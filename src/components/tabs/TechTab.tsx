import { useState } from 'react'
import { getTechNodesByBranch } from '../../data/origins'
import {
  MARTIAL_ARTS,
  MARTIAL_KIND_LABEL,
  bottleneckSuccessChance,
  getMartialsByKind,
  trainPotentialCost,
} from '../../data/martialArts'
import {
  TECH_BRANCH_LABEL,
  type GameState,
  type MartialKind,
  type TechBranch,
} from '../../types/game'

const BRANCHES: TechBranch[] = ['medical', 'gadget', 'physique']
const MARTIAL_KINDS: MartialKind[] = ['internal', 'heart', 'qinggong', 'active']

interface TechTabProps {
  state: GameState
  onUnlock: (techId: string) => void
  onTrain: (artId: string) => void
  onSetSlot: (
    slot: 'internal' | 'heart' | 'qinggong' | 'active',
    artId: string | null,
    activeIndex?: number,
  ) => void
}

export function TechTab({ state, onUnlock, onTrain, onSetSlot }: TechTabProps) {
  const [pane, setPane] = useState<'tech' | 'martial'>('martial')

  return (
    <section className="space-y-4 text-left">
      <div className="rounded-2xl border border-paper/10 bg-ink-900/70 p-4">
        <h2 className="font-display text-xl text-paper">武學與科技</h2>
        <p className="mt-1 text-xs leading-relaxed text-paper/55">
          配置主內功／輔心法／輕功／最多四主動；潛能修練，第 5／10 重為瓶頸。
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <p className="rounded-lg bg-ink-950/80 px-3 py-2 text-amber-100 ring-1 ring-amber-700/30">
            靈感 {state.inspiration}
          </p>
          <p className="rounded-lg bg-ink-950/80 px-3 py-2 text-sky-100 ring-1 ring-sky-700/30">
            潛能 {state.potential}
          </p>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setPane('martial')}
            className={`touch-btn rounded-lg py-2.5 text-sm ${
              pane === 'martial' ? 'bg-cinnabar/90 text-paper' : 'bg-paper/10 text-paper/70'
            }`}
          >
            武學配置
          </button>
          <button
            type="button"
            onClick={() => setPane('tech')}
            className={`touch-btn rounded-lg py-2.5 text-sm ${
              pane === 'tech' ? 'bg-cinnabar/90 text-paper' : 'bg-paper/10 text-paper/70'
            }`}
          >
            科技樹
          </button>
        </div>
      </div>

      {pane === 'martial' ? (
        <>
          <LoadoutPanel state={state} onSetSlot={onSetSlot} />
          {MARTIAL_KINDS.map((kind) => (
            <div key={kind} className="space-y-2">
              <h3 className="font-display text-sm text-paper/85">
                {MARTIAL_KIND_LABEL[kind]}
              </h3>
              {getMartialsByKind(kind).map((art) => {
                const lv = state.martialProgress[art.id] ?? 0
                const next = lv + 1
                const bottleneck = next === 5 || next === 10
                const chance = bottleneck
                  ? bottleneckSuccessChance(
                      state.comprehension,
                      state.rootBone,
                      next,
                    )
                  : 1
                const cost = lv <= 0 ? 5 : trainPotentialCost(lv)
                return (
                  <article
                    key={art.id}
                    className={`rounded-xl border p-3 ${
                      lv > 0
                        ? 'border-teal-700/40 bg-teal-950/25'
                        : 'border-paper/10 bg-ink-900/65'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-medium text-paper">{art.name}</h4>
                        <p className="mt-1 text-xs leading-relaxed text-paper/65">
                          {art.description}
                        </p>
                        <p className="mt-1 text-[11px] text-paper/45">
                          {lv > 0 ? `第 ${lv} 重` : '未學會'}
                          {lv > 0 && lv < 10 && bottleneck
                            ? ` · 下一重瓶頸成功率 ${Math.round(chance * 100)}%`
                            : ''}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => onTrain(art.id)}
                        disabled={lv >= 10}
                        className="touch-btn flex-1 rounded-lg bg-cinnabar/90 py-2.5 text-xs text-paper disabled:opacity-40"
                      >
                        {lv >= 10
                          ? '已圓滿'
                          : lv <= 0
                            ? `學習（${cost} 潛能）`
                            : bottleneck
                              ? `衝擊第 ${next} 重（${cost} 潛能）`
                              : `修練第 ${next} 重（${cost} 潛能）`}
                      </button>
                      {lv > 0 && (
                        <ConfigButton
                          artId={art.id}
                          kind={kind}
                          state={state}
                          onSetSlot={onSetSlot}
                        />
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          ))}
        </>
      ) : (
        BRANCHES.map((branch) => {
          const nodes = getTechNodesByBranch(branch)
          return (
            <div key={branch} className="space-y-2">
              <h3 className="font-display text-sm text-paper/85">
                {TECH_BRANCH_LABEL[branch]}
              </h3>
              {nodes.map((node) => {
                const unlocked = (state.techTree[node.id] ?? 0) > 0
                const prereqMet = node.requires.every(
                  (r) => (state.techTree[r] ?? 0) > 0,
                )
                const canAfford = state.inspiration >= node.inspirationCost
                return (
                  <article
                    key={node.id}
                    className={`rounded-xl border p-3 ${
                      unlocked
                        ? 'border-teal-700/40 bg-teal-950/30'
                        : 'border-paper/10 bg-ink-900/65'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-medium text-paper">
                          {node.tier}. {node.name}
                        </h4>
                        <p className="mt-1 text-xs leading-relaxed text-paper/65">
                          {node.description}
                        </p>
                        <p className="mt-1 text-[11px] text-paper/45">
                          {node.effectText}
                        </p>
                      </div>
                      <span className="shrink-0 text-[11px] text-amber-200">
                        {node.inspirationCost} 靈感
                      </span>
                    </div>
                    {unlocked ? (
                      <p className="mt-2 text-xs text-teal-200">已解鎖</p>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onUnlock(node.id)}
                        className="touch-btn mt-2 w-full rounded-lg bg-cinnabar/90 py-2.5 text-xs text-paper active:scale-[0.98] disabled:opacity-40"
                        disabled={!prereqMet && node.requires.length > 0}
                      >
                        {!prereqMet
                          ? '前置未解鎖'
                          : canAfford
                            ? `消耗 ${node.inspirationCost} 靈感解鎖`
                            : `靈感不足（差 ${node.inspirationCost - state.inspiration} 靈感）`}
                      </button>
                    )}
                  </article>
                )
              })}
            </div>
          )
        })
      )}
      {/* 確保 MARTIAL_ARTS 被引用以利 tree-shake 檢查 */}
      <p className="sr-only">{MARTIAL_ARTS.length}</p>
    </section>
  )
}

function LoadoutPanel({
  state,
  onSetSlot,
}: {
  state: GameState
  onSetSlot: TechTabProps['onSetSlot']
}) {
  const L = state.martialLoadout
  const nameOf = (id: string | null) =>
    id ? (MARTIAL_ARTS.find((m) => m.id === id)?.name ?? id) : '未配置'
  return (
    <div className="rounded-2xl border border-paper/10 bg-ink-900/70 p-4">
      <h3 className="font-display text-sm text-paper">目前配置</h3>
      <ul className="mt-2 space-y-1 text-xs text-paper/75">
        <li>主內功：{nameOf(L.internalId)}</li>
        <li>輔心法：{nameOf(L.heartId)}</li>
        <li>輕功：{nameOf(L.qinggongId)}</li>
        {L.activeIds.map((id, i) => (
          <li key={i}>
            主動 {i + 1}：{nameOf(id)}
            {id && (
              <button
                type="button"
                className="ml-2 text-cinnabar-soft underline"
                onClick={() => onSetSlot('active', null, i)}
              >
                清空
              </button>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] text-paper/40">
        悟性 {state.comprehension} · 根骨 {state.rootBone}（影響瓶頸）
      </p>
    </div>
  )
}

function ConfigButton({
  artId,
  kind,
  state,
  onSetSlot,
}: {
  artId: string
  kind: MartialKind
  state: GameState
  onSetSlot: TechTabProps['onSetSlot']
}) {
  if (kind === 'active') {
    const emptyIdx = state.martialLoadout.activeIds.findIndex((x) => x === null)
    const already = state.martialLoadout.activeIds.includes(artId)
    return (
      <button
        type="button"
        onClick={() => {
          if (already) {
            const idx = state.martialLoadout.activeIds.indexOf(artId)
            onSetSlot('active', null, idx)
          } else if (emptyIdx >= 0) {
            onSetSlot('active', artId, emptyIdx)
          } else {
            onSetSlot('active', artId, 0)
          }
        }}
        className="touch-btn rounded-lg bg-paper/10 px-3 py-2.5 text-xs text-paper"
      >
        {already ? '卸下' : emptyIdx >= 0 ? '配置' : '替換1'}
      </button>
    )
  }
  const slot = kind as 'internal' | 'heart' | 'qinggong'
  const current =
    slot === 'internal'
      ? state.martialLoadout.internalId
      : slot === 'heart'
        ? state.martialLoadout.heartId
        : state.martialLoadout.qinggongId
  return (
    <button
      type="button"
      onClick={() => onSetSlot(slot, current === artId ? null : artId)}
      className="touch-btn rounded-lg bg-paper/10 px-3 py-2.5 text-xs text-paper"
    >
      {current === artId ? '卸下' : '配置'}
    </button>
  )
}
