"use client";

import { useQuery } from "@tanstack/react-query";
import type { TimeRange } from "@/types/analytics";

export interface PriceCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface PriceHistoryResponse {
  candles: PriceCandle[];
  source: string;
  days: string;
  cached?: boolean;
  stale?: boolean;
}

const RANGE_TO_DAYS: Record<TimeRange, string> = {
  "1D": "1",
  "7D": "7",
  "1M": "30",
  "3M": "90",
  "1Y": "365",
  ALL: "max",
};

const STALE_TIME_BY_RANGE: Record<TimeRange, number> = {
  "1D": 60_000,
  "7D": 300_000,
  "1M": 600_000,
  "3M": 1_800_000,
  "1Y": 3_600_000,
  ALL: 3_600_000,
};

export function usePriceCandles(range: TimeRange) {
  return useQuery<PriceHistoryResponse>({
    queryKey: ["price-candles", range],
    queryFn: async () => {
      const response = await fetch(`/api/price-history?days=${RANGE_TO_DAYS[range]}`);
      if (!response.ok) throw new Error("Failed to fetch price history");
      return response.json();
    },
    staleTime: STALE_TIME_BY_RANGE[range],
    gcTime: 30 * 60 * 1000,
    retry: 2,
  });
}
