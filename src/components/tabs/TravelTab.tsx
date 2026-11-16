import { useMemo, useState } from 'react'
import { ALCHEMY_RECIPES, MATERIAL_IDS } from '../../data/alchemy'
import { farTravelHints, XUN_LABELS } from '../../data/events'
import {
  listActiveArcSummaries,
  seasonalModifier,
  STORY_BEAT_COOLDOWN_XUN,
} from '../../data/storyArcs'
import { ensureStoryRoute } from '../../lib/storyProgress'
import {
  computeJourneyProfile,
  effectiveBeatCooldown,
} from '../../lib/journeyPath'
import {
  computeGrowthProfile,
  nextCultivationPreview,
} from '../../lib/growthStage'
import {
  alignmentLabel,
  renownLabel,
  tideInviteStatus,
} from '../../lib/renownAxis'
import {
  canStartChallenge,
  challengeCleared,
  CHALLENGE_TRIALS,
  type ChallengeTrialId,
} from '../../lib/challengeTrials'
import {
  getLocationById,
  LOCATION_KIND_LABEL,
} from '../../data/locations'
import {
  BANDIT_FIGHT_AP_COST,
  BANDIT_FIGHTS_PER_XUN_MAX,
  getBanditStartBlock,
} from '../../lib/banditEncounterRules'
import type {
  GameState,
  LocationDef,
  StoryChoice,
  StoryEvent,
  StoryEventChoiceDef,
  StoryEventDef,
  TabId,
} from '../../types/game'

interface TravelTabProps {
  state: GameState
  statusMsg: string | null
  linkedLocations: LocationDef[]
  pendingEvent: StoryEventDef | null
  /** NG+ 差分後的序章（由 useGame 提供） */
  prologueEvent: StoryEvent
  onChoose: (choice: StoryChoice) => void
  onTravel: (locationId: string) => void
  onGather: (kind: 'herb' | 'ore') => void
  onCraft: (recipeId: string) => void
  onAdvanceXun: () => void
  onResolveEvent: (choice: StoryEventChoiceDef) => void
  onFight: () => void
  onUsePill: (itemId: string) => void
  onClaimDaily: () => void
  onClaimWeekly: (goalId: string) => void
  onNavigateTab: (tab: TabId) => void
  onStartChallenge: (id: ChallengeTrialId) => void
}

export function TravelTab({
  state,
  statusMsg,
  linkedLocations,
  pendingEvent,
  prologueEvent,
  onChoose,
  onTravel,
  onGather,
  onCraft,
  onAdvanceXun,
  onResolveEvent,
  onFight,
  onUsePill,
  onClaimDaily,
  onClaimWeekly,
  onNavigateTab,
  onStartChallenge,
}: TravelTabProps) {
  const prologue = prologueEvent
  const showPrologue =
    state.originChosen &&
    !state.prologueDone &&
    state.activeEventId === 'event_prologue_rain_temple'

  if (!state.originChosen) {
    return (
      <section className="rounded-2xl border border-dashed border-paper/20 px-4 py-12 text-center text-sm text-paper/50">
        請先完成開局職業選擇。
      </section>
    )
  }

  if (showPrologue) {
    return (
      <section className="space-y-4 text-left">
        <div className="relative overflow-hidden rounded-2xl border border-paper/10 bg-ink-900/60">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(180,60,50,0.22),_transparent_55%),linear-gradient(180deg,_rgba(20,28,36,0.2),_rgba(8,10,14,0.85))]" />
          <div className="rain-layer pointer-events-none absolute inset-0 opacity-40" />
          <div className="relative space-y-3 p-4">
            <p className="text-[11px] tracking-[0.2em] text-cinnabar-soft">遊歷事件</p>
            <h2 className="font-display text-xl text-paper">{prologue.title}</h2>
            <p className="text-xs text-paper/55">{prologue.locationName}</p>
            <div className="space-y-3 text-sm leading-7 text-paper/90">
              {prologue.paragraphs.map((p) => (
                <p key={p.slice(0, 12)}>{p}</p>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-display text-sm text-paper/80">你要如何應對？</h3>
          {prologue.choices.map((choice) => (
            <button
              key={choice.id}
              type="button"
              onClick={() => onChoose(choice)}
              className="touch-btn w-full rounded-xl border border-paper/15 bg-ink-900/90 px-4 py-3.5 text-left transition hover:border-cinnabar/50 active:scale-[0.99]"
            >
              <span className="block text-sm font-medium text-paper">{choice.label}</span>
              {choice.hint && (
                <span className="mt-1 block text-[11px] text-paper/50">{choice.hint}</span>
              )}
            </button>
          ))}
        </div>
      </section>
    )
  }

  const routed = ensureStoryRoute(state)
  const current = getLocationById(state.locationId)
  const xun = state.time.xun ?? 0
  const hpPill = state.inventory.find((i) => i.id === MATERIAL_IDS.hpPill)
  const qiPill = state.inventory.find((i) => i.id === MATERIAL_IDS.qiPill)
  const arcRows = listActiveArcSummaries(routed)
  const pendingArc =
    pendingEvent?.id?.startsWith('main_') ||
    pendingEvent?.id?.startsWith('arc_')
      ? pendingEvent
      : null
  const mainLoc = pendingArc?.locationId
    ? getLocationById(pendingArc.locationId)
    : null
  const beatNeed = effectiveBeatCooldown(routed, STORY_BEAT_COOLDOWN_XUN)
  const pathBrief = computeJourneyProfile(routed)
  const growthBrief = computeGrowthProfile(routed)
  const growthPreview = nextCultivationPreview(routed)
  const tideInvite = tideInviteStatus(routed)
  const coolLeft = Math.max(0, beatNeed - routed.xunsSinceLastBeat)
  const guideTips = farTravelHints(state.knownLocationIds)
  const weeklyGoals = routed.weekly.goals
  const fightBlock = getBanditStartBlock(state)
  const fightLocked = fightBlock !== null
  const fightButtonLabel = (() => {
    if (fightBlock === 'low_hp' || fightBlock === 'lose_streak') return '需先養傷'
    if (fightBlock === 'no_ap') return `AP 不足（需 ${BANDIT_FIGHT_AP_COST} AP）`
    if (fightBlock === 'xun_cap') {
      return `本旬已滿（${BANDIT_FIGHTS_PER_XUN_MAX} 場）`
    }
    if (fightBlock === 'prologue') return '序章未了'
    return `路遇（${BANDIT_FIGHT_AP_COST} AP）`
  })()

  const [showAllMaps, setShowAllMaps] = useState(false)

  const quickDestinations = useMemo(() => {
    const picks: LocationDef[] = []
    if (mainLoc && mainLoc.id !== state.locationId) picks.push(mainLoc)
    for (const loc of linkedLocations) {
      if (picks.some((p) => p.id === loc.id)) continue
      picks.push(loc)
      if (picks.length >= 4) break
    }
    return picks
  }, [linkedLocations, mainLoc, state.locationId])

  const travelCost = (loc: LocationDef) =>
    state.travelPassCharges > 0
      ? Math.max(1, Math.ceil(loc.travelStamina / 2))
      : loc.travelStamina

  const renderDestinationButton = (loc: LocationDef, compact = false) => {
    const known = state.knownLocationIds.includes(loc.id)
    const cost = travelCost(loc)
    const canGo = state.stats.stamina >= cost
    const isClue = mainLoc?.id === loc.id
    if (compact) {
      return (
        <button
          key={`q-${loc.id}`}
          type="button"
          onClick={() => onTravel(loc.id)}
          disabled={!canGo}
          className="touch-btn rounded-lg border border-teal-800/45 bg-teal-950/40 px-2 py-2 text-left disabled:opacity-40"
        >
          <span className="block text-[11px] leading-snug text-teal-50">
            {isClue ? '線索·' : ''}
            {loc.name}
            {!known ? '·初' : ''}
          </span>
          <span className="mt-0.5 block text-[10px] text-teal-100/60">
            {cost} 精力
          </span>
        </button>
      )
    }
    const farHint = loc.kind === 'secret' && !known ? ' · 建議一探' : ''
    return (
      <button
        key={loc.id}
        type="button"
        onClick={() => onTravel(loc.id)}
        className="touch-btn flex w-full items-center justify-between gap-3 rounded-xl border border-paper/15 bg-ink-900/90 px-4 py-3.5 text-left active:scale-[0.99]"
      >
        <span>
          <span className="block text-sm font-medium text-paper">
            {isClue ? '【線索】' : ''}
            {loc.name}
            {!known ? '（初探）' : ''}
          </span>
          <span className="mt-0.5 block text-[11px] text-paper/50">
            {LOCATION_KIND_LABEL[loc.kind]} · {loc.region}
            {farHint}
          </span>
        </span>
        <span
          className={`shrink-0 rounded-lg px-2.5 py-1 text-xs ${
            canGo
              ? 'bg-teal-900/50 text-teal-100'
              : 'bg-rose-950/50 text-rose-200'
          }`}
        >
          耗 {cost} 精力
          {state.travelPassCharges > 0 ? '（通票）' : ''}
        </span>
      </button>
    )
  }

  return (
    <section className="space-y-4 text-left">
      <div className="rounded-2xl border border-paper/10 bg-ink-900/70 p-4">
        <p className="text-[11px] tracking-[0.2em] text-cinnabar-soft">遊歷</p>
        <h2 className="mt-1 font-display text-xl text-paper">
          {current?.name ?? state.locationName}
        </h2>
        <p className="mt-1 text-[11px] text-paper/45">
          {state.time.year}年{state.time.month}月{XUN_LABELS[xun] ?? '上旬'} · AP{' '}
          {state.actionPoints}/{state.maxActionPoints} · 商道 Lv.
          {state.tradeRouteLevel}
          {state.travelPassCharges > 0
            ? ` · 通票 ${state.travelPassCharges} 次`
            : ''}
          {state.ngPlusCount > 0 ? ` · 第 ${state.ngPlusCount + 1} 周目` : ''}
        </p>
        <p className="mt-2 text-sm leading-7 text-paper/85">
          {current?.description ?? '你站在陌生的路口。'}
        </p>
        {state.prologueDone && (
          <div className="mt-3 rounded-lg bg-ink-950/50 px-3 py-2 text-[11px] leading-relaxed ring-1 ring-paper/10">
            <p className="text-amber-200/70">
              旅程 {pathBrief.diversityScore}｜
              {pathBrief.labels.slice(0, 3).join('·') || '尚無痕跡'}
              {pathBrief.finaleEngaged
                ? '｜潮信請帖已可至'
                : '｜潮信需話本碎片＋聲名（並養成戰績）'}
            </p>
            <p className="mt-1 text-amber-50/75">
              {renownLabel(tideInvite.renown)} {tideInvite.renown}｜
              {alignmentLabel(tideInvite.alignment)} {tideInvite.alignment}
            </p>
            <p className="mt-1 text-cinnabar-soft/90">{tideInvite.line}</p>
            {tideInvite.shards.parts.length > 0 && (
              <p className="mt-0.5 text-[10px] text-paper/40">
                話本碎片：{tideInvite.shards.parts.join('、')}
              </p>
            )}
            <p className="mt-1 text-teal-100/80">
              {growthBrief.stageLabel}｜養成 {growthBrief.cultivationScore}/
              {growthBrief.expectedForYear}｜
              {growthBrief.labels.slice(0, 2).join('·')}｜敵勢×
              {growthBrief.enemyGrowthScale.toFixed(2)}
            </p>
            <p className="mt-1 text-teal-50/70">
              {growthPreview.nextStageHint}
              <br />
              {growthPreview.gapLine}｜建議：
              {growthPreview.focusTips.join('、')}
            </p>
          </div>
        )}
        {!pendingEvent && state.prologueDone && (
          <div className="mt-3 rounded-lg bg-ink-950/55 px-3 py-2 ring-1 ring-paper/10">
            <p className="text-[11px] tracking-wide text-cinnabar-soft">歇腳處</p>
            <p className="mt-0.5 text-[11px] text-paper/50">
              養成捷徑（不另開大系統）
            </p>
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => onNavigateTab('tech')}
                className="touch-btn rounded-lg border border-teal-800/40 bg-teal-950/35 py-2 text-[11px] text-teal-50"
              >
                修練
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('character')}
                className="touch-btn rounded-lg border border-amber-800/40 bg-amber-950/35 py-2 text-[11px] text-amber-50"
              >
                精煉
              </button>
              <button
                type="button"
                onClick={() => {
                  document
                    .getElementById('rest-alchemy')
                    ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                }}
                className="touch-btn rounded-lg border border-stone-500/40 bg-stone-900/45 py-2 text-[11px] text-stone-100"
              >
                煉丹
              </button>
            </div>
          </div>
        )}
        {pendingArc && (
          <p className="mt-3 rounded-lg bg-amber-950/45 px-3 py-2 text-xs leading-relaxed text-amber-100 ring-1 ring-amber-700/40">
            故事節拍：{pendingArc.title}
            {mainLoc ? `（線索地：${mainLoc.name}）` : ''}。了結後需再歷數旬，不會瞬間跨年。
          </p>
        )}
        {state.combatLoseStreak > 0 && (
          <p className="mt-3 rounded-lg bg-rose-950/45 px-3 py-2 text-xs leading-relaxed text-rose-100 ring-1 ring-rose-700/40">
            連敗 {state.combatLoseStreak} 場
            {state.combatLoseStreak >= 2
              ? '：下一場路遇敵人會較弱；建議先服丹、遠行或推進旬制養傷。'
              : '：注意氣血，可先休整再戰。'}
            {state.combatLoseStreak >= 3
              ? '路遇已暫時鎖定（服丹／遠行／推進旬可解鎖）。'
              : ''}
          </p>
        )}
        <p className="mt-3 text-[11px] text-paper/45">
          本旬路遇 {state.banditFightsThisXun}/{BANDIT_FIGHTS_PER_XUN_MAX} 場（每場{' '}
          {BANDIT_FIGHT_AP_COST} AP；第 3 場起獎減半）
        </p>
        {statusMsg && (
          <p className="mt-3 rounded-lg bg-teal-950/50 px-3 py-2 text-xs text-teal-100 ring-1 ring-teal-700/40">
            {statusMsg}
          </p>
        )}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onAdvanceXun}
            className="touch-btn rounded-xl bg-cinnabar/90 px-2 py-2.5 text-sm leading-snug text-paper"
          >
            <span className="block">推進一旬</span>
            <span className="mt-0.5 block text-[10px] font-normal text-paper/85">
              {state.actionPoints >= state.maxActionPoints
                ? '已滿則不增'
                : 'AP +1，上限內'}
            </span>
          </button>
          <button
            type="button"
            onClick={onFight}
            disabled={fightLocked}
            className="touch-btn rounded-xl bg-rose-900/60 px-2 py-2.5 text-sm leading-snug text-rose-50 disabled:opacity-40"
          >
            <span className="block">{fightButtonLabel}</span>
            {!fightLocked && (
              <span className="mt-0.5 block text-[10px] font-normal text-rose-50/85">
                3v3 · 本旬 {state.banditFightsThisXun}/{BANDIT_FIGHTS_PER_XUN_MAX}
              </span>
            )}
          </button>
        </div>

        <div className="mt-3 rounded-lg bg-ink-950/55 px-3 py-2 ring-1 ring-paper/10">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] tracking-wide text-cinnabar-soft">
              導航・快速移動
            </p>
            <button
              type="button"
              onClick={() => setShowAllMaps((v) => !v)}
              className="touch-btn rounded-md border border-paper/20 px-2 py-1 text-[10px] text-paper/75"
            >
              {showAllMaps ? '收合地圖' : '全部地圖'}
            </button>
          </div>
          <p className="mt-0.5 text-[10px] text-paper/45">
            夜間出發至破曉：AP +1（上限內）。主要 AP 靠推進一旬。
          </p>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() =>
                document
                  .getElementById('travel-daily-tasks')
                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }
              className="touch-btn rounded-lg border border-amber-800/45 bg-amber-950/35 px-2 py-2 text-left"
            >
              <span className="block text-[11px] text-amber-50">今日任務</span>
              <span className="mt-0.5 block text-[10px] text-amber-100/55">
                滾至頁底
              </span>
            </button>
            <button
              type="button"
              onClick={() =>
                document
                  .getElementById('travel-story-arcs')
                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }
              className="touch-btn rounded-lg border border-amber-800/45 bg-amber-950/35 px-2 py-2 text-left"
            >
              <span className="block text-[11px] text-amber-50">進行中事項</span>
              <span className="mt-0.5 block text-[10px] text-amber-100/55">
                故事弧・滾至頁底
              </span>
            </button>
          </div>
          {quickDestinations.length === 0 ? (
            <p className="mt-2 text-[11px] text-paper/45">此處暫無通路。</p>
          ) : (
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {quickDestinations.map((loc) => renderDestinationButton(loc, true))}
            </div>
          )}
          {showAllMaps && (
            <div id="travel-destinations" className="mt-2 space-y-2 border-t border-paper/10 pt-2">
              {linkedLocations.length === 0 ? (
                <p className="text-center text-[11px] text-paper/45">此處暫無通路。</p>
              ) : (
                linkedLocations.map((loc) => renderDestinationButton(loc, false))
              )}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-paper/10 bg-ink-900/70 p-4">
        <h3 className="font-display text-sm text-paper">江湖傳聞</h3>
        <ul className="mt-2 space-y-2 text-xs leading-relaxed text-paper/70">
          {state.rumors.slice(0, 3).map((r) => (
            <li key={r.slice(0, 16)}>· {r}</li>
          ))}
        </ul>
        {guideTips.length > 0 && (
          <ul className="mt-3 space-y-2 border-t border-paper/10 pt-3 text-xs leading-relaxed text-teal-100/80">
            {guideTips.map((t) => (
              <li key={t.slice(0, 18)}>· {t}</li>
            ))}
          </ul>
        )}
      </div>

      {pendingEvent && (
        <div className="space-y-2 rounded-2xl border border-amber-700/40 bg-amber-950/20 p-4">
          <p className="text-[11px] tracking-[0.15em] text-amber-200/80">旬內事件</p>
          <h3 className="font-display text-lg text-paper">{pendingEvent.title}</h3>
          <p className="text-xs text-paper/55">{pendingEvent.summary}</p>
          <div className="space-y-2 text-sm leading-7 text-paper/85">
            {pendingEvent.paragraphs.map((p) => (
              <p key={p.slice(0, 10)}>{p}</p>
            ))}
          </div>
          {pendingEvent.choices.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onResolveEvent(c)}
              className="touch-btn w-full rounded-xl border border-paper/15 bg-ink-900/90 px-4 py-3 text-left"
            >
              <span className="block text-sm text-paper">{c.label}</span>
              {c.hint && (
                <span className="mt-0.5 block text-[11px] text-paper/50">{c.hint}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {state.lastOutcomeText && (
        <article className="rounded-2xl border border-amber-700/30 bg-ink-900/80 p-4">
          <h3 className="font-display text-sm text-amber-100">方才的結局</h3>
          <p className="mt-2 text-sm leading-7 text-paper/88">{state.lastOutcomeText}</p>
        </article>
      )}

      {state.lastCombatResult && (
        <article className="rounded-2xl border border-cinnabar/25 bg-cinnabar/10 p-4">
          <h3 className="font-display text-sm text-paper">戰鬥結算</h3>
          <p className="mt-1 text-xs text-paper/55">
            {state.lastCombatResult.victory ? '結果：勝利' : '結果：敗北'}
          </p>
          <p className="mt-2 text-sm leading-7 text-paper/85">
            {state.lastCombatResult.summary}
          </p>
          {state.lastCombatResult.rewardsNote && (
            <p className="mt-1 text-[11px] text-paper/45">
              {state.lastCombatResult.rewardsNote}
            </p>
          )}
        </article>
      )}

      {(current?.gather === 'herb' ||
        current?.gather === 'ore' ||
        current?.gather === 'both') && (
        <div className="space-y-2">
          <h3 className="font-display text-sm text-paper/80">
            採集（耗 1 AP｜目前 {state.actionPoints}/{state.maxActionPoints} AP）
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {(current.gather === 'herb' || current.gather === 'both') && (
              <button
                type="button"
                onClick={() => onGather('herb')}
                className="touch-btn rounded-xl border border-emerald-700/40 bg-emerald-950/40 py-3 text-sm text-emerald-100"
              >
                採草藥
              </button>
            )}
            {(current.gather === 'ore' || current.gather === 'both') && (
              <button
                type="button"
                onClick={() => onGather('ore')}
                className="touch-btn rounded-xl border border-stone-500/40 bg-stone-900/50 py-3 text-sm text-stone-100"
              >
                採礦石
              </button>
            )}
          </div>
        </div>
      )}

      {state.prologueDone && (
        <div className="space-y-2 rounded-2xl border border-paper/10 bg-ink-900/70 p-3">
          <h3 className="font-display text-sm text-paper/85">可選驗收／挑戰旗標</h3>
          <p className="text-[11px] leading-relaxed text-paper/50">
            不擋主線。通過只點亮旗標與小獎；失敗耗 AP，結局仍可靠敘事推進。
          </p>
          <ul className="space-y-2">
            {CHALLENGE_TRIALS.map((trial) => {
              const gate = canStartChallenge(state, trial)
              const done = challengeCleared(state, trial)
              return (
                <li
                  key={trial.id}
                  className="rounded-lg bg-ink-950/60 px-3 py-2 ring-1 ring-paper/10"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs text-paper">
                        {trial.title}
                        {done ? ' · 已點亮' : ''}
                      </p>
                      <p className="mt-0.5 text-[11px] leading-snug text-paper/50">
                        {trial.blurb}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={!gate.ok}
                      onClick={() => onStartChallenge(trial.id)}
                      className="touch-btn shrink-0 rounded-md border border-rose-700/50 bg-rose-950/50 px-2 py-1.5 text-[11px] text-rose-50 disabled:opacity-40"
                    >
                      {gate.ok
                        ? done
                          ? `再驗（${trial.apCost} AP）`
                          : `挑戰（${trial.apCost} AP）`
                        : gate.reason ?? '未開'}
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <div id="rest-alchemy" className="space-y-2 scroll-mt-4">
        <h3 className="font-display text-sm text-paper/80">簡易煉丹／丹藥</h3>
        {ALCHEMY_RECIPES.map((recipe) => (
          <button
            key={recipe.id}
            type="button"
            onClick={() => onCraft(recipe.id)}
            className="touch-btn w-full rounded-xl border border-paper/15 bg-ink-900/90 px-4 py-3 text-left"
          >
            <span className="block text-sm text-paper">{recipe.name}</span>
            <span className="mt-0.5 block text-[11px] text-paper/50">
              {recipe.description}
            </span>
          </button>
        ))}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={!hpPill}
            onClick={() => onUsePill(MATERIAL_IDS.hpPill)}
            className="touch-btn rounded-xl bg-paper/10 py-2.5 text-xs text-paper disabled:opacity-35"
          >
            服回血丹（{hpPill?.quantity ?? 0}）
          </button>
          <button
            type="button"
            disabled={!qiPill}
            onClick={() => onUsePill(MATERIAL_IDS.qiPill)}
            className="touch-btn rounded-xl bg-paper/10 py-2.5 text-xs text-paper disabled:opacity-35"
          >
            服回內丹（{qiPill?.quantity ?? 0}）
          </button>
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-paper/10 bg-ink-900/70 p-4">
        <div
          id="travel-daily-tasks"
          className="scroll-mt-3 space-y-2 rounded-lg bg-ink-950/50 px-3 py-2 ring-1 ring-paper/10"
        >
          <p className="text-[11px] tracking-wide text-cinnabar-soft">
            今日任務・{seasonalModifier().label}
          </p>
          <button
            type="button"
            onClick={onClaimDaily}
            className="touch-btn w-full rounded-lg border border-teal-800/50 bg-teal-950/40 px-3 py-2 text-left text-xs text-teal-50"
          >
            領取今日登入（季節加成・連登有獎）
          </button>
          <ul className="space-y-1.5">
            {weeklyGoals.map((g) => (
              <li
                key={g.id}
                className="flex items-center justify-between gap-2 text-[11px] text-paper/80"
              >
                <span>
                  {g.title}（{g.progress}/{g.target}）
                </span>
                <button
                  type="button"
                  disabled={g.claimed || g.progress < g.target}
                  onClick={() => onClaimWeekly(g.id)}
                  className="touch-btn shrink-0 rounded-md border border-paper/20 px-2 py-1 disabled:opacity-40"
                >
                  {g.claimed ? '已領' : '領獎'}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div
          id="travel-story-arcs"
          className="scroll-mt-3 rounded-lg bg-ink-950/50 px-3 py-2 text-[11px] leading-relaxed text-paper/75 ring-1 ring-paper/10"
        >
          <p className="text-cinnabar-soft">進行中故事弧</p>
          {arcRows.length === 0 ? (
            <p className="mt-1 text-paper/45">目前沒有進行中的故事弧。</p>
          ) : (
            <ul className="mt-1 space-y-1">
              {arcRows.map((row) => (
                <li key={`${row.arcTitle}-${row.beatTitle}`}>
                  {row.arcTitle} · {row.beatTitle}
                  {row.done ? '（已了）' : '（未了）'}
                </li>
              ))}
            </ul>
          )}
          {coolLeft > 0 && (
            <p className="mt-1 text-paper/45">
              下一段節拍約需再推 {coolLeft} 旬
              {pathBrief.pathTier === 'hollow' ? '（空轉較慢）' : ''}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
