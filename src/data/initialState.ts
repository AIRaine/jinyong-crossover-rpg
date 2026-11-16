import { NPCS } from './npcs'
import { buildWeeklyGoals, calendarWeekKey, STORY_BEAT_COOLDOWN_XUN } from './storyArcs'
import { SAVE_VERSION, type GameState } from '../types/game'

export function createInitialGameState(): GameState {
  const now = new Date().toISOString()
  const affinity: Record<string, number> = {}
  for (const npc of NPCS) {
    affinity[npc.id] = npc.startingAffinity
  }

  return {
    version: SAVE_VERSION,
    playerName: '無名穿越客',
    createdAt: now,
    updatedAt: now,
    time: {
      year: 1,
      month: 3,
      day: 7,
      period: 'night',
      xun: 0,
    },
    stats: {
      hp: 100,
      maxHp: 100,
      stamina: 80,
      maxStamina: 100,
      attack: 12,
      defense: 8,
      internalForce: 20,
      maxInternalForce: 50,
      level: 1,
      exp: 0,
    },
    currency: {
      silver: 50,
      yuanbao: 0,
    },
    locationId: 'loc_broken_temple',
    locationName: '雨夜破廟',
    flags: {
      hasModernPhone: true,
      hasFlashlight: true,
      knowsFirstAid: true,
    },
    inventory: [
      {
        id: 'item_phone',
        name: '沒訊號的手機',
        description: '螢幕裂了一角，卻還能當手電筒。江湖人看了直呼妖物。',
        quantity: 1,
        kind: 'quest',
      },
      {
        id: 'item_energy_bar',
        name: '能量棒三條',
        description: '包裝刺眼，味道像甜膩的木屑，卻能果腹。',
        quantity: 3,
        kind: 'consumable',
      },
      {
        id: 'item_thermos',
        name: '保溫瓶半壺熱水',
        description: '金屬瓶身尚有餘溫，雨夜裡比刀還珍貴。',
        quantity: 1,
        kind: 'misc',
      },
    ],
    quests: [
      {
        id: 'quest_prologue',
        title: '雨夜破廟',
        description:
          '你醒來便落在這座漏雨破廟。先選定自己的現代本事，再活過今夜。',
        status: 'active',
        source: 'event_prologue_rain_temple',
        objectives: [
          {
            id: 'obj_pick_origin',
            text: '選定穿越前的現代職業',
            done: false,
          },
          {
            id: 'obj_survive_night',
            text: '在破廟度過危局，作出抉擇',
            done: false,
          },
          {
            id: 'obj_meet_huangrong',
            text: '與負傷的鵝黃色衣衫少女對上話',
            done: false,
          },
        ],
      },
    ],
    affinity,
    techTree: {},
    completedEvents: [],
    activeEventId: null,
    prologueDone: false,
    lastCombatResult: null,
    lastOutcomeText: null,
    originChosen: false,
    originId: null,
    originJobTitle: '',
    playerGender: 'unspecified',
    inspiration: 0,
    knownLocationIds: ['loc_broken_temple'],
    ownedEquipment: [],
    equipped: {},
    martialProgress: {},
    martialLoadout: {
      internalId: null,
      heartId: null,
      qinggongId: null,
      activeIds: [null, null, null, null],
    },
    actionPoints: 8,
    maxActionPoints: 8,
    potential: 0,
    comprehension: 40,
    rootBone: 40,
    equipUidSeq: 1,
    partyIds: [],
    partnerId: null,
    sectId: null,
    sectContribution: 0,
    lifetimeXuns: 0,
    sectBanIds: [],
    sectBannedAlliances: [],
    sectJoinCooldownUntilXun: 0,
    sectHistory: [],
    storyFlags: {},
    pendingEventId: null,
    rumors: [
      '襄揚城東夜有妖光——有人說是雷火，有人說是穿越客的手電筒。',
      '桃華島琴聲三日不停，漁民說花都跟著顫。',
      '天機閣分閣開始賣「結局預測」——收費且不退。',
    ],
    tradeRouteLevel: 0,
    ngPlusCount: 0,
    gachaPityEpic: 0,
    gachaPityLegendary: 0,
    gachaTotalPulls: 0,
    monthlyCardCharges: 0,
    monthlyClaimedXunKey: '',
    sparWins: 0,
    cosmetics: [],
    ngPlusReady: false,
    combatLoseStreak: 0,
    banditFightsThisXun: 0,
    sparFightsThisXun: 0,
    travelPassCharges: 0,
    paidAtkBonus: 0,
    paidDefBonus: 0,
    routeSeed: 0,
    unlockedArcIds: [],
    completedBeatIds: [],
    /** 開局即可掛第一個節拍；了結後歸零再冷卻 */
    xunsSinceLastBeat: STORY_BEAT_COOLDOWN_XUN,
    daily: {
      lastClaimDate: '',
      streak: 0,
    },
    weekly: {
      weekKey: calendarWeekKey(),
      goals: buildWeeklyGoals(calendarWeekKey()),
    },
  }
}
