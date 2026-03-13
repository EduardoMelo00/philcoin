import { NextResponse } from "next/server";

const CMC_API_KEY = process.env.CMC_API_KEY || "d21cbee1-b29e-4f34-91c2-65ebf83d171b";
const CMC_BASE_URL = "https://pro-api.coinmarketcap.com";

export async function GET() {
  try {
    const [quoteRes, infoRes] = await Promise.all([
      fetch(`${CMC_BASE_URL}/v2/cryptocurrency/quotes/latest?symbol=PHL`, {
        headers: { "X-CMC_PRO_API_KEY": CMC_API_KEY },
        next: { revalidate: 30 },
      }),
      fetch(`${CMC_BASE_URL}/v2/cryptocurrency/info?symbol=PHL`, {
        headers: { "X-CMC_PRO_API_KEY": CMC_API_KEY },
        next: { revalidate: 3600 },
      }),
    ]);

    const quoteData = await quoteRes.json();
    const infoData = await infoRes.json();

    const phlQuotes = quoteData?.data?.PHL;
    const phlInfo = infoData?.data?.PHL;

    if (!phlQuotes || phlQuotes.length === 0) {
      return NextResponse.json({ error: "PHL not found" }, { status: 404 });
    }

    const phl = phlQuotes[0];
    const quote = phl.quote?.USD;
    const info = phlInfo?.[0];

    const circulatingSupply = phl.circulating_supply > 0
      ? phl.circulating_supply
      : 745_360_000;
    const marketCap = quote?.market_cap > 0
      ? quote.market_cap
      : (quote?.price ?? 0) * circulatingSupply;

    return NextResponse.json({
      price: quote?.price ?? 0,
      market_cap: marketCap,
      volume_24h: quote?.volume_24h ?? 0,
      percent_change_24h: quote?.percent_change_24h ?? 0,
      percent_change_7d: quote?.percent_change_7d ?? 0,
      percent_change_30d: quote?.percent_change_30d ?? 0,
      circulating_supply: circulatingSupply,
      total_supply: phl.total_supply > 0 ? phl.total_supply : 5_000_000_000,
      max_supply: phl.max_supply ?? 0,
      cmc_rank: phl.cmc_rank ?? 0,
      num_market_pairs: phl.num_market_pairs ?? 0,
      fully_diluted_market_cap: quote?.fully_diluted_market_cap ?? 0,
      logo: info?.logo ?? "",
      description: info?.description ?? "",
      urls: info?.urls ?? {},
      last_updated: quote?.last_updated ?? new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch from CoinMarketCap" },
      { status: 500 }
    );
  }
}
