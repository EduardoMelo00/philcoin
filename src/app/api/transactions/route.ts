import { NextResponse } from "next/server";

const MORALIS_API_KEY = process.env.MORALIS_API_KEY!;
const PHL_CONTRACT = "0x24c80D7F032Bc8D308F10d59e20d5a65b90b7334";
const MORALIS_BASE = "https://deep-index.moralis.io/api/v2.2";

const DEX_ROUTERS = new Set([
  "0xa5e0829caced8ffdd4de3c43696c57f7d7a678ff",
  "0xf5b509bb0909a69b1c207e495f687a596c168e12",
  "0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45",
  "0xd99d1c33f9fc3444f8101754abc46c52416550d1",
  "0x1b02da8cb0d097eb8d57a175b88c7d8b47997506",
  "0xe592427a0aece92de3edee1f18e0157c05861564",
]);

interface MoralisTransfer {
  block_timestamp: string;
  from_address: string;
  to_address: string;
  value: string;
  value_decimal: string;
  token_decimals: string;
}

async function fetchTransfers(cursor?: string): Promise<{ result: MoralisTransfer[]; cursor: string | null }> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400 * 1000).toISOString();
  const params = new URLSearchParams({
    chain: "polygon",
    order: "DESC",
    limit: "100",
    from_date: thirtyDaysAgo,
  });
  if (cursor) params.set("cursor", cursor);

  const response = await fetch(
    `${MORALIS_BASE}/erc20/${PHL_CONTRACT}/transfers?${params}`,
    {
      headers: { "X-API-Key": MORALIS_API_KEY },
      next: { revalidate: 60 },
    }
  );

  if (!response.ok) throw new Error(`Moralis API error: ${response.status}`);
  return response.json();
}

export async function GET() {
  try {
    const allTransfers: MoralisTransfer[] = [];
    let cursor: string | undefined;
    let pages = 0;

    do {
      const data = await fetchTransfers(cursor);
      allTransfers.push(...data.result);
      cursor = data.cursor ?? undefined;
      pages++;
    } while (cursor && pages < 50);

    const dailyMap = new Map<string, {
      count: number;
      wallets: Set<string>;
      buyVolume: number;
      sellVolume: number;
    }>();

    for (const tx of allTransfers) {
      const date = tx.block_timestamp.split("T")[0];
      const value = parseFloat(tx.value_decimal || "0");

      if (!dailyMap.has(date)) {
        dailyMap.set(date, { count: 0, wallets: new Set(), buyVolume: 0, sellVolume: 0 });
      }

      const day = dailyMap.get(date)!;
      day.count++;
      day.wallets.add(tx.from_address.toLowerCase());
      day.wallets.add(tx.to_address.toLowerCase());

      const fromDex = DEX_ROUTERS.has(tx.from_address.toLowerCase());
      const toDex = DEX_ROUTERS.has(tx.to_address.toLowerCase());

      if (fromDex) {
        day.buyVolume += value;
      } else if (toDex) {
        day.sellVolume += value;
      }
    }

    const daily = Array.from(dailyMap.entries())
      .map(([date, d]) => ({
        date,
        count: d.count,
        activeWallets: d.wallets.size,
        buyVolume: Math.round(d.buyVolume),
        sellVolume: Math.round(d.sellVolume),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const today = daily[daily.length - 1];
    const totalBuy = today?.buyVolume || 0;
    const totalSell = today?.sellVolume || 0;
    const totalVol = totalBuy + totalSell;

    return NextResponse.json({
      daily,
      todayTxns: today?.count || 0,
      todayWallets: today?.activeWallets || 0,
      buyPressure: totalVol > 0 ? Math.round((totalBuy / totalVol) * 100) : 50,
    });
  } catch (error) {
    console.error("Transaction fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch transaction data" },
      { status: 500 },
    );
  }
}
