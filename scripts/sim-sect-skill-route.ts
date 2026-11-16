/**
 * 門派／招式／路線 → 可測難度差異
 * 用法：npm run sim:sect-route
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { createInitialGameState } from '../src/data/initialState.ts'
import { grantStarterGear } from '../src/lib/starterGear.ts'
import {
  applyJoinSect,
  applyLeaveSect,
  canJoinSect,
  getSectRule,
} from '../src/lib/sectRules.ts'
import { grantMartialArts } from '../src/lib/martialUnlock.ts'
import { canProgressMartial } from '../src/lib/martialGates.ts'
import { computeDifficultyMods } from '../src/lib/difficultyModifiers.ts'
import {
  buildPartyCombatants,
  buildPlayerCombatant,
} from '../src/lib/buildCombatants.ts'
import {
  makeBanditEncounter,
  performPlayerAction,
  type CombatActionKind,
} from '../src/lib/combatEngine.ts'
import { MARTIAL_ARTS } from '../src/data/martialArts.ts'
import type { GameState } from '../src/types/game.ts'

const OUT =
  '/cursor/stores/bc-94541db2-36ac-4a3c-a5bc-a3f7b97e3303/internal/sect-skill-route-result.json'

const FIGHTS = 80

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function baseState(): GameState {
  let s = createInitialGameState()
  s = {
    ...s,
    playerName: '路線測',
    prologueDone: true,
    originChosen: true,
    stats: {
      ...s.stats,
      level: 3,
      attack: 18,
      defense: 12,
      hp: 140,
      maxHp: 140,
      internalForce: 40,
      maxInternalForce: 40,
    },
    currency: { silver: 500, yuanbao: 0 },
    comprehension: 55,
    potential: 80,
    knownLocationIds: [
      'loc_broken_temple',
      'loc_xiangyang',
      'loc_shaolin',
      'loc_wudang',
      'loc_huashan',
      'loc_beggar_hall',
      'loc_dead_tomb',
      'loc_xuanmu',
      'loc_emei_gate',
      'loc_peach_island',
    ],
  }
  return grantStarterGear(s)
}

function trainChain(state: GameState, ids: string[], level = 4): GameState {
  let s = state
  const martialProgress = { ...s.martialProgress }
  for (const id of ids) {
    martialProgress[id] = Math.max(martialProgress[id] ?? 0, level)
  }
  s = { ...s, martialProgress }
  // 配置第一個內功／主動
  const loadout = { ...s.martialLoadout, activeIds: [...s.martialLoadout.activeIds] as GameState['martialLoadout']['activeIds'] }
  for (const id of ids) {
    const art = MARTIAL_ARTS.find((m) => m.id === id)
    if (!art) continue
    if (art.kind === 'internal') loadout.internalId = id
    if (art.kind === 'heart') loadout.heartId = id
    if (art.kind === 'qinggong') loadout.qinggongId = id
    if (art.kind === 'active') {
      const idx = loadout.activeIds.findIndex((x) => x === null)
      if (idx >= 0) loadout.activeIds[idx] = id
    }
  }
  return { ...s, martialLoadout: loadout }
}

function runFights(
  state: GameState,
  seed: number,
  policy: 'attack' | 'skill',
  year = 3,
): {
  wins: number
  losses: number
  winRate: number
  avgSilver: number
  avgTurns: number
  avgHpLeft: number
} {
  const mods = computeDifficultyMods(state)
  let wins = 0
  let losses = 0
  let silver = 0
  let turns = 0
  let hpLeft = 0
  for (let i = 0; i < FIGHTS; i++) {
    const rng = mulberry32(seed + i * 17)
    void rng
    let combat = makeBanditEncounter(
      buildPlayerCombatant(state),
      buildPartyCombatants(state),
      { loseStreak: 0, year, enemyScale: mods.enemyScale },
    )
    let guard = 0
    while (!combat.finished && guard < 80) {
      guard++
      const foes = combat.enemies.filter((e) => e.hp > 0)
      const target = foes[Math.floor(Math.random() * foes.length)]?.id
      const player = combat.allies.find((a) => a.isPlayer)!
      const action: CombatActionKind =
        policy === 'skill'
          ? player.hp < player.maxHp * 0.4
            ? 'tactic_aid'
            : 'skill'
          : 'attack'
      combat = performPlayerAction(combat, action, target)
    }
    turns += combat.turn
    const p = combat.allies.find((a) => a.isPlayer)
    if (combat.victory) {
      wins++
      silver += Math.max(0, 20 + mods.banditSilverFlat)
      hpLeft += p?.hp ?? 0
    } else losses++
  }
  const total = wins + losses || 1
  return {
    wins,
    losses,
    winRate: Math.round((wins / total) * 1000) / 10,
    avgSilver: Math.round((silver / total) * 10) / 10,
    avgTurns: Math.round((turns / total) * 10) / 10,
    avgHpLeft: wins ? Math.round((hpLeft / wins) * 10) / 10 : 0,
  }
}

function countLearnable(state: GameState): number {
  let n = 0
  for (const art of MARTIAL_ARTS) {
    if ((state.martialProgress[art.id] ?? 0) > 0) continue
    if (canProgressMartial(state, art.id, { learning: true }).ok) n++
  }
  return n
}

function main() {
  const scenarios: Record<string, unknown>[] = []

  // A 少凜＋俠義
  {
    let s = baseState()
    s = applyJoinSect(s, 'sect_shaolin')
    s = grantMartialArts(s, ['ma_shaolin_yi']).state
    s = trainChain(s, ['ma_shaolin_yi', 'ma_shaolin_xisui', 'ma_act_dragon'], 5)
    s = { ...s, flags: { ...s.flags, route_y1: 'chivalry', route_y2: 'scholar' } }
    const mods = computeDifficultyMods(s)
    const skill = runFights(s, 101, 'skill')
    const attack = runFights(s, 111, 'attack')
    scenarios.push({
      id: 'shaolin_chivalry',
      title: '少凜＋俠義書生路',
      mods,
      learnable: countLearnable(s),
      known: Object.keys(s.martialProgress).filter((k) => s.martialProgress[k] > 0)
        .length,
      skill,
      attack,
    })
  }

  // B 明皎＋權謀
  {
    let s = baseState()
    s = applyJoinSect(s, 'sect_mingjiao')
    s = grantMartialArts(s, ['ma_mingjiao_fire', 'ma_jiuyang']).state
    s = trainChain(s, ['ma_mingjiao_fire', 'ma_jiuyang', 'ma_qing_icefire'], 5)
    s = {
      ...s,
      flags: { ...s.flags, route_y1: 'scheme', route_y2: 'scheme', route_y3: 'battle' },
    }
    const mods = computeDifficultyMods(s)
    const skill = runFights(s, 202, 'skill')
    const attack = runFights(s, 212, 'attack')
    scenarios.push({
      id: 'mingjiao_scheme',
      title: '明皎＋權謀鏖戰路',
      mods,
      learnable: countLearnable(s),
      known: Object.keys(s.martialProgress).filter((k) => s.martialProgress[k] > 0)
        .length,
      skill,
      attack,
      convertedAwayJiuyin: !(s.martialProgress.ma_jiuyin > 0),
    })
  }

  // C 華嶠劍意高風險
  {
    let s = baseState()
    s = applyJoinSect(s, 'sect_huashan')
    s = grantMartialArts(s, ['ma_qing_huashan']).state
    s = trainChain(s, ['ma_qing_huashan', 'ma_act_lonely'], 5)
    s = { ...s, flags: { ...s.flags, route_y1: 'chivalry', route_y2: 'sword' } }
    const mods = computeDifficultyMods(s)
    const skill = runFights(s, 303, 'skill')
    const attack = runFights(s, 313, 'attack')
    scenarios.push({
      id: 'huashan_sword',
      title: '華嶠＋劍意',
      mods,
      learnable: countLearnable(s),
      skill,
      attack,
    })
  }

  // D 無門派普攻
  {
    let s = baseState()
    const mods = computeDifficultyMods(s)
    const skill = runFights(s, 404, 'skill')
    const attack = runFights(s, 414, 'attack')
    scenarios.push({
      id: 'no_sect_attack',
      title: '無門派',
      mods,
      learnable: countLearnable(s),
      skill,
      attack,
    })
  }

  // E 規則：叛少凜後禁明皎？ rival of shaolin is heretic - betray bans heretic
  {
    let s = baseState()
    s = applyJoinSect(s, 'sect_shaolin')
    s = applyLeaveSect(s, 'betray')
    const joinMing = canJoinSect(s, 'sect_mingjiao')
    const joinBeggar = canJoinSect(s, 'sect_beggar')
    const rejoinShaolin = canJoinSect(s, 'sect_shaolin')
    scenarios.push({
      id: 'betray_rules',
      title: '叛出少凜後互斥',
      bans: s.sectBanIds,
      bannedAlliances: s.sectBannedAlliances,
      canJoinMingjiao: joinMing.ok,
      mingDetail: joinMing.detail,
      canJoinBeggar: joinBeggar.ok,
      canRejoinShaolin: rejoinShaolin.ok,
    })
  }

  // F 互斥：有久隱不能學久陽（自學）
  {
    let s = baseState() // has jiuyin
    const learnYang = canProgressMartial(s, 'ma_jiuyang', { learning: true })
    const learnXisui = canProgressMartial(s, 'ma_shaolin_xisui', { learning: true })
    s = applyJoinSect(s, 'sect_shaolin')
    s = grantMartialArts(s, ['ma_shaolin_yi']).state
    const learnXisui2 = canProgressMartial(s, 'ma_shaolin_xisui', { learning: true })
    const learnNeedle = canProgressMartial(
      trainChain(s, ['ma_qing_huashan', 'ma_act_lonely'], 1),
      'ma_act_needle',
      { learning: true },
    )
    scenarios.push({
      id: 'exclusive_gates',
      title: '招式互斥／前置',
      cannotLearnJiuyangWithJiuyin: !learnYang.ok,
      jiuyangReason: learnYang.ok ? null : learnYang.reason,
      xisuiNeedsSectAndYi: !learnXisui.ok && learnXisui2.ok,
      lonelyBlocksNeedle: !learnNeedle.ok,
      needleReason: learnNeedle.ok ? null : learnNeedle.reason,
    })
  }

  // G 古暮退派不可再入
  {
    let s = baseState()
    s = applyJoinSect(s, 'sect_gumupo')
    s = applyLeaveSect(s, 'leave')
    const rejoin = canJoinSect(s, 'sect_gumupo')
    scenarios.push({
      id: 'gumupo_no_rejoin',
      title: '古暮退派不可再入',
      banIds: s.sectBanIds,
      canRejoin: rejoin.ok,
      detail: rejoin.detail,
      rule: getSectRule('sect_gumupo')?.leave,
    })
  }

  const combatRows = scenarios
    .filter((s) => s.attack && s.skill)
    .map((s) => ({
      id: s.id as string,
      enemyScale: (s.mods as { enemyScale: number }).enemyScale,
      attackWin: (s.attack as { winRate: number }).winRate,
      skillWin: (s.skill as { winRate: number }).winRate,
      attackSilver: (s.attack as { avgSilver: number }).avgSilver,
      skillSilver: (s.skill as { avgSilver: number }).avgSilver,
      learnable: s.learnable as number,
    }))

  const attackWins = combatRows.map((r) => r.attackWin)
  const skillWins = combatRows.map((r) => r.skillWin)
  const scales = combatRows.map((r) => r.enemyScale)
  const silvers = combatRows.map((r) => r.skillSilver)

  const payload = {
    generatedAt: new Date().toISOString(),
    fightsPerScenario: FIGHTS,
    year: 3,
    scenarios,
    combatRows,
    verdict: {
      attackWinFork:
        attackWins.length >= 2
          ? Math.round(
              (Math.max(...attackWins) - Math.min(...attackWins)) * 10,
            ) / 10
          : 0,
      skillWinFork:
        skillWins.length >= 2
          ? Math.round((Math.max(...skillWins) - Math.min(...skillWins)) * 10) /
            10
          : 0,
      enemyScaleFork:
        scales.length >= 2
          ? Math.round((Math.max(...scales) - Math.min(...scales)) * 1000) / 1000
          : 0,
      silverFork:
        silvers.length >= 2
          ? Math.round((Math.max(...silvers) - Math.min(...silvers)) * 10) / 10
          : 0,
      rulesOk: scenarios.some(
        (s) => s.id === 'betray_rules' && s.canJoinMingjiao === false,
      ),
      exclusivesOk: scenarios.some(
        (s) =>
          s.id === 'exclusive_gates' && s.cannotLearnJiuyangWithJiuyin === true,
      ),
      gumupoNoRejoin: scenarios.some(
        (s) => s.id === 'gumupo_no_rejoin' && s.canRejoin === false,
      ),
    },
  }

  mkdirSync(
    '/cursor/stores/bc-94541db2-36ac-4a3c-a5bc-a3f7b97e3303/internal',
    { recursive: true },
  )
  writeFileSync(OUT, JSON.stringify(payload, null, 2))
  console.log(JSON.stringify(payload.verdict, null, 2))
  console.log('combatRows', combatRows)
  console.log('wrote', OUT)
}

main()
