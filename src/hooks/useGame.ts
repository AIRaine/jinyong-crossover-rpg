import { useCallback, useEffect, useState } from 'react'
import {
  ALCHEMY_RECIPES,
  MATERIAL_IDS,
  MATERIAL_DEFS,
  makeMaterial,
} from '../data/alchemy'
import { getEquipmentById, refineCostForLevel } from '../data/equipments'
import { createInitialGameState } from '../data/initialState'
import {
  getLinkedLocations,
  getLocationById,
} from '../data/locations'
import {
  bottleneckSuccessChance,
  getMartialById,
  trainPotentialCost,
} from '../data/martialArts'
import {
  COLD_LOCATION_IDS,
  ENCOUNTER_EVENTS,
  MAIN_STORY_EVENTS,
  XUN_LABELS,
} from '../data/events'
import {
  bumpWeeklyGoal,
  calendarDateKey,
  DAILY_LOGIN_AP,
  DAILY_LOGIN_POTENTIAL,
  DAILY_LOGIN_SILVER,
  ensureWeeklyGoals,
} from '../data/storyArcs'
import {
  allMainBeatsDone,
  applyMainBeatResolved,
  ensureStoryRoute,
  resolveAdvanceXunStory,
} from '../lib/storyProgress'
import {
  detectEndingKey,
  flavorEventForNgPlus,
  flavorPrologueForNgPlus,
  NG_PLUS_ENCOUNTERS,
} from '../lib/ngPlusStory'
import {
  COMBAT_MARTIAL_POOL,
  LOCATION_MARTIAL_FINDS,
  SECT_MARTIAL_GRANTS,
  grantMartialArts,
  pickUnknownMartial,
} from '../lib/martialUnlock'
import { createItemFromCatalog, getNpcById } from '../data/npcs'
import { getOriginById, getTechNodeById } from '../data/origins'
import { getPrologueEvent } from '../data/prologue'
import {
  getSectById,
  sectRankFromContribution,
} from '../data/sects'
import {
  MOCK_TOPUP_PACKS,
  MONTHLY_DAILY_AP,
  MONTHLY_DAILY_POTENTIAL,
  MONTHLY_DAILY_SILVER,
  MONTHLY_DAILY_YUANBAO,
  SILVER_SHOP,
  YUANBAO_SHOP,
} from '../data/shop'
import { applyRewards } from '../lib/applyRewards'
import {
  applyBanditFightStartCost,
  BANDIT_FIGHT_AP_COST,
  BANDIT_FIGHTS_PER_XUN_MAX,
  banditWinRewards,
  clearCombatLoseStreak,
  getBanditStartBlock,
} from '../lib/banditEncounterRules'
import {
  applySparFightStartCost,
  getSparStartBlock,
  SPAR_FIGHT_AP_COST,
  SPAR_FIGHTS_PER_XUN_MAX,
  SPAR_WIN_POTENTIAL,
  SPAR_WIN_SILVER,
  sparStartBlockLabel,
} from '../lib/sparEncounterRules'
import {
  applyNightTravelApRestore,
  NIGHT_TRAVEL_AP_RESTORE,
} from '../lib/travelApRules'
import {
  buildPartyCombatants,
  buildPlayerCombatant,
} from '../lib/buildCombatants'
import {
  makeBanditEncounter,
  makeSparEncounter,
  performPlayerAction,
  type CombatActionKind,
  type CombatState,
} from '../lib/combatEngine'
import {
  GACHA_SINGLE_COST,
  GACHA_TEN_COST,
  pullMany,
} from '../lib/gachaEngine'
import { applyNewGamePlus, canSettleNgPlus } from '../lib/ngPlus'
import {
  autoSave,
  loadFromSlot,
  loadOrCreateGame,
  MANUAL_SLOTS,
  saveToSlot,
} from '../lib/saveManager'
import { playSound, unlockAudio } from '../lib/soundEngine'
import { grantStarterGear } from '../lib/starterGear'
import {
  TECH_ID_POISON,
  TECH_ID_QUENCH,
  type EquipmentDef,
  type EquipSlot,
  type GameState,
  type InventoryItem,
  type OwnedEquipment,
  type PlayerGender,
  type SaveSlotId,
  type StoryChoice,
  type StoryEventChoiceDef,
  type TabId,
} from '../types/game'

type CombatKind = 'bandit' | 'spar'

function mergeItem(
  inventory: InventoryItem[],
  item: InventoryItem,
): InventoryItem[] {
  const next = inventory.map((i) => ({ ...i }))
  const found = next.find((i) => i.id === item.id)
  if (found) found.quantity += item.quantity
  else next.push(item)
  return next
}

function consumeItem(
  inventory: InventoryItem[],
  id: string,
  qty: number,
): InventoryItem[] | null {
  const next = inventory.map((i) => ({ ...i }))
  const found = next.find((i) => i.id === id)
  if (!found || found.quantity < qty) return null
  found.quantity -= qty
  return next.filter((i) => i.quantity > 0)
}

export function useGame() {
  const [state, setState] = useState<GameState>(() => loadOrCreateGame())
  const [tab, setTab] = useState<TabId>('travel')
  const [questOpen, setQuestOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)
  const [combat, setCombat] = useState<CombatState | null>(null)
  const [combatKind, setCombatKind] = useState<CombatKind | null>(null)
  const [lastGacha, setLastGacha] = useState<EquipmentDef[]>([])

  const persist = useCallback((next: GameState) => {
    const stamped = autoSave(next)
    setState({ ...next, updatedAt: stamped.updatedAt })
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 2800)
    return () => window.clearTimeout(t)
  }, [toast])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
  }, [])

  const ensureAudio = useCallback(async () => {
    await unlockAudio()
  }, [])

  const changeTab = useCallback(
    async (next: TabId) => {
      await ensureAudio()
      playSound('page')
      setTab(next)
    },
    [ensureAudio],
  )

  const selectOrigin = useCallback(
    async (payload: {
      originId: string
      jobTitle: string
      playerName: string
      gender: PlayerGender
    }) => {
      await ensureAudio()
      const origin = getOriginById(payload.originId)
      if (!origin || state.originChosen) return

      const bonuses = origin.bonuses
      const stats = { ...state.stats }
      if (bonuses.maxHp) {
        stats.maxHp += bonuses.maxHp
        stats.hp += bonuses.maxHp
      }
      if (bonuses.maxStamina) {
        stats.maxStamina += bonuses.maxStamina
        stats.stamina = Math.min(
          stats.maxStamina,
          stats.stamina + Math.floor(bonuses.maxStamina / 2),
        )
      }
      if (bonuses.attack) stats.attack += bonuses.attack
      if (bonuses.defense) stats.defense += bonuses.defense
      if (bonuses.maxInternalForce) {
        stats.maxInternalForce += bonuses.maxInternalForce
        stats.internalForce += Math.floor(bonuses.maxInternalForce / 2)
      }

      const techTree = { ...state.techTree }
      for (const techId of origin.startingTechIds) {
        techTree[techId] = 1
      }

      let inventory = state.inventory.map((i) => ({ ...i }))
      for (const itemId of origin.startingItemIds) {
        const item = createItemFromCatalog(itemId, 1)
        if (!item) continue
        inventory = mergeItem(inventory, item)
      }

      const quests = state.quests.map((q) => {
        if (q.id !== 'quest_prologue') return q
        return {
          ...q,
          objectives: q.objectives.map((o) =>
            o.id === 'obj_pick_origin' ? { ...o, done: true } : o,
          ),
        }
      })

      const comprehension = Math.min(
        99,
        state.comprehension + (origin.comprehensionBonus ?? 0),
      )
      const rootBone = Math.min(
        99,
        state.rootBone + (origin.rootBoneBonus ?? 0),
      )

      const playerName =
        payload.playerName.trim().slice(0, 12) || '無名穿越客'
      const originJobTitle = payload.jobTitle.trim().slice(0, 20)
      const displayJob =
        originJobTitle || origin.defaultJobTitle || origin.name

      const next: GameState = {
        ...state,
        playerName,
        playerGender: payload.gender,
        originChosen: true,
        originId: origin.id,
        originJobTitle,
        stats,
        techTree,
        inventory,
        quests,
        inspiration: state.inspiration + (bonuses.inspiration ?? 0),
        currency: {
          ...state.currency,
          silver: state.currency.silver + (bonuses.silver ?? 0),
        },
        activeEventId: 'event_prologue_rain_temple',
        comprehension,
        rootBone,
        flags: {
          ...state.flags,
          originName: displayJob,
          originCategory: origin.name,
          openingTransitDone: true,
          ngPlusNeedsOrigin: false,
        },
      }
      persist(next)
      playSound('success')
      showToast(
        `你以「${displayJob}」之身墜入雨夜。靈感 +${bonuses.inspiration ?? 0}`,
      )
      setStatusMsg('異變已過。破廟序章開始——請在遊歷作出抉擇。')
      setTab('travel')
    },
    [ensureAudio, persist, showToast, state],
  )

  const choosePrologue = useCallback(
    async (choice: StoryChoice) => {
      if (!state.originChosen) {
        showToast('請先選定現代職業')
        return
      }
      await ensureAudio()
      playSound('combat')
      const withInsp: StoryChoice = {
        ...choice,
        rewards: {
          ...choice.rewards,
          inspiration: (choice.rewards.inspiration ?? 0) + 4,
          potential: (choice.rewards.potential ?? 0) + 8,
        },
      }
      const { state: rewarded, messages } = applyRewards(state, withInsp.rewards)
      const prologue = flavorPrologueForNgPlus(
        getPrologueEvent(),
        state.ngPlusCount,
        detectEndingKey(state.flags),
      )
      const known = new Set([
        ...rewarded.knownLocationIds,
        'loc_broken_temple',
        'loc_xiangyang',
      ])
      let next: GameState = {
        ...rewarded,
        prologueDone: true,
        activeEventId: null,
        completedEvents: rewarded.completedEvents.includes(prologue.id)
          ? rewarded.completedEvents
          : [...rewarded.completedEvents, prologue.id],
        lastOutcomeText: choice.outcomeText,
        locationId: 'loc_broken_temple',
        locationName: '雨夜破廟',
        knownLocationIds: [...known],
        time: { ...rewarded.time, period: 'dawn' },
      }
      next = grantStarterGear(next)
      persist(next)
      playSound('success')
      showToast(`${messages.join(' · ')} · 獲得起步裝備與武學`)
      setStatusMsg('序章了結。可遊歷、採集煉丹、穿裝精煉、修練武學。')
    },
    [ensureAudio, persist, showToast, state],
  )

  const travelTo = useCallback(
    async (locationId: string) => {
      await ensureAudio()
      if (!state.prologueDone) {
        playSound('fail')
        showToast('序章未了，尚不能遠行')
        return
      }
      const current = getLocationById(state.locationId)
      const target = getLocationById(locationId)
      if (!current || !target) {
        playSound('fail')
        showToast('未知地點')
        return
      }
      if (!current.links.includes(locationId)) {
        playSound('fail')
        showToast('此地無法直達，請先經過鄰近節點')
        return
      }
      const usePass = state.travelPassCharges > 0
      const cost = usePass
        ? Math.max(1, Math.ceil(target.travelStamina / 2))
        : target.travelStamina
      if (state.stats.stamina < cost) {
        playSound('fail')
        showToast(
          `精力不足（需要 ${cost} 精力，目前 ${state.stats.stamina} 精力）`,
        )
        return
      }

      const known = new Set(state.knownLocationIds)
      known.add(locationId)
      for (const link of target.links) known.add(link)

      const nextPeriod =
        state.time.period === 'dawn'
          ? 'noon'
          : state.time.period === 'noon'
            ? 'dusk'
            : state.time.period === 'dusk'
              ? 'night'
              : 'dawn'
      const nextDay =
        state.time.period === 'night' ? state.time.day + 1 : state.time.day
      const restoreAp = state.time.period === 'night'

      // 初訪過冷秘境：機率發現武學書冊
      let martialNote = ''
      let martialProgress = state.martialProgress
      if (!state.knownLocationIds.includes(target.id)) {
        const pool = LOCATION_MARTIAL_FINDS[target.id]
        if (pool && Math.random() < 0.55) {
          const id = pickUnknownMartial(
            { ...state, martialProgress },
            pool,
          )
          if (id) {
            const granted = grantMartialArts(
              { ...state, martialProgress },
              [id],
            )
            martialProgress = granted.state.martialProgress
            const art = getMartialById(id)
            if (art) martialNote = `｜發現書冊「${art.name}」`
          }
        }
      }

      const cleared =
        state.combatLoseStreak > 0 ? clearCombatLoseStreak(state) : state
      const apAfterNight = restoreAp
        ? applyNightTravelApRestore(
            cleared.actionPoints,
            cleared.maxActionPoints,
          )
        : cleared.actionPoints
      let next: GameState = {
        ...cleared,
        locationId: target.id,
        locationName: target.name,
        knownLocationIds: [...known],
        martialProgress,
        travelPassCharges: usePass
          ? Math.max(0, cleared.travelPassCharges - 1)
          : cleared.travelPassCharges,
        stats: {
          ...cleared.stats,
          stamina: cleared.stats.stamina - cost,
        },
        time: {
          ...cleared.time,
          period: nextPeriod,
          day: nextDay,
        },
        actionPoints: apAfterNight,
        lastOutcomeText: null,
        lastCombatResult: null,
      }
      const cold = new Set<string>(COLD_LOCATION_IDS)
      if (cold.has(target.id)) {
        next = bumpWeeklyGoal(ensureWeeklyGoals(next), 'visit_cold', 1)
      }
      persist(next)
      playSound('page')
      const streakNote =
        state.combatLoseStreak > 0 ? '｜連敗保護已解除' : ''
      const nightApNote = restoreAp
        ? apAfterNight > cleared.actionPoints
          ? `；破曉 AP +${NIGHT_TRAVEL_AP_RESTORE}（上限內）`
          : '；破曉 AP 已滿則不增'
        : ''
      showToast(
        `抵達「${target.name}」，消耗精力 ${cost}${usePass ? '（通票減半）' : ''}${nightApNote}${martialNote}${streakNote}`,
      )
      setStatusMsg(`你來到${target.region}的${target.name}。`)
    },
    [ensureAudio, persist, showToast, state],
  )

  const unlockTech = useCallback(
    async (techId: string) => {
      await ensureAudio()
      const node = getTechNodeById(techId)
      if (!node) return

      if ((state.techTree[techId] ?? 0) > 0) {
        showToast('此節點已解鎖')
        return
      }
      for (const req of node.requires) {
        if ((state.techTree[req] ?? 0) <= 0) {
          playSound('fail')
          const reqNode = getTechNodeById(req)
          showToast(`需先解鎖「${reqNode?.name ?? req}」`)
          return
        }
      }
      if (state.inspiration < node.inspirationCost) {
        playSound('fail')
        showToast(
          `靈感不足：需要 ${node.inspirationCost} 靈感，目前只有 ${state.inspiration} 靈感`,
        )
        return
      }

      const next: GameState = {
        ...state,
        inspiration: state.inspiration - node.inspirationCost,
        techTree: { ...state.techTree, [techId]: 1 },
      }

      if (techId === 'tech_body_1') {
        next.stats = {
          ...next.stats,
          maxStamina: next.stats.maxStamina + 5,
          stamina: next.stats.stamina + 5,
        }
      }
      if (techId === 'tech_body_5') {
        next.stats = { ...next.stats, attack: next.stats.attack + 2 }
      }
      if (techId === 'tech_med_5') {
        next.stats = {
          ...next.stats,
          maxInternalForce: next.stats.maxInternalForce + 10,
        }
      }
      if (techId === TECH_ID_QUENCH) {
        next.flags = { ...next.flags, quenchUnlocked: true }
      }
      if (techId === TECH_ID_POISON) {
        next.flags = { ...next.flags, poisonUnlocked: true }
      }

      persist(next)
      playSound('success')
      showToast(`解鎖「${node.name}」，靈感 -${node.inspirationCost}`)
    },
    [ensureAudio, persist, showToast, state],
  )

  const equipItem = useCallback(
    async (uid: string) => {
      await ensureAudio()
      const owned = state.ownedEquipment.find((e) => e.uid === uid)
      const def = owned ? getEquipmentById(owned.defId) : undefined
      if (!owned || !def) return
      const next: GameState = {
        ...state,
        equipped: { ...state.equipped, [def.slot]: uid },
      }
      persist(next)
      playSound('tap')
      showToast(`已裝備「${def.name}」`)
    },
    [ensureAudio, persist, showToast, state],
  )

  const unequipSlot = useCallback(
    async (slot: EquipSlot) => {
      await ensureAudio()
      const equipped = { ...state.equipped }
      delete equipped[slot]
      persist({ ...state, equipped })
      playSound('tap')
      showToast('已卸下')
    },
    [ensureAudio, persist, showToast, state],
  )

  const refineEquipment = useCallback(
    async (uid: string) => {
      await ensureAudio()
      const owned = state.ownedEquipment.find((e) => e.uid === uid)
      const def = owned ? getEquipmentById(owned.defId) : undefined
      if (!owned || !def) return
      if (owned.refineLevel >= 15) {
        playSound('fail')
        showToast('已達精煉上限 +15')
        return
      }
      const cost = refineCostForLevel(def.baseRefineCost, owned.refineLevel)
      if (state.currency.silver < cost) {
        playSound('fail')
        showToast(
          `銀兩不足：需要 ${cost} 銀兩，目前 ${state.currency.silver} 銀兩`,
        )
        return
      }
      const nextOwned = state.ownedEquipment.map((e) =>
        e.uid === uid ? { ...e, refineLevel: e.refineLevel + 1 } : e,
      )
      persist({
        ...state,
        currency: {
          ...state.currency,
          silver: state.currency.silver - cost,
        },
        ownedEquipment: nextOwned,
      })
      playSound('coin')
      showToast(`「${def.name}」精煉至 +${owned.refineLevel + 1}（-${cost} 銀兩）`)
    },
    [ensureAudio, persist, showToast, state],
  )

  const quenchEquipment = useCallback(
    async (uid: string) => {
      await ensureAudio()
      if ((state.techTree[TECH_ID_QUENCH] ?? 0) <= 0) {
        playSound('fail')
        showToast('需先解鎖科技「火藥替代試作」才能淬火')
        return
      }
      const owned = state.ownedEquipment.find((e) => e.uid === uid)
      const def = owned ? getEquipmentById(owned.defId) : undefined
      if (!owned || !def) return
      if (owned.quenched) {
        showToast('此裝備已淬火')
        return
      }
      const cost = 40
      if (state.currency.silver < cost) {
        playSound('fail')
        showToast(`銀兩不足（淬火需 ${cost} 銀兩）`)
        return
      }
      const inv = consumeItem(state.inventory, MATERIAL_IDS.ore, 1)
      if (!inv) {
        playSound('fail')
        showToast('需要粗煉礦石 ×1')
        return
      }
      persist({
        ...state,
        currency: { ...state.currency, silver: state.currency.silver - cost },
        inventory: inv,
        ownedEquipment: state.ownedEquipment.map((e) =>
          e.uid === uid ? { ...e, quenched: true } : e,
        ),
      })
      playSound('success')
      showToast(`「${def.name}」淬火成功（攻擊+3）`)
    },
    [ensureAudio, persist, showToast, state],
  )

  const poisonEquipment = useCallback(
    async (uid: string) => {
      await ensureAudio()
      if ((state.techTree[TECH_ID_POISON] ?? 0) <= 0) {
        playSound('fail')
        showToast('需先解鎖科技「草藥辨識」才能塗毒')
        return
      }
      const owned = state.ownedEquipment.find((e) => e.uid === uid)
      const def = owned ? getEquipmentById(owned.defId) : undefined
      if (!owned || !def) return
      if (owned.poisoned) {
        showToast('此裝備已塗毒')
        return
      }
      const inv = consumeItem(state.inventory, MATERIAL_IDS.herb, 2)
      if (!inv) {
        playSound('fail')
        showToast('需要新鮮草藥 ×2')
        return
      }
      persist({
        ...state,
        inventory: inv,
        ownedEquipment: state.ownedEquipment.map((e) =>
          e.uid === uid ? { ...e, poisoned: true } : e,
        ),
      })
      playSound('success')
      showToast(`「${def.name}」塗毒完成（攻擊+2）`)
    },
    [ensureAudio, persist, showToast, state],
  )

  const setMartialSlot = useCallback(
    async (
      slot: 'internal' | 'heart' | 'qinggong' | 'active',
      artId: string | null,
      activeIndex = 0,
    ) => {
      await ensureAudio()
      if (artId) {
        const lv = state.martialProgress[artId] ?? 0
        const art = getMartialById(artId)
        if (!art || lv <= 0) {
          playSound('fail')
          showToast('尚未學會此武學')
          return
        }
        if (slot === 'internal' && art.kind !== 'internal') return
        if (slot === 'heart' && art.kind !== 'heart') return
        if (slot === 'qinggong' && art.kind !== 'qinggong') return
        if (slot === 'active' && art.kind !== 'active') return
      }
      const loadout = { ...state.martialLoadout, activeIds: [...state.martialLoadout.activeIds] as GameState['martialLoadout']['activeIds'] }
      if (slot === 'internal') loadout.internalId = artId
      if (slot === 'heart') loadout.heartId = artId
      if (slot === 'qinggong') loadout.qinggongId = artId
      if (slot === 'active') {
        const idx = Math.max(0, Math.min(3, activeIndex))
        loadout.activeIds[idx] = artId
      }
      persist({ ...state, martialLoadout: loadout })
      playSound('tap')
      showToast(artId ? `已配置「${getMartialById(artId)?.name}」` : '已清空配置')
    },
    [ensureAudio, persist, showToast, state],
  )

  const trainMartial = useCallback(
    async (artId: string) => {
      await ensureAudio()
      const art = getMartialById(artId)
      const level = state.martialProgress[artId] ?? 0
      if (!art) return
      if (level <= 0) {
        // 學習：消耗潛能解鎖 1 級
        const learnCost = 5
        if (state.potential < learnCost) {
          playSound('fail')
          showToast(
            `潛能不足：學習需 ${learnCost} 潛能，目前 ${state.potential} 潛能`,
          )
          return
        }
        persist({
          ...state,
          potential: state.potential - learnCost,
          martialProgress: { ...state.martialProgress, [artId]: 1 },
        })
        playSound('success')
        showToast(`學會「${art.name}」第 1 重`)
        return
      }
      if (level >= 10) {
        playSound('fail')
        showToast('已達第十重圓滿')
        return
      }
      const target = level + 1
      const cost = trainPotentialCost(level)
      if (state.potential < cost) {
        playSound('fail')
        showToast(
          `潛能不足：需要 ${cost} 潛能，目前 ${state.potential} 潛能`,
        )
        return
      }

      const isBottleneck = target === 5 || target === 10
      if (isBottleneck) {
        const chance = bottleneckSuccessChance(
          state.comprehension,
          state.rootBone,
          target,
        )
        const roll = Math.random()
        if (roll > chance) {
          const hpLoss = target === 10 ? 25 : 15
          persist({
            ...state,
            potential: state.potential - cost,
            stats: {
              ...state.stats,
              hp: Math.max(1, state.stats.hp - hpLoss),
            },
          })
          playSound('fail')
          showToast(
            `第 ${target} 重瓶頸失敗（成功率 ${Math.round(chance * 100)}%），氣血 -${hpLoss}`,
          )
          return
        }
      }

      persist({
        ...state,
        potential: state.potential - cost,
        martialProgress: { ...state.martialProgress, [artId]: target },
      })
      playSound('success')
      showToast(
        isBottleneck
          ? `突破瓶頸！「${art.name}」升至第 ${target} 重`
          : `「${art.name}」修至第 ${target} 重`,
      )
    },
    [ensureAudio, persist, showToast, state],
  )

  const gatherAtLocation = useCallback(
    async (kind: 'herb' | 'ore') => {
      await ensureAudio()
      if (!state.prologueDone) {
        playSound('fail')
        showToast('序章未了')
        return
      }
      if (state.actionPoints < 1) {
        playSound('fail')
        showToast('行動點不足（需 1 AP）')
        return
      }
      const loc = getLocationById(state.locationId)
      if (!loc || loc.gather === 'none') {
        playSound('fail')
        showToast('此地無可採資源')
        return
      }
      if (kind === 'herb' && loc.gather !== 'herb' && loc.gather !== 'both') {
        playSound('fail')
        showToast('此地採不到草藥')
        return
      }
      if (kind === 'ore' && loc.gather !== 'ore' && loc.gather !== 'both') {
        playSound('fail')
        showToast('此地採不到礦石')
        return
      }
      const matId = kind === 'herb' ? MATERIAL_IDS.herb : MATERIAL_IDS.ore
      const mat = makeMaterial(matId, 1)
      if (!mat) return
      let martialProgress = state.martialProgress
      let martialNote = ''
      const pool = LOCATION_MARTIAL_FINDS[state.locationId]
      if (pool && Math.random() < 0.18) {
        const mid = pickUnknownMartial(state, pool)
        if (mid) {
          const granted = grantMartialArts(state, [mid])
          martialProgress = granted.state.martialProgress
          const art = getMartialById(mid)
          if (art) martialNote = `｜翻出書冊「${art.name}」`
        }
      }
      persist({
        ...state,
        martialProgress,
        actionPoints: state.actionPoints - 1,
        inventory: mergeItem(state.inventory, mat),
        potential: state.potential + 1,
      })
      playSound('success')
      showToast(`採集獲得「${mat.name}」×1（-1 AP，潛能 +1）${martialNote}`)
    },
    [ensureAudio, persist, showToast, state],
  )

  const craftAlchemy = useCallback(
    async (recipeId: string) => {
      await ensureAudio()
      const recipe = ALCHEMY_RECIPES.find((r) => r.id === recipeId)
      if (!recipe) return
      let inv = state.inventory.map((i) => ({ ...i }))
      for (const [id, qty] of Object.entries(recipe.costs)) {
        const next = consumeItem(inv, id, qty)
        if (!next) {
          playSound('fail')
          const name = MATERIAL_DEFS[id]?.name ?? id
          showToast(`材料不足：需要 ${name} ×${qty}`)
          return
        }
        inv = next
      }
      const result = makeMaterial(recipe.resultId, recipe.resultQty)
      if (!result) return
      inv = mergeItem(inv, result)
      persist({ ...state, inventory: inv })
      playSound('success')
      showToast(`${recipe.name}成功：獲得「${result.name}」`)
    },
    [ensureAudio, persist, showToast, state],
  )

  const useConsumable = useCallback(
    async (itemId: string) => {
      await ensureAudio()
      if (itemId === MATERIAL_IDS.hpPill) {
        const inv = consumeItem(state.inventory, itemId, 1)
        if (!inv) {
          playSound('fail')
          showToast('沒有回血丹')
          return
        }
        const cleared = clearCombatLoseStreak(state)
        persist({
          ...cleared,
          inventory: inv,
          stats: {
            ...cleared.stats,
            hp: Math.min(cleared.stats.maxHp, cleared.stats.hp + 40),
          },
        })
        playSound('success')
        showToast(
          state.combatLoseStreak > 0
            ? '服用回血丹，氣血 +40｜連敗保護已解除'
            : '服用回血丹，氣血 +40',
        )
        return
      }
      if (itemId === MATERIAL_IDS.qiPill) {
        const inv = consumeItem(state.inventory, itemId, 1)
        if (!inv) {
          playSound('fail')
          showToast('沒有回內丹')
          return
        }
        const cleared = clearCombatLoseStreak(state)
        persist({
          ...cleared,
          inventory: inv,
          stats: {
            ...cleared.stats,
            internalForce: Math.min(
              cleared.stats.maxInternalForce,
              cleared.stats.internalForce + 30,
            ),
          },
        })
        playSound('success')
        showToast(
          state.combatLoseStreak > 0
            ? '服用回內丹，內力 +30｜連敗保護已解除'
            : '服用回內丹，內力 +30',
        )
      }
    },
    [ensureAudio, persist, showToast, state],
  )

  const mockTopUp = useCallback(
    async (packId: string) => {
      await ensureAudio()
      const pack = MOCK_TOPUP_PACKS.find((p) => p.id === packId)
      if (!pack) return
      const next: GameState = {
        ...state,
        currency: {
          ...state.currency,
          yuanbao: state.currency.yuanbao + pack.yuanbao,
        },
        flags: {
          ...state.flags,
          usedMockTopUp: true,
        },
      }
      persist(next)
      playSound('coin')
      showToast(
        `模擬儲值成功（體驗用）：${pack.label}，元寶 +${pack.yuanbao}。不會扣款。`,
      )
    },
    [ensureAudio, persist, showToast, state],
  )

  const buySilverOffer = useCallback(
    async (offerId: string) => {
      await ensureAudio()
      const offer = SILVER_SHOP.find((o) => o.id === offerId)
      if (!offer || !offer.available) return
      const price = offer.priceSilver ?? 0
      if (state.currency.silver < price) {
        playSound('fail')
        showToast('銀兩不足')
        return
      }
      let inventory = state.inventory
      let stamina = state.stats.stamina
      const grant = offer.grant
      if (grant?.kind === 'stat' && grant.stamina) {
        stamina = Math.min(
          state.stats.maxStamina,
          stamina + grant.stamina,
        )
      } else if (grant?.kind === 'item' && grant.id) {
        const fromMat = makeMaterial(grant.id, grant.qty ?? 1)
        const fromGift = createItemFromCatalog(grant.id, grant.qty ?? 1)
        const item = fromMat ?? fromGift
        if (!item) {
          playSound('fail')
          showToast('商品資料缺失')
          return
        }
        inventory = mergeItem(inventory, item)
      }
      persist({
        ...state,
        inventory,
        currency: {
          ...state.currency,
          silver: state.currency.silver - price,
        },
        stats: { ...state.stats, stamina },
      })
      playSound('coin')
      showToast(`購入「${offer.name}」`)
    },
    [ensureAudio, persist, showToast, state],
  )

  const buyYuanbaoOffer = useCallback(
    async (offerId: string) => {
      await ensureAudio()
      const offer = YUANBAO_SHOP.find((o) => o.id === offerId)
      if (!offer || !offer.available) return
      if (state.currency.yuanbao < offer.priceYuanbao) {
        playSound('fail')
        showToast('元寶不足（可用模擬儲值）')
        return
      }
      let next: GameState = {
        ...state,
        currency: {
          ...state.currency,
          yuanbao: state.currency.yuanbao - offer.priceYuanbao,
        },
      }
      if (offer.kind === 'monthly') {
        next = {
          ...next,
          monthlyCardCharges: next.monthlyCardCharges + 30,
        }
        showToast('江湖月卡（體驗）已生效：可領次數 +30')
      } else if (offer.kind === 'boost') {
        if (offer.id === 'shop_convenience_kit') {
          const halfStamina = Math.max(
            1,
            Math.floor(next.stats.maxStamina / 2),
          )
          next = {
            ...next,
            actionPoints: Math.min(
              next.maxActionPoints,
              next.actionPoints + 3,
            ),
            travelPassCharges: next.travelPassCharges + 2,
            stats: {
              ...next.stats,
              stamina: Math.min(
                next.stats.maxStamina,
                next.stats.stamina + halfStamina,
              ),
            },
          }
          showToast('遊歷便利錦囊：AP +3、精力回一半、通票 +2')
        } else if (offer.id === 'shop_potential_pack') {
          next = { ...next, potential: next.potential + 18 }
          showToast('潛能果生效：潛能 +18')
        } else if (offer.id === 'shop_stamina_elixir') {
          next = {
            ...next,
            stats: {
              ...next.stats,
              stamina: next.stats.maxStamina,
            },
          }
          showToast('回氣仙露：精力已回滿')
        } else if (offer.id === 'shop_ap_incense') {
          next = {
            ...next,
            actionPoints: Math.min(
              next.maxActionPoints,
              next.actionPoints + 4,
            ),
          }
          showToast('行動香篆：AP +4')
        } else if (offer.id === 'shop_travel_pass') {
          next = {
            ...next,
            travelPassCharges: next.travelPassCharges + 8,
          }
          showToast('遊歷通票：之後 8 次移動精力減半')
        } else if (offer.id === 'shop_combat_charm') {
          if (next.paidAtkBonus >= 6 && next.paidDefBonus >= 6) {
            playSound('fail')
            showToast('護身小符已達上限（攻防各 +6）')
            return
          }
          next = {
            ...next,
            paidAtkBonus: Math.min(6, next.paidAtkBonus + 1),
            paidDefBonus: Math.min(6, next.paidDefBonus + 1),
          }
          showToast(
            `護身小符：攻擊 +1、防禦 +1（目前 ${next.paidAtkBonus}/${next.paidDefBonus}）`,
          )
        } else {
          next = {
            ...next,
            comprehension: Math.min(99, next.comprehension + 3),
          }
          showToast('悟性符生效：悟性 +3')
        }
      } else if (offer.kind === 'cosmetic') {
        const id = 'cosmetic_rain_temple'
        next = {
          ...next,
          cosmetics: next.cosmetics.includes(id)
            ? next.cosmetics
            : [...next.cosmetics, id],
        }
        showToast('已解鎖外觀：破廟夜雨頭像框')
      } else {
        showToast(`已購買「${offer.name}」`)
      }
      persist(next)
      playSound('coin')
    },
    [ensureAudio, persist, showToast, state],
  )

  const claimMonthly = useCallback(async () => {
    await ensureAudio()
    if (state.monthlyCardCharges <= 0) {
      playSound('fail')
      showToast('月卡次數已用盡（可用元寶購買體驗月卡）')
      return
    }
    const key = `${state.time.year}-${state.time.month}-${state.time.xun}`
    if (state.monthlyClaimedXunKey === key) {
      playSound('fail')
      showToast('本旬已領過月卡')
      return
    }
    const apGain = Math.min(
      MONTHLY_DAILY_AP,
      Math.max(0, state.maxActionPoints - state.actionPoints),
    )
    persist({
      ...state,
      monthlyCardCharges: state.monthlyCardCharges - 1,
      monthlyClaimedXunKey: key,
      potential: state.potential + MONTHLY_DAILY_POTENTIAL,
      actionPoints: Math.min(
        state.maxActionPoints,
        state.actionPoints + MONTHLY_DAILY_AP,
      ),
      currency: {
        silver: state.currency.silver + MONTHLY_DAILY_SILVER,
        yuanbao: state.currency.yuanbao + MONTHLY_DAILY_YUANBAO,
      },
    })
    playSound('coin')
    showToast(
      `月卡領取：元寶 +${MONTHLY_DAILY_YUANBAO}、銀兩 +${MONTHLY_DAILY_SILVER}、潛能 +${MONTHLY_DAILY_POTENTIAL}${
        apGain > 0 ? `、AP +${apGain}` : '（AP 已滿）'
      }`,
    )
  }, [ensureAudio, persist, showToast, state])

  const pullGacha = useCallback(
    async (count: 1 | 10) => {
      await ensureAudio()
      const cost = count === 1 ? GACHA_SINGLE_COST : GACHA_TEN_COST
      if (state.currency.yuanbao < cost) {
        playSound('fail')
        showToast(`元寶不足（需 ${cost} 元寶）`)
        return
      }
      const pulled = pullMany(count, {
        year: state.time.year,
        pityEpic: state.gachaPityEpic,
        pityLegendary: state.gachaPityLegendary,
      })
      let seq = state.equipUidSeq
      const owned: OwnedEquipment[] = [...state.ownedEquipment]
      for (const r of pulled.results) {
        owned.push({
          uid: `eq_${seq}`,
          defId: r.item.id,
          refineLevel: 0,
          quenched: false,
          poisoned: false,
        })
        seq += 1
      }
      setLastGacha(pulled.results.map((r) => r.item))
      persist({
        ...state,
        currency: {
          ...state.currency,
          yuanbao: state.currency.yuanbao - cost,
        },
        ownedEquipment: owned,
        equipUidSeq: seq,
        gachaPityEpic: pulled.pityEpic,
        gachaPityLegendary: pulled.pityLegendary,
        gachaTotalPulls: state.gachaTotalPulls + count,
      })
      playSound('success')
      const best = pulled.results.reduce((a, b) =>
        a.item.quality === 'legendary' ||
        (a.item.quality === 'epic' && b.item.quality !== 'legendary')
          ? a
          : b,
      )
      showToast(
        count === 1
          ? `抽得「${best.item.name}」`
          : `十連完成，最佳「${best.item.name}」`,
      )
    },
    [ensureAudio, persist, showToast, state],
  )

  const startSpar = useCallback(
    async (_entryId: string, sparPower: number, name: string) => {
      await ensureAudio()
      const block = getSparStartBlock(state)
      if (block) {
        playSound('fail')
        showToast(sparStartBlockLabel(block))
        if (block === 'no_ap') {
          setStatusMsg(
            `切磋需 ${SPAR_FIGHT_AP_COST} AP（目前 ${state.actionPoints}）；可推進一旬回復。`,
          )
        } else if (block === 'xun_cap') {
          setStatusMsg(
            `同旬切磋上限 ${SPAR_FIGHTS_PER_XUN_MAX} 場；推進旬制可重置次數。`,
          )
        }
        return
      }
      const paid = applySparFightStartCost(state)
      persist(paid)
      playSound('combat')
      setCombatKind('spar')
      setCombat(
        makeSparEncounter(
          buildPlayerCombatant(paid),
          buildPartyCombatants(paid),
          sparPower,
          name,
        ),
      )
      setStatusMsg(
        `切磋開戰（-${SPAR_FIGHT_AP_COST} AP｜本旬 ${paid.sparFightsThisXun}/${SPAR_FIGHTS_PER_XUN_MAX}）`,
      )
    },
    [ensureAudio, persist, showToast, state],
  )

  const settleNgPlus = useCallback(async () => {
    await ensureAudio()
    if (!canSettleNgPlus(state)) {
      playSound('fail')
      showToast('尚未完成五年主線，無法結算 NG+')
      return
    }
    const next = applyNewGamePlus(state)
    // originChosen 已由 fresh 重設為 false → App 會強制導引開局大類
    persist({
      ...next,
      flags: {
        ...next.flags,
        ngPlusNeedsOrigin: true,
      },
    })
    setLastGacha([])
    setCombat(null)
    setCombatKind(null)
    playSound('success')
    showToast(`第 ${next.ngPlusCount} 周目：請重新選擇開局大類與職稱`)
    setTab('travel')
    setStatusMsg('NG+ 已結算。請先完成開局大類選擇，再進入序章。')
  }, [ensureAudio, persist, showToast, state])

  const manualSave = useCallback(
    async (slot: SaveSlotId) => {
      if (!MANUAL_SLOTS.includes(slot)) return
      await ensureAudio()
      saveToSlot(slot, state)
      playSound('success')
      showToast(`已寫入手動存檔槽 ${slot}`)
    },
    [ensureAudio, showToast, state],
  )

  const manualLoad = useCallback(
    async (slot: SaveSlotId) => {
      await ensureAudio()
      const loaded = loadFromSlot(slot)
      if (!loaded) {
        playSound('fail')
        showToast('此槽無存檔')
        return
      }
      persist(loaded)
      playSound('success')
      showToast(`已讀取存檔槽 ${slot === 0 ? '自動' : slot}`)
      setTab('travel')
    },
    [ensureAudio, persist, showToast],
  )

  const newGame = useCallback(async () => {
    await ensureAudio()
    const fresh = createInitialGameState()
    persist(fresh)
    playSound('page')
    showToast('已開新局（自動存檔已覆寫）')
    setTab('travel')
    setStatusMsg(null)
  }, [ensureAudio, persist, showToast])

  const renamePlayer = useCallback(
    (name: string) => {
      const trimmed = name.trim().slice(0, 12)
      if (!trimmed) return
      persist({ ...state, playerName: trimmed })
      showToast(`江湖稱謂已改為「${trimmed}」`)
    },
    [persist, showToast, state],
  )

  const startBanditFight = useCallback(async () => {
    await ensureAudio()
    const block = getBanditStartBlock(state)
    if (block) {
      playSound('fail')
      if (block === 'prologue') {
        showToast('序章未了')
      } else if (block === 'low_hp') {
        showToast('氣血過低，先服丹或採集養傷，再上路遇')
        setStatusMsg('戰敗疲勞提示：氣血不足三成五時不宜硬打。')
      } else if (block === 'lose_streak') {
        showToast('連敗三次，先推進旬制、服丹或遠行再戰')
        setStatusMsg('連敗保護：請先休整（旬制／丹藥／遠行），再挑戰路遇。')
      } else if (block === 'no_ap') {
        showToast(
          `行動點不足（需 ${BANDIT_FIGHT_AP_COST} AP，目前 ${state.actionPoints} AP）`,
        )
        setStatusMsg('路遇需消耗行動點；可推進一旬回復 AP（上限內）。')
      } else {
        showToast(
          `本旬路遇已達上限（${BANDIT_FIGHTS_PER_XUN_MAX} 場），請推進一旬後再戰`,
        )
        setStatusMsg(
          `同旬路遇上限 ${BANDIT_FIGHTS_PER_XUN_MAX} 場；推進旬制可重置次數。`,
        )
      }
      return
    }
    const paid = applyBanditFightStartCost(state)
    persist(paid)
    playSound('combat')
    setCombatKind('bandit')
    const encounter = makeBanditEncounter(
      buildPlayerCombatant(paid),
      buildPartyCombatants(paid),
      {
        loseStreak: paid.combatLoseStreak,
        year: paid.time.year,
      },
    )
    setCombat(encounter)
    setStatusMsg(
      `路遇開戰（-${BANDIT_FIGHT_AP_COST} AP｜本旬 ${paid.banditFightsThisXun}/${BANDIT_FIGHTS_PER_XUN_MAX}）`,
    )
  }, [ensureAudio, persist, showToast, state])

  const combatAct = useCallback(
    (action: CombatActionKind, targetId?: string) => {
      if (!combat) return
      playSound(action === 'tactic_aid' ? 'success' : 'combat')
      const next = performPlayerAction(combat, action, targetId)
      setCombat(next)
      if (next.finished) {
        const isSpar = combatKind === 'spar'
        if (next.victory) {
          const player = next.allies.find((a) => a.isPlayer)
          const hp = player?.hp ?? state.stats.hp
          const banditReward = isSpar
            ? {
                silver: SPAR_WIN_SILVER,
                potential: SPAR_WIN_POTENTIAL,
                decayed: false,
              }
            : banditWinRewards(state.banditFightsThisXun)
          const silverGain = banditReward.silver
          const potGain = banditReward.potential
          let martialProgress = state.martialProgress
          let martialNote = ''
          if (!isSpar && Math.random() < 0.28) {
            const mid = pickUnknownMartial(state, [...COMBAT_MARTIAL_POOL])
            if (mid) {
              const granted = grantMartialArts(state, [mid])
              martialProgress = granted.state.martialProgress
              const art = getMartialById(mid)
              if (art) martialNote = `、武學「${art.name}」`
            }
          }
          const decayNote =
            !isSpar && banditReward.decayed ? '（本旬獎勵已衰減）' : ''
          persist({
            ...state,
            martialProgress,
            combatLoseStreak: 0,
            stats: {
              ...state.stats,
              hp: Math.max(1, Math.min(state.stats.maxHp, hp)),
            },
            currency: {
              ...state.currency,
              silver: state.currency.silver + silverGain,
            },
            potential: state.potential + potGain,
            sparWins: state.sparWins + (isSpar ? 1 : 0),
            lastCombatResult: {
              victory: true,
              summary: isSpar ? '切磋勝利。' : '三對三戰局勝利。',
              rewardsNote: isSpar
                ? `銀兩 +${silverGain}、潛能 +${potGain}、切磋勝場 +1`
                : `銀兩 +${silverGain}、潛能 +${potGain}${martialNote}${decayNote}`,
            },
          })
          showToast(
            isSpar
              ? `切磋勝利：銀兩 +${silverGain}、潛能 +${potGain}`
              : `戰鬥勝利：銀兩 +${silverGain}、潛能 +${potGain}${martialNote}${decayNote}`,
          )
        } else {
          const streak = state.combatLoseStreak + 1
          // 連敗恢復更厚：一敗 40%、二敗 55%、三敗以上 70%
          const hpRatio = streak >= 3 ? 0.7 : streak === 2 ? 0.55 : 0.4
          persist({
            ...state,
            combatLoseStreak: streak,
            stats: {
              ...state.stats,
              hp: Math.max(1, Math.floor(state.stats.maxHp * hpRatio)),
              stamina: Math.min(
                state.stats.maxStamina,
                state.stats.stamina + (streak >= 2 ? 12 : 6),
              ),
            },
            lastCombatResult: {
              victory: false,
              summary: isSpar
                ? '切磋失利。'
                : streak >= 2
                  ? `此戰失利（連敗 ${streak}）。對手氣勢已衰，建議休整後再戰。`
                  : '此戰失利，氣血大損。',
              rewardsNote:
                streak >= 3
                  ? '連敗保護：路遇暫時鎖定，請先旬制／服丹／遠行。'
                  : undefined,
            },
          })
          showToast(
            isSpar
              ? '切磋敗北，氣血已回復部分'
              : `戰鬥敗北（連敗 ${streak}），氣血回復至 ${Math.round(hpRatio * 100)}%`,
          )
          if (streak >= 2) {
            setStatusMsg('連敗疲勞：先養傷或換地遊歷，下一場敵人會較弱。')
          }
        }
        setCombatKind(null)
      }
    },
    [combat, combatKind, persist, showToast, state],
  )

  const closeCombat = useCallback(() => {
    setCombat(null)
    setCombatKind(null)
    playSound('page')
  }, [])

  const giftNpc = useCallback(
    async (npcId: string, giftId: string) => {
      await ensureAudio()
      const npc = getNpcById(npcId)
      if (!npc) return
      const inv = consumeItem(state.inventory, giftId, 1)
      if (!inv) {
        playSound('fail')
        showToast('禮物不足')
        return
      }
      const fav = npc.favoriteGifts.includes(giftId)
      const delta = fav ? 18 : 8
      const nextAff = Math.min(
        100,
        (state.affinity[npcId] ?? 0) + delta,
      )
      persist({
        ...state,
        inventory: inv,
        affinity: { ...state.affinity, [npcId]: nextAff },
      })
      playSound('success')
      showToast(
        `贈予${npc.name}：好感 ${fav ? '大增' : '上升'}至 ${nextAff}`,
      )
    },
    [ensureAudio, persist, showToast, state],
  )

  const recruitNpc = useCallback(
    async (npcId: string) => {
      await ensureAudio()
      const npc = getNpcById(npcId)
      if (!npc) return
      if (state.partyIds.includes(npcId)) {
        showToast('已在隊伍中')
        return
      }
      if (state.partyIds.length >= 2) {
        playSound('fail')
        showToast('隊伍最多 2 人')
        return
      }
      const aff = state.affinity[npcId] ?? 0
      if (aff < 30) {
        playSound('fail')
        showToast(`好感不足（需 30 好感，目前 ${aff}）`)
        return
      }
      persist({ ...state, partyIds: [...state.partyIds, npcId] })
      playSound('success')
      showToast(`${npc.name} 加入隊伍`)
    },
    [ensureAudio, persist, showToast, state],
  )

  const dismissNpc = useCallback(
    async (npcId: string) => {
      await ensureAudio()
      persist({
        ...state,
        partyIds: state.partyIds.filter((id) => id !== npcId),
      })
      playSound('tap')
      showToast('已請離隊伍')
    },
    [ensureAudio, persist, showToast, state],
  )

  const makePartner = useCallback(
    async (npcId: string) => {
      await ensureAudio()
      const npc = getNpcById(npcId)
      if (!npc?.romanceable) {
        playSound('fail')
        showToast('此人不接受俠侶之約')
        return
      }
      if (state.partnerId === npcId) {
        showToast('已是俠侶')
        return
      }
      const aff = state.affinity[npcId] ?? 0
      if (aff < 100) {
        playSound('fail')
        showToast(`好感未滿（${aff}/100）`)
        return
      }
      persist({ ...state, partnerId: npcId })
      playSound('success')
      showToast(`與${npc.name}結為俠侶（雙修加成生效）`)
    },
    [ensureAudio, persist, showToast, state],
  )

  const joinSect = useCallback(
    async (sectId: string) => {
      await ensureAudio()
      const sect = getSectById(sectId)
      if (!sect) return
      if (state.sectId) {
        playSound('fail')
        showToast('已有門派，階段四暫不支援叛出')
        return
      }
      if (!state.knownLocationIds.includes(sect.homeLocationId)) {
        playSound('fail')
        showToast('尚未踏足該派駐地')
        return
      }
      if (state.stats.level < sect.entry.minLevel) {
        playSound('fail')
        showToast(`等級不足（需等級 ${sect.entry.minLevel}）`)
        return
      }
      if (state.currency.silver < sect.entry.minSilver) {
        playSound('fail')
        showToast(`銀兩不足（需 ${sect.entry.minSilver} 銀兩）`)
        return
      }
      if (
        sect.entry.minComprehension &&
        state.comprehension < sect.entry.minComprehension
      ) {
        playSound('fail')
        showToast(`悟性不足（需 ${sect.entry.minComprehension} 悟性）`)
        return
      }
      const grants = SECT_MARTIAL_GRANTS[sectId]?.onJoin ?? []
      const granted = grantMartialArts(state, grants)
      const names = granted.learned
        .map((id) => getMartialById(id)?.name)
        .filter(Boolean)
      persist({
        ...granted.state,
        sectId,
        sectContribution: 0,
        currency: {
          ...granted.state.currency,
          silver: granted.state.currency.silver - sect.entry.minSilver,
        },
      })
      playSound('success')
      showToast(
        names.length
          ? `拜入${sect.name}！傳授「${names.join('、')}」`
          : `拜入${sect.name}！`,
      )
    },
    [ensureAudio, persist, showToast, state],
  )

  const contributeSect = useCallback(async () => {
    await ensureAudio()
    if (!state.sectId) {
      showToast('尚未入門')
      return
    }
    const cost = 20
    if (state.currency.silver < cost) {
      playSound('fail')
      showToast('銀兩不足')
      return
    }
    const sect = getSectById(state.sectId)
    const nextContrib = state.sectContribution + 15
    const before = sect
      ? sectRankFromContribution(sect, state.sectContribution)
      : 0
    const after = sect ? sectRankFromContribution(sect, nextContrib) : 0
    let nextState = state
    let martialNote = ''
    if (after > before && state.sectId) {
      const rankGrants =
        SECT_MARTIAL_GRANTS[state.sectId]?.onRank[after] ?? []
      if (rankGrants.length) {
        const granted = grantMartialArts(state, rankGrants)
        nextState = granted.state
        const names = granted.learned
          .map((id) => getMartialById(id)?.name)
          .filter(Boolean)
        if (names.length) martialNote = `｜傳功「${names.join('、')}」`
      }
    }
    persist({
      ...nextState,
      sectContribution: nextContrib,
      currency: {
        ...nextState.currency,
        silver: nextState.currency.silver - cost,
      },
    })
    playSound('coin')
    showToast(
      after > before
        ? `貢獻 +15，晉升門派階級！${martialNote}`
        : `貢獻 +15（目前 ${nextContrib}）`,
    )
  }, [ensureAudio, persist, showToast, state])

  const advanceXun = useCallback(async () => {
    await ensureAudio()
    if (!state.prologueDone) {
      showToast('序章未了')
      return
    }

    const routed = ensureStoryRoute(state)
    let xun = routed.time.xun + 1
    let month = routed.time.month
    let year = routed.time.year
    let day = routed.time.day + 10
    if (xun > 2) {
      xun = 0
      month += 1
      if (month > 12) {
        month = 1
        year += 1
      }
    }

    const tradeSilver = 5 + routed.tradeRouteLevel * 8
    const story = resolveAdvanceXunStory(
      routed,
      { year, month, day, period: 'noon', xun },
      routed.pendingEventId,
      Math.random(),
    )

    const apBefore = routed.actionPoints
    const apAfter = Math.min(routed.maxActionPoints, apBefore + 1)
    const apNote =
      apAfter > apBefore ? 'AP +1（上限內）' : 'AP 已滿則不增'

    const streakCleared = routed.combatLoseStreak > 0
    let next: GameState = bumpWeeklyGoal(
      {
        ...routed,
        actionPoints: apAfter,
        time: story.time,
        currency: {
          ...routed.currency,
          silver: routed.currency.silver + tradeSilver,
        },
        rumors: story.rumors,
        pendingEventId: story.pendingEventId,
        unlockedArcIds: story.unlockedArcIds,
        xunsSinceLastBeat: story.xunsSinceLastBeat,
        lastOutcomeText: null,
        combatLoseStreak: 0,
        banditFightsThisXun: 0,
        sparFightsThisXun: 0,
      },
      'advance_xun',
      1,
    )
    next = ensureWeeklyGoals(next)
    persist(next)
    playSound('page')
    const pendingTitle = story.pendingEventId
      ? MAIN_STORY_EVENTS.find((e) => e.id === story.pendingEventId)?.title
      : null
    const restNote = streakCleared ? '｜連敗保護已解除' : ''
    const soft = story.softYearNote ? `${story.softYearNote} ` : ''
    showToast(
      `${soft}推進一旬（${apNote}）｜進入${story.time.year}年${story.time.month}月${XUN_LABELS[story.time.xun]}｜商道進帳 ${tradeSilver} 銀兩｜路遇／切磋次數重置${restNote}${pendingTitle ? `｜事態：${pendingTitle}` : ''}`,
    )
    setStatusMsg(
      pendingTitle && story.pendingEventId?.startsWith('main_')
        ? `故事節拍已降臨：${pendingTitle}。請於下方選擇。`
        : story.pendingEventId
          ? '旬內有事發生，請查看下方事件。'
          : '旬日平穩，傳聞已更新。',
    )
  }, [ensureAudio, persist, showToast, state])

  const resolvePendingChoice = useCallback(
    async (choice: StoryEventChoiceDef) => {
      await ensureAudio()
      const eventId = state.pendingEventId
      if (!eventId) return
      const rawDef =
        MAIN_STORY_EVENTS.find((e) => e.id === eventId) ??
        ENCOUNTER_EVENTS.find((e) => e.id === eventId) ??
        NG_PLUS_ENCOUNTERS.find((e) => e.id === eventId)
      if (!rawDef) return
      const lastEnding = detectEndingKey(state.flags)
      const def = flavorEventForNgPlus(rawDef, state.ngPlusCount, lastEnding)
      const resolvedChoice =
        def.choices.find((c) => c.id === choice.id) ?? choice

      const { state: rewarded, messages } = applyRewards(
        state,
        resolvedChoice.rewards,
      )
      // 五年結局寫入 lastEnding，供下周目序章／奇遇差分
      let flagged = rewarded
      if (eventId === 'main_y5_wharf') {
        const endingNow = detectEndingKey(rewarded.flags)
        if (endingNow) {
          flagged = {
            ...rewarded,
            flags: { ...rewarded.flags, lastEnding: endingNow },
          }
        }
      }
      const storyFlags = { ...flagged.storyFlags, [eventId]: true }
      const mainDone = allMainBeatsDone(storyFlags)

      // 階段 A：取消了結即傳奇加速；主線節拍改冷卻（見 storyProgress）
      const baseNext: GameState = {
        ...flagged,
        pendingEventId: null,
        storyFlags,
        lastOutcomeText: resolvedChoice.outcomeText,
        tradeRouteLevel:
          flagged.tradeRouteLevel + (resolvedChoice.tradeBump ?? 0),
        ngPlusReady: flagged.ngPlusReady || mainDone,
      }
      let next: GameState = eventId.startsWith('main_')
        ? applyMainBeatResolved(baseNext, eventId)
        : ensureStoryRoute(baseNext)

      if (resolvedChoice.startCombat) {
        persist(next)
        showToast(messages.join(' · ') || '事件了結，戰局開打')
        setCombatKind('bandit')
        const encounter = makeBanditEncounter(
          buildPlayerCombatant(next),
          buildPartyCombatants(next),
          {
            loseStreak: next.combatLoseStreak,
            year: next.time.year,
          },
        )
        setCombat(encounter)
        playSound('combat')
        return
      }

      persist(next)
      playSound('success')
      showToast(
        mainDone && eventId.startsWith('main_y5')
          ? `${messages.join(' · ') || '事件了結'}｜主線節拍齊備，可至系統結算 NG+`
          : `${messages.join(' · ') || '事件了結'}｜下一段需再歷數旬`,
      )
      setStatusMsg(
        mainDone
          ? '主要故事節拍已齊。可繼續遊歷或至系統結算多周目。'
          : '節拍了結。推進數旬後，下一段故事可能降臨。',
      )
    },
    [ensureAudio, persist, showToast, state],
  )

  const claimDailyLogin = useCallback(async () => {
    await ensureAudio()
    if (!state.prologueDone) {
      showToast('序章未了')
      return
    }
    const today = calendarDateKey()
    if (state.daily.lastClaimDate === today) {
      playSound('fail')
      showToast('今日已領過日登')
      return
    }
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yKey = calendarDateKey(yesterday)
    const streak =
      state.daily.lastClaimDate === yKey ? state.daily.streak + 1 : 1
    const bonusSilver = Math.min(15, Math.max(0, streak - 1) * 3)
    const next: GameState = {
      ...ensureStoryRoute(state),
      daily: { lastClaimDate: today, streak },
      currency: {
        ...state.currency,
        silver: state.currency.silver + DAILY_LOGIN_SILVER + bonusSilver,
      },
      potential: state.potential + DAILY_LOGIN_POTENTIAL,
      actionPoints: Math.min(
        state.maxActionPoints,
        state.actionPoints + DAILY_LOGIN_AP,
      ),
    }
    persist(next)
    playSound('success')
    showToast(
      `日登領取：銀兩 +${DAILY_LOGIN_SILVER + bonusSilver}、潛能 +${DAILY_LOGIN_POTENTIAL}、AP +${DAILY_LOGIN_AP}（連登 ${streak} 日）`,
    )
  }, [ensureAudio, persist, showToast, state])

  const claimWeeklyGoal = useCallback(
    async (goalId: string) => {
      await ensureAudio()
      const synced = ensureWeeklyGoals(ensureStoryRoute(state))
      const goal = synced.weekly.goals.find((g) => g.id === goalId)
      if (!goal) {
        playSound('fail')
        showToast('找不到該週目標')
        return
      }
      if (goal.claimed) {
        playSound('fail')
        showToast('已領過')
        return
      }
      if (goal.progress < goal.target) {
        playSound('fail')
        showToast('尚未達成')
        return
      }
      const next: GameState = {
        ...synced,
        weekly: {
          ...synced.weekly,
          goals: synced.weekly.goals.map((g) =>
            g.id === goalId ? { ...g, claimed: true } : g,
          ),
        },
        currency: {
          ...synced.currency,
          silver: synced.currency.silver + 40,
        },
        potential: synced.potential + 4,
        inspiration: synced.inspiration + 2,
      }
      persist(next)
      playSound('success')
      showToast('週目標領取：銀兩 +40、潛能 +4、靈感 +2')
    },
    [ensureAudio, persist, showToast, state],
  )

  const linkedLocations = getLinkedLocations(state.locationId)

  const pendingEventBase = state.pendingEventId
    ? (MAIN_STORY_EVENTS.find((e) => e.id === state.pendingEventId) ??
      ENCOUNTER_EVENTS.find((e) => e.id === state.pendingEventId) ??
      NG_PLUS_ENCOUNTERS.find((e) => e.id === state.pendingEventId) ??
      null)
    : null
  const pendingEvent = pendingEventBase
    ? flavorEventForNgPlus(
        pendingEventBase,
        state.ngPlusCount,
        detectEndingKey(state.flags),
      )
    : null

  const prologueEvent = flavorPrologueForNgPlus(
    getPrologueEvent(),
    state.ngPlusCount,
    detectEndingKey(state.flags),
  )

  return {
    state,
    tab,
    questOpen,
    toast,
    statusMsg,
    linkedLocations,
    combat,
    pendingEvent,
    prologueEvent,
    lastGacha,
    canNgPlus: canSettleNgPlus(state),
    setQuestOpen,
    changeTab,
    selectOrigin,
    choosePrologue,
    travelTo,
    unlockTech,
    equipItem,
    unequipSlot,
    refineEquipment,
    quenchEquipment,
    poisonEquipment,
    setMartialSlot,
    trainMartial,
    gatherAtLocation,
    craftAlchemy,
    useConsumable,
    mockTopUp,
    buySilverOffer,
    buyYuanbaoOffer,
    claimMonthly,
    pullGacha,
    startSpar,
    settleNgPlus,
    manualSave,
    manualLoad,
    newGame,
    renamePlayer,
    ensureAudio,
    showToast,
    startBanditFight,
    combatAct,
    closeCombat,
    giftNpc,
    recruitNpc,
    dismissNpc,
    makePartner,
    joinSect,
    contributeSect,
    advanceXun,
    resolvePendingChoice,
    claimDailyLogin,
    claimWeeklyGoal,
  }
}
