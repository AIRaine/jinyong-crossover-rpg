import { getOriginDisplayName } from '../data/origins'
import { DAY_PERIOD_LABEL, type GameState } from '../types/game'
import { computePanelStats } from '../lib/combatStats'

interface TopStatusBarProps {
  state: GameState
  onOpenQuests: () => void
}

function StatChip({
  label,
  value,
  max,
  accent,
}: {
  label: string
  value: number | string
  max?: number
  accent?: string
}) {
  return (
    <div className="flex min-w-0 flex-col rounded-md bg-ink-950/55 px-2 py-1 ring-1 ring-paper/10">
      <span className="text-[10px] tracking-wider text-paper/55">{label}</span>
      <span className={`truncate text-xs font-semibold ${accent ?? 'text-paper'}`}>
        {max !== undefined ? `${value}/${max}` : value}
      </span>
    </div>
  )
}

export function TopStatusBar({ state, onOpenQuests }: TopStatusBarProps) {
  const { time, currency, playerName, locationName, actionPoints, maxActionPoints } =
    state
  const panel = computePanelStats(state)
  const timeText = `${time.year}年${time.month}月${time.day}日 · ${DAY_PERIOD_LABEL[time.period]}`

  return (
    <header className="shrink-0 border-b border-cinnabar/30 bg-gradient-to-b from-ink-900 to-ink-950 px-3 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0 text-left">
          <p className="font-display text-base leading-tight text-paper">{playerName}</p>
          {state.originChosen && (
            <p className="truncate text-[11px] text-amber-100/70">
              {getOriginDisplayName({
                originId: state.originId,
                originJobTitle: state.originJobTitle,
              })}
            </p>
          )}
          <p className="truncate text-[11px] text-paper/60">
            {locationName} · {timeText}
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenQuests}
          className="touch-btn shrink-0 rounded-lg bg-cinnabar/90 px-3 py-2 text-xs font-medium text-paper shadow-md shadow-ink-950/40 active:scale-[0.98]"
        >
          任務
        </button>
      </div>
      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
        <StatChip label="精力" value={panel.stamina} max={panel.maxStamina} accent="text-teal-200" />
        <StatChip label="氣血" value={panel.hp} max={panel.maxHp} accent="text-rose-200" />
        <StatChip label="AP" value={actionPoints} max={maxActionPoints} accent="text-sky-200" />
        <StatChip label="銀兩" value={currency.silver} accent="text-amber-200" />
        <StatChip label="元寶" value={currency.yuanbao} accent="text-yellow-300" />
        <StatChip label="潛能" value={state.potential} accent="text-violet-200" />
      </div>
    </header>
  )
}
