"use client";

import { useQuery } from "@tanstack/react-query";
import { REFRESH_INTERVALS } from "@/lib/constants";
import { mockTransactionData } from "@/lib/mock-data";
import type { TransactionData } from "@/types/analytics";

export function useTransactions() {
  return useQuery<TransactionData>({
    queryKey: ["transactions"],
    queryFn: async () => {
      return mockTransactionData;
    },
    refetchInterval: REFRESH_INTERVALS.transactions,
    placeholderData: mockTransactionData,
    staleTime: REFRESH_INTERVALS.transactions,
  });
}
