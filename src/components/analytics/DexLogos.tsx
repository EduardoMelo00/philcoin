export function QuickSwapLogo({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#418099" />
      <path d="M22.5 11.5L16 8L9.5 11.5V18.5L16 22L22.5 18.5V11.5Z" stroke="white" strokeWidth="1.5" fill="none" />
      <path d="M16 8V22M9.5 11.5L22.5 18.5M22.5 11.5L9.5 18.5" stroke="white" strokeWidth="1.2" />
    </svg>
  );
}

export function UniswapLogo({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#FF007A" />
      <path d="M12 10C12 10 14 12 16 12C18 12 18 10 20 10C22 10 23 12 23 14C23 18 16 24 16 24C16 24 9 18 9 14C9 12 10 10 12 10Z" fill="white" />
    </svg>
  );
}

export function SushiSwapLogo({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#0E0F23" />
      <ellipse cx="16" cy="16" rx="10" ry="5" fill="#E05DAA" />
      <ellipse cx="16" cy="14" rx="10" ry="5" fill="#0E0F23" />
      <ellipse cx="16" cy="14" rx="10" ry="5" stroke="#E05DAA" strokeWidth="1.2" fill="none" />
      <circle cx="13" cy="13.5" r="1" fill="white" />
      <circle cx="19" cy="13.5" r="1" fill="white" />
    </svg>
  );
}

export function BinanceLogo({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#F3BA2F" />
      <path d="M16 8L19 11L17 13L16 12L15 13L13 11L16 8Z" fill="#1E2026" />
      <path d="M22 14L25 17L22 20L19 17L22 14Z" fill="#1E2026" />
      <path d="M10 14L13 17L10 20L7 17L10 14Z" fill="#1E2026" />
      <path d="M16 16L19 19L17 21L16 20L15 21L13 19L16 16Z" fill="#1E2026" />
      <path d="M16 22L19 25L16 28L13 25L16 22Z" fill="#1E2026" />
    </svg>
  );
}

export function CoinbaseLogo({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#0052FF" />
      <circle cx="16" cy="16" r="9" fill="white" />
      <rect x="13" y="13" width="6" height="6" rx="1" fill="#0052FF" />
    </svg>
  );
}

export function KrakenLogo({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#5741D9" />
      <path d="M16 8L20 14L24 12L20 18L16 24L12 18L8 12L12 14L16 8Z" fill="white" />
    </svg>
  );
}

export function PolygonBridgeLogo({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#8247E5" />
      <path d="M21 13.5L17.5 11.5L14 13.5V17.5L17.5 19.5L21 17.5V13.5Z" fill="white" fillOpacity="0.9" />
      <path d="M14 13.5L10.5 15.5V19.5L14 21.5L17.5 19.5" stroke="white" strokeWidth="1.2" fill="none" />
    </svg>
  );
}

export function BitMartLogo({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#00B897" />
      <path d="M10 12L16 8L22 12V20L16 24L10 20V12Z" fill="white" fillOpacity="0.9" />
      <path d="M13 14L16 12L19 14V18L16 20L13 18V14Z" fill="#00B897" />
    </svg>
  );
}

export function MEXCLogo({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#1B2B3A" />
      <path d="M8 21L12 11L16 17L20 11L24 21" stroke="#2EBD85" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export function GenericDexLogo({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#374151" />
      <path d="M11 16H21M16 11V21" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const EXCHANGE_LOGOS: Record<string, React.FC<{ size?: number }>> = {
  quickswap: QuickSwapLogo,
  uniswap: UniswapLogo,
  sushiswap: SushiSwapLogo,
  sushi: SushiSwapLogo,
  binance: BinanceLogo,
  coinbase: CoinbaseLogo,
  kraken: KrakenLogo,
  polygon: PolygonBridgeLogo,
  bridge: PolygonBridgeLogo,
  bitmart: BitMartLogo,
  mexc: MEXCLogo,
};

export function getExchangeLogo(name: string): React.FC<{ size?: number }> | null {
  const lower = name.toLowerCase();
  for (const [key, Logo] of Object.entries(EXCHANGE_LOGOS)) {
    if (lower.includes(key)) return Logo;
  }
  return null;
}
