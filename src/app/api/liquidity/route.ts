import { NextResponse } from "next/server";

const PHL_CONTRACT = "0x24c80D7F032Bc8D308F10d59e20d5a65b90b7334";
const GECKOTERMINAL_BASE = "https://api.geckoterminal.com/api/v2";

export async function GET() {
  try {
    const response = await fetch(
      `${GECKOTERMINAL_BASE}/networks/polygon_pos/tokens/${PHL_CONTRACT}/pools?page=1`,
      {
        headers: { Accept: "application/json" },
        next: { revalidate: 120 },
      }
    );

    if (!response.ok) throw new Error("GeckoTerminal fetch failed");

    const json = await response.json();
    const rawPools = json?.data ?? [];

    const pools = rawPools
      .filter((p: Record<string, unknown>) => {
        const attrs = p.attributes as Record<string, unknown> | undefined;
        return attrs && Number(attrs.reserve_in_usd) > 0.01;
      })
      .slice(0, 10)
      .map((p: Record<string, unknown>) => {
        const attrs = p.attributes as Record<string, unknown>;
        const volumeUsd = attrs.volume_usd as Record<string, string> | undefined;
        const priceChange = attrs.price_change_percentage as Record<string, string> | undefined;
        return {
          name: String(attrs.name || "Unknown Pool"),
          dex: String(attrs.name || "").split(" ")?.[0] || extractDex(p),
          tvl: Number(attrs.reserve_in_usd) || 0,
          volume24h: Number(volumeUsd?.h24) || 0,
          change24h: Number(priceChange?.h24) || 0,
        };
      });

    const totalLiquidity = pools.reduce((sum: number, p: { tvl: number }) => sum + p.tvl, 0);
    const totalVolume24h = pools.reduce((sum: number, p: { volume24h: number }) => sum + p.volume24h, 0);

    return NextResponse.json({
      pools,
      totalLiquidity,
      totalVolume24h,
    });
  } catch (error) {
    console.error("Liquidity fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch liquidity data" },
      { status: 500 }
    );
  }
}

function extractDex(pool: Record<string, unknown>): string {
  const relationships = pool.relationships as Record<string, Record<string, Record<string, string>>> | undefined;
  const dexId = relationships?.dex?.data?.id || "";
  if (dexId.includes("quickswap")) return "QuickSwap";
  if (dexId.includes("uniswap")) return "Uniswap";
  if (dexId.includes("sushi")) return "SushiSwap";
  return dexId || "DEX";
}
