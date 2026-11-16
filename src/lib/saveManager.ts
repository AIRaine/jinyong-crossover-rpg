import {
  SAVE_VERSION,
  type GameState,
  type SaveSlotId,
  type SaveSlotMeta,
} from '../types/game'
import { createInitialGameState } from '../data/initialState'
import {
  LEGACY_ORIGIN_JOB_TITLE,
  resolveOriginCategoryId,
} from '../data/origins'
import { NPCS } from '../data/npcs'
import { grantStarterGear } from './starterGear'

const STORAGE_PREFIX = 'jinyong-crossover-rpg:save:v'
const META_KEY = 'jinyong-crossover-rpg:save-meta'

function slotKey(slot: SaveSlotId): string {
  return `${STORAGE_PREFIX}${slot}`
}

function nowIso(): string {
  return new Date().toISOString()
}

function summarize(state: GameState): string {
  const originHint = state.originChosen ? '已選職業' : '未選職業'
  const eventHint = state.prologueDone ? '序章已畢' : '序章進行中'
  return `${state.locationName}｜${originHint}｜${eventHint}｜AP ${state.actionPoints}｜潛能 ${state.potential}`
}

function readMetaMap(): Partial<Record<SaveSlotId, SaveSlotMeta>> {
  try {
    const raw = localStorage.getItem(META_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Partial<Record<SaveSlotId, SaveSlotMeta>>
  } catch {
    return {}
  }
}

function writeMetaMap(map: Partial<Record<SaveSlotId, SaveSlotMeta>>): void {
  localStorage.setItem(META_KEY, JSON.stringify(map))
}

function defaultAffinity(): Record<string, number> {
  const affinity: Record<string, number> = {}
  for (const npc of NPCS) {
    affinity[npc.id] = npc.startingAffinity
  }
  return affinity
}

export function migrateSaveData(raw: unknown): GameState {
  const base = createInitialGameState()

  if (!raw || typeof raw !== 'object') {
    return base
  }

  const data = raw as Partial<GameState> & { version?: number }
  const version = typeof data.version === 'number' ? data.version : 0

  let migrated: GameState = {
    ...base,
    ...data,
    version: SAVE_VERSION,
    time: { ...base.time, ...(data.time ?? {}) },
    stats: { ...base.stats, ...(data.stats ?? {}) },
    currency: { ...base.currency, ...(data.currency ?? {}) },
    flags: { ...base.flags, ...(data.flags ?? {}) },
    inventory: Array.isArray(data.inventory) ? data.inventory : base.inventory,
    quests: Array.isArray(data.quests) ? data.quests : base.quests,
    affinity: { ...defaultAffinity(), ...(data.affinity ?? {}) },
    techTree: { ...base.techTree, ...(data.techTree ?? {}) },
    completedEvents: Array.isArray(data.completedEvents)
      ? data.completedEvents
      : base.completedEvents,
    lastCombatResult:
      data.lastCombatResult === undefined
        ? base.lastCombatResult
        : data.lastCombatResult,
    lastOutcomeText:
      data.lastOutcomeText === undefined
        ? base.lastOutcomeText
        : data.lastOutcomeText,
    originChosen: Boolean(data.originChosen),
    originId: data.originId ?? null,
    originJobTitle:
      typeof data.originJobTitle === 'string' ? data.originJobTitle : '',
    playerGender:
      data.playerGender === 'male' ||
      data.playerGender === 'female' ||
      data.playerGender === 'unspecified'
        ? data.playerGender
        : base.playerGender,
    inspiration:
      typeof data.inspiration === 'number' ? data.inspiration : base.inspiration,
    knownLocationIds: Array.isArray(data.knownLocationIds)
      ? data.knownLocationIds
      : base.knownLocationIds,
    ownedEquipment: Array.isArray(data.ownedEquipment)
      ? data.ownedEquipment
      : base.ownedEquipment,
    equipped: { ...base.equipped, ...(data.equipped ?? {}) },
    martialProgress: { ...base.martialProgress, ...(data.martialProgress ?? {}) },
    martialLoadout: {
      ...base.martialLoadout,
      ...(data.martialLoadout ?? {}),
      activeIds: (data.martialLoadout?.activeIds ??
        base.martialLoadout.activeIds) as GameState['martialLoadout']['activeIds'],
    },
    actionPoints:
      typeof data.actionPoints === 'number'
        ? data.actionPoints
        : base.actionPoints,
    maxActionPoints:
      typeof data.maxActionPoints === 'number'
        ? data.maxActionPoints
        : base.maxActionPoints,
    potential:
      typeof data.potential === 'number' ? data.potential : base.potential,
    comprehension:
      typeof data.comprehension === 'number'
        ? data.comprehension
        : base.comprehension,
    rootBone:
      typeof data.rootBone === 'number' ? data.rootBone : base.rootBone,
    equipUidSeq:
      typeof data.equipUidSeq === 'number' ? data.equipUidSeq : base.equipUidSeq,
    partyIds: Array.isArray(data.partyIds) ? data.partyIds : base.partyIds,
    partnerId: data.partnerId ?? null,
    sectId: data.sectId ?? null,
    sectContribution:
      typeof data.sectContribution === 'number'
        ? data.sectContribution
        : base.sectContribution,
    storyFlags: { ...base.storyFlags, ...(data.storyFlags ?? {}) },
    pendingEventId: data.pendingEventId ?? null,
    rumors: Array.isArray(data.rumors) ? data.rumors : base.rumors,
    tradeRouteLevel:
      typeof data.tradeRouteLevel === 'number'
        ? data.tradeRouteLevel
        : base.tradeRouteLevel,
    combatLoseStreak:
      typeof data.combatLoseStreak === 'number'
        ? data.combatLoseStreak
        : base.combatLoseStreak,
    banditFightsThisXun:
      typeof data.banditFightsThisXun === 'number'
        ? data.banditFightsThisXun
        : base.banditFightsThisXun,
    lifetimeBanditWins:
      typeof data.lifetimeBanditWins === 'number'
        ? data.lifetimeBanditWins
        : base.lifetimeBanditWins,
    sparFightsThisXun:
      typeof data.sparFightsThisXun === 'number'
        ? data.sparFightsThisXun
        : base.sparFightsThisXun,
    travelPassCharges:
      typeof data.travelPassCharges === 'number'
        ? data.travelPassCharges
        : base.travelPassCharges,
    paidAtkBonus:
      typeof data.paidAtkBonus === 'number'
        ? data.paidAtkBonus
        : base.paidAtkBonus,
    paidDefBonus:
      typeof data.paidDefBonus === 'number'
        ? data.paidDefBonus
        : base.paidDefBonus,
    updatedAt: nowIso(),
  }

  if (typeof migrated.time.xun !== 'number') {
    migrated.time = { ...migrated.time, xun: 0 }
  }

  if (version < 2) {
    const legacyLoc = migrated.locationId
    if (
      legacyLoc === 'broken_temple_rain' ||
      legacyLoc === 'temple_aftermath'
    ) {
      migrated.locationId = 'loc_broken_temple'
      migrated.locationName = '雨夜破廟'
    }
    if (!migrated.knownLocationIds.includes('loc_broken_temple')) {
      migrated.knownLocationIds = [
        ...migrated.knownLocationIds,
        'loc_broken_temple',
      ]
    }
    if (migrated.prologueDone && !migrated.originChosen) {
      migrated.originChosen = false
      migrated.originId = null
    }
    const oldTree = migrated.techTree
    const nextTree = { ...oldTree }
    if (oldTree.first_aid && !nextTree.tech_med_1) {
      nextTree.tech_med_1 = 1
    }
    if (oldTree.modern_insight && !nextTree.tech_gadget_1) {
      nextTree.tech_gadget_1 = Math.min(1, Number(oldTree.modern_insight) || 0)
    }
    migrated.techTree = nextTree
    if (migrated.inspiration <= 0 && migrated.prologueDone) {
      migrated.inspiration = 5
    }
  }

  // v2 → v3：補裝備／武學／AP／潛能
  if (version < 3) {
    if (!Array.isArray(migrated.ownedEquipment)) migrated.ownedEquipment = []
    if (!migrated.equipped) migrated.equipped = {}
    if (!migrated.martialProgress) migrated.martialProgress = {}
    if (!migrated.martialLoadout) {
      migrated.martialLoadout = {
        internalId: null,
        heartId: null,
        qinggongId: null,
        activeIds: [null, null, null, null],
      }
    }
    if (typeof migrated.actionPoints !== 'number') {
      migrated.actionPoints = 8
      migrated.maxActionPoints = 8
    }
    if (typeof migrated.potential !== 'number') {
      migrated.potential = migrated.prologueDone ? 12 : 0
    }
    if (typeof migrated.comprehension !== 'number') migrated.comprehension = 40
    if (typeof migrated.rootBone !== 'number') migrated.rootBone = 40
    if (typeof migrated.equipUidSeq !== 'number') migrated.equipUidSeq = 1
    if (
      migrated.prologueDone &&
      (!migrated.ownedEquipment || migrated.ownedEquipment.length === 0)
    ) {
      migrated = grantStarterGear(migrated)
    }
  }

  if (version < 4) {
    if (!Array.isArray(migrated.partyIds)) migrated.partyIds = []
    if (migrated.partnerId === undefined) migrated.partnerId = null
    if (migrated.sectId === undefined) migrated.sectId = null
    if (typeof migrated.sectContribution !== 'number') {
      migrated.sectContribution = 0
    }
    if (!migrated.storyFlags) migrated.storyFlags = {}
    if (migrated.pendingEventId === undefined) migrated.pendingEventId = null
    if (!Array.isArray(migrated.rumors) || migrated.rumors.length === 0) {
      migrated.rumors = base.rumors
    }
    if (typeof migrated.tradeRouteLevel !== 'number') {
      migrated.tradeRouteLevel = 0
    }
    if (typeof migrated.time.xun !== 'number') {
      migrated.time = { ...migrated.time, xun: 0 }
    }
  }

  // v4 → v5：榜單／抽卡／月卡／NG+
  if (version < 5) {
    if (typeof migrated.ngPlusCount !== 'number') migrated.ngPlusCount = 0
    if (typeof migrated.gachaPityEpic !== 'number') migrated.gachaPityEpic = 0
    if (typeof migrated.gachaPityLegendary !== 'number') {
      migrated.gachaPityLegendary = 0
    }
    if (typeof migrated.gachaTotalPulls !== 'number') {
      migrated.gachaTotalPulls = 0
    }
    if (typeof migrated.monthlyCardCharges !== 'number') {
      migrated.monthlyCardCharges = 0
    }
    if (typeof migrated.monthlyClaimedXunKey !== 'string') {
      migrated.monthlyClaimedXunKey = ''
    }
    if (typeof migrated.sparWins !== 'number') migrated.sparWins = 0
    if (!Array.isArray(migrated.cosmetics)) migrated.cosmetics = []
    if (typeof migrated.ngPlusReady !== 'boolean') migrated.ngPlusReady = false
  }

  // v5 → v6：細職 → 大類＋自填職稱
  if (version < 6 || migrated.originId?.startsWith('origin_')) {
    const rawId = migrated.originId
    if (rawId && rawId.startsWith('origin_')) {
      if (!migrated.originJobTitle) {
        migrated.originJobTitle = LEGACY_ORIGIN_JOB_TITLE[rawId] ?? ''
      }
      const mapped = resolveOriginCategoryId(rawId)
      if (mapped) migrated.originId = mapped
    }
    if (typeof migrated.originJobTitle !== 'string') {
      migrated.originJobTitle = ''
    }
    if (
      migrated.originChosen &&
      migrated.originJobTitle &&
      !migrated.flags.originName
    ) {
      migrated.flags = {
        ...migrated.flags,
        originName: migrated.originJobTitle,
      }
    }
  }

  // v6 → v7：連敗保護／課金便利加值欄位
  if (version < 7) {
    if (typeof migrated.combatLoseStreak !== 'number') {
      migrated.combatLoseStreak = 0
    }
    if (typeof migrated.travelPassCharges !== 'number') {
      migrated.travelPassCharges = 0
    }
    if (typeof migrated.paidAtkBonus !== 'number') migrated.paidAtkBonus = 0
    if (typeof migrated.paidDefBonus !== 'number') migrated.paidDefBonus = 0
  }

  // v7 → v8：路遇同旬次數（防無成本刷）
  if (version < 8) {
    if (typeof migrated.banditFightsThisXun !== 'number') {
      migrated.banditFightsThisXun = 0
    }
  }

  // v8 → v9：切磋同旬次數（防無成本刷）
  if (version < 9) {
    if (typeof migrated.sparFightsThisXun !== 'number') {
      migrated.sparFightsThisXun = 0
    }
  }

  // v11 → v12：路遇累計勝場（旅程品質）
  if (version < 12) {
    if (typeof migrated.lifetimeBanditWins !== 'number') {
      migrated.lifetimeBanditWins = 0
    }
  }

  // v10 → v11：門派退叛／互斥履歷
  if (version < 11) {
    if (typeof migrated.lifetimeXuns !== 'number') {
      const y = Math.max(1, migrated.time?.year ?? 1)
      const m = Math.max(1, migrated.time?.month ?? 1)
      const x = Math.max(0, migrated.time?.xun ?? 0)
      migrated.lifetimeXuns = (y - 1) * 36 + (m - 1) * 3 + x
    }
    if (!Array.isArray(migrated.sectBanIds)) migrated.sectBanIds = []
    if (!Array.isArray(migrated.sectBannedAlliances)) {
      migrated.sectBannedAlliances = []
    }
    if (typeof migrated.sectJoinCooldownUntilXun !== 'number') {
      migrated.sectJoinCooldownUntilXun = 0
    }
    if (!Array.isArray(migrated.sectHistory)) migrated.sectHistory = []
  }

  // v9 → v10：故事弧／日登／週目標（數週節奏骨架）
  if (version < 10) {
    if (typeof migrated.routeSeed !== 'number' || migrated.routeSeed < 1) {
      migrated.routeSeed =
        (Date.now() % 900000) +
        (migrated.ngPlusCount ?? 0) * 97 +
        11
    }
    if (!Array.isArray(migrated.unlockedArcIds)) migrated.unlockedArcIds = []
    if (!Array.isArray(migrated.completedBeatIds)) {
      migrated.completedBeatIds = []
    }
    if (typeof migrated.xunsSinceLastBeat !== 'number') {
      migrated.xunsSinceLastBeat = 4
    }
    if (!migrated.daily || typeof migrated.daily !== 'object') {
      migrated.daily = { lastClaimDate: '', streak: 0 }
    } else {
      migrated.daily = {
        lastClaimDate:
          typeof migrated.daily.lastClaimDate === 'string'
            ? migrated.daily.lastClaimDate
            : '',
        streak:
          typeof migrated.daily.streak === 'number' ? migrated.daily.streak : 0,
      }
    }
    if (!migrated.weekly || typeof migrated.weekly !== 'object') {
      migrated.weekly = { weekKey: '', goals: [] }
    } else if (!Array.isArray(migrated.weekly.goals)) {
      migrated.weekly = {
        weekKey:
          typeof migrated.weekly.weekKey === 'string'
            ? migrated.weekly.weekKey
            : '',
        goals: [],
      }
    }
  }

  migrated.version = SAVE_VERSION
  return migrated
}

export function saveToSlot(slot: SaveSlotId, state: GameState): SaveSlotMeta {
  const stamped: GameState = {
    ...state,
    version: SAVE_VERSION,
    updatedAt: nowIso(),
  }
  localStorage.setItem(slotKey(slot), JSON.stringify(stamped))

  const meta: SaveSlotMeta = {
    slot,
    updatedAt: stamped.updatedAt,
    playerName: stamped.playerName,
    summary: summarize(stamped),
    empty: false,
  }
  const map = readMetaMap()
  map[slot] = meta
  writeMetaMap(map)
  return meta
}

export function loadFromSlot(slot: SaveSlotId): GameState | null {
  const raw = localStorage.getItem(slotKey(slot))
  if (!raw) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    return migrateSaveData(parsed)
  } catch {
    return null
  }
}

export function deleteSlot(slot: SaveSlotId): void {
  localStorage.removeItem(slotKey(slot))
  const map = readMetaMap()
  delete map[slot]
  writeMetaMap(map)
}

export function getSlotMeta(slot: SaveSlotId): SaveSlotMeta {
  const map = readMetaMap()
  const existing = map[slot]
  if (existing && !existing.empty) return existing

  const loaded = loadFromSlot(slot)
  if (!loaded) {
    return {
      slot,
      updatedAt: '',
      playerName: '',
      summary: '空存檔',
      empty: true,
    }
  }
  const meta: SaveSlotMeta = {
    slot,
    updatedAt: loaded.updatedAt,
    playerName: loaded.playerName,
    summary: summarize(loaded),
    empty: false,
  }
  map[slot] = meta
  writeMetaMap(map)
  return meta
}

export function listAllSlotMeta(): SaveSlotMeta[] {
  return ([0, 1, 2, 3] as SaveSlotId[]).map(getSlotMeta)
}

export function autoSave(state: GameState): SaveSlotMeta {
  return saveToSlot(0, state)
}

export function loadOrCreateGame(): GameState {
  const auto = loadFromSlot(0)
  if (auto) return auto
  const fresh = createInitialGameState()
  autoSave(fresh)
  return fresh
}

export const MANUAL_SLOTS: SaveSlotId[] = [1, 2, 3]
export const AUTO_SLOT: SaveSlotId = 0
