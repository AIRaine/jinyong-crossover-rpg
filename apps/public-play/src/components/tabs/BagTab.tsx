import { MATERIAL_IDS } from '../../data/alchemy'
import type { GameState } from '../../types/game'

const KIND_LABEL = {
  consumable: '消耗',
  material: '素材',
  quest: '任務',
  misc: '雜物',
  manual: '秘籍',
  gift: '禮物',
} as const

interface BagTabProps {
  state: GameState
  onUse: (itemId: string) => void
}

export function BagTab({ state, onUse }: BagTabProps) {
  return (
    <section className="space-y-3 text-left">
      <div className="rounded-2xl border border-paper/10 bg-ink-900/70 p-4">
        <h2 className="font-display text-xl text-paper">背包</h2>
        <p className="mt-1 text-xs text-paper/55">
          草藥礦石可煉丹；回血丹／回內丹可直接服用。
        </p>
      </div>
      {state.inventory.length === 0 ? (
        <p className="py-10 text-center text-sm text-paper/45">行囊空空</p>
      ) : (
        state.inventory.map((item) => {
          const usable =
            item.id === MATERIAL_IDS.hpPill || item.id === MATERIAL_IDS.qiPill
          return (
            <article
              key={item.id}
              className="rounded-xl border border-paper/10 bg-ink-900/65 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-medium text-paper">{item.name}</h3>
                  <span className="mt-1 inline-block rounded bg-paper/10 px-2 py-0.5 text-[10px] text-paper/70">
                    {KIND_LABEL[item.kind]} · ×{item.quantity}
                  </span>
                </div>
                {usable && (
                  <button
                    type="button"
                    onClick={() => onUse(item.id)}
                    className="touch-btn shrink-0 rounded-lg bg-cinnabar/90 px-3 py-2 text-xs text-paper"
                  >
                    服用
                  </button>
                )}
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-paper/65">
                {item.description}
              </p>
            </article>
          )
        })
      )}
    </section>
  )
}
