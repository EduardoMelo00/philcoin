"use client";

import { useQuery } from "@tanstack/react-query";
import { REFRESH_INTERVALS } from "@/lib/constants";
import { mockLiquidityData } from "@/lib/mock-data";
import type { LiquidityData } from "@/types/analytics";

async function fetchLiquidity(): Promise<LiquidityData> {
  const response = await fetch("/api/liquidity");
  if (!response.ok) throw new Error("Failed to fetch liquidity");
  const data = await response.json();
  if (data.error) throw new Error(data.error);

  const pools = data.pools.map((p: Record<string, unknown>) => ({
    name: p.dex || p.name,
    tvl: p.tvl,
    volume24h: p.volume24h,
    change24h: p.change24h,
  }));

  const totalLiquidity = data.totalLiquidity || 0;
  const mcapEstimate = 17_000_000;
  const ratio = totalLiquidity > 0 ? (totalLiquidity / mcapEstimate) * 100 : 0;

  let health: "Healthy" | "Adequate" | "Low" = "Low";
  if (ratio >= 10) health = "Healthy";
  else if (ratio >= 5) health = "Adequate";

  return {
    pools,
    totalLiquidity,
    liquidityMcapRatio: parseFloat(ratio.toFixed(1)),
    liquidityHealth: health,
    netFlow24h: data.totalVolume24h || 0,
  };
}

export function useLiquidity() {
  return useQuery<LiquidityData>({
    queryKey: ["liquidity"],
    queryFn: fetchLiquidity,
    refetchInterval: REFRESH_INTERVALS.liquidity,
    placeholderData: mockLiquidityData,
    staleTime: REFRESH_INTERVALS.liquidity,
    retry: 2,
  });
}
