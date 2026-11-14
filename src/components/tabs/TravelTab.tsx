import { ALCHEMY_RECIPES, MATERIAL_IDS } from '../../data/alchemy'
import { XUN_LABELS } from '../../data/events'
import { getPrologueEvent } from '../../data/prologue'
import {
  getLocationById,
  LOCATION_KIND_LABEL,
} from '../../data/locations'
import type {
  GameState,
  LocationDef,
  StoryChoice,
  StoryEventChoiceDef,
  StoryEventDef,
} from '../../types/game'

interface TravelTabProps {
  state: GameState
  statusMsg: string | null
  linkedLocations: LocationDef[]
  pendingEvent: StoryEventDef | null
  onChoose: (choice: StoryChoice) => void
  onTravel: (locationId: string) => void
  onGather: (kind: 'herb' | 'ore') => void
  onCraft: (recipeId: string) => void
  onAdvanceXun: () => void
  onResolveEvent: (choice: StoryEventChoiceDef) => void
  onFight: () => void
  onUsePill: (itemId: string) => void
}

export function TravelTab({
  state,
  statusMsg,
  linkedLocations,
  pendingEvent,
  onChoose,
  onTravel,
  onGather,
  onCraft,
  onAdvanceXun,
  onResolveEvent,
  onFight,
  onUsePill,
}: TravelTabProps) {
  const prologue = getPrologueEvent()
  const showPrologue =
    state.originChosen &&
    !state.prologueDone &&
    state.activeEventId === prologue.id

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

  const current = getLocationById(state.locationId)
  const xun = state.time.xun ?? 0
  const hpPill = state.inventory.find((i) => i.id === MATERIAL_IDS.hpPill)
  const qiPill = state.inventory.find((i) => i.id === MATERIAL_IDS.qiPill)

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
        </p>
        <p className="mt-2 text-sm leading-7 text-paper/85">
          {current?.description ?? '你站在陌生的路口。'}
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
            className="touch-btn rounded-xl bg-cinnabar/90 py-3 text-sm text-paper"
          >
            推進一旬（2 AP）
          </button>
          <button
            type="button"
            onClick={onFight}
            className="touch-btn rounded-xl bg-rose-900/60 py-3 text-sm text-rose-50"
          >
            路遇戰鬥 3v3
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-paper/10 bg-ink-900/70 p-4">
        <h3 className="font-display text-sm text-paper">江湖傳聞</h3>
        <ul className="mt-2 space-y-2 text-xs leading-relaxed text-paper/70">
          {state.rumors.slice(0, 3).map((r) => (
            <li key={r.slice(0, 16)}>· {r}</li>
          ))}
        </ul>
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
            採集（1 AP｜目前 {state.actionPoints}/{state.maxActionPoints}）
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

      <div className="space-y-2">
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

      <div className="space-y-2">
        <h3 className="font-display text-sm text-paper/80">可前往</h3>
        {linkedLocations.length === 0 ? (
          <p className="rounded-xl border border-dashed border-paper/20 px-4 py-6 text-center text-sm text-paper/45">
            此處暫無通路。
          </p>
        ) : (
          linkedLocations.map((loc) => {
            const known = state.knownLocationIds.includes(loc.id)
            const canGo = state.stats.stamina >= loc.travelStamina
            return (
              <button
                key={loc.id}
                type="button"
                onClick={() => onTravel(loc.id)}
                className="touch-btn flex w-full items-center justify-between gap-3 rounded-xl border border-paper/15 bg-ink-900/90 px-4 py-3.5 text-left active:scale-[0.99]"
              >
                <span>
                  <span className="block text-sm font-medium text-paper">
                    {loc.name}
                    {!known ? '（初探）' : ''}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-paper/50">
                    {LOCATION_KIND_LABEL[loc.kind]} · {loc.region}
                  </span>
                </span>
                <span
                  className={`shrink-0 rounded-lg px-2.5 py-1 text-xs ${
                    canGo
                      ? 'bg-teal-900/50 text-teal-100'
                      : 'bg-rose-950/50 text-rose-200'
                  }`}
                >
                  精力 -{loc.travelStamina}
                </span>
              </button>
            )
          })
        )}
      </div>
    </section>
  )
}
