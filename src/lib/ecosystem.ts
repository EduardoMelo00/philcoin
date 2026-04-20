export type ContractStatus =
  | "live"
  | "testnet"
  | "pending-migration"
  | "planned"
  | "deprecated";

export type ContractCategory =
  | "Core"
  | "Founders"
  | "Rewards"
  | "Lending"
  | "Payments";

export interface EcosystemContract {
  id: string;
  name: string;
  shortName: string;
  address: string;
  chain: "Polygon" | "Polygon Amoy" | "Ethereum Sepolia";
  chainId: number;
  category: ContractCategory;
  type: "token" | "proxy" | "sale" | "nft" | "lending" | "airdrop" | "payment" | "distributor" | "other";
  status: ContractStatus;
  owner?: string;
  description: string;
}

const POLYGONSCAN = "https://polygonscan.com/address";
const AMOYSCAN = "https://amoy.polygonscan.com/address";
const SEPOLIASCAN = "https://sepolia.etherscan.io/address";

export function explorerUrl(c: EcosystemContract): string {
  if (c.chainId === 137) return `${POLYGONSCAN}/${c.address}`;
  if (c.chainId === 80002) return `${AMOYSCAN}/${c.address}`;
  if (c.chainId === 11155111) return `${SEPOLIASCAN}/${c.address}`;
  return `${POLYGONSCAN}/${c.address}`;
}

export const CATEGORY_META: Record<ContractCategory, { label: string; accent: string; glow: string; description: string }> = {
  Core: {
    label: "CORE",
    accent: "#F58600",
    glow: "rgba(245, 134, 0, 0.55)",
    description: "PHL token + reward distribution backbone",
  },
  Founders: {
    label: "FOUNDERS",
    accent: "#fbbf24",
    glow: "rgba(251, 191, 36, 0.55)",
    description: "PhilSocial ownership units + NFT certificates",
  },
  Rewards: {
    label: "AIRDROP",
    accent: "#ec4899",
    glow: "rgba(236, 72, 153, 0.55)",
    description: "Airdrop campaigns + auxiliary contracts",
  },
  Lending: {
    label: "LENDING",
    accent: "#22d3ee",
    glow: "rgba(34, 211, 238, 0.55)",
    description: "WBTC-backed lending vaults",
  },
  Payments: {
    label: "PAYMENTS",
    accent: "#a855f7",
    glow: "rgba(168, 85, 247, 0.55)",
    description: "Payment processors + registration proxies",
  },
};

export const STATUS_META: Record<ContractStatus, { label: string; color: string }> = {
  "live": { label: "LIVE MAINNET", color: "#22c55e" },
  "testnet": { label: "TESTNET", color: "#a855f7" },
  "pending-migration": { label: "PENDING MIGRATION", color: "#ef4444" },
  "planned": { label: "PLANNED", color: "#64748b" },
  "deprecated": { label: "DEPRECATED", color: "#475569" },
};

export const ECOSYSTEM: EcosystemContract[] = [
  // ───── CORE ─────
  {
    id: "phl-token",
    name: "PHL Token",
    shortName: "PHL",
    address: "0x24c80D7F032Bc8D308F10d59e20d5a65b90b7334",
    chain: "Polygon",
    chainId: 137,
    category: "Core",
    type: "token",
    status: "live",
    owner: "0x1eFE3E182b4289FACc1D258F6d60c72a6DE15Cde",
    description: "PHILCOIN ERC-20 token on Polygon. Total supply 5B.",
  },
  {
    id: "rewards-proxy",
    name: "Rewards Distribution",
    shortName: "Rewards",
    address: "0x3e4144fc80d18ac54b5a6e080005964896730f8b",
    chain: "Polygon",
    chainId: 137,
    category: "Core",
    type: "proxy",
    status: "live",
    owner: "0xc421EBdFD49A4EE1dCe1c28bF67DF11aa1458Ca6",
    description: "Rewards engine. Migrated to new KMS wallet (0xc421).",
  },
  {
    id: "phl-distributor",
    name: "PHL Bulk Distributor",
    shortName: "Distributor",
    address: "",
    chain: "Polygon",
    chainId: 137,
    category: "Core",
    type: "distributor",
    status: "planned",
    description: "Multi-send contract (planned, Phase 1). Supports ~200 wallets/tx at ~$0.05 on Polygon.",
  },

  // ───── FOUNDERS ─────
  {
    id: "membership-sale",
    name: "MembershipSale",
    shortName: "Membership",
    address: "0xb4b75276217244edaca7c0aa4be6eb7e160a1dfb",
    chain: "Polygon",
    chainId: 137,
    category: "Founders",
    type: "sale",
    status: "live",
    owner: "0x28f7888785bE25e930Bb8cBb6d864F8627f761A8",
    description: "PhilSocial membership sale on mainnet.",
  },
  {
    id: "membership-certificate",
    name: "MembershipCertificate",
    shortName: "Member NFT",
    address: "0x66f047339ff94f0744d3103919c5b18a903bf2d5",
    chain: "Polygon",
    chainId: 137,
    category: "Founders",
    type: "nft",
    status: "live",
    owner: "0x28f7888785bE25e930Bb8cBb6d864F8627f761A8",
    description: "ERC-721 membership certificate (PhilSocial).",
  },
  {
    id: "unitsale-amoy",
    name: "UnitSale V2 (Amoy)",
    shortName: "UnitSale",
    address: "0xC4afA883d28bAdBf5558bF4982F9655a050DBFce",
    chain: "Polygon Amoy",
    chainId: 80002,
    category: "Founders",
    type: "sale",
    status: "testnet",
    description: "Founder units sale (testnet). Tiered pricing, KYC gated, 2-tier referral.",
  },
  {
    id: "cert-amoy",
    name: "OwnershipCertificate (Amoy)",
    shortName: "Ownership",
    address: "0x685CA4F30A6D2868764fE4DfB67e43d5b2902412",
    chain: "Polygon Amoy",
    chainId: 80002,
    category: "Founders",
    type: "nft",
    status: "testnet",
    description: "ERC-721 founder unit certificate (testnet). 1-year transfer lock.",
  },
  {
    id: "unitsale-sepolia",
    name: "UnitSale V2 (Sepolia)",
    shortName: "UnitSale ETH",
    address: "0xF947a474E64006c56B83E0a01fc839B18CE6CeBf",
    chain: "Ethereum Sepolia",
    chainId: 11155111,
    category: "Founders",
    type: "sale",
    status: "testnet",
    description: "Founder units sale (Ethereum Sepolia testnet).",
  },
  {
    id: "cert-sepolia",
    name: "OwnershipCertificate (Sepolia)",
    shortName: "Ownership ETH",
    address: "0x09E9A7e4030A0CB827c8e35C0a0920D564086035",
    chain: "Ethereum Sepolia",
    chainId: 11155111,
    category: "Founders",
    type: "nft",
    status: "testnet",
    description: "Founder unit NFT certificate (Sepolia testnet).",
  },

  // ───── REWARDS / AIRDROP ─────
  {
    id: "airdrop",
    name: "Airdrop Campaigns",
    shortName: "Airdrop",
    address: "0xea5838b57ded6fcda656d5aa0f88c31b7b477840",
    chain: "Polygon",
    chainId: 137,
    category: "Rewards",
    type: "airdrop",
    status: "pending-migration",
    owner: "0xB8BB42f4bCf78Ce21A7882A6A90BB851B612A961",
    description: "Airdrop distribution contract. 3,166 txs. Holds PHL. PENDING migration to 0xc421.",
  },
  {
    id: "erc20-other",
    name: "ERC-20 Auxiliary",
    shortName: "ERC20",
    address: "0xea3bb53eec93b5e464f585f2f869ee3867897055",
    chain: "Polygon",
    chainId: 137,
    category: "Rewards",
    type: "other",
    status: "pending-migration",
    owner: "0xB8BB42f4bCf78Ce21A7882A6A90BB851B612A961",
    description: "Auxiliary ERC-20 token. Ownership pending migration.",
  },
  {
    id: "proxy-1",
    name: "Proxy A",
    shortName: "Proxy A",
    address: "0x8b2bf6afc056479ea2ae5b4b4a1698bd53b88c2b",
    chain: "Polygon",
    chainId: 137,
    category: "Rewards",
    type: "proxy",
    status: "pending-migration",
    owner: "0xB8BB42f4bCf78Ce21A7882A6A90BB851B612A961",
    description: "Unused proxy (0 txs). Ownership pending migration.",
  },
  {
    id: "proxy-2",
    name: "Proxy B",
    shortName: "Proxy B",
    address: "0x83e7b26051a62688a905c8fc1a91c95528985512",
    chain: "Polygon",
    chainId: 137,
    category: "Rewards",
    type: "proxy",
    status: "pending-migration",
    owner: "0xB8BB42f4bCf78Ce21A7882A6A90BB851B612A961",
    description: "Unused proxy (0 txs). Ownership pending migration.",
  },

  // ───── LENDING ─────
  {
    id: "lending-1",
    name: "WBTC Lending Vault 1",
    shortName: "Vault 1",
    address: "0x333c4cf3a3c51c53d493ddd61b781f7b15ae6449",
    chain: "Polygon",
    chainId: 137,
    category: "Lending",
    type: "lending",
    status: "pending-migration",
    owner: "0xB8BB42f4bCf78Ce21A7882A6A90BB851B612A961",
    description: "WBTC-backed lending vault. Admin + owner pending migration.",
  },
  {
    id: "lending-2",
    name: "WBTC Lending Vault 2",
    shortName: "Vault 2",
    address: "0x5d20e1e4cd2cc19ffa6bbda0c407e2e40ec9805b",
    chain: "Polygon",
    chainId: 137,
    category: "Lending",
    type: "lending",
    status: "pending-migration",
    owner: "0xB8BB42f4bCf78Ce21A7882A6A90BB851B612A961",
    description: "WBTC-backed lending vault. Admin + owner pending migration.",
  },
  {
    id: "lending-3",
    name: "WBTC Lending Vault 3",
    shortName: "Vault 3",
    address: "0xef1e01c027285592c480ce4bb525cf9be3671cda",
    chain: "Polygon",
    chainId: 137,
    category: "Lending",
    type: "lending",
    status: "pending-migration",
    owner: "0xB8BB42f4bCf78Ce21A7882A6A90BB851B612A961",
    description: "WBTC-backed lending vault. Admin + owner pending migration.",
  },
  {
    id: "lending-4",
    name: "WBTC Lending Vault 4",
    shortName: "Vault 4",
    address: "0x66614bc767292b259bfe918084e2d17cab524da6",
    chain: "Polygon",
    chainId: 137,
    category: "Lending",
    type: "lending",
    status: "pending-migration",
    owner: "0xB8BB42f4bCf78Ce21A7882A6A90BB851B612A961",
    description: "WBTC-backed lending vault. Admin + owner pending migration.",
  },

  // ───── PAYMENTS ─────
  {
    id: "payment-1",
    name: "Payment Processor 1",
    shortName: "Payment 1",
    address: "0x360a37df5a380f0cf1da2a67c01c9c5678c2e9fe",
    chain: "Polygon",
    chainId: 137,
    category: "Payments",
    type: "payment",
    status: "pending-migration",
    owner: "0xB8BB42f4bCf78Ce21A7882A6A90BB851B612A961",
    description: "Payment / registration proxy. Ownership pending migration.",
  },
  {
    id: "payment-2",
    name: "Payment Processor 2",
    shortName: "Payment 2",
    address: "0xb1d569605c6e9b5d0cb1f6921d75dbc5bbeb9fbb",
    chain: "Polygon",
    chainId: 137,
    category: "Payments",
    type: "payment",
    status: "pending-migration",
    owner: "0xB8BB42f4bCf78Ce21A7882A6A90BB851B612A961",
    description: "Payment / registration proxy. Ownership pending migration.",
  },
  {
    id: "payment-3",
    name: "Payment Processor 3",
    shortName: "Payment 3",
    address: "0x901554208032b456a6aa47c31611fabfd00e2277",
    chain: "Polygon",
    chainId: 137,
    category: "Payments",
    type: "payment",
    status: "pending-migration",
    owner: "0xB8BB42f4bCf78Ce21A7882A6A90BB851B612A961",
    description: "Payment / registration proxy. Ownership pending migration.",
  },
  {
    id: "payment-4",
    name: "Payment Processor 4",
    shortName: "Payment 4",
    address: "0xafa654432803e5ddaeddecf6ad879deae9b833a1",
    chain: "Polygon",
    chainId: 137,
    category: "Payments",
    type: "payment",
    status: "pending-migration",
    owner: "0xB8BB42f4bCf78Ce21A7882A6A90BB851B612A961",
    description: "Payment / registration proxy. Ownership pending migration.",
  },
];

export const CATEGORY_ORDER: ContractCategory[] = ["Core", "Founders", "Payments", "Lending", "Rewards"];

export function contractsByCategory(category: ContractCategory): EcosystemContract[] {
  return ECOSYSTEM.filter((c) => c.category === category);
}
