import {
  SECTS,
  SECT_RANK_LABELS,
  getSectById,
  sectRankFromContribution,
} from '../../data/sects'
import { getLocationById } from '../../data/locations'
import {
  ALLIANCE_LABEL,
  canJoinSect,
  describeJoinBlock,
  getSectRule,
} from '../../lib/sectRules'
import { computeDifficultyMods } from '../../lib/difficultyModifiers'
import type { GameState } from '../../types/game'

interface SectTabProps {
  state: GameState
  onJoin: (sectId: string) => void
  onLeave: (mode: 'leave' | 'betray') => void
  onContribute: () => void
}

export function SectTab({ state, onJoin, onLeave, onContribute }: SectTabProps) {
  const current = state.sectId ? getSectById(state.sectId) : undefined
  const currentRule = state.sectId ? getSectRule(state.sectId) : undefined
  const rank = current
    ? sectRankFromContribution(current, state.sectContribution)
    : 0
  const mods = computeDifficultyMods(state)

  return (
    <section className="space-y-4 text-left">
      <div className="rounded-2xl border border-paper/10 bg-ink-900/70 p-4">
        <h2 className="font-display text-xl text-paper">門派</h2>
        <p className="mt-1 text-xs leading-relaxed text-paper/55">
          同時僅能一派。退派有冷卻與銀兩；叛出永禁本派，並可能鎖死對立聯盟。門派會改變戰鬥難度與獎賞。
        </p>
        <p className="mt-2 text-[11px] leading-snug text-amber-100/80">
          當前難度標籤：{mods.labels.join(' · ') || '無'}｜敵勢×
          {mods.enemyScale.toFixed(2)}｜攻+{mods.atkFlat}／防+{mods.defFlat}
        </p>
        {current && currentRule ? (
          <div className="mt-3 rounded-lg bg-ink-950/80 px-3 py-2 text-sm text-paper ring-1 ring-cinnabar/30">
            <p>
              當前：{current.name} · {SECT_RANK_LABELS[rank]} ·{' '}
              {ALLIANCE_LABEL[currentRule.alliance]}
            </p>
            <p className="mt-1 text-xs text-paper/55">
              貢獻 {state.sectContribution}
              {rank < SECT_RANK_LABELS.length - 1
                ? `（下一階 ${current.rankThresholds[rank] ?? '—'}）`
                : '（已至長老）'}
            </p>
            <p className="mt-1 text-[11px] text-paper/50">
              {currentRule.ruleSummary}
            </p>
            <button
              type="button"
              onClick={onContribute}
              className="touch-btn mt-2 w-full rounded-lg bg-cinnabar/90 py-2.5 text-xs text-paper"
            >
              繳納貢獻（20 銀兩 → +15 貢獻）
            </button>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onLeave('leave')}
                className="touch-btn rounded-lg bg-paper/10 py-2.5 text-[11px] text-paper"
              >
                和平退派
              </button>
              <button
                type="button"
                onClick={() => onLeave('betray')}
                className="touch-btn rounded-lg bg-rose-950/70 py-2.5 text-[11px] text-rose-100"
              >
                叛出（永禁）
              </button>
            </div>
            <p className="mt-1 text-[10px] text-paper/40">
              {currentRule.leave.label}｜{currentRule.betray.label}
            </p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-paper/60">尚未拜入任何門派。</p>
        )}
        {(state.sectBanIds?.length > 0 ||
          state.sectBannedAlliances?.length > 0) && (
          <p className="mt-2 text-[11px] text-rose-200/80">
            永禁：
            {[
              ...(state.sectBanIds ?? []).map(
                (id) => getSectById(id)?.name ?? id,
              ),
              ...(state.sectBannedAlliances ?? []).map(
                (a) => ALLIANCE_LABEL[a as keyof typeof ALLIANCE_LABEL] ?? a,
              ),
            ].join('、')}
          </p>
        )}
      </div>

      {SECTS.map((sect) => {
        const home = getLocationById(sect.homeLocationId)
        const visited = state.knownLocationIds.includes(sect.homeLocationId)
        const joined = state.sectId === sect.id
        const rule = getSectRule(sect.id)
        const check = canJoinSect(state, sect.id)
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
            {rule && (
              <p className="mt-1 text-[10px] text-amber-100/70">
                {ALLIANCE_LABEL[rule.alliance]}｜敵勢×
                {rule.combat.enemyScale.toFixed(2)}｜攻+{rule.combat.atkFlat}／防+
                {rule.combat.defFlat}
              </p>
            )}
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
            {rule && (
              <p className="mt-1 text-[10px] leading-snug text-paper/40">
                {rule.ruleSummary}
              </p>
            )}
            {!state.sectId && (
              <button
                type="button"
                onClick={() => onJoin(sect.id)}
                disabled={!check.ok}
                className="touch-btn mt-2 w-full rounded-lg bg-paper/10 py-2.5 text-xs text-paper disabled:opacity-40"
              >
                {check.ok
                  ? '申請入門'
                  : describeJoinBlock(check.reason, check.detail)}
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
