import { NextResponse } from "next/server";

const QUICKNODE_RPC = process.env.QUICKNODE_RPC || "https://sleek-late-fog.matic.quiknode.pro/b580892f638ecd34642256b68c6f2b1dacbb8ee2/";
const ETHERSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY || "6D3JVRZP4W8XT23G22V9FWDZNT2RT8KI2Y";
const PHL_CONTRACT = "0x24c80D7F032Bc8D308F10d59e20d5a65b90b7334";
const TOTAL_SUPPLY = 5_000_000_000;
const BALANCE_OF_SELECTOR = "0x70a08231";
const TOTAL_HOLDERS = 5_135;

type HolderLabel = "Treasury" | "Team" | "Exchange" | "LP" | "Community" | "Unknown";

const KNOWN_WALLETS: Record<string, { label: HolderLabel; name: string }> = {
  "0x633a94b6e161a43f3fd8fe8874eb2f1912f250df": { label: "Treasury", name: "Philanthropy Vesting" },
  "0x72349caff75f97e4189f00d2fdbe1e50efb18367": { label: "Treasury", name: "Treasury Safe" },
  "0x0d7a457e15dc3c12005c414995155ce7ca2e87ab": { label: "Team", name: "Team Vesting" },
  "0x775e184d9865148046c6a6a0ceaff847789da791": { label: "Treasury", name: "Strategic Vesting" },
  "0x49eb2660c673f2f525a66a21f1e8190e1ed21523": { label: "Treasury", name: "Treasury Vesting" },
  "0x3a33dca0692bf8b26005b060ceccfaa635a73b98": { label: "Treasury", name: "CrossChain Vesting" },
  "0xf85ecebf8f13c46151bbcca30951980932e9cf0a": { label: "Treasury", name: "Foundation Vesting" },
  "0x0a3ce65bf86de3e94b174676a5dd8122403a123a": { label: "Treasury", name: "Reserve" },
  "0x2992759e1f443aac6da7dfbcd4c1184c8bfc199d": { label: "Treasury", name: "Operations" },
  "0x51e3d44172868acc60d68ca99591ce4230bc75e0": { label: "Exchange", name: "MEXC" },
  "0xe9ee9f2857b559c67dd03576a1c74589a6af6197": { label: "Exchange", name: "BitMart" },
  "0x0c28a26303c292fede3b22451f1a1b9c7a1b4209": { label: "Treasury", name: "Gnosis Safe" },
};

const BASELINE_ADDRESSES = [
  "0x633a94b6e161a43f3fd8fe8874eb2f1912f250df",
  "0x72349caff75f97e4189f00d2fdbe1e50efb18367",
  "0x0d7a457e15dc3c12005c414995155ce7ca2e87ab",
  "0x775e184d9865148046c6a6a0ceaff847789da791",
  "0x49eb2660c673f2f525a66a21f1e8190e1ed21523",
  "0x3a33dca0692bf8b26005b060ceccfaa635a73b98",
  "0xf85ecebf8f13c46151bbcca30951980932e9cf0a",
  "0x0a3ce65bf86de3e94b174676a5dd8122403a123a",
  "0x2992759e1f443aac6da7dfbcd4c1184c8bfc199d",
  "0x51e3d44172868acc60d68ca99591ce4230bc75e0",
  "0x4af6c3afd5a8c9b1b03dceac46612417471b296a",
  "0xe9ee9f2857b559c67dd03576a1c74589a6af6197",
  "0x4a40ee3974d6235b551e77f2f23159a066da8924",
  "0xaf0a0b7b731a7722b11d24f30c1c1d06dfe81817",
  "0xc9354fd5108be674aa2813e65f19d11d47be447f",
  "0x6e2df6e59d8b5c3585f3e27e049b025bf5872155",
  "0x7458b0d0fe820ff079a36b0fef75d6dc9a41c7de",
  "0x9abc90c5dbad16303b82f16622915a7b1d15c487",
  "0x4233903f4df309a230865046a6f440d026ce33bb",
  "0x686e76d82ff32fc974664e1d41bf2ae71336ec25",
  "0x0c28a26303c292fede3b22451f1a1b9c7a1b4209",
  "0x32b904c7b0611ffd547a4b0822b2043d7d70b469",
  "0x1233026aeae1733ec0460e528f79c51dbd899bf4",
  "0x32b07536cd2705daf0601c9a26e47488a7fb6e99",
  "0xc528cd85835d7554fc2797cd02c989b743257f15",
  "0x01d43f5a2b458f4bab76173b3768d04c33ed550a",
  "0xdedff32b8be61b1df8462732b83451c622fcddf8",
  "0xf8c948732c245fe8af81024002404deefb684a7a",
  "0x61ae7f60abe70cee4dd5f0bfa2921e6246f37794",
  "0xb4bd363d9ba6cf4060d11bcec1931614829ce570",
  "0x0ab289da7a64d87ab38c61a36e1d9b61435e7a13",
  "0xf869955c8aa81dfc4289b52bd9726c0e95f6c906",
  "0x5a204b98a4812c6e229ee757d3e9707dea39dce2",
  "0x8d396e0a0acb8b217c09e5179950e17b75ae4de8",
  "0x0cc4e6ea2a43f4cb975038a3ac3df7a86837ef97",
  "0x9d1621f27ad89de0faf833525abf4988402811d4",
  "0xc1080900699321bf4d3257aef3b48612ec500d1d",
  "0x931b172cb60cc34dc02f3eb329d041f7ccc5d42b",
  "0x0e0a7234eaa20437325291e13463a5bd5ec17475",
  "0xd7f21f214df98254e79e445ca57a61c8cb52da0a",
  "0x783ebde0290716bf0a5def726d1ca0ee818270b9",
  "0x725ff9ef612f0bbe4e033d3db477c0fb000800b2",
  "0xe5646f1d42e2fc158f0e8ff8ab5b78ad9ea1553e",
  "0xf0276919c10d3f3985475dd05c1cae4781b97cb2",
  "0xd221cf01d0e4ce084f337d2ff0f24ae3bef434d3",
  "0xaddef627d392c7534fc8796ce4f2d4a382f7a233",
  "0xc2f860766a46ebc58229facc111e5a31a4ea4df8",
  "0x17d01860373f918b3e8ca37618c05d60aa7e85f2",
  "0x9e3cd408326a4fff0b640e33f55465a700d01213",
  "0x7b39c6087dd2b191e711f202c430e9ba2c2b7f71",
];

async function discoverAddressesFromTransfers(): Promise<string[]> {
  const addresses = new Set<string>();

  for (let page = 1; page <= 10; page++) {
    const url = `https://api.etherscan.io/v2/api?chainid=137&module=account&action=tokentx&contractaddress=${PHL_CONTRACT}&page=${page}&offset=10000&sort=asc&apikey=${ETHERSCAN_API_KEY}`;
    const response = await fetch(url, { next: { revalidate: 3600 } });
    const data = await response.json();

    if (data.status !== "1" || !Array.isArray(data.result) || data.result.length === 0) break;

    for (const tx of data.result) {
      if (tx.to && tx.to !== "0x0000000000000000000000000000000000000000") {
        addresses.add(tx.to.toLowerCase());
      }
      if (tx.from && tx.from !== "0x0000000000000000000000000000000000000000") {
        addresses.add(tx.from.toLowerCase());
      }
    }

    if (data.result.length < 10000) break;
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
      if (idx < addresses.length && r.result && r.result !== "0x") {
        const raw = BigInt(r.result);
        const balance = Number(raw / BigInt(10 ** 14)) / 10000;
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
    const discoveredAddresses = await discoverAddressesFromTransfers();

    const allAddresses = new Set(BASELINE_ADDRESSES.map((a) => a.toLowerCase()));
    for (const addr of discoveredAddresses) {
      allAddresses.add(addr);
    }

    const balances = await batchBalanceOf(Array.from(allAddresses));

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
      totalHolders: Math.max(holders.length, TOTAL_HOLDERS),
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
