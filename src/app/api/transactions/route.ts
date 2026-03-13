import { NextResponse } from "next/server";

const PHL_CONTRACT = "0x24c80D7F032Bc8D308F10d59e20d5a65b90b7334";
const ETHERSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY || "6D3JVRZP4W8XT23G22V9FWDZNT2RT8KI2Y";

const DEX_ROUTERS = new Set([
  "0xa5e0829caced8ffdd4de3c43696c57f7d7a678ff",
  "0xf5b509bb0909a69b1c207e495f687a596c168e12",
  "0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45",
  "0xd99d1c33f9fc3444f8101754abc46c52416550d1",
  "0x1b02da8cb0d097eb8d57a175b88c7d8b47997506",
  "0xe592427a0aece92de3edee1f18e0157c05861564",
]);

interface Transfer {
  timeStamp: string;
  from: string;
  to: string;
  value: string;
  tokenDecimal: string;
}

export async function GET() {
  try {
    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 86400;

    const url = `https://api.etherscan.io/v2/api?chainid=137&module=account&action=tokentx&contractaddress=${PHL_CONTRACT}&startblock=0&endblock=99999999&page=1&offset=10000&sort=desc&apikey=${ETHERSCAN_API_KEY}`;

    const response = await fetch(url, { next: { revalidate: 60 } });
    const data = await response.json();

    if (data.status !== "1" || !Array.isArray(data.result)) {
      throw new Error("Failed to fetch transfers");
    }

    const transfers: Transfer[] = data.result.filter(
      (tx: Transfer) => Number(tx.timeStamp) >= thirtyDaysAgo
    );

    const dailyMap = new Map<string, {
      count: number;
      wallets: Set<string>;
      buyVolume: number;
      sellVolume: number;
    }>();

    for (const tx of transfers) {
      const date = new Date(Number(tx.timeStamp) * 1000).toISOString().split("T")[0];
      const decimals = Number(tx.tokenDecimal) || 18;
      const value = Number(tx.value) / Math.pow(10, decimals);

      if (!dailyMap.has(date)) {
        dailyMap.set(date, { count: 0, wallets: new Set(), buyVolume: 0, sellVolume: 0 });
      }

      const day = dailyMap.get(date)!;
      day.count++;
      day.wallets.add(tx.from.toLowerCase());
      day.wallets.add(tx.to.toLowerCase());

      const fromDex = DEX_ROUTERS.has(tx.from.toLowerCase());
      const toDex = DEX_ROUTERS.has(tx.to.toLowerCase());

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
      { status: 500 }
    );
  }
}
