#!/usr/bin/env node
/**
 * PHL Holder Indexer.
 * Scans Transfer events via eth_getLogs, snapshots balances via Multicall3, writes
 * public/holders.json and public/holders.csv.
 *
 * Env: QUICKNODE_POLYGON_RPC (required)
 */

import fs from "node:fs/promises";
import path from "node:path";
import { createPublicClient, http, parseAbi, getAddress, formatUnits } from "viem";
import { polygon } from "viem/chains";

const RPC = process.env.QUICKNODE_POLYGON_RPC;
if (!RPC) {
  console.error("QUICKNODE_POLYGON_RPC env var is required");
  process.exit(1);
}

const PHL = "0x24c80D7F032Bc8D308F10d59e20d5a65b90b7334";
const PHL_DEPLOY_BLOCK = 60934001n;
const ZERO = "0x0000000000000000000000000000000000000000";
const TOTAL_SUPPLY = 5_000_000_000;
const LOG_RANGE = 10_000n;
const MULTICALL_BATCH = 500;

const OUT_DIR = path.resolve("public");
const JSON_PATH = path.join(OUT_DIR, "holders.json");
const CSV_PATH = path.join(OUT_DIR, "holders.csv");

const ERC20_ABI = parseAbi([
  "function balanceOf(address) view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
]);

const KNOWN = {
  "0x633a94b6e161a43f3fd8fe8874eb2f1912f250df": ["Treasury", "Philanthropy Vesting"],
  "0x72349caff75f97e4189f00d2fdbe1e50efb18367": ["Treasury", "Treasury Safe"],
  "0x0d7a457e15dc3c12005c414995155ce7ca2e87ab": ["Team", "Team Vesting"],
  "0x775e184d9865148046c6a6a0ceaff847789da791": ["Treasury", "Strategic Vesting"],
  "0x49eb2660c673f2f525a66a21f1e8190e1ed21523": ["Treasury", "Treasury Vesting"],
  "0x3a33dca0692bf8b26005b060ceccfaa635a73b98": ["Treasury", "CrossChain Vesting"],
  "0xf85ecebf8f13c46151bbcca30951980932e9cf0a": ["Treasury", "Foundation Vesting"],
  "0x0a3ce65bf86de3e94b174676a5dd8122403a123a": ["Treasury", "Reserve"],
  "0x2992759e1f443aac6da7dfbcd4c1184c8bfc199d": ["Treasury", "Operations"],
  "0x51e3d44172868acc60d68ca99591ce4230bc75e0": ["Exchange", "MEXC"],
  "0xe9ee9f2857b559c67dd03576a1c74589a6af6197": ["Exchange", "BitMart"],
  "0x0c28a26303c292fede3b22451f1a1b9c7a1b4209": ["Treasury", "Gnosis Safe"],
};

const client = createPublicClient({
  chain: polygon,
  transport: http(RPC, { batch: false, retryCount: 3, retryDelay: 800, timeout: 45_000 }),
});

const SCAN_CONCURRENCY = 8;

async function scanTransfers(fromBlock, toBlock) {
  const addresses = new Set();
  let totalLogs = 0;
  const totalRange = Number(toBlock - fromBlock);
  console.log(`→ scanning Transfer logs ${fromBlock}..${toBlock} (concurrency ${SCAN_CONCURRENCY})`);

  const ranges = [];
  for (let start = fromBlock; start <= toBlock; start += LOG_RANGE) {
    const end = start + LOG_RANGE - 1n > toBlock ? toBlock : start + LOG_RANGE - 1n;
    ranges.push([start, end]);
  }
  console.log(`  ${ranges.length} block ranges to scan`);

  let done = 0;
  let lastLoggedPct = -1;
  const startTs = Date.now();

  for (let i = 0; i < ranges.length; i += SCAN_CONCURRENCY) {
    const slice = ranges.slice(i, i + SCAN_CONCURRENCY);
    const results = await Promise.all(slice.map(([s, e]) =>
      client.getLogs({ address: PHL, event: ERC20_ABI[1], fromBlock: s, toBlock: e })
    ));
    for (const logs of results) {
      for (const log of logs) {
        if (log.args.from && log.args.from !== ZERO) addresses.add(log.args.from.toLowerCase());
        if (log.args.to && log.args.to !== ZERO) addresses.add(log.args.to.toLowerCase());
      }
      totalLogs += logs.length;
    }
    done += slice.length;
    const lastEnd = slice[slice.length - 1][1];
    const pct = totalRange === 0 ? 100 : (Number(lastEnd - fromBlock) / totalRange) * 100;
    const bucket = Math.floor(pct / 5) * 5;
    if (bucket > lastLoggedPct || done === ranges.length) {
      const elapsedSec = ((Date.now() - startTs) / 1000).toFixed(0);
      console.log(`  ${pct.toFixed(1).padStart(5)}% · ${done}/${ranges.length} ranges · block ${lastEnd} · logs: ${totalLogs} · candidates: ${addresses.size} · ${elapsedSec}s`);
      lastLoggedPct = bucket;
    }
  }

  console.log(`  total events: ${totalLogs}, unique candidates: ${addresses.size}`);
  return addresses;
}

async function multicallBalances(addresses) {
  console.log(`→ multicall balanceOf × ${addresses.length}`);
  const balances = new Map();

  for (let i = 0; i < addresses.length; i += MULTICALL_BATCH) {
    const batch = addresses.slice(i, i + MULTICALL_BATCH);
    const results = await client.multicall({
      allowFailure: true,
      contracts: batch.map((addr) => ({
        address: PHL,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [getAddress(addr)],
      })),
    });

    for (let j = 0; j < batch.length; j++) {
      const r = results[j];
      if (r.status === "success" && r.result && r.result > 0n) {
        balances.set(batch[j], r.result);
      }
    }

    const done = Math.min(i + MULTICALL_BATCH, addresses.length);
    console.log(`  ${done}/${addresses.length} · holders > 0: ${balances.size}`);
  }
  return balances;
}

async function detectContracts(addresses) {
  console.log(`→ detecting contract addresses via eth_getCode`);
  const contracts = new Set();
  const CONCURRENCY = 25;
  for (let i = 0; i < addresses.length; i += CONCURRENCY) {
    const batch = addresses.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map(async (addr) => {
      const code = await client.getCode({ address: getAddress(addr) });
      if (code && code !== "0x") contracts.add(addr);
    }));
    const done = Math.min(i + CONCURRENCY, addresses.length);
    if (done % 500 === 0 || done === addresses.length) {
      console.log(`  ${done}/${addresses.length} · contracts: ${contracts.size}`);
    }
  }
  return contracts;
}

function buildHolders(balances, contracts) {
  const list = [];
  for (const [addr, bal] of balances) {
    const human = parseFloat(formatUnits(bal, 18));
    const holdings = Math.round(human);
    const pct = (human / TOTAL_SUPPLY) * 100;
    const [label, name] = KNOWN[addr] ?? ["Unknown", undefined];
    list.push({
      address: addr,
      holdings,
      percentage: parseFloat(pct.toFixed(6)),
      label,
      entityName: name,
      isContract: contracts.has(addr),
    });
  }
  list.sort((a, b) => b.holdings - a.holdings);
  list.forEach((h, i) => { h.rank = i + 1; });
  return list;
}

function toCSV(holders) {
  const header = "rank,address,holdings_phl,percentage,label,entity,is_contract";
  const rows = holders.map((h) => [
    h.rank,
    h.address,
    h.holdings,
    h.percentage,
    h.label,
    h.entityName ? `"${h.entityName.replace(/"/g, '""')}"` : "",
    h.isContract ? "true" : "false",
  ].join(","));
  return [header, ...rows].join("\n") + "\n";
}

async function loadExisting() {
  try {
    const raw = await fs.readFile(JSON_PATH, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function main() {
  const started = Date.now();
  await fs.mkdir(OUT_DIR, { recursive: true });

  const latest = await client.getBlockNumber();
  console.log(`latest block: ${latest}`);

  const existing = await loadExisting();
  let fromBlock;
  const seenCandidates = new Set();

  if (existing?.holders) {
    for (const h of existing.holders) seenCandidates.add(h.address);
  }

  if (existing?.lastBlock && Number.isFinite(existing.lastBlock)) {
    fromBlock = BigInt(existing.lastBlock) + 1n;
    console.log(`incremental · fromBlock ${fromBlock} · ${existing.holders.length} known holders`);
  } else {
    fromBlock = PHL_DEPLOY_BLOCK;
    console.log(`seed · fromBlock ${fromBlock} (PHL deploy block)`);
  }

  if (fromBlock > latest) {
    console.log("no new blocks since last run");
    return;
  }

  const newCandidates = await scanTransfers(fromBlock, latest);
  for (const a of newCandidates) seenCandidates.add(a);

  const all = Array.from(seenCandidates);
  console.log(`total candidates to balance-check: ${all.length}`);

  const balances = await multicallBalances(all);
  const positive = Array.from(balances.keys());
  const contracts = await detectContracts(positive);
  const holders = buildHolders(balances, contracts);

  const payload = {
    generatedAt: new Date().toISOString(),
    lastBlock: Number(latest),
    total: holders.length,
    totalSupply: TOTAL_SUPPLY,
    source: "quicknode-polygon-rpc",
    holders,
  };

  await fs.writeFile(JSON_PATH, JSON.stringify(payload));
  await fs.writeFile(CSV_PATH, toCSV(holders));

  const elapsed = ((Date.now() - started) / 1000).toFixed(1);
  console.log("");
  console.log(`✓ holders: ${holders.length}`);
  console.log(`✓ lastBlock: ${latest}`);
  console.log(`✓ elapsed: ${elapsed}s`);
  console.log(`✓ wrote ${JSON_PATH} (${(JSON.stringify(payload).length / 1024).toFixed(1)} KB)`);
  console.log(`✓ wrote ${CSV_PATH}`);
}

main().catch((e) => {
  console.error("FAILED:", e);
  process.exit(1);
});
