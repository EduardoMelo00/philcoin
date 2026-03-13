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
  usd: 0.00234,
  usd_24h_change: 5.67,
  usd_market_cap: 23_400_000,
  usd_24h_vol: 1_200_000,
};

export const mockTokenInfo: TokenInfo = {
  name: "Philcoin",
  symbol: "PHL",
  totalSupply: 5_000_000_000,
  circulatingSupply: 3_600_000_000,
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
    const volume = 500_000 + rand() * 2_000_000;

    points.push({ time, value: price, volume });
  }

  points.push({
    time: now,
    value: basePrice,
    volume: 800_000 + rand() * 1_000_000,
  });

  return points;
}

export function getMockPriceHistory(days: number): PricePoint[] {
  return generateRealisticPriceHistory(days, mockTokenPrice.usd);
}

export const mockHolderData: HolderData = {
  totalHolders: 15_247,
  hhi: 0.087,
  concentrationLevel: "Low",
  holders: [
    { rank: 1, address: "0x1a2b3c4d5e6f7890abcdef1234567890abcdef01", holdings: 820_000_000, percentage: 8.2, label: "Treasury" },
    { rank: 2, address: "0x9b3c4d5e6f7890abcdef1234567890abcdef02c1", holdings: 610_000_000, percentage: 6.1, label: "Team" },
    { rank: 3, address: "0x2c4d5e6f7890abcdef1234567890abcdef0312ab", holdings: 540_000_000, percentage: 5.4, label: "Team" },
    { rank: 4, address: "0x3d5e6f7890abcdef1234567890abcdef0423cd45", holdings: 480_000_000, percentage: 4.8, label: "Exchange", exchangeName: "BitMart" },
    { rank: 5, address: "0x4e6f7890abcdef1234567890abcdef053456ef67", holdings: 420_000_000, percentage: 4.2, label: "LP", exchangeName: "QuickSwap V3" },
    { rank: 6, address: "0x5f7890abcdef1234567890abcdef064567ab89cd", holdings: 380_000_000, percentage: 3.8, label: "Exchange", exchangeName: "MEXC" },
    { rank: 7, address: "0x6a890abcdef1234567890abcdef075678bcde01f2", holdings: 340_000_000, percentage: 3.4, label: "Community" },
    { rank: 8, address: "0x7b90abcdef1234567890abcdef086789cdef1234", holdings: 310_000_000, percentage: 3.1, label: "Community" },
    { rank: 9, address: "0x8ca0abcdef1234567890abcdef09789adef23456", holdings: 280_000_000, percentage: 2.8, label: "Unknown" },
    { rank: 10, address: "0x9db0abcdef1234567890abcdef108a9bef345678", holdings: 260_000_000, percentage: 2.6, label: "Community" },
    { rank: 11, address: "0xaec0abcdef1234567890abcdef219bacf0456789", holdings: 240_000_000, percentage: 2.4, label: "Unknown" },
    { rank: 12, address: "0xbfd0abcdef1234567890abcdef32acbdf1567890", holdings: 220_000_000, percentage: 2.2, label: "Community" },
    { rank: 13, address: "0xc0e0abcdef1234567890abcdef43bdcef2678901", holdings: 200_000_000, percentage: 2.0, label: "Unknown" },
    { rank: 14, address: "0xd1f0abcdef1234567890abcdef54cedf03789012", holdings: 185_000_000, percentage: 1.85, label: "Community" },
    { rank: 15, address: "0xe200abcdef1234567890abcdef65dfef14890123", holdings: 170_000_000, percentage: 1.7, label: "Unknown" },
    { rank: 16, address: "0xf310abcdef1234567890abcdef76ef0f25901234", holdings: 160_000_000, percentage: 1.6, label: "Community" },
    { rank: 17, address: "0x0420abcdef1234567890abcdef87f01f36012345", holdings: 145_000_000, percentage: 1.45, label: "Unknown" },
    { rank: 18, address: "0x1530abcdef1234567890abcdef98012f47123456", holdings: 130_000_000, percentage: 1.3, label: "Community" },
    { rank: 19, address: "0x2640abcdef1234567890abcdefa9123f58234567", holdings: 120_000_000, percentage: 1.2, label: "Unknown" },
    { rank: 20, address: "0x3750abcdef1234567890abcdefba234f69345678", holdings: 110_000_000, percentage: 1.1, label: "Community" },
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

    const baseTxns = 800 + Math.floor(rand() * 800);
    const baseWallets = Math.floor(baseTxns * (0.55 + rand() * 0.2));
    const totalVolume = 400_000 + rand() * 1_600_000;
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
    { name: "Holder Concentration", score: 6, maxScore: 10, weight: 0.2, description: "Top 10 holders control 44.4% — moderate" },
    { name: "Trading Volume", score: 8, maxScore: 10, weight: 0.15, description: "24h volume is 5.1% of market cap — active" },
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
    description: "The top 10 holders control 44.4% of supply. Institutional investors flag concentrations above 40% as a governance risk. Implement quarterly vesting releases to bring this below 35%.",
    currentMetric: "Top 10: 44.4%",
    targetMetric: "Target: < 35%",
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
