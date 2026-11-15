import {
  SECTS,
  SECT_RANK_LABELS,
  getSectById,
  sectRankFromContribution,
} from '../../data/sects'
import { getLocationById } from '../../data/locations'
import type { GameState } from '../../types/game'

interface SectTabProps {
  state: GameState
  onJoin: (sectId: string) => void
  onContribute: () => void
}

export function SectTab({ state, onJoin, onContribute }: SectTabProps) {
  const current = state.sectId ? getSectById(state.sectId) : undefined
  const rank = current
    ? sectRankFromContribution(current, state.sectContribution)
    : 0

  return (
    <section className="space-y-4 text-left">
      <div className="rounded-2xl border border-paper/10 bg-ink-900/70 p-4">
        <h2 className="font-display text-xl text-paper">門派</h2>
        <p className="mt-1 text-xs leading-relaxed text-paper/55">
          入門有條件；貢獻累積可晉升階級。同時只能隸屬一個門派。
        </p>
        {current ? (
          <div className="mt-3 rounded-lg bg-ink-950/80 px-3 py-2 text-sm text-paper ring-1 ring-cinnabar/30">
            <p>
              當前：{current.name} · {SECT_RANK_LABELS[rank]}
            </p>
            <p className="mt-1 text-xs text-paper/55">
              貢獻 {state.sectContribution}
              {rank < SECT_RANK_LABELS.length - 1
                ? `（下一階 ${current.rankThresholds[rank] ?? '—'}）`
                : '（已至長老）'}
            </p>
            <button
              type="button"
              onClick={onContribute}
              className="touch-btn mt-2 w-full rounded-lg bg-cinnabar/90 py-2.5 text-xs text-paper"
            >
              繳納貢獻（20 銀兩 → +15 貢獻）
            </button>
          </div>
        ) : (
          <p className="mt-3 text-sm text-paper/60">尚未拜入任何門派。</p>
        )}
      </div>

      {SECTS.map((sect) => {
        const home = getLocationById(sect.homeLocationId)
        const visited = state.knownLocationIds.includes(sect.homeLocationId)
        const joined = state.sectId === sect.id
        return (
          <article
            key={sect.id}
            className={`rounded-xl border p-3 ${
              joined
                ? 'border-cinnabar/40 bg-cinnabar/10'
                : 'border-paper/10 bg-ink-900/65'
            }`}
          >
            <h3 className="font-display text-sm text-paper">{sect.name}</h3>
            <p className="mt-0.5 text-[11px] text-cinnabar-soft">{sect.motto}</p>
            <p className="mt-2 text-xs leading-relaxed text-paper/70">
              {sect.description}
            </p>
            <p className="mt-2 text-[11px] text-paper/45">
              駐地：{home?.name ?? '未知'}
              {visited ? '（已踏足）' : '（尚未抵達）'}
            </p>
            <p className="mt-1 text-[11px] text-paper/50">
              入門：{sect.entry.description}
            </p>
            {!state.sectId && (
              <button
                type="button"
                onClick={() => onJoin(sect.id)}
                className="touch-btn mt-2 w-full rounded-lg bg-paper/10 py-2.5 text-xs text-paper"
              >
                申請入門
              </button>
            )}
            {joined && (
              <p className="mt-2 text-xs text-teal-200">你已隸屬此派</p>
            )}
          </article>
        )
      })}
    </section>
  )
}
