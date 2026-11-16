/**
 * 門派／招式樹／故事路線 → 可量化戰鬥／資源修飾。
 */
import { getMartialGate } from '../data/martialGates'
import { computeGrowthProfile } from './growthStage'
import { computeJourneyProfile } from './journeyPath'
import { getSectRule, type SectCombatProfile } from './sectRules'
import type { GameFlags, GameState } from '../types/game'

export type DifficultyMods = {
  atkFlat: number
  defFlat: number
  skillPowerFlat: number
  enemyScale: number
  banditSilverFlat: number
  /** 說明用標籤 */
  labels: string[]
}

const NEUTRAL: SectCombatProfile = {
  atkFlat: 0,
  defFlat: 0,
  skillPowerFlat: 0,
  enemyScale: 1,
  banditSilverFlat: 0,
}

function routeMods(flags: GameFlags): Pick<
  DifficultyMods,
  'enemyScale' | 'banditSilverFlat' | 'skillPowerFlat' | 'atkFlat' | 'labels'
> {
  const labels: string[] = []
  let enemyScale = 1
  let banditSilverFlat = 0
  let skillPowerFlat = 0
  let atkFlat = 0

  const y1 = flags.route_y1
  if (y1 === 'chivalry') {
    enemyScale *= 0.95
    banditSilverFlat -= 2
    labels.push('路線·俠義（敵弱獎薄）')
  } else if (y1 === 'intel') {
    skillPowerFlat += 0.03
    labels.push('路線·情報（絕招略強）')
  } else if (y1 === 'scheme') {
    enemyScale *= 1.05
    banditSilverFlat += 8
    labels.push('路線·權謀（敵強獎厚）')
  }

  const y2 = flags.route_y2
  if (y2 === 'sword') {
    atkFlat += 2
    enemyScale *= 1.03
    labels.push('路線·劍意（攻敵雙升）')
  } else if (y2 === 'scholar') {
    enemyScale *= 0.97
    labels.push('路線·書生（略穩）')
  } else if (y2 === 'scheme') {
    enemyScale *= 1.03
    banditSilverFlat += 4
    labels.push('路線·詭局')
  }

  const y3 = flags.route_y3
  if (y3 === 'battle') {
    enemyScale *= 1.04
    atkFlat += 1
    labels.push('路線·鏖戰')
  } else if (y3 === 'seal') {
    enemyScale *= 0.96
    labels.push('路線·封局（敵弱）')
  } else if (y3 === 'ally') {
    skillPowerFlat += 0.02
    labels.push('路線·结盟')
  }

  const y4 = flags.route_y4
  if (y4 === 'battle') {
    enemyScale *= 1.03
    labels.push('路線·再戰')
  } else if (y4 === 'contract') {
    banditSilverFlat += 5
    enemyScale *= 1.02
    labels.push('路線·契約')
  }

  return { enemyScale, banditSilverFlat, skillPowerFlat, atkFlat, labels }
}

/** 已學互斥樹深度：越深絕招越強，但敵人也略強（高風險專精） */
function treeDepthMods(state: GameState): Pick<
  DifficultyMods,
  'skillPowerFlat' | 'enemyScale' | 'labels'
> {
  let chain = 0
  const labels: string[] = []
  for (const [id, lv] of Object.entries(state.martialProgress)) {
    if (lv <= 0) continue
    const gate = getMartialGate(id)
    if (gate?.requires?.length) chain += 1
  }
  if (chain >= 3) {
    labels.push(`招式鏈專精×${chain}`)
    return {
      skillPowerFlat: 0.02 * Math.min(6, chain),
      enemyScale: 1 + Math.min(0.08, chain * 0.01),
      labels,
    }
  }
  if (chain >= 1) {
    labels.push(`招式鏈×${chain}`)
    return {
      skillPowerFlat: 0.015 * chain,
      enemyScale: 1 + chain * 0.008,
      labels,
    }
  }
  return { skillPowerFlat: 0, enemyScale: 1, labels }
}

function pathDiversityMods(state: GameState): {
  skillPowerFlat: number
  atkFlat: number
  labels: string[]
} {
  const p = computeJourneyProfile(state)
  if (p.pathTier === 'forged') {
    return { skillPowerFlat: 0.04, atkFlat: 2, labels: p.labels }
  }
  if (p.pathTier === 'walked') {
    return { skillPowerFlat: 0.02, atkFlat: 1, labels: p.labels }
  }
  return { skillPowerFlat: 0, atkFlat: 0, labels: p.labels }
}

export function computeDifficultyMods(state: GameState): DifficultyMods {
  const sect = state.sectId ? getSectRule(state.sectId)?.combat : undefined
  const profile = sect ?? NEUTRAL
  const route = routeMods(state.flags ?? {})
  const tree = treeDepthMods(state)
  const path = pathDiversityMods(state)
  const growth = computeGrowthProfile(state)
  const labels = [
    ...(state.sectId ? [`門派·${state.sectId}`] : ['門派·無']),
    growth.stageLabel,
    ...route.labels,
    ...tree.labels,
    ...path.labels,
    ...growth.labels,
  ]
  return {
    atkFlat: profile.atkFlat + route.atkFlat + path.atkFlat + growth.atkFlat,
    defFlat: profile.defFlat + growth.defFlat,
    skillPowerFlat:
      profile.skillPowerFlat +
      route.skillPowerFlat +
      tree.skillPowerFlat +
      path.skillPowerFlat +
      growth.skillGrowthFlat,
    enemyScale:
      profile.enemyScale *
      route.enemyScale *
      tree.enemyScale *
      growth.enemyGrowthScale,
    banditSilverFlat: profile.banditSilverFlat + route.banditSilverFlat,
    labels,
  }
}

