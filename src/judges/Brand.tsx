// The real brand files live in /public/brands and are served from /brands.
// Every image carries alt text and explicit width and height so the film never
// shifts while it loads.

type BrandName = 'tatum' | 'sui' | 'memwal' | 'walrus'

const BRANDS: Record<BrandName, { src: string; width: number; height: number }> = {
  tatum: { src: '/brands/tatum-chip.png', width: 788, height: 452 },
  sui: { src: '/brands/sui-chip.png', width: 306, height: 184 },
  memwal: { src: '/brands/memwal-chip.png', width: 772, height: 452 },
  walrus: { src: '/brands/walrus-white.png', width: 128, height: 128 },
}

const ALTS: Record<BrandName, string> = {
  tatum: 'Tatum',
  sui: 'Sui',
  memwal: 'MemWal',
  walrus: 'Walrus',
}

export function BrandImage({
  brand,
  height,
  className = '',
  alt,
}: {
  brand: BrandName
  height: number
  className?: string
  alt?: string
}) {
  const asset = BRANDS[brand]
  const width = Math.max(1, Math.round((height * asset.width) / asset.height))

  return (
    <img
      src={asset.src}
      alt={alt ?? ALTS[brand]}
      width={width}
      height={height}
      decoding="async"
      className={`block shrink-0 rounded-xs ${className}`}
    />
  )
}

export function X402Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`font-wordmark tracking-tight text-primary ${className}`} aria-label="x402">
      x402
    </span>
  )
}
