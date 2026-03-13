import type {
  TokenPrice,
  TokenInfo,
  PricePoint,
  HolderData,
  LiquidityData,
  TransactionData,
  DailyTransaction,
  RiskData,
  GrowthMetric,
  Recommendation,
} from "@/types/analytics";

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export const mockTokenPrice: TokenPrice = {
  usd: 0.0233,
  usd_24h_change: 2.54,
  usd_market_cap: 17_400_000,
  usd_24h_vol: 65_000,
  circulating_supply: 745_360_000,
  total_supply: 5_000_000_000,
  fully_diluted_market_cap: 116_500_000,
};

export const mockTokenInfo: TokenInfo = {
  name: "Philcoin",
  symbol: "PHL",
  totalSupply: 5_000_000_000,
  circulatingSupply: 745_360_000,
  decimals: 18,
  contractAddress: "0x24c80D7F032Bc8D308F10d59e20d5a65b90b7334",
};

function generateRealisticPriceHistory(
  days: number,
  basePrice: number
): PricePoint[] {
  const rand = seededRandom(days * 1000 + 42);
  const points: PricePoint[] = [];
  const now = 1741900800;
  const intervalSeconds = days <= 1 ? 300 : days <= 7 ? 3600 : 86400;
  const totalPoints = Math.floor((days * 86400) / intervalSeconds);
  let price = basePrice * (0.7 + rand() * 0.3);

  for (let i = 0; i < totalPoints; i++) {
    const volatility = 0.02 + rand() * 0.03;
    const trend = 0.0002;
    const change = (rand() - 0.48) * volatility + trend;
    price = Math.max(price * (1 + change), basePrice * 0.1);

    const time = now - (totalPoints - i) * intervalSeconds;
    const volume = 30_000 + rand() * 80_000;

    points.push({ time, value: price, volume });
  }

  points.push({
    time: now,
    value: basePrice,
    volume: 40_000 + rand() * 50_000,
  });

  return points;
}

export function getMockPriceHistory(days: number): PricePoint[] {
  return generateRealisticPriceHistory(days, 0.0233);
}

export const mockHolderData: HolderData = {
  totalHolders: 5_180,
  hhi: 0.1427,
  concentrationLevel: "High",
  holders: [
    { rank: 1, address: "0x633a94b6e161a43f3fd8fe8874eb2f1912f250df", holdings: 1_759_763_781, percentage: 35.1953, label: "Unknown" },
    { rank: 2, address: "0x0d7a457e15dc3c12005c414995155ce7ca2e87ab", holdings: 400_000_000, percentage: 8.0, label: "Unknown" },
    { rank: 3, address: "0x775e184d9865148046c6a6a0ceaff847789da791", holdings: 400_000_000, percentage: 8.0, label: "Unknown" },
    { rank: 4, address: "0x49eb2660c673f2f525a66a21f1e8190e1ed21523", holdings: 307_864_574, percentage: 6.1573, label: "Unknown" },
    { rank: 5, address: "0x3a33dca0692bf8b26005b060ceccfaa635a73b98", holdings: 215_072_045, percentage: 4.3014, label: "Unknown" },
    { rank: 6, address: "0xf85ecebf8f13c46151bbcca30951980932e9cf0a", holdings: 152_142_626, percentage: 3.0429, label: "Unknown" },
    { rank: 7, address: "0xaf0a0b7b731a7722b11d24f30c1c1d06dfe81817", holdings: 57_876_278, percentage: 1.1575, label: "Unknown" },
    { rank: 8, address: "0x0c28a26303c292fede3b22451f1a1b9c7a1b4209", holdings: 17_388_957, percentage: 0.3478, label: "Unknown" },
    { rank: 9, address: "0x32b904c7b0611ffd547a4b0822b2043d7d70b469", holdings: 17_104_106, percentage: 0.3421, label: "Unknown" },
    { rank: 10, address: "0x32b07536cd2705daf0601c9a26e47488a7fb6e99", holdings: 13_132_709, percentage: 0.2627, label: "Unknown" },
  ],
};

export const mockLiquidityData: LiquidityData = {
  pools: [
    { name: "QuickSwap V3", tvl: 2_400_000, volume24h: 890_000, change24h: 3.2 },
    { name: "Uniswap V3", tvl: 890_000, volume24h: 340_000, change24h: -1.5 },
    { name: "SushiSwap", tvl: 120_000, volume24h: 45_000, change24h: 0.8 },
  ],
  totalLiquidity: 3_410_000,
  liquidityMcapRatio: 14.6,
  liquidityHealth: "Healthy",
  netFlow24h: 125_000,
};

function generateDailyTransactions(days: number): DailyTransaction[] {
  const rand = seededRandom(days * 777 + 13);
  const data: DailyTransaction[] = [];
  const baseDate = new Date("2026-03-13");

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    const baseTxns = 150 + Math.floor(rand() * 200);
    const baseWallets = Math.floor(baseTxns * (0.55 + rand() * 0.2));
    const totalVolume = 30_000 + rand() * 70_000;
    const buyRatio = 0.45 + rand() * 0.2;

    data.push({
      date: dateStr,
      count: baseTxns,
      activeWallets: baseWallets,
      buyVolume: totalVolume * buyRatio,
      sellVolume: totalVolume * (1 - buyRatio),
    });
  }

  return data;
}

export const mockTransactionData: TransactionData = (() => {
  const daily = generateDailyTransactions(30);
  const today = daily[daily.length - 1];
  const totalVolume = today.buyVolume + today.sellVolume;
  return {
    daily,
    todayTxns: today.count,
    todayWallets: today.activeWallets,
    buyPressure: Math.round((today.buyVolume / totalVolume) * 100),
  };
})();

export const mockRiskData: RiskData = {
  overallScore: 72,
  level: "Low",
  factors: [
    { name: "Liquidity Ratio", score: 9, maxScore: 10, weight: 0.25, description: "TVL vs Market Cap ratio is healthy at 14.6%" },
    { name: "Contract Security", score: 10, maxScore: 10, weight: 0.2, description: "Audited, no admin keys, renounced ownership" },
    { name: "Holder Concentration", score: 2, maxScore: 10, weight: 0.2, description: "Top 10 holders control 66.8% — high concentration" },
    { name: "Trading Volume", score: 3, maxScore: 10, weight: 0.15, description: "24h volume is 0.37% of market cap — low" },
    { name: "Price Volatility", score: 7, maxScore: 10, weight: 0.1, description: "30-day standard deviation within normal range" },
    { name: "Smart Money Flow", score: 6, maxScore: 10, weight: 0.1, description: "Whale wallets showing slight accumulation" },
  ],
};

export const mockGrowthMetrics: GrowthMetric[] = [
  {
    label: "New Holders (30d)",
    value: "+1,247",
    trend: 8.3,
    trendLabel: "+8.3% vs prev 30d",
    sparklineData: [32, 38, 41, 35, 42, 48, 44, 50, 46, 52, 55, 49, 58, 53, 60, 57, 62, 64, 59, 67, 63, 70, 66, 72, 68, 75, 71, 78, 74, 80],
    positive: true,
  },
  {
    label: "Token Velocity",
    value: "0.34",
    trend: -2.1,
    trendLabel: "Healthy (0.1 — 0.5)",
    sparklineData: [0.38, 0.36, 0.35, 0.37, 0.34, 0.33, 0.35, 0.36, 0.34, 0.32, 0.33, 0.35, 0.34, 0.36, 0.35, 0.33, 0.34, 0.35, 0.33, 0.34, 0.36, 0.35, 0.34, 0.33, 0.35, 0.34, 0.33, 0.34, 0.35, 0.34],
    positive: true,
  },
  {
    label: "Network Growth",
    value: "+12.4%/mo",
    trend: 12.4,
    trendLabel: "Compound monthly growth",
    sparklineData: [5.2, 6.1, 7.3, 6.8, 8.2, 9.1, 8.5, 10.2, 9.8, 11.4, 10.8, 12.4],
    positive: true,
  },
];

export const mockRecommendations: Recommendation[] = [
  {
    priority: "HIGH",
    title: "Reduce top-10 holder concentration via scheduled vesting unlock",
    description: "The top 10 holders control 66.8% of supply. The #1 wallet alone holds 35.2%. Institutional investors flag concentrations above 40% as a governance risk. Implement on-chain vesting and transparent labeling.",
    currentMetric: "Top 10: 66.8%",
    targetMetric: "Target: < 40%",
  },
  {
    priority: "MEDIUM",
    title: "Increase liquidity on Uniswap V3 with concentrated positions",
    description: "Uniswap V3 liquidity is $890K vs $2.4M on QuickSwap. Diversifying DEX liquidity reduces single-point-of-failure risk and improves price discovery.",
    currentMetric: "Uniswap V3: $890K",
    targetMetric: "Target: $2M+",
  },
  {
    priority: "LOW",
    title: "Launch holder reward program to sustain growth momentum",
    description: "New holder growth is strong at +8.3% MoM. A staking or loyalty program could accelerate this while reducing speculative velocity.",
    currentMetric: "Velocity: 0.34",
    targetMetric: "Healthy range: 0.1-0.5",
  },
];
