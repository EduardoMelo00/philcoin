import { NextResponse } from "next/server";

const QUICKNODE_RPC = process.env.QUICKNODE_RPC || "https://sleek-late-fog.matic.quiknode.pro/b580892f638ecd34642256b68c6f2b1dacbb8ee2/";
const ETHERSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY || "6D3JVRZP4W8XT23G22V9FWDZNT2RT8KI2Y";
const PHL_CONTRACT = "0x24c80D7F032Bc8D308F10d59e20d5a65b90b7334";
const TOTAL_SUPPLY = 5_000_000_000;
const BALANCE_OF_SELECTOR = "0x70a08231";

type HolderLabel = "Treasury" | "Team" | "Exchange" | "LP" | "Community" | "Unknown";

const KNOWN_WALLETS: Record<string, { label: HolderLabel; name: string }> = {
  "0x633a94b6e161a43f3fd8fe8874eb2f1912f250df": { label: "Treasury", name: "Philanthropy Vesting" },
  "0x0d7a457e15dc3c12005c414995155ce7ca2e87ab": { label: "Team", name: "Team Vesting" },
  "0x49eb2660c673f2f525a66a21f1e8190e1ed21523": { label: "Treasury", name: "Treasury Vesting" },
  "0xf85ecebf8f13c46151bbcca30951980932e9cf0a": { label: "Treasury", name: "Foundation Vesting" },
  "0x775e184d9865148046c6a6a0ceaff847789da791": { label: "Treasury", name: "Strategic Vesting" },
  "0x3a33dca0692bf8b26005b060ceccfaa635a73b98": { label: "Treasury", name: "CrossChain Vesting" },
  "0x0c28a26303c292fede3b22451f1a1b9c7a1b4209": { label: "Treasury", name: "Gnosis Safe" },
};

async function getUniqueAddressesFromTransfers(): Promise<string[]> {
  const url = `https://api.etherscan.io/v2/api?chainid=137&module=account&action=tokentx&contractaddress=${PHL_CONTRACT}&page=1&offset=10000&sort=asc&apikey=${ETHERSCAN_API_KEY}`;

  const response = await fetch(url, { next: { revalidate: 600 } });
  const data = await response.json();

  if (data.status !== "1" || !Array.isArray(data.result)) {
    throw new Error("Failed to fetch transfers");
  }

  const addresses = new Set<string>();
  for (const tx of data.result) {
    if (tx.to && tx.to !== "0x0000000000000000000000000000000000000000") {
      addresses.add(tx.to.toLowerCase());
    }
    if (tx.from && tx.from !== "0x0000000000000000000000000000000000000000") {
      addresses.add(tx.from.toLowerCase());
    }
  }

  return Array.from(addresses);
}

async function batchBalanceOf(addresses: string[]): Promise<Map<string, number>> {
  const balances = new Map<string, number>();

  const batchSize = 50;
  for (let i = 0; i < addresses.length; i += batchSize) {
    const batch = addresses.slice(i, i + batchSize).map((addr, idx) => ({
      jsonrpc: "2.0",
      id: i + idx,
      method: "eth_call",
      params: [
        {
          to: PHL_CONTRACT,
          data: BALANCE_OF_SELECTOR + addr.slice(2).padStart(64, "0"),
        },
        "latest",
      ],
    }));

    const response = await fetch(QUICKNODE_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(batch),
    });

    const results = await response.json();

    for (const r of results) {
      const idx = r.id;
      if (idx < addresses.length && r.result) {
        const balance = parseInt(r.result, 16) / 1e18;
        if (balance > 0) {
          balances.set(addresses[idx], balance);
        }
      }
    }
  }

  return balances;
}

export async function GET() {
  try {
    const addresses = await getUniqueAddressesFromTransfers();
    const balances = await batchBalanceOf(addresses);

    const holders = Array.from(balances.entries())
      .map(([address, holdings]) => {
        const known = KNOWN_WALLETS[address.toLowerCase()];
        return {
          rank: 0,
          address,
          holdings: Math.round(holdings),
          percentage: parseFloat(((holdings / TOTAL_SUPPLY) * 100).toFixed(4)),
          label: known?.label ?? ("Unknown" as HolderLabel),
          exchangeName: known?.name,
        };
      })
      .filter((h) => h.holdings > 0)
      .sort((a, b) => b.holdings - a.holdings);

    holders.forEach((h, i) => (h.rank = i + 1));

    const top50 = holders.slice(0, 50);
    const top10 = holders.slice(0, 10);
    const top10Pct = top10.reduce((sum, h) => sum + h.percentage, 0);
    const hhi = top50.reduce(
      (sum, h) => sum + (h.percentage / 100) ** 2,
      0
    );

    let concentrationLevel: "Low" | "Medium" | "High" = "Low";
    if (hhi > 0.1) concentrationLevel = "High";
    else if (hhi > 0.05) concentrationLevel = "Medium";

    return NextResponse.json({
      holders: top50,
      totalHolders: holders.length,
      hhi: parseFloat(hhi.toFixed(4)),
      concentrationLevel,
      top10Percentage: parseFloat(top10Pct.toFixed(2)),
    });
  } catch (error) {
    console.error("Holder fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch holder data" },
      { status: 500 },
    );
  }
}
