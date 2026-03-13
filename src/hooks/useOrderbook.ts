"use client";

import { useQuery } from "@tanstack/react-query";
import type { DepthPoint } from "@/types/analytics";

interface OrderbookData {
  bids: DepthPoint[];
  asks: DepthPoint[];
}

async function fetchOrderbook(): Promise<OrderbookData> {
  const response = await fetch("/api/orderbook");
  if (!response.ok) throw new Error("Failed to fetch orderbook");
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return { bids: data.bids || [], asks: data.asks || [] };
}

export function useOrderbook() {
  return useQuery<OrderbookData>({
    queryKey: ["orderbook"],
    queryFn: fetchOrderbook,
    refetchInterval: 30_000,
    staleTime: 15_000,
    retry: 2,
  });
}
