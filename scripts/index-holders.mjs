#!/usr/bin/env node
/**
 * PHL Holder Snapshot — uses Moralis's pre-built holder index.
 * Runs once per day (via GitHub Actions) and writes public/holders.json + .csv.
 *
 * Env: MORALIS_API_KEY (required)
 */

import fs from "node:fs/promises";
import path from "node:path";

const API_KEY = process.env.MORALIS_API_KEY;
if (!API_KEY) {
  console.error("MORALIS_API_KEY env var is required");
  process.exit(1);
}

const PHL = "0x24c80D7F032Bc8D308F10d59e20d5a65b90b7334";
const TOTAL_SUPPLY = 5_000_000_000;
const MORALIS_BASE = "https://deep-index.moralis.io/api/v2.2";
const PAGE_SIZE = 100;
const MAX_PAGES = 300;

const OUT_DIR = path.resolve("public");
const JSON_PATH = path.join(OUT_DIR, "holders.json");
const CSV_PATH = path.join(OUT_DIR, "holders.csv");

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

async function fetchPage(cursor) {
  const params = new URLSearchParams({
    chain: "polygon",
    order: "DESC",
    limit: String(PAGE_SIZE),
  });
  if (cursor) params.set("cursor", cursor);

  let attempt = 0;
  while (true) {
    try {
      const res = await fetch(`${MORALIS_BASE}/erc20/${PHL}/owners?${params}`, {
        headers: { "X-API-Key": API_KEY, Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    } catch (err) {
      attempt++;
      if (attempt >= 4) throw err;
      const backoff = 800 * Math.pow(2, attempt - 1);
      console.warn(`  retry ${attempt} after ${backoff}ms: ${err.message}`);
      await new Promise((r) => setTimeout(r, backoff));
    }
  }
}

function resolveLabel(owner) {
  const known = KNOWN[owner.owner_address.toLowerCase()];
  if (known) return { label: known[0], name: known[1] };

  if (owner.entity) {
    const low = owner.entity.toLowerCase();
    if (["bitmart", "mexc", "binance", "kucoin", "gate", "huobi", "coinbase"].some((x) => low.includes(x))) {
      return { label: "Exchange", name: owner.entity };
    }
  }
  if (owner.owner_address_label) {
    const low = owner.owner_address_label.toLowerCase();
    if (low.includes("exchange") || low.includes("hot wallet")) {
      return { label: "Exchange", name: owner.owner_address_label };
    }
  }
  return { label: "Unknown" };
}

function mapOwner(owner) {
  const { label, name } = resolveLabel(owner);
  const holdings = Math.round(parseFloat(owner.balance_formatted));
  const pct = (holdings / TOTAL_SUPPLY) * 100;
  return {
    address: owner.owner_address.toLowerCase(),
    holdings,
    percentage: parseFloat(pct.toFixed(6)),
    label,
    entityName: name,
    isContract: !!owner.is_contract,
  };
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

async function main() {
  const started = Date.now();
  await fs.mkdir(OUT_DIR, { recursive: true });

  console.log(`fetching all PHL holders from Moralis (up to ${MAX_PAGES} pages × ${PAGE_SIZE})`);

  const all = [];
  let cursor;
  let pages = 0;
  do {
    const data = await fetchPage(cursor);
    const mapped = data.result
      .filter((o) => parseFloat(o.balance_formatted) > 0)
      .map(mapOwner);
    all.push(...mapped);
    cursor = data.cursor ?? undefined;
    pages++;
    if (pages % 10 === 0 || !cursor) {
      console.log(`  page ${pages} · total holders: ${all.length}`);
    }
  } while (cursor && pages < MAX_PAGES);

  all.sort((a, b) => b.holdings - a.holdings);
  all.forEach((h, i) => { h.rank = i + 1; });

  const payload = {
    generatedAt: new Date().toISOString(),
    total: all.length,
    totalSupply: TOTAL_SUPPLY,
    source: "moralis",
    pages,
    holders: all,
  };

  await fs.writeFile(JSON_PATH, JSON.stringify(payload));
  await fs.writeFile(CSV_PATH, toCSV(all));

  const elapsed = ((Date.now() - started) / 1000).toFixed(1);
  console.log("");
  console.log(`✓ holders: ${all.length}`);
  console.log(`✓ pages: ${pages}`);
  console.log(`✓ elapsed: ${elapsed}s`);
  console.log(`✓ wrote ${JSON_PATH} (${(JSON.stringify(payload).length / 1024).toFixed(1)} KB)`);
  console.log(`✓ wrote ${CSV_PATH}`);
}

main().catch((e) => {
  console.error("FAILED:", e);
  process.exit(1);
});
