/**
 * 氛圍圖襯底——文字 RPG 以可讀為先，圖在下、文在上。
 */
import type { ReactNode } from 'react'

type ArtVariant = 'hero' | 'banner' | 'panel'

const HEIGHT: Record<ArtVariant, string> = {
  hero: 'min-h-[9.5rem] sm:min-h-[11rem]',
  banner: 'min-h-[5.5rem]',
  panel: 'min-h-[7rem]',
}

interface ArtBannerProps {
  src: string
  alt: string
  variant?: ArtVariant
  className?: string
  children?: ReactNode
  /** 戰鬥全螢幕底圖時用更強遮罩 */
  heavyScrim?: boolean
}

export function ArtBanner({
  src,
  alt,
  variant = 'banner',
  className = '',
  children,
  heavyScrim = false,
}: ArtBannerProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-paper/10 ${HEIGHT[variant]} ${className}`}
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
      />
      <div
        className={`pointer-events-none absolute inset-0 ${
          heavyScrim
            ? 'bg-gradient-to-b from-ink-950/55 via-ink-950/70 to-ink-950/92'
            : 'bg-gradient-to-b from-ink-950/35 via-ink-950/55 to-ink-950/88'
        }`}
      />
      {children ? (
        <div className="relative z-[1] p-4">{children}</div>
      ) : null}
    </div>
  )
}

/** 靜態資產路徑（public/art） */
export const ART = {
  titleRainTemple: '/art/art-title-rain-temple.jpg',
  travelMistRoad: '/art/art-travel-mist-road.jpg',
  combatMistClash: '/art/art-combat-mist-clash.jpg',
  sectMountainGate: '/art/art-sect-mountain-gate.jpg',
  shopLanternBazaar: '/art/art-shop-lantern-bazaar.jpg',
  atlasScroll: '/art/art-atlas-scroll.jpg',
} as const
