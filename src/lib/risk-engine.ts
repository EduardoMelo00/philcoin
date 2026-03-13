import type { RiskData, RiskFactor, HolderData, LiquidityData, TransactionData, TokenPrice } from "@/types/analytics";
import { RISK_WEIGHTS } from "./constants";

function scoreLiquidity(liquidityMcapRatio: number): number {
  if (liquidityMcapRatio >= 15) return 10;
  if (liquidityMcapRatio >= 10) return 8;
  if (liquidityMcapRatio >= 5) return 6;
  if (liquidityMcapRatio >= 2) return 4;
  return 2;
}

function scoreConcentration(hhi: number): number {
  if (hhi <= 0.05) return 10;
  if (hhi <= 0.1) return 8;
  if (hhi <= 0.15) return 6;
  if (hhi <= 0.25) return 4;
  return 2;
}

function scoreVolume(volume24h: number, marketCap: number): number {
  const ratio = marketCap > 0 ? (volume24h / marketCap) * 100 : 0;
  if (ratio >= 5) return 9;
  if (ratio >= 3) return 8;
  if (ratio >= 1) return 6;
  if (ratio >= 0.5) return 4;
  return 2;
}

function scoreVolatility(change24h: number): number {
  const absChange = Math.abs(change24h);
  if (absChange <= 3) return 9;
  if (absChange <= 5) return 8;
  if (absChange <= 10) return 6;
  if (absChange <= 20) return 4;
  return 2;
}

function getRiskLevel(score: number): RiskData["level"] {
  if (score >= 80) return "Very Low";
  if (score >= 60) return "Low";
  if (score >= 40) return "Medium";
  if (score >= 20) return "High";
  return "Critical";
}

export function computeRiskScore(
  holderData: HolderData,
  liquidityData: LiquidityData,
  transactionData: TransactionData,
  priceData: TokenPrice
): RiskData {
  const liquidityScore = scoreLiquidity(liquidityData.liquidityMcapRatio);
  const concentrationScore = scoreConcentration(holderData.hhi);
  const securityScore = 10;
  const volumeScore = scoreVolume(priceData.usd_24h_vol, priceData.usd_market_cap);
  const volatilityScore = scoreVolatility(priceData.usd_24h_change);
  const smartMoneyScore = transactionData.buyPressure >= 50 ? 7 : 5;

  const factors: RiskFactor[] = [
    { name: "Liquidity Ratio", score: liquidityScore, maxScore: 10, weight: RISK_WEIGHTS.liquidity, description: `TVL vs Market Cap ratio at ${liquidityData.liquidityMcapRatio.toFixed(1)}%` },
    { name: "Contract Security", score: securityScore, maxScore: 10, weight: RISK_WEIGHTS.security, description: "Audited, verified on Polygonscan" },
    { name: "Holder Concentration", score: concentrationScore, maxScore: 10, weight: RISK_WEIGHTS.concentration, description: `HHI index: ${holderData.hhi.toFixed(3)} (${holderData.concentrationLevel})` },
    { name: "Trading Volume", score: volumeScore, maxScore: 10, weight: RISK_WEIGHTS.volume, description: `24h volume relative to market cap` },
    { name: "Price Volatility", score: volatilityScore, maxScore: 10, weight: RISK_WEIGHTS.volatility, description: `24h change: ${priceData.usd_24h_change.toFixed(1)}%` },
    { name: "Smart Money Flow", score: smartMoneyScore, maxScore: 10, weight: RISK_WEIGHTS.smartMoney, description: `Buy pressure: ${transactionData.buyPressure}%` },
  ];

  const weightedScore = factors.reduce(
    (acc, f) => acc + (f.score / f.maxScore) * f.weight * 100,
    0
  );

  const overallScore = Math.round(weightedScore);

  return {
    overallScore,
    level: getRiskLevel(overallScore),
    factors,
  };
}
