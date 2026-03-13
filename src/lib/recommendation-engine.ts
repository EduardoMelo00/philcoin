import type {
  Recommendation,
  HolderData,
  LiquidityData,
  TransactionData,
  GrowthMetric,
} from "@/types/analytics";

export function computeRecommendations(
  holderData: HolderData,
  liquidityData: LiquidityData,
  transactionData: TransactionData,
  growthMetrics: GrowthMetric[]
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  const top10Percentage = holderData.holders
    .slice(0, 10)
    .reduce((sum, h) => sum + h.percentage, 0);

  if (top10Percentage > 40) {
    recommendations.push({
      priority: "HIGH",
      title: "Reduce top-10 holder concentration via scheduled vesting unlock",
      description: `The top 10 holders control ${top10Percentage.toFixed(1)}% of supply. Institutional investors flag concentrations above 40% as a governance risk. Implement quarterly vesting releases.`,
      currentMetric: `Top 10: ${top10Percentage.toFixed(1)}%`,
      targetMetric: "Target: < 35%",
    });
  } else if (holderData.hhi > 0.15) {
    recommendations.push({
      priority: "MEDIUM",
      title: "Monitor holder distribution — HHI approaching medium concentration",
      description: `HHI at ${holderData.hhi.toFixed(3)} is approaching the medium concentration threshold. Consider community distribution events.`,
      currentMetric: `HHI: ${holderData.hhi.toFixed(3)}`,
      targetMetric: "Target: < 0.15",
    });
  }

  if (liquidityData.liquidityMcapRatio < 5) {
    recommendations.push({
      priority: "HIGH",
      title: "Critical: Increase DEX liquidity to reduce price impact risk",
      description: `Liquidity/MCap ratio is ${liquidityData.liquidityMcapRatio.toFixed(1)}%. Large sells will cause significant slippage. Incentivize LP providers immediately.`,
      currentMetric: `Ratio: ${liquidityData.liquidityMcapRatio.toFixed(1)}%`,
      targetMetric: "Target: > 10%",
    });
  } else if (liquidityData.pools.length > 0) {
    const maxPool = liquidityData.pools[0];
    const secondPool = liquidityData.pools[1];
    if (secondPool && maxPool.tvl > secondPool.tvl * 3) {
      recommendations.push({
        priority: "MEDIUM",
        title: `Diversify liquidity — ${maxPool.name} dominance is a risk`,
        description: `${maxPool.name} holds ${((maxPool.tvl / liquidityData.totalLiquidity) * 100).toFixed(0)}% of all liquidity. Increase positions on ${secondPool.name} to reduce single-DEX dependency.`,
        currentMetric: `${secondPool.name}: $${(secondPool.tvl / 1_000_000).toFixed(1)}M`,
        targetMetric: "Target: $2M+",
      });
    }
  }

  if (transactionData.buyPressure < 40) {
    recommendations.push({
      priority: "HIGH",
      title: "Sell pressure dominant — consider buyback or catalyst announcement",
      description: `Buy pressure at ${transactionData.buyPressure}% indicates sustained selling. A strategic buyback or major partnership announcement could reverse sentiment.`,
      currentMetric: `Buy pressure: ${transactionData.buyPressure}%`,
      targetMetric: "Target: > 50%",
    });
  }

  const holderGrowth = growthMetrics.find((m) => m.label.includes("Holder"));
  if (holderGrowth && holderGrowth.trend < 0) {
    recommendations.push({
      priority: "MEDIUM",
      title: "New holder growth declining — launch acquisition campaign",
      description: "Holder growth rate is negative. Consider airdrop campaigns, exchange listings, or community incentive programs to attract new holders.",
      currentMetric: `Growth: ${holderGrowth.trendLabel}`,
      targetMetric: "Target: > 5% MoM",
    });
  }

  const velocityMetric = growthMetrics.find((m) => m.label.includes("Velocity"));
  if (velocityMetric) {
    const velocity = parseFloat(velocityMetric.value);
    if (velocity > 0.8) {
      recommendations.push({
        priority: "MEDIUM",
        title: "High token velocity suggests speculative trading — launch staking",
        description: `Token velocity at ${velocity.toFixed(2)} indicates rapid turnover. A staking program with competitive APY would incentivize holding and reduce sell pressure.`,
        currentMetric: `Velocity: ${velocity.toFixed(2)}`,
        targetMetric: "Healthy: 0.1-0.5",
      });
    }
  }

  if (recommendations.length === 0) {
    recommendations.push({
      priority: "LOW",
      title: "All metrics within healthy ranges — maintain current strategy",
      description: "Token fundamentals are solid. Continue monitoring holder distribution and liquidity ratios. Consider proactive growth initiatives.",
      currentMetric: "Status: Healthy",
      targetMetric: "Maintain",
    });
  }

  return recommendations.sort((a, b) => {
    const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    return order[a.priority] - order[b.priority];
  });
}
