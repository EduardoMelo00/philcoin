"use client";

import { useQuery } from "@tanstack/react-query";
import { API_URLS, REFRESH_INTERVALS, TIME_RANGE_DAYS, PHL_CONTRACT } from "@/lib/constants";
import { mockTokenPrice, getMockPriceHistory } from "@/lib/mock-data";
import type { TokenPrice, PricePoint, TimeRange } from "@/types/analytics";

async function fetchFromCMC(): Promise<TokenPrice> {
  const response = await fetch("/api/token");
  if (!response.ok) throw new Error("CMC fetch failed");
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return {
    usd: data.price,
    usd_24h_change: data.percent_change_24h,
    usd_market_cap: data.market_cap,
    usd_24h_vol: data.volume_24h,
    circulating_supply: data.circulating_supply,
    total_supply: data.total_supply,
    fully_diluted_market_cap: data.fully_diluted_market_cap,
  };
}

async function fetchFromCoinGecko(): Promise<TokenPrice> {
  const response = await fetch(API_URLS.coingeckoPrice);
  if (!response.ok) throw new Error("CoinGecko fetch failed");
  const data = await response.json();
  const tokenData = data[PHL_CONTRACT.toLowerCase()];
  if (!tokenData) throw new Error("Token not found");
  return {
    usd: tokenData.usd,
    usd_24h_change: tokenData.usd_24h_change ?? 0,
    usd_market_cap: tokenData.usd_market_cap ?? 0,
    usd_24h_vol: tokenData.usd_24h_vol ?? 0,
  };
}

async function fetchTokenPrice(): Promise<TokenPrice> {
  try {
    return await fetchFromCMC();
  } catch {
    return await fetchFromCoinGecko();
  }
}

async function fetchPriceHistory(days: number): Promise<PricePoint[]> {
  const response = await fetch(API_URLS.coingeckoChart(days));
  if (!response.ok) throw new Error("Failed to fetch chart data");
  const data = await response.json();
  if (!data.prices?.length) throw new Error("No price data");
  return data.prices.map(([timestamp, price]: [number, number], index: number) => ({
    time: Math.floor(timestamp / 1000),
    value: price,
    volume: data.total_volumes?.[index]?.[1] ?? 0,
  }));
}

export function useTokenPrice() {
  return useQuery<TokenPrice>({
    queryKey: ["tokenPrice"],
    queryFn: fetchTokenPrice,
    refetchInterval: REFRESH_INTERVALS.price,
    placeholderData: mockTokenPrice,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    staleTime: REFRESH_INTERVALS.price,
  });
}

export function usePriceHistory(timeRange: TimeRange) {
  const days = TIME_RANGE_DAYS[timeRange];

  return useQuery<PricePoint[]>({
    queryKey: ["priceHistory", timeRange],
    queryFn: () => fetchPriceHistory(days),
    placeholderData: () => getMockPriceHistory(days),
    staleTime: timeRange === "1D" ? 60_000 : 300_000,
    retry: 2,
  });
}
