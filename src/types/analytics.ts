export interface TokenPrice {
  usd: number;
  usd_24h_change: number;
  usd_market_cap: number;
  usd_24h_vol: number;
  circulating_supply?: number;
  total_supply?: number;
  fully_diluted_market_cap?: number;
}

export interface TokenInfo {
  name: string;
  symbol: string;
  totalSupply: number;
  circulatingSupply: number;
  decimals: number;
  contractAddress: string;
}

export interface PricePoint {
  time: number;
  value: number;
  volume?: number;
}

export type TimeRange = "1D" | "7D" | "1M" | "3M" | "1Y" | "ALL";

export interface HolderEntry {
  rank: number;
  address: string;
  holdings: number;
  percentage: number;
  label: HolderLabel;
  exchangeName?: string;
}

export type HolderLabel = "Treasury" | "Team" | "Exchange" | "LP" | "Community" | "Unknown";

export interface HolderData {
  holders: HolderEntry[];
  totalHolders: number;
  hhi: number;
  concentrationLevel: "Low" | "Medium" | "High";
}

export interface DexPool {
  name: string;
  tvl: number;
  volume24h: number;
  change24h: number;
}

export interface LiquidityData {
  pools: DexPool[];
  totalLiquidity: number;
  liquidityMcapRatio: number;
  liquidityHealth: "Healthy" | "Adequate" | "Low";
  netFlow24h: number;
}

export interface DepthPoint {
  price: number;
  quantity: number;
}

export interface DailyTransaction {
  date: string;
  count: number;
  activeWallets: number;
  buyVolume: number;
  sellVolume: number;
}

export interface TransactionData {
  daily: DailyTransaction[];
  todayTxns: number;
  todayWallets: number;
  buyPressure: number;
}

export interface RiskFactor {
  name: string;
  score: number;
  maxScore: number;
  weight: number;
  description: string;
}

export interface RiskData {
  overallScore: number;
  level: "Critical" | "High" | "Medium" | "Low" | "Very Low";
  factors: RiskFactor[];
}

export interface GrowthMetric {
  label: string;
  value: string;
  trend: number;
  trendLabel: string;
  sparklineData: number[];
  positive: boolean;
}

export type RecommendationPriority = "HIGH" | "MEDIUM" | "LOW";

export interface Recommendation {
  priority: RecommendationPriority;
  title: string;
  description: string;
  currentMetric: string;
  targetMetric: string;
}
