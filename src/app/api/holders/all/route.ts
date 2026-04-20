import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;
export const revalidate = 0;

const MORALIS_API_KEY = process.env.MORALIS_API_KEY!;
const PHL_CONTRACT = "0x24c80D7F032Bc8D308F10d59e20d5a65b90b7334";
const TOTAL_SUPPLY = 5_000_000_000;
const MORALIS_BASE = "https://deep-index.moralis.io/api/v2.2";

const ALL_HOLDERS_TTL = 21_600_000;
const MAX_PAGES = 250;

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

interface Holder {
  rank: number;
  address: string;
  holdings: number;
  percentage: number;
  label: HolderLabel;
  entityName?: string;
  isContract: boolean;
  usdValue?: number;
}

let cache: { data: Holder[]; timestamp: number } | null = null;

async function fetchMoralisPage(cursor?: string): Promise<MoralisOwnersResponse> {
  const params = new URLSearchParams({
    chain: "polygon",
    order: "DESC",
    limit: "100",
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
    if (entityLower.includes("bitmart") || entityLower.includes("mexc") || entityLower.includes("binance") || entityLower.includes("kucoin") || entityLower.includes("gate")) {
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

function mapOwner(owner: MoralisOwner): Holder {
  const resolved = resolveLabel(owner);
  const holdings = Math.round(parseFloat(owner.balance_formatted));
  return {
    rank: 0,
    address: owner.owner_address.toLowerCase(),
    holdings,
    percentage: parseFloat(((holdings / TOTAL_SUPPLY) * 100).toFixed(6)),
    label: resolved.label,
    entityName: resolved.name,
    isContract: owner.is_contract,
    usdValue: owner.usd_value ? parseFloat(owner.usd_value) : undefined,
  };
}

async function getAllHolders(): Promise<Holder[]> {
  const now = Date.now();
  if (cache && now - cache.timestamp < ALL_HOLDERS_TTL) {
    return cache.data;
  }

  const all: Holder[] = [];
  let cursor: string | undefined;
  let pages = 0;

  do {
    const data = await fetchMoralisPage(cursor);
    for (const owner of data.result) {
      if (parseFloat(owner.balance_formatted) <= 0) continue;
      all.push(mapOwner(owner));
    }
    cursor = data.cursor ?? undefined;
    pages++;
  } while (cursor && pages < MAX_PAGES);

  all.sort((a, b) => b.holdings - a.holdings);
  all.forEach((h, i) => (h.rank = i + 1));

  cache = { data: all, timestamp: now };
  return all;
}

function toCSV(holders: Holder[]): string {
  const header = "rank,address,holdings_phl,percentage,usd_value,label,entity,is_contract";
  const rows = holders.map((h) => [
    h.rank,
    h.address,
    h.holdings,
    h.percentage,
    h.usdValue ?? "",
    h.label,
    h.entityName ? `"${h.entityName.replace(/"/g, '""')}"` : "",
    h.isContract ? "true" : "false",
  ].join(","));
  return [header, ...rows].join("\n");
}

export async function GET(req: NextRequest) {
  try {
    const format = new URL(req.url).searchParams.get("format");
    const holders = await getAllHolders();

    if (format === "csv") {
      const csv = toCSV(holders);
      const date = new Date().toISOString().slice(0, 10);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="phl-holders-${date}.csv"`,
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    return NextResponse.json({
      total: holders.length,
      generatedAt: new Date(cache?.timestamp ?? Date.now()).toISOString(),
      holders,
    });
  } catch (error) {
    console.error("Holders all error:", error);
    if (cache) {
      return NextResponse.json({
        total: cache.data.length,
        generatedAt: new Date(cache.timestamp).toISOString(),
        holders: cache.data,
        stale: true,
      });
    }
    return NextResponse.json({ error: "Failed to fetch holders" }, { status: 500 });
  }
}
