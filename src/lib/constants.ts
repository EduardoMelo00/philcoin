export const PHL_CONTRACT = "0x24c80D7F032Bc8D308F10d59e20d5a65b90b7334";
export const POLYGON_CHAIN_ID = 137;
export const POLYGONSCAN_API_KEY = "6D3JVRZP4W8XT23G22V9FWDZNT2RT8KI2Y";

export const API_URLS = {
  coingeckoPrice: `https://api.coingecko.com/api/v3/simple/token_price/polygon-pos?contract_addresses=${PHL_CONTRACT}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`,
  defiLlama: `https://coins.llama.fi/prices/current/polygon:${PHL_CONTRACT}`,
  polygonscanTokenInfo: `https://api.polygonscan.com/api?module=token&action=tokeninfo&contractaddress=${PHL_CONTRACT}&apikey=${POLYGONSCAN_API_KEY}`,
  coingeckoChart: (days: number) =>
    `https://api.coingecko.com/api/v3/coins/polygon-pos/contract/${PHL_CONTRACT}/market_chart?vs_currency=usd&days=${days}`,
} as const;

export const REFRESH_INTERVALS = {
  price: 30_000,
  liquidity: 120_000,
  transactions: 60_000,
  holders: 300_000,
  recommendations: 900_000,
} as const;

export const TIME_RANGE_DAYS: Record<string, number> = {
  "1D": 1,
  "7D": 7,
  "1M": 30,
  "3M": 90,
  "1Y": 365,
  ALL: 1825,
} as const;

export const HOLDER_SEGMENT_COLORS = [
  "#3B82F6",
  "#6366F1",
  "#8B5CF6",
  "#A78BFA",
  "#818CF8",
  "#60A5FA",
  "#38BDF8",
  "#22D3EE",
  "#2DD4BF",
  "#34D399",
] as const;

export const RISK_WEIGHTS = {
  liquidity: 0.25,
  concentration: 0.2,
  security: 0.2,
  volume: 0.15,
  volatility: 0.1,
  smartMoney: 0.1,
} as const;
