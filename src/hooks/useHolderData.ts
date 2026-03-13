"use client";

import { useQuery } from "@tanstack/react-query";
import { REFRESH_INTERVALS } from "@/lib/constants";
import { mockHolderData } from "@/lib/mock-data";
import type { HolderData } from "@/types/analytics";

export function useHolderData() {
  return useQuery<HolderData>({
    queryKey: ["holderData"],
    queryFn: async () => {
      return mockHolderData;
    },
    refetchInterval: REFRESH_INTERVALS.holders,
    placeholderData: mockHolderData,
    staleTime: REFRESH_INTERVALS.holders,
  });
}
