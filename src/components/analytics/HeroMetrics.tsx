"use client";

import MetricCard from "./MetricCard";
import NumberTicker from "./NumberTicker";
import { formatPrice, formatCurrency, formatPercentage, formatLargeNumber } from "@/lib/formatters";
import type { TokenPrice, TokenInfo } from "@/types/analytics";

interface HeroMetricsProps {
  price: TokenPrice;
  tokenInfo: TokenInfo;
}

export default function HeroMetrics({ price, tokenInfo }: HeroMetricsProps) {
  const bullish = price.usd_24h_change >= 0;
  const formattedPrice = formatPrice(price.usd);
  const [priceInteger, priceDecimal] = formattedPrice.split(".");
  const marketCap = price.usd_market_cap > 0
    ? price.usd_market_cap
    : price.usd * tokenInfo.circulatingSupply;

  return (
    <div className="grid grid-cols-2 lg:flex lg:gap-1 gap-2">
      <MetricCard
        label="Price"
        className="col-span-2 lg:flex-1"
        delay={0}
      >
        <div className={`flex items-baseline gap-0.5 ${bullish ? "glow-bullish" : "glow-bearish"}`}>
          <span className="text-text-secondary text-2xl lg:text-[28px] font-light">$</span>
          <NumberTicker
            value={priceInteger}
            className="text-3xl lg:text-[48px] font-bold text-text-primary leading-none"
          />
          <span className="text-3xl lg:text-[48px] font-light text-text-primary leading-none">.</span>
          <NumberTicker
            value={priceDecimal}
            className="text-3xl lg:text-[48px] font-light text-text-secondary leading-none"
          />
        </div>
      </MetricCard>

      <MetricCard
        label="24h Change"
        delay={0.05}
        className="lg:flex-1"
        background={bullish ? "var(--gradient-bullish)" : "var(--gradient-bearish)"}
      >
        <div className="flex items-center gap-1.5">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            className={`transition-transform duration-300 ${bullish ? "" : "rotate-180"}`}
            fill="none"
          >
            <path
              d="M8 3L13 9H3L8 3Z"
              fill={bullish ? "#22C55E" : "#EF4444"}
            />
          </svg>
          <span className={`text-[28px] font-semibold leading-none font-mono ${bullish ? "text-accent-bullish" : "text-accent-bearish"}`}>
            {formatPercentage(price.usd_24h_change)}
          </span>
        </div>
      </MetricCard>

      <MetricCard
        label="Market Cap"
        delay={0.1}
        className="lg:flex-1"
      >
        <span className="text-[28px] font-semibold text-text-primary leading-none font-mono">
          {formatCurrency(marketCap)}
        </span>
      </MetricCard>

      <MetricCard
        label="Volume (24h)"
        delay={0.15}
        className="lg:flex-1"
      >
        <span className="text-[28px] font-semibold text-text-primary leading-none font-mono">
          {formatCurrency(price.usd_24h_vol)}
        </span>
      </MetricCard>

      <MetricCard
        label="Supply"
        delay={0.2}
        className="lg:flex-1"
        subDetail={`${formatLargeNumber(tokenInfo.circulatingSupply)} circulating`}
      >
        <span className="text-xl font-semibold text-text-primary leading-none font-mono">
          {formatLargeNumber(tokenInfo.totalSupply)}
        </span>
        <div className="mt-2 h-1.5 rounded-full bg-elevated overflow-hidden">
          <div
            className="h-full rounded-full bg-accent-primary transition-all duration-500"
            style={{ width: `${(tokenInfo.circulatingSupply / tokenInfo.totalSupply) * 100}%` }}
          />
        </div>
      </MetricCard>
    </div>
  );
}
