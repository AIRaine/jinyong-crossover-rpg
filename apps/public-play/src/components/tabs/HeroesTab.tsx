import { getLocationById } from '../../data/locations'
import { ITEM_CATALOG, NPCS } from '../../data/npcs'
import {
  COMBAT_ROLE_LABEL,
  type GameState,
} from '../../types/game'

interface HeroesTabProps {
  state: GameState
  onGift: (npcId: string, giftId: string) => void
  onRecruit: (npcId: string) => void
  onDismiss: (npcId: string) => void
  onPartner: (npcId: string) => void
}

export function HeroesTab({
  state,
  onGift,
  onRecruit,
  onDismiss,
  onPartner,
}: HeroesTabProps) {
  const here = getLocationById(state.locationId)
  const hereIds = new Set(here?.npcIds ?? [])
  const gifts = state.inventory.filter((i) => i.kind === 'gift' && i.quantity > 0)

  const sorted = [...NPCS].sort((a, b) => {
    const aHere = hereIds.has(a.id) || a.homeLocationId === state.locationId ? 0 : 1
    const bHere = hereIds.has(b.id) || b.homeLocationId === state.locationId ? 0 : 1
    if (aHere !== bHere) return aHere - bHere
    return (state.affinity[b.id] ?? 0) - (state.affinity[a.id] ?? 0)
  })

  return (
    <section className="space-y-3 text-left">
      <div className="rounded-2xl border border-paper/10 bg-ink-900/70 p-4">
        <h2 className="font-display text-xl text-paper">武林群英</h2>
        <p className="mt-1 text-xs leading-relaxed text-paper/55">
          送禮增好感；好感足夠可入隊（最多 2 人）。可攻略角色好感滿 100 可結俠侶，獲雙修加成。
        </p>
        <p className="mt-2 text-[11px] text-paper/45">
          隊伍：
          {state.partyIds.length === 0
            ? '無'
            : state.partyIds
                .map((id) => NPCS.find((n) => n.id === id)?.name ?? id)
                .join('、')}
          {state.partnerId
            ? `｜俠侶：${NPCS.find((n) => n.id === state.partnerId)?.name}`
            : ''}
        </p>
      </div>

      {sorted.map((npc) => {
        const affinity = state.affinity[npc.id] ?? 0
        const home = getLocationById(npc.homeLocationId)
        const onSite =
          hereIds.has(npc.id) || npc.homeLocationId === state.locationId
        const inParty = state.partyIds.includes(npc.id)
        const isPartner = state.partnerId === npc.id
        const favGifts = gifts.filter((g) => npc.favoriteGifts.includes(g.id))

        return (
          <article
            key={npc.id}
            className={`rounded-xl border p-3 ${
              onSite
                ? 'border-cinnabar/35 bg-cinnabar/10'
                : 'border-paper/10 bg-ink-900/65'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-display text-sm text-paper">{npc.name}</h3>
                <p className="text-[11px] text-paper/50">{npc.title}</p>
              </div>
              <div className="shrink-0 space-y-1 text-right">
                <span className="block rounded bg-paper/10 px-2 py-0.5 text-[10px] text-paper/75">
                  {COMBAT_ROLE_LABEL[npc.role]}
                </span>
                {npc.romanceable && (
                  <span className="block rounded bg-rose-900/50 px-2 py-0.5 text-[10px] text-rose-100">
                    可雙修
                  </span>
                )}
                {inParty && (
                  <span className="block rounded bg-teal-900/60 px-2 py-0.5 text-[10px] text-teal-100">
                    隊伍中
                  </span>
                )}
                {isPartner && (
                  <span className="block rounded bg-amber-900/60 px-2 py-0.5 text-[10px] text-amber-100">
                    俠侶
                  </span>
                )}
              </div>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-paper/70">{npc.bio}</p>
            <p className="mt-2 text-[11px] text-paper/45">
              常駐：{home?.name ?? '未知'} · 好感 {affinity}/100
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-950">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cinnabar to-amber-500"
                style={{ width: `${Math.min(100, Math.max(0, affinity))}%` }}
              />
            </div>

            <div className="mt-2 flex flex-wrap gap-1.5">
              {favGifts.length === 0 ? (
                <span className="text-[10px] text-paper/40">
                  背包無其喜好禮物
                </span>
              ) : (
                favGifts.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => onGift(npc.id, g.id)}
                    className="touch-btn rounded-lg bg-amber-950/50 px-2.5 py-1.5 text-[10px] text-amber-100"
                  >
                    送{ITEM_CATALOG[g.id]?.name ?? g.name}
                  </button>
                ))
              )}
            </div>

            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {inParty ? (
                <button
                  type="button"
                  onClick={() => onDismiss(npc.id)}
                  className="touch-btn rounded-lg bg-paper/10 py-2 text-xs text-paper"
                >
                  請離隊伍
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onRecruit(npc.id)}
                  className="touch-btn rounded-lg bg-teal-900/50 py-2 text-xs text-teal-50"
                >
                  邀請入隊
                </button>
              )}
              {npc.romanceable && (
                <button
                  type="button"
                  onClick={() => onPartner(npc.id)}
                  disabled={affinity < 100 && !isPartner}
                  className="touch-btn rounded-lg bg-rose-900/50 py-2 text-xs text-rose-50 disabled:opacity-40"
                >
                  {isPartner ? '已是俠侶' : affinity >= 100 ? '結為俠侶' : '俠侶需滿好感'}
                </button>
              )}
            </div>
          </article>
        )
      })}
    </section>
  )
}
