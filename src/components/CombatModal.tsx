import { useState } from 'react'
import {
  TACTIC_AID_MAX_PER_FIGHT,
  type CombatActionKind,
  type CombatState,
} from '../lib/combatEngine'

interface CombatModalProps {
  combat: CombatState
  onAct: (action: CombatActionKind, targetId?: string) => void
  onClose: () => void
}

function FighterCard({
  name,
  hp,
  maxHp,
  status,
  selected,
  onClick,
  side,
}: {
  name: string
  hp: number
  maxHp: number
  status: string
  selected?: boolean
  onClick?: () => void
  side: 'ally' | 'enemy'
}) {
  const pct = Math.max(0, Math.round((hp / Math.max(1, maxHp)) * 100))
  return (
    <button
      type="button"
      disabled={!onClick || hp <= 0}
      onClick={onClick}
      className={`w-full rounded-lg border px-2 py-2 text-left ${
        selected ? 'border-amber-400 ring-1 ring-amber-400/50' : 'border-paper/15'
      } ${side === 'ally' ? 'bg-teal-950/40' : 'bg-rose-950/35'} ${
        hp <= 0 ? 'opacity-40' : ''
      }`}
    >
      <div className="flex justify-between gap-1 text-[11px] text-paper">
        <span className="truncate font-medium">{name}</span>
        <span>
          {hp}/{maxHp}
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink-950">
        <div
          className={`h-full ${side === 'ally' ? 'bg-teal-400' : 'bg-rose-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {status !== 'none' && (
        <p className="mt-1 text-[10px] text-amber-200/90">
          {status === 'poison' ? '中毒' : status === 'stun' ? '眩暈' : status}
        </p>
      )}
    </button>
  )
}

export function CombatModal({ combat, onAct, onClose }: CombatModalProps) {
  const livingEnemies = combat.enemies.filter((e) => e.hp > 0)
  const player = combat.allies.find((a) => a.isPlayer) ?? combat.allies[0]
  const playerDown = !player || player.hp <= 0
  const actionsLocked = combat.finished || playerDown
  const [selected, setSelected] = useState<string | undefined>(
    livingEnemies[0]?.id,
  )
  const targetId =
    livingEnemies.find((e) => e.id === selected)?.id ?? livingEnemies[0]?.id

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-ink-950/95">
      <div className="shrink-0 border-b border-cinnabar/30 px-3 py-3 text-center">
        <p className="text-[11px] tracking-[0.2em] text-cinnabar-soft">三對三戰局</p>
        <h2 className="font-display text-lg text-paper">第 {combat.turn} 回合</h2>
        <p className="mt-1 text-[10px] leading-snug text-paper/55">
          低血可急救（本場{' '}
          {combat.aidUsesLeft ?? 0}/{TACTIC_AID_MAX_PER_FIGHT}）／防禦；絕招吃武學配置。
        </p>
        {playerDown && !combat.finished && (
          <p className="mt-1 text-xs text-rose-200">你已無法作戰——請結束此戰。</p>
        )}
      </div>

      <div className="grid flex-1 grid-cols-2 gap-2 overflow-y-auto px-3 py-3">
        <div className="space-y-2">
          <p className="text-[11px] text-teal-200/80">我方</p>
          {combat.allies.map((f) => (
            <FighterCard
              key={f.id}
              name={f.name}
              hp={f.hp}
              maxHp={f.maxHp}
              status={f.status}
              side="ally"
            />
          ))}
        </div>
        <div className="space-y-2">
          <p className="text-[11px] text-rose-200/80">敵方（點選為目標）</p>
          {combat.enemies.map((f) => (
            <FighterCard
              key={f.id}
              name={f.name}
              hp={f.hp}
              maxHp={f.maxHp}
              status={f.status}
              side="enemy"
              selected={f.id === targetId}
              onClick={f.hp > 0 ? () => setSelected(f.id) : undefined}
            />
          ))}
        </div>
      </div>

      <div className="max-h-28 shrink-0 overflow-y-auto border-t border-paper/10 px-3 py-2 text-[11px] leading-relaxed text-paper/70">
        {combat.logs.slice(-6).map((l, i) => (
          <p key={`${i}-${l.text.slice(0, 8)}`}>{l.text}</p>
        ))}
      </div>

      {actionsLocked ? (
        <div className="shrink-0 space-y-2 border-t border-paper/10 px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <p className="text-center text-sm text-paper">
            {combat.finished
              ? combat.victory
                ? '勝利！'
                : '敗北……'
              : '你已倒下，無法再操作。'}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="touch-btn w-full rounded-xl bg-cinnabar/90 py-3 text-sm text-paper"
          >
            離開戰場
          </button>
        </div>
      ) : (
        <div className="shrink-0 grid grid-cols-2 gap-2 border-t border-paper/10 px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => onAct('attack', targetId)}
            className="touch-btn rounded-xl bg-cinnabar/90 py-3 text-sm text-paper"
          >
            攻擊
          </button>
          <button
            type="button"
            onClick={() => onAct('skill', targetId)}
            className="touch-btn rounded-xl bg-amber-900/70 py-3 text-sm text-amber-50"
          >
            絕招（配置越強越痛）
          </button>
          <button
            type="button"
            onClick={() => onAct('tactic_flash', targetId)}
            className="touch-btn rounded-xl bg-sky-950/80 py-3 text-sm text-sky-100"
          >
            妖光戰術
          </button>
          <button
            type="button"
            onClick={() => onAct('tactic_aid')}
            disabled={(combat.aidUsesLeft ?? 0) <= 0}
            className="touch-btn rounded-xl bg-teal-950/80 py-3 text-sm text-teal-100 disabled:opacity-40"
          >
            急救（剩 {combat.aidUsesLeft ?? 0}）
          </button>
          <button
            type="button"
            onClick={() => onAct('defend')}
            className="touch-btn col-span-2 rounded-xl bg-paper/10 py-3 text-sm text-paper"
          >
            防禦
          </button>
        </div>
      )}
    </div>
  )
}
