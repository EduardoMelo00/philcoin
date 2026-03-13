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
    name: String(p.dex || p.name || "Unknown"),
    tvl: Number(p.tvl) || 0,
    volume24h: Number(p.volume24h) || 0,
    change24h: Number(p.change24h) || 0,
  }));

  const totalLiquidity = Number(data.totalLiquidity) || 0;
  const totalVolume = Number(data.totalVolume24h) || 0;

  return {
    pools,
    totalLiquidity,
    liquidityMcapRatio: 0,
    liquidityHealth: "Low",
    netFlow24h: totalVolume,
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
