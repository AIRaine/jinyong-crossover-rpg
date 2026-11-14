import { getOriginById } from '../../data/origins'
import {
  EQUIP_QUALITY_COLOR,
  EQUIP_QUALITY_LABEL,
  EQUIP_SLOT_LABEL,
  getEquipmentById,
  refineCostForLevel,
} from '../../data/equipments'
import { computePanelStats } from '../../lib/combatStats'
import {
  TECH_ID_POISON,
  TECH_ID_QUENCH,
  type EquipSlot,
  type GameState,
} from '../../types/game'

const SLOTS: EquipSlot[] = [
  'weapon',
  'head',
  'body',
  'hands',
  'feet',
  'accessory',
]

interface CharacterTabProps {
  state: GameState
  onRename: (name: string) => void
  onEquip: (uid: string) => void
  onUnequip: (slot: EquipSlot) => void
  onRefine: (uid: string) => void
  onQuench: (uid: string) => void
  onPoison: (uid: string) => void
}

export function CharacterTab({
  state,
  onRename,
  onEquip,
  onUnequip,
  onRefine,
  onQuench,
  onPoison,
}: CharacterTabProps) {
  const { affinity, playerName, inspiration, originId } = state
  const origin = originId ? getOriginById(originId) : undefined
  const panel = computePanelStats(state)
  const huang = affinity.npc_huang_rong ?? 0
  const canQuench = (state.techTree[TECH_ID_QUENCH] ?? 0) > 0
  const canPoison = (state.techTree[TECH_ID_POISON] ?? 0) > 0

  return (
    <section className="space-y-4 text-left">
      <div className="rounded-2xl border border-paper/10 bg-ink-900/70 p-4">
        <h2 className="font-display text-xl text-paper">人物</h2>
        <p className="mt-1 text-xs text-paper/55">
          {origin
            ? `現代職業：${origin.name}｜${
                state.playerGender === 'male'
                  ? '男'
                  : state.playerGender === 'female'
                    ? '女'
                    : '不便透露'
              }`
            : '尚未選定職業——請先完成開局。'}
        </p>
        {origin?.monologue && (
          <p className="mt-2 text-[11px] leading-relaxed text-paper/45">
            「{origin.monologue}」
          </p>
        )}
        <label className="mt-4 block text-xs text-paper/60">江湖稱謂</label>
        <form
          className="mt-1 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            onRename(String(fd.get('name') ?? ''))
          }}
        >
          <input
            name="name"
            defaultValue={playerName}
            maxLength={12}
            className="min-w-0 flex-1 rounded-lg border border-paper/15 bg-ink-950 px-3 py-2.5 text-sm text-paper outline-none focus:border-cinnabar/60"
          />
          <button
            type="submit"
            className="touch-btn shrink-0 rounded-lg bg-cinnabar/90 px-3 py-2.5 text-sm text-paper active:scale-[0.98]"
          >
            改名
          </button>
        </form>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {[
          ['面板攻擊', panel.attack],
          ['面板防禦', panel.defense],
          ['氣血', `${panel.hp}/${panel.maxHp}`],
          ['內力', `${panel.internalForce}/${panel.maxInternalForce}`],
          ['悟性', state.comprehension],
          ['根骨', state.rootBone],
          ['潛能', state.potential],
          ['靈感', inspiration],
        ].map(([label, value]) => (
          <div
            key={String(label)}
            className="rounded-xl border border-paper/10 bg-ink-900/60 px-3 py-3"
          >
            <p className="text-[11px] text-paper/50">{label}</p>
            <p className="text-sm font-semibold text-paper">{value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <h3 className="font-display text-sm text-paper/85">裝備欄</h3>
        {SLOTS.map((slot) => {
          const uid = state.equipped[slot]
          const owned = uid
            ? state.ownedEquipment.find((e) => e.uid === uid)
            : undefined
          const def = owned ? getEquipmentById(owned.defId) : undefined
          return (
            <div
              key={slot}
              className="rounded-xl border border-paper/10 bg-ink-900/65 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[11px] text-paper/45">{EQUIP_SLOT_LABEL[slot]}</p>
                  {def && owned ? (
                    <>
                      <p className={`text-sm font-medium ${EQUIP_QUALITY_COLOR[def.quality]}`}>
                        {def.name} +{owned.refineLevel}
                      </p>
                      <p className="mt-0.5 text-[11px] text-paper/50">
                        {EQUIP_QUALITY_LABEL[def.quality]}
                        {owned.quenched ? ' · 已淬火' : ''}
                        {owned.poisoned ? ' · 已塗毒' : ''}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-paper/40">空</p>
                  )}
                </div>
                {uid && (
                  <button
                    type="button"
                    onClick={() => onUnequip(slot)}
                    className="touch-btn rounded-lg bg-paper/10 px-3 py-2 text-xs text-paper"
                  >
                    卸下
                  </button>
                )}
              </div>
              {owned && def && (
                <div className="mt-2 grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => onRefine(owned.uid)}
                    className="touch-btn rounded-lg bg-amber-900/50 py-2 text-[11px] text-amber-100"
                  >
                    精煉
                    {owned.refineLevel < 15
                      ? ` ${refineCostForLevel(def.baseRefineCost, owned.refineLevel)}銀`
                      : ' MAX'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onQuench(owned.uid)}
                    className="touch-btn rounded-lg bg-orange-950/60 py-2 text-[11px] text-orange-100 disabled:opacity-40"
                    disabled={!canQuench || owned.quenched}
                  >
                    {owned.quenched ? '已淬火' : canQuench ? '淬火' : '需科技'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onPoison(owned.uid)}
                    className="touch-btn rounded-lg bg-emerald-950/60 py-2 text-[11px] text-emerald-100 disabled:opacity-40"
                    disabled={!canPoison || owned.poisoned}
                  >
                    {owned.poisoned ? '已塗毒' : canPoison ? '塗毒' : '需科技'}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="space-y-2">
        <h3 className="font-display text-sm text-paper/85">行囊裝備</h3>
        {state.ownedEquipment.length === 0 ? (
          <p className="rounded-xl border border-dashed border-paper/20 px-4 py-6 text-center text-sm text-paper/45">
            尚無裝備。完成序章後會獲得起步裝。
          </p>
        ) : (
          state.ownedEquipment.map((owned) => {
            const def = getEquipmentById(owned.defId)
            if (!def) return null
            const isOn = Object.values(state.equipped).includes(owned.uid)
            return (
              <article
                key={owned.uid}
                className="rounded-xl border border-paper/10 bg-ink-900/65 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className={`text-sm font-medium ${EQUIP_QUALITY_COLOR[def.quality]}`}>
                      {def.name} +{owned.refineLevel}
                    </p>
                    <p className="mt-0.5 text-[11px] text-paper/50">
                      {EQUIP_SLOT_LABEL[def.slot]} · {EQUIP_QUALITY_LABEL[def.quality]} · 攻
                      {def.attack} 防{def.defense}
                    </p>
                    <p className="mt-1 text-xs text-paper/60">{def.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => (isOn ? onUnequip(def.slot) : onEquip(owned.uid))}
                    className="touch-btn shrink-0 rounded-lg bg-cinnabar/90 px-3 py-2 text-xs text-paper"
                  >
                    {isOn ? '卸下' : '裝備'}
                  </button>
                </div>
              </article>
            )
          })
        )}
      </div>

      <div className="rounded-2xl border border-paper/10 bg-ink-900/70 p-4">
        <h3 className="font-display text-sm text-paper">人際速覽</h3>
        <p className="mt-2 text-sm text-paper/80">皇容好感：{huang}</p>
      </div>
    </section>
  )
}
