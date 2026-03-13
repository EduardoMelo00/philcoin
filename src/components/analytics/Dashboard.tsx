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
import {
  mockTokenPrice,
  mockTokenInfo,
  mockHolderData,
  mockLiquidityData,
  mockTransactionData,
  mockGrowthMetrics,
  mockRecommendations,
} from "@/lib/mock-data";

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

  const riskData = computeRiskScore(holders, liquidity, transactions, price);
  const growthMetrics = mockGrowthMetrics;
  const recommendations = computeRecommendations(holders, liquidity, transactions, growthMetrics);

  const isLive = secondsAgo < 60 || priceFetching;

  return (
    <div className="min-h-screen font-display">
      <TopBar secondsAgo={secondsAgo} isLive={isLive} />

      <main className="pt-14">
        <div className="max-w-[1440px] mx-auto px-4 md:px-5 lg:px-6 py-4 md:py-6 space-y-4 md:space-y-6">
          <HeroMetrics price={price} tokenInfo={mockTokenInfo} />

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
            <span>Data: CoinGecko, DeFiLlama</span>
            <span className="w-1 h-1 rounded-full bg-text-muted" />
            <span>Last full refresh: {secondsAgo < 120 ? "just now" : `${Math.floor(secondsAgo / 60)}m ago`}</span>
          </footer>
        </div>
      </main>
    </div>
  );
}
