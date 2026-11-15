/** 存檔結構版本；變更欄位時遞增並在 migrateSaveData 處理 */
export const SAVE_VERSION = 6 as const

/** 底部分頁 */
export type TabId =
  | 'travel'
  | 'character'
  | 'heroes'
  | 'sect'
  | 'tech'
  | 'rank'
  | 'shop'
  | 'system'

/** 一日時段 */
export type DayPeriod = 'dawn' | 'noon' | 'dusk' | 'night'

export const DAY_PERIOD_LABEL: Record<DayPeriod, string> = {
  dawn: '黎明',
  noon: '正午',
  dusk: '黃昏',
  night: '深夜',
}

/** 遊戲內曆法時間 */
export interface GameTime {
  year: number
  month: number
  day: number
  period: DayPeriod
  /** 旬：0 上旬、1 中旬、2 下旬 */
  xun: number
}

/** 雙貨幣：銀兩（玩法）＋元寶（課金／模擬儲值） */
export interface Currency {
  silver: number
  yuanbao: number
}

/** 主角基礎數值 */
export interface PlayerStats {
  hp: number
  maxHp: number
  stamina: number
  maxStamina: number
  attack: number
  defense: number
  internalForce: number
  maxInternalForce: number
  level: number
  exp: number
}

/** 開局可選性別（敘事用，不鎖數值） */
export type PlayerGender = 'male' | 'female' | 'unspecified'

export const PLAYER_GENDER_LABEL: Record<PlayerGender, string> = {
  male: '男',
  female: '女',
  unspecified: '不便透露／皆可',
}

/** 現代穿越職業大類（天賦原型；具體職稱可自填） */
export interface OriginDef {
  id: string
  name: string
  summary: string
  flavor: string
  /** 穿越前職場小傳 */
  bio: string
  /** 死因或穿越契機 */
  crossoverHook: string
  /** 性格標籤（短詞） */
  tags: string[]
  /** 選定後開場獨白 */
  monologue: string
  /** 被動／職業優勢說明 */
  passiveText: string
  /** 初始道具說明 */
  startingItemBlurb: string
  /** 起始科技說明 */
  startingTechBlurb: string
  /** 過渡敘事頁（加班猝死／異變 → 墜入雨夜） */
  transitPages: string[]
  /** 自填空白時的預設職稱 */
  defaultJobTitle: string
  comprehensionBonus?: number
  rootBoneBonus?: number
  bonuses: Partial<
    Pick<
      PlayerStats,
      'maxHp' | 'maxStamina' | 'attack' | 'defense' | 'maxInternalForce'
    >
  > & { inspiration?: number; silver?: number }
  startingTechIds: string[]
  startingItemIds: string[]
}

/** 科技樹分支 */
export type TechBranch = 'medical' | 'gadget' | 'physique'

export const TECH_BRANCH_LABEL: Record<TechBranch, string> = {
  medical: '現代醫理',
  gadget: '機關奇巧',
  physique: '身法體能',
}

/** 科技樹節點 */
export interface TechNodeDef {
  id: string
  name: string
  branch: TechBranch
  tier: number
  description: string
  inspirationCost: number
  requires: string[]
  effectText: string
}

/** 地點類型 */
export type LocationKind = 'city' | 'sect' | 'secret' | 'road'

/** 採集類型 */
export type GatherType = 'herb' | 'ore' | 'both' | 'none'

/** 地圖節點 */
export interface LocationDef {
  id: string
  name: string
  kind: LocationKind
  region: string
  description: string
  links: string[]
  travelStamina: number
  npcIds: string[]
  /** 可採集資源 */
  gather: GatherType
}

/** 戰鬥定位 */
export type CombatRole = 'tank' | 'dps' | 'support'

export const COMBAT_ROLE_LABEL: Record<CombatRole, string> = {
  tank: '禦守',
  dps: '破敵',
  support: '輔佐',
}

/** NPC 定義 */
export interface NpcDef {
  id: string
  name: string
  title: string
  role: CombatRole
  homeLocationId: string
  bio: string
  romanceable: boolean
  favoriteGifts: string[]
  startingAffinity: number
}

/** 裝備欄位 */
export type EquipSlot =
  | 'weapon'
  | 'head'
  | 'body'
  | 'hands'
  | 'feet'
  | 'accessory'

/** 裝備品質 */
export type EquipQuality =
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'epic'
  | 'legendary'

/** 裝備定義 */
export interface EquipmentDef {
  id: string
  name: string
  slot: EquipSlot
  quality: EquipQuality
  description: string
  attack: number
  defense: number
  maxHp?: number
  maxInternalForce?: number
  maxStamina?: number
  baseRefineCost: number
}

/** 持有裝備實例 */
export interface OwnedEquipment {
  uid: string
  defId: string
  /** 0～15 */
  refineLevel: number
  quenched: boolean
  poisoned: boolean
}

/** 武學類型 */
export type MartialKind = 'internal' | 'heart' | 'qinggong' | 'active'

/** 武學定義 */
export interface MartialArtDef {
  id: string
  name: string
  kind: MartialKind
  description: string
  attackPerLevel?: number
  defensePerLevel?: number
  maxInternalPerLevel?: number
  maxHpPerLevel?: number
  maxStaminaPerLevel?: number
}

/** 武學配置 */
export interface MartialLoadout {
  internalId: string | null
  heartId: string | null
  qinggongId: string | null
  /** 最多 4 個主動 */
  activeIds: [string | null, string | null, string | null, string | null]
}

/** 武學等級（1～10） */
export type MartialProgress = Record<string, number>

/** 裝備欄：slot → owned uid */
export type EquippedMap = Partial<Record<EquipSlot, string>>

/** 背包物品 */
export interface InventoryItem {
  id: string
  name: string
  description: string
  quantity: number
  kind: 'consumable' | 'material' | 'quest' | 'misc' | 'manual' | 'gift'
}

/** 任務目標 */
export interface QuestObjective {
  id: string
  text: string
  done: boolean
}

/** 任務 */
export interface Quest {
  id: string
  title: string
  description: string
  status: 'active' | 'completed' | 'failed'
  objectives: QuestObjective[]
  source?: string
}

export type AffinityMap = Record<string, number>
export type TechTreeProgress = Record<string, number>
export type GameFlags = Record<string, boolean | number | string>

export interface CombatPlaceholderResult {
  victory: boolean
  summary: string
  rewardsNote?: string
}

export interface EventRewards {
  silver?: number
  yuanbao?: number
  hpDelta?: number
  staminaDelta?: number
  exp?: number
  inspiration?: number
  potential?: number
  affinity?: AffinityMap
  items?: InventoryItem[]
  flags?: GameFlags
  questsToAdd?: Quest[]
  questsToComplete?: string[]
  combatPlaceholder?: CombatPlaceholderResult
}

export interface StoryChoice {
  id: string
  label: string
  hint?: string
  rewards: EventRewards
  outcomeText: string
}

export interface StoryEvent {
  id: string
  title: string
  locationName: string
  paragraphs: string[]
  choices: StoryChoice[]
}

/** 階段四：主線／奇遇事件定義 */
export interface StoryEventChoiceDef {
  id: string
  label: string
  hint?: string
  outcomeText: string
  rewards: EventRewards
  startCombat?: boolean
  tradeBump?: number
}

export interface StoryEventDef {
  id: string
  year: number
  title: string
  summary: string
  locationId: string | null
  paragraphs: string[]
  choices: StoryEventChoiceDef[]
}

/** 門派 */
export interface SectDef {
  id: string
  name: string
  motto: string
  homeLocationId: string
  description: string
  entry: {
    minLevel: number
    minSilver: number
    minComprehension?: number
    description: string
  }
  /** 貢獻門檻：外門／內門／執事前／長老 */
  rankThresholds: number[]
}

export interface ShopOffer {
  id: string
  name: string
  description: string
  priceYuanbao: number
  priceSilver?: number
  kind: 'item' | 'boost' | 'cosmetic' | 'monthly'
  available: boolean
}

export interface MockTopUpPack {
  id: string
  label: string
  yuanbao: number
  displayPriceTwd: number
}

export type SaveSlotId = 0 | 1 | 2 | 3

export interface SaveSlotMeta {
  slot: SaveSlotId
  updatedAt: string
  playerName: string
  summary: string
  empty: boolean
}

/** 完整可序列化遊戲狀態 */
export interface GameState {
  version: number
  playerName: string
  createdAt: string
  updatedAt: string
  time: GameTime
  stats: PlayerStats
  currency: Currency
  locationId: string
  locationName: string
  flags: GameFlags
  inventory: InventoryItem[]
  quests: Quest[]
  affinity: AffinityMap
  techTree: TechTreeProgress
  completedEvents: string[]
  activeEventId: string | null
  prologueDone: boolean
  lastCombatResult: CombatPlaceholderResult | null
  lastOutcomeText: string | null
  originChosen: boolean
  /** 大類 id（舊細職會在 migrate 映射） */
  originId: string | null
  /** 玩家自填具體工作／身分；空白則顯示大類預設名 */
  originJobTitle: string
  /** 開局性別（敘事／稱呼用） */
  playerGender: PlayerGender
  inspiration: number
  knownLocationIds: string[]
  /** 階段三：裝備 */
  ownedEquipment: OwnedEquipment[]
  equipped: EquippedMap
  /** 階段三：武學 */
  martialProgress: MartialProgress
  martialLoadout: MartialLoadout
  /** 行動點（採集等） */
  actionPoints: number
  maxActionPoints: number
  /** 潛能點（武學修練） */
  potential: number
  /** 悟性／根骨（瓶頸判定） */
  comprehension: number
  rootBone: number
  /** 裝備實例遞增序號 */
  equipUidSeq: number
  /** 階段四：隊伍（最多 2 名 NPC） */
  partyIds: string[]
  /** 俠侶 */
  partnerId: string | null
  /** 門派 */
  sectId: string | null
  sectContribution: number
  /** 已觸發主線／奇遇 */
  storyFlags: Record<string, boolean>
  /** 當前可選事件 id */
  pendingEventId: string | null
  /** 傳聞三條 */
  rumors: string[]
  /** 商道等級（被動銀兩） */
  tradeRouteLevel: number
  /** 階段五：多周目次數 */
  ngPlusCount: number
  /** 抽卡保底計數（距上次絕品／神兵） */
  gachaPityEpic: number
  gachaPityLegendary: number
  /** 累計抽卡次數 */
  gachaTotalPulls: number
  /** 月卡：剩餘可領次數（體驗用，非真實金流） */
  monthlyCardCharges: number
  /** 本旬是否已領月卡 */
  monthlyClaimedXunKey: string
  /** 切磋勝場 */
  sparWins: number
  /** 已解鎖外觀 id */
  cosmetics: string[]
  /** 本周目是否已可結算 NG+（主線五年完成） */
  ngPlusReady: boolean
}

export interface ApplyRewardsResult {
  state: GameState
  messages: string[]
}

/** 淬火科技節點 */
export const TECH_ID_QUENCH = 'tech_gadget_3'
/** 塗毒科技節點 */
export const TECH_ID_POISON = 'tech_med_2'
