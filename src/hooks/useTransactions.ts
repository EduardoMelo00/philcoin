"use client";

import { useQuery } from "@tanstack/react-query";
import { REFRESH_INTERVALS } from "@/lib/constants";
import { mockTransactionData } from "@/lib/mock-data";
import type { TransactionData } from "@/types/analytics";

async function fetchTransactions(): Promise<TransactionData> {
  const response = await fetch("/api/transactions");
  if (!response.ok) throw new Error("Failed to fetch transactions");
  const data = await response.json();
  if (data.error) throw new Error(data.error);

  return {
    daily: data.daily.map((d: Record<string, unknown>) => ({
      date: d.date,
      count: d.count,
      activeWallets: d.activeWallets,
      buyVolume: d.buyVolume,
      sellVolume: d.sellVolume,
    })),
    todayTxns: data.todayTxns,
    todayWallets: data.todayWallets,
    buyPressure: data.buyPressure,
  };
}

export function useTransactions() {
  return useQuery<TransactionData>({
    queryKey: ["transactions"],
    queryFn: fetchTransactions,
    refetchInterval: REFRESH_INTERVALS.transactions,
    placeholderData: mockTransactionData,
    staleTime: REFRESH_INTERVALS.transactions,
    retry: 2,
  });
}
