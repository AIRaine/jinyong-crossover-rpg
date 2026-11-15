import type { GameState, Quest } from '../types/game'

interface QuestLogModalProps {
  open: boolean
  state: GameState
  onClose: () => void
}

function QuestCard({ quest }: { quest: Quest }) {
  const statusLabel =
    quest.status === 'active'
      ? '進行中'
      : quest.status === 'completed'
        ? '已完成'
        : '失敗'

  return (
    <article className="rounded-xl border border-paper/10 bg-ink-900/80 p-3 text-left">
      <div className="mb-1 flex items-center justify-between gap-2">
        <h3 className="font-display text-sm text-paper">{quest.title}</h3>
        <span
          className={`rounded px-2 py-0.5 text-[10px] ${
            quest.status === 'completed'
              ? 'bg-teal-900/80 text-teal-100'
              : 'bg-cinnabar/30 text-paper'
          }`}
        >
          {statusLabel}
        </span>
      </div>
      <p className="mb-2 text-xs leading-relaxed text-paper/70">{quest.description}</p>
      <ul className="space-y-1">
        {quest.objectives.map((obj) => (
          <li key={obj.id} className="flex gap-2 text-xs text-paper/85">
            <span className="shrink-0 text-cinnabar">{obj.done ? '✓' : '○'}</span>
            <span className={obj.done ? 'line-through opacity-60' : ''}>{obj.text}</span>
          </li>
        ))}
      </ul>
    </article>
  )
}

export function QuestLogModal({ open, state, onClose }: QuestLogModalProps) {
  if (!open) return null

  const active = state.quests.filter((q) => q.status === 'active')
  const done = state.quests.filter((q) => q.status !== 'active')

  return (
    <div
      className="absolute inset-0 z-40 flex items-end justify-center bg-ink-950/70 p-3 backdrop-blur-[2px] sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quest-log-title"
    >
      <div className="flex max-h-[85%] w-full max-w-[390px] flex-col overflow-hidden rounded-2xl border border-paper/15 bg-ink-950 shadow-2xl">
        <div className="flex items-center justify-between border-b border-paper/10 px-4 py-3">
          <h2 id="quest-log-title" className="font-display text-lg text-paper">
            任務日誌
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="touch-btn rounded-lg bg-paper/10 px-3 py-2 text-sm text-paper active:scale-[0.98]"
          >
            關閉
          </button>
        </div>
        <div className="space-y-3 overflow-y-auto px-3 py-3">
          {active.length === 0 && done.length === 0 && (
            <p className="py-8 text-center text-sm text-paper/50">尚無任務</p>
          )}
          {active.map((q) => (
            <QuestCard key={q.id} quest={q} />
          ))}
          {done.map((q) => (
            <QuestCard key={q.id} quest={q} />
          ))}
        </div>
      </div>
    </div>
  )
}
