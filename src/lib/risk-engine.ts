import type { RiskData, RiskFactor, HolderData, LiquidityData, TransactionData, TokenPrice } from "@/types/analytics";
import { RISK_WEIGHTS } from "./constants";

function scoreLiquidity(volume24h: number, marketCap: number, dexTvl: number): { score: number; description: string } {
  const volRatio = marketCap > 0 ? (volume24h / marketCap) * 100 : 0;

  if (dexTvl > 1_000_000) {
    return { score: 9, description: `DEX TVL: $${(dexTvl / 1e6).toFixed(1)}M — strong on-chain liquidity` };
  }

  if (volRatio >= 1) {
    return { score: 7, description: `CEX-based liquidity (MEXC, BitMart). Vol/MCap: ${volRatio.toFixed(2)}%` };
  }
  if (volRatio >= 0.3) {
    return { score: 5, description: `CEX-based liquidity. Vol/MCap: ${volRatio.toFixed(2)}% — adequate` };
  }
  return { score: 3, description: `Low liquidity. Vol/MCap: ${volRatio.toFixed(2)}%. Minimal DEX presence` };
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
  const circulatingSupply = priceData.circulating_supply && priceData.circulating_supply > 0
    ? priceData.circulating_supply
    : 745_360_000;
  const marketCap = priceData.usd_market_cap > 0
    ? priceData.usd_market_cap
    : priceData.usd * circulatingSupply;

  const liq = scoreLiquidity(priceData.usd_24h_vol, marketCap, liquidityData.totalLiquidity);
  const concentrationScore = scoreConcentration(holderData.hhi);
  const securityScore = 10;
  const volumeScore = scoreVolume(priceData.usd_24h_vol, marketCap);
  const volatilityScore = scoreVolatility(priceData.usd_24h_change);
  const smartMoneyScore = transactionData.buyPressure >= 50 ? 7 : 5;

  const factors: RiskFactor[] = [
    { name: "Liquidity", score: liq.score, maxScore: 10, weight: RISK_WEIGHTS.liquidity, description: liq.description },
    { name: "Contract Security", score: securityScore, maxScore: 10, weight: RISK_WEIGHTS.security, description: "Audited, verified on Polygonscan" },
    { name: "Holder Concentration", score: concentrationScore, maxScore: 10, weight: RISK_WEIGHTS.concentration, description: `HHI index: ${holderData.hhi.toFixed(3)} (${holderData.concentrationLevel})` },
    { name: "Trading Volume", score: volumeScore, maxScore: 10, weight: RISK_WEIGHTS.volume, description: `Vol/MCap: ${marketCap > 0 ? ((priceData.usd_24h_vol / marketCap) * 100).toFixed(2) : 0}%` },
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
