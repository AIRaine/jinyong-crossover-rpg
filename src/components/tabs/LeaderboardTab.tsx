import { useState } from 'react'
import {
  BOARD_LABEL,
  buildBoard,
  type BoardKind,
} from '../../data/leaderboard'
import {
  SPAR_FIGHT_AP_COST,
  SPAR_FIGHTS_PER_XUN_MAX,
} from '../../lib/sparEncounterRules'
import type { GameState } from '../../types/game'

const KINDS: BoardKind[] = ['heaven', 'earth', 'weapon', 'rich']

interface LeaderboardTabProps {
  state: GameState
  onSpar: (entryId: string, sparPower: number, name: string) => void
}

export function LeaderboardTab({ state, onSpar }: LeaderboardTabProps) {
  const [kind, setKind] = useState<BoardKind>('heaven')
  const board = buildBoard(kind, state)
  const sparLocked =
    state.actionPoints < SPAR_FIGHT_AP_COST ||
    state.sparFightsThisXun >= SPAR_FIGHTS_PER_XUN_MAX

  return (
    <section className="space-y-4 text-left">
      <div className="rounded-2xl border border-paper/10 bg-ink-900/70 p-4">
        <h2 className="font-display text-xl text-paper">榜單</h2>
        <p className="mt-1 text-xs leading-relaxed text-paper/55">
          天／地／神兵／富豪四榜骨架。點名家可發起切磋（進入 3v3 戰局）。切磋勝場：
          {state.sparWins}
        </p>
        <p className="mt-2 text-[11px] text-paper/45">
          本旬切磋 {state.sparFightsThisXun}/{SPAR_FIGHTS_PER_XUN_MAX} 場（每場{' '}
          {SPAR_FIGHT_AP_COST} AP）｜目前 {state.actionPoints}/
          {state.maxActionPoints} AP
        </p>
        <div className="mt-3 grid grid-cols-2 gap-1.5">
          {KINDS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={`touch-btn rounded-lg py-2 text-xs ${
                kind === k
                  ? 'bg-cinnabar/90 text-paper'
                  : 'bg-paper/10 text-paper/70'
              }`}
            >
              {BOARD_LABEL[k]}
            </button>
          ))}
        </div>
      </div>

      <ol className="space-y-2">
        {board.map((entry, idx) => (
          <li
            key={entry.id}
            className={`rounded-xl border p-3 ${
              entry.isPlayer
                ? 'border-amber-600/50 bg-amber-950/30'
                : 'border-paper/10 bg-ink-900/65'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm text-paper">
                  <span className="text-paper/45">#{idx + 1}</span>{' '}
                  {entry.name}
                  {entry.isPlayer ? '（你）' : ''}
                </p>
                <p className="mt-0.5 text-[11px] text-paper/50">{entry.note}</p>
                <p className="mt-1 text-xs text-amber-100/90">積分 {entry.score}</p>
              </div>
              {!entry.isPlayer && (
                <button
                  type="button"
                  disabled={sparLocked}
                  onClick={() => onSpar(entry.id, entry.sparPower, entry.name)}
                  className="touch-btn shrink-0 rounded-lg bg-rose-900/60 px-3 py-2 text-xs text-rose-50 disabled:opacity-40"
                >
                  切磋（{SPAR_FIGHT_AP_COST} AP）
                </button>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
