import { NextResponse } from "next/server";

const MORALIS_API_KEY = process.env.MORALIS_API_KEY!;
const PHL_CONTRACT = "0x24c80D7F032Bc8D308F10d59e20d5a65b90b7334";
const TOTAL_SUPPLY = 5_000_000_000;
const MORALIS_BASE = "https://deep-index.moralis.io/api/v2.2";

const TOP_HOLDERS_TTL = 1800_000;
const TOTAL_COUNT_TTL = 21600_000;

type HolderLabel = "Treasury" | "Team" | "Exchange" | "LP" | "Community" | "Unknown";

const KNOWN_WALLETS: Record<string, { label: HolderLabel; name: string }> = {
  "0x633a94b6e161a43f3fd8fe8874eb2f1912f250df": { label: "Treasury", name: "Philanthropy Vesting" },
  "0x72349caff75f97e4189f00d2fdbe1e50efb18367": { label: "Treasury", name: "Treasury Safe" },
  "0x0d7a457e15dc3c12005c414995155ce7ca2e87ab": { label: "Team", name: "Team Vesting" },
  "0x775e184d9865148046c6a6a0ceaff847789da791": { label: "Treasury", name: "Strategic Vesting" },
  "0x49eb2660c673f2f525a66a21f1e8190e1ed21523": { label: "Treasury", name: "Treasury Vesting" },
  "0x3a33dca0692bf8b26005b060ceccfaa635a73b98": { label: "Treasury", name: "CrossChain Vesting" },
  "0xf85ecebf8f13c46151bbcca30951980932e9cf0a": { label: "Treasury", name: "Foundation Vesting" },
  "0x0a3ce65bf86de3e94b174676a5dd8122403a123a": { label: "Treasury", name: "Reserve" },
  "0x2992759e1f443aac6da7dfbcd4c1184c8bfc199d": { label: "Treasury", name: "Operations" },
  "0x51e3d44172868acc60d68ca99591ce4230bc75e0": { label: "Exchange", name: "MEXC" },
  "0xe9ee9f2857b559c67dd03576a1c74589a6af6197": { label: "Exchange", name: "BitMart" },
  "0x0c28a26303c292fede3b22451f1a1b9c7a1b4209": { label: "Treasury", name: "Gnosis Safe" },
};

interface MoralisOwner {
  balance: string;
  balance_formatted: string;
  is_contract: boolean;
  owner_address: string;
  owner_address_label: string | null;
  entity: string | null;
  entity_logo: string | null;
  usd_value: string | null;
  percentage_relative_to_total_supply: number;
}

interface MoralisOwnersResponse {
  cursor: string | null;
  page: number;
  page_size: number;
  result: MoralisOwner[];
}

let topHoldersCache: { data: ReturnType<typeof mapOwner>[]; timestamp: number } | null = null;
let totalCountCache: { count: number; timestamp: number } | null = null;

async function fetchMoralisPage(cursor?: string, limit = 100): Promise<MoralisOwnersResponse> {
  const params = new URLSearchParams({
    chain: "polygon",
    order: "DESC",
    limit: String(limit),
  });
  if (cursor) params.set("cursor", cursor);

  const response = await fetch(
    `${MORALIS_BASE}/erc20/${PHL_CONTRACT}/owners?${params}`,
    { headers: { "X-API-Key": MORALIS_API_KEY } }
  );

  if (!response.ok) throw new Error(`Moralis API error: ${response.status}`);
  return response.json();
}

function resolveLabel(owner: MoralisOwner): { label: HolderLabel; name?: string } {
  const known = KNOWN_WALLETS[owner.owner_address.toLowerCase()];
  if (known) return known;

  if (owner.entity) {
    const entityLower = owner.entity.toLowerCase();
    if (entityLower.includes("bitmart") || entityLower.includes("mexc") || entityLower.includes("binance") || entityLower.includes("kucoin")) {
      return { label: "Exchange", name: owner.entity };
    }
  }

  if (owner.owner_address_label) {
    const labelLower = owner.owner_address_label.toLowerCase();
    if (labelLower.includes("exchange") || labelLower.includes("hot wallet")) {
      return { label: "Exchange", name: owner.owner_address_label };
    }
  }

  return { label: "Unknown" };
}

function mapOwner(owner: MoralisOwner) {
  const resolved = resolveLabel(owner);
  const holdings = Math.round(parseFloat(owner.balance_formatted));
  return {
    rank: 0,
    address: owner.owner_address.toLowerCase(),
    holdings,
    percentage: parseFloat(((holdings / TOTAL_SUPPLY) * 100).toFixed(4)),
    label: resolved.label,
    exchangeName: resolved.name,
    isContract: owner.is_contract,
    usdValue: owner.usd_value ? parseFloat(owner.usd_value) : undefined,
  };
}

async function getTopHolders() {
  const now = Date.now();
  if (topHoldersCache && now - topHoldersCache.timestamp < TOP_HOLDERS_TTL) {
    return topHoldersCache.data;
  }

  const data = await fetchMoralisPage(undefined, 100);
  const holders = data.result
    .filter((o) => parseFloat(o.balance_formatted) > 0)
    .map(mapOwner)
    .sort((a, b) => b.holdings - a.holdings);

  holders.forEach((h, i) => (h.rank = i + 1));
  topHoldersCache = { data: holders, timestamp: now };
  return holders;
}

async function getTotalHolderCount(): Promise<number> {
  const now = Date.now();
  if (totalCountCache && now - totalCountCache.timestamp < TOTAL_COUNT_TTL) {
    return totalCountCache.count;
  }

  let count = 0;
  let cursor: string | undefined;
  let pages = 0;

  do {
    const data = await fetchMoralisPage(cursor);
    count += data.result.filter((o) => parseFloat(o.balance_formatted) > 0).length;
    cursor = data.cursor ?? undefined;
    pages++;
  } while (cursor && pages < 200);

  totalCountCache = { count, timestamp: now };
  return count;
}

export async function GET() {
  try {
    const [holders, totalHolders] = await Promise.all([
      getTopHolders(),
      getTotalHolderCount(),
    ]);

    const top50 = holders.slice(0, 50);
    const top10 = holders.slice(0, 10);
    const top10Pct = top10.reduce((sum, h) => sum + h.percentage, 0);
    const hhi = top50.reduce((sum, h) => sum + (h.percentage / 100) ** 2, 0);

    let concentrationLevel: "Low" | "Medium" | "High" = "Low";
    if (hhi > 0.1) concentrationLevel = "High";
    else if (hhi > 0.05) concentrationLevel = "Medium";

    return NextResponse.json({
      holders: top50,
      totalHolders,
      hhi: parseFloat(hhi.toFixed(4)),
      concentrationLevel,
      top10Percentage: parseFloat(top10Pct.toFixed(2)),
    });
  } catch (error) {
    console.error("Holder fetch error:", error);

    if (topHoldersCache) {
      const holders = topHoldersCache.data;
      const top50 = holders.slice(0, 50);
      const hhi = top50.reduce((sum, h) => sum + (h.percentage / 100) ** 2, 0);
      return NextResponse.json({
        holders: top50,
        totalHolders: totalCountCache?.count ?? holders.length,
        hhi: parseFloat(hhi.toFixed(4)),
        concentrationLevel: hhi > 0.1 ? "High" : hhi > 0.05 ? "Medium" : "Low",
        top10Percentage: parseFloat(holders.slice(0, 10).reduce((s, h) => s + h.percentage, 0).toFixed(2)),
      });
    }

    return NextResponse.json(
      { error: "Failed to fetch holder data" },
      { status: 500 },
    );
  }
}
