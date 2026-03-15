"use client";

import MetricCard from "./MetricCard";
import NumberTicker from "./NumberTicker";
import { formatPrice, formatCurrency, formatPercentage, formatLargeNumber } from "@/lib/formatters";
import type { TokenPrice, TokenInfo } from "@/types/analytics";

interface HeroMetricsProps {
  price: TokenPrice;
  tokenInfo: TokenInfo;
  totalHolders?: number;
}

export default function HeroMetrics({ price, tokenInfo, totalHolders }: HeroMetricsProps) {
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

      {totalHolders !== undefined && (
        <MetricCard
          label="Active Wallets"
          delay={0.2}
          className="lg:flex-1"
          subDetail="wallets holding PHL > 0"
        >
          <div className="flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-accent-primary flex-shrink-0">
              <path d="M21 18V19C21 20.1 20.1 21 19 21H5C3.89 21 3 20.1 3 19V5C3 3.9 3.89 3 5 3H19C20.1 3 21 3.9 21 5V6H12C10.89 6 10 6.9 10 8V16C10 17.1 10.89 18 12 18H21ZM12 16H22V8H12V16ZM16 13.5C15.17 13.5 14.5 12.83 14.5 12C14.5 11.17 15.17 10.5 16 10.5C16.83 10.5 17.5 11.17 17.5 12C17.5 12.83 16.83 13.5 16 13.5Z" fill="currentColor"/>
            </svg>
            <span className="text-[28px] font-semibold text-text-primary leading-none font-mono">
              {totalHolders.toLocaleString()}
            </span>
          </div>
        </MetricCard>
      )}

      <MetricCard
        label="Supply"
        delay={0.25}
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
