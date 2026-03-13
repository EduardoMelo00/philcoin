"use client";

import { useQuery } from "@tanstack/react-query";
import { REFRESH_INTERVALS } from "@/lib/constants";
import { mockLiquidityData } from "@/lib/mock-data";
import type { LiquidityData } from "@/types/analytics";

export function useLiquidity() {
  return useQuery<LiquidityData>({
    queryKey: ["liquidity"],
    queryFn: async () => {
      return mockLiquidityData;
    },
    refetchInterval: REFRESH_INTERVALS.liquidity,
    placeholderData: mockLiquidityData,
    staleTime: REFRESH_INTERVALS.liquidity,
  });
}
