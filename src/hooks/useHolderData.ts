"use client";

import { useQuery } from "@tanstack/react-query";
import { REFRESH_INTERVALS } from "@/lib/constants";
import { mockHolderData } from "@/lib/mock-data";
import type { HolderData } from "@/types/analytics";

async function fetchHolderData(): Promise<HolderData> {
  const response = await fetch("/api/holders");
  if (!response.ok) throw new Error("Failed to fetch holders");
  const data = await response.json();
  if (data.error) throw new Error(data.error);

  return {
    holders: data.holders.map((h: Record<string, unknown>) => ({
      rank: h.rank,
      address: h.address,
      holdings: h.holdings,
      percentage: h.percentage,
      label: h.label || "Unknown",
      exchangeName: h.exchangeName,
    })),
    totalHolders: data.totalHolders,
    hhi: data.hhi,
    concentrationLevel: data.concentrationLevel,
  };
}

export function useHolderData() {
  return useQuery<HolderData>({
    queryKey: ["holderData"],
    queryFn: fetchHolderData,
    refetchInterval: REFRESH_INTERVALS.holders,
    placeholderData: mockHolderData,
    staleTime: REFRESH_INTERVALS.holders,
    retry: 2,
  });
}
