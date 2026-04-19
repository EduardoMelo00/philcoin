import { NextResponse } from "next/server";

const COINGECKO_ID = "philcoin";
const CG_BASE = "https://api.coingecko.com/api/v3";

const VALID_DAYS: Record<string, string> = {
  "1": "1",
  "7": "7",
  "14": "14",
  "30": "30",
  "90": "90",
  "180": "180",
  "365": "365",
  max: "365",
};

const REVALIDATE_BY_DAYS: Record<string, number> = {
  "1": 60,
  "7": 300,
  "14": 600,
  "30": 900,
  "90": 1800,
  "180": 3600,
  "365": 3600,
};

type OHLCTuple = [number, number, number, number, number];
type PriceTuple = [number, number];
type VolumeTuple = [number, number];

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const cache = new Map<string, { data: Candle[]; timestamp: number }>();

function nearestVolume(sortedVolumes: VolumeTuple[], ts: number): number {
  if (sortedVolumes.length === 0) return 0;
  let lo = 0;
  let hi = sortedVolumes.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (sortedVolumes[mid][0] < ts) lo = mid + 1;
    else hi = mid;
  }
  const candidate = sortedVolumes[lo];
  const prev = lo > 0 ? sortedVolumes[lo - 1] : candidate;
  return Math.abs(candidate[0] - ts) <= Math.abs(prev[0] - ts) ? candidate[1] : prev[1];
}

function deriveCandlesFromPrices(
  prices: PriceTuple[],
  volumes: VolumeTuple[],
  days: string,
): Candle[] {
  if (prices.length === 0) return [];
  const bucketSeconds = days === "1"
    ? 1800
    : days === "7" || days === "14"
      ? 14400
      : 86400;

  const buckets = new Map<number, { prices: number[]; startTs: number; endTs: number }>();

  for (const [tsMs, price] of prices) {
    const tsSec = Math.floor(tsMs / 1000);
    const bucket = Math.floor(tsSec / bucketSeconds) * bucketSeconds;
    const entry = buckets.get(bucket);
    if (entry) {
      entry.prices.push(price);
      entry.endTs = tsSec;
    } else {
      buckets.set(bucket, { prices: [price], startTs: tsSec, endTs: tsSec });
    }
  }

  return Array.from(buckets.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([bucket, { prices: pts }]) => {
      const open = pts[0];
      const close = pts[pts.length - 1];
      let high = pts[0];
      let low = pts[0];
      for (const p of pts) {
        if (p > high) high = p;
        if (p < low) low = p;
      }
      return {
        time: bucket,
        open,
        high,
        low,
        close,
        volume: nearestVolume(volumes, bucket * 1000),
      };
    });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const daysParam = searchParams.get("days") ?? "7";
  const days = VALID_DAYS[daysParam] ?? "7";
  const cacheKey = `days:${days}`;
  const ttlMs = (REVALIDATE_BY_DAYS[days] ?? 300) * 1000;
  const now = Date.now();

  const cached = cache.get(cacheKey);
  if (cached && now - cached.timestamp < ttlMs) {
    return NextResponse.json({ candles: cached.data, source: "coingecko", days, cached: true });
  }

  try {
    const revalidate = REVALIDATE_BY_DAYS[days] ?? 300;
    const [ohlcRes, chartRes] = await Promise.all([
      fetch(`${CG_BASE}/coins/${COINGECKO_ID}/ohlc?vs_currency=usd&days=${days}`, {
        next: { revalidate },
      }),
      fetch(`${CG_BASE}/coins/${COINGECKO_ID}/market_chart?vs_currency=usd&days=${days}`, {
        next: { revalidate },
      }),
    ]);

    const ohlc: OHLCTuple[] = ohlcRes.ok ? await ohlcRes.json() : [];
    const chart = chartRes.ok
      ? (await chartRes.json() as { prices?: PriceTuple[]; total_volumes?: VolumeTuple[] })
      : { prices: [], total_volumes: [] };
    const volumes: VolumeTuple[] = (chart.total_volumes ?? []).sort((a, b) => a[0] - b[0]);

    let candles: Candle[] = ohlc.map(([ts, open, high, low, close]) => ({
      time: Math.floor(ts / 1000),
      open,
      high,
      low,
      close,
      volume: nearestVolume(volumes, ts),
    }));

    let derivedFallback = false;
    if (candles.length === 0 && chart.prices?.length) {
      candles = deriveCandlesFromPrices(chart.prices, volumes, days);
      derivedFallback = true;
    }

    if (candles.length === 0) {
      throw new Error("No price data returned by CoinGecko");
    }

    cache.set(cacheKey, { data: candles, timestamp: now });

    return NextResponse.json({
      candles,
      source: derivedFallback ? "coingecko:derived" : "coingecko",
      days,
    });
  } catch (error) {
    console.error("Price history fetch error:", error);
    if (cached) {
      return NextResponse.json({
        candles: cached.data,
        source: "coingecko",
        days,
        cached: true,
        stale: true,
      });
    }
    return NextResponse.json(
      { error: "Failed to fetch price history", candles: [] },
      { status: 502 },
    );
  }
}
