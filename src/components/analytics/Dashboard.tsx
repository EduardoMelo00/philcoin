"use client";

import TopBar from "./TopBar";
import HeroMetrics from "./HeroMetrics";
import TradingChart from "./TradingChart";
import HolderDistribution from "./HolderDistribution";
import LiquidityAnalysis from "./LiquidityAnalysis";
import TransactionActivity from "./TransactionActivity";
import RiskAssessment from "./RiskAssessment";
import GrowthMetrics from "./GrowthMetrics";
import Recommendations from "./Recommendations";
import { useTokenPrice } from "@/hooks/useTokenPrice";
import { useHolderData } from "@/hooks/useHolderData";
import { useLiquidity } from "@/hooks/useLiquidity";
import { useTransactions } from "@/hooks/useTransactions";
import { useLastUpdated } from "@/hooks/useLastUpdated";
import { computeRiskScore } from "@/lib/risk-engine";
import { computeRecommendations } from "@/lib/recommendation-engine";
import type { TokenInfo, GrowthMetric } from "@/types/analytics";
import {
  mockTokenPrice,
  mockTokenInfo,
  mockHolderData,
  mockLiquidityData,
  mockTransactionData,
  mockRecommendations,
} from "@/lib/mock-data";

function computeGrowthMetrics(
  volume24h: number,
  marketCap: number,
  daily: { count: number; activeWallets: number }[],
  totalHolders: number
): GrowthMetric[] {
  const velocity = marketCap > 0 ? volume24h / marketCap : 0;
  const velocityHealthy = velocity >= 0.001 && velocity <= 0.05;

  const recentDays = daily.slice(-7);
  const olderDays = daily.slice(-14, -7);
  const recentAvgWallets = recentDays.length > 0
    ? recentDays.reduce((s, d) => s + d.activeWallets, 0) / recentDays.length
    : 0;
  const olderAvgWallets = olderDays.length > 0
    ? olderDays.reduce((s, d) => s + d.activeWallets, 0) / olderDays.length
    : 0;
  const walletGrowth = olderAvgWallets > 0
    ? ((recentAvgWallets - olderAvgWallets) / olderAvgWallets) * 100
    : 0;

  const txnSparkline = daily.slice(-30).map((d) => d.count);
  const walletSparkline = daily.slice(-30).map((d) => d.activeWallets);

  return [
    {
      label: "Total Holders",
      value: totalHolders.toLocaleString(),
      trend: walletGrowth,
      trendLabel: `${walletGrowth >= 0 ? "+" : ""}${walletGrowth.toFixed(1)}% active wallet growth (7d)`,
      sparklineData: walletSparkline.length > 0 ? walletSparkline : [0],
      positive: walletGrowth >= 0,
    },
    {
      label: "Token Velocity",
      value: velocity.toFixed(4),
      trend: velocityHealthy ? 0 : velocity > 0.05 ? -1 : 1,
      trendLabel: velocity < 0.001 ? "Very Low" : velocity > 0.05 ? "High (speculative)" : "Healthy range",
      sparklineData: txnSparkline.length > 0 ? txnSparkline : [0],
      positive: velocityHealthy,
    },
    {
      label: "Daily Transactions",
      value: daily.length > 0 ? daily[daily.length - 1].count.toString() : "0",
      trend: walletGrowth,
      trendLabel: `${recentDays.length > 0 ? Math.round(recentDays.reduce((s, d) => s + d.count, 0) / recentDays.length) : 0} avg/day (7d)`,
      sparklineData: txnSparkline.length > 0 ? txnSparkline : [0],
      positive: walletGrowth >= 0,
    },
  ];
}

export default function Dashboard() {
  const { data: priceData, dataUpdatedAt: priceUpdatedAt, isFetching: priceFetching } = useTokenPrice();
  const { data: holderData } = useHolderData();
  const { data: liquidityData } = useLiquidity();
  const { data: transactionData } = useTransactions();

  const secondsAgo = useLastUpdated(priceUpdatedAt);

  const price = priceData ?? mockTokenPrice;
  const holders = holderData ?? mockHolderData;
  const liquidity = liquidityData ?? mockLiquidityData;
  const transactions = transactionData ?? mockTransactionData;

  const tokenInfo: TokenInfo = {
    ...mockTokenInfo,
    totalSupply: price.total_supply && price.total_supply > 0 ? price.total_supply : mockTokenInfo.totalSupply,
    circulatingSupply: price.circulating_supply && price.circulating_supply > 0 ? price.circulating_supply : mockTokenInfo.circulatingSupply,
  };

  const marketCap = price.usd_market_cap > 0
    ? price.usd_market_cap
    : price.usd * tokenInfo.circulatingSupply;

  const riskData = computeRiskScore(holders, liquidity, transactions, price);
  const growthMetrics = computeGrowthMetrics(
    price.usd_24h_vol,
    marketCap,
    transactions.daily,
    holders.totalHolders
  );
  const recommendations = computeRecommendations(holders, liquidity, transactions, growthMetrics);

  const isLive = secondsAgo < 60 || priceFetching;

  return (
    <div className="min-h-screen font-display">
      <TopBar secondsAgo={secondsAgo} isLive={isLive} />

      <main className="pt-14">
        <div className="max-w-[1440px] mx-auto px-4 md:px-5 lg:px-6 py-4 md:py-6 space-y-4 md:space-y-6">
          <HeroMetrics price={price} tokenInfo={tokenInfo} totalHolders={holders.totalHolders} />

          <HolderDistribution data={holders} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <RiskAssessment data={riskData} />
            <LiquidityAnalysis data={liquidity} />
          </div>

          <Recommendations recommendations={recommendations.length > 0 ? recommendations : mockRecommendations} />

          <TradingChart />

          <TransactionActivity data={transactions} />

          <GrowthMetrics metrics={growthMetrics} />

          <footer className="py-6 flex flex-wrap items-center justify-center gap-4 text-[10px] text-text-muted">
            <span>Powered by Polygon</span>
            <span className="w-1 h-1 rounded-full bg-text-muted" />
            <span>Data: CoinMarketCap, Moralis, GeckoTerminal, MEXC</span>
            <span className="w-1 h-1 rounded-full bg-text-muted" />
            <span>Last full refresh: {secondsAgo < 120 ? "just now" : `${Math.floor(secondsAgo / 60)}m ago`}</span>
          </footer>
        </div>
      </main>
    </div>
  );
}
