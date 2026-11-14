import { ORIGINS } from '../data/origins'

interface OriginSelectProps {
  onSelect: (originId: string) => void
}

export function OriginSelect({ onSelect }: OriginSelectProps) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-ink-950">
      <div className="shrink-0 border-b border-cinnabar/30 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] text-center">
        <p className="text-[11px] tracking-[0.2em] text-cinnabar-soft">開局</p>
        <h1 className="font-display text-xl text-paper">你穿越前是誰？</h1>
        <p className="mt-1 text-xs leading-relaxed text-paper/55">
          選定現代職業後寫入存檔，屬性、靈感與起始科技會立刻生效。
        </p>
      </div>
      <div className="flex-1 space-y-2.5 overflow-y-auto px-3 py-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {ORIGINS.map((origin) => (
          <button
            key={origin.id}
            type="button"
            onClick={() => onSelect(origin.id)}
            className="touch-btn w-full rounded-xl border border-paper/15 bg-ink-900/90 px-4 py-3.5 text-left transition active:scale-[0.99] hover:border-cinnabar/45"
          >
            <span className="block font-display text-base text-paper">{origin.name}</span>
            <span className="mt-1 block text-xs leading-relaxed text-paper/70">
              {origin.summary}
            </span>
            <span className="mt-1.5 block text-[11px] leading-relaxed text-paper/45">
              {origin.flavor}
            </span>
            <span className="mt-2 block text-[11px] text-amber-200/80">
              靈感 +{origin.bonuses.inspiration ?? 0}
              {origin.bonuses.silver ? ` · 銀兩 +${origin.bonuses.silver}` : ''}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
