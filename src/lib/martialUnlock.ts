import { getMartialById } from '../data/martialArts'
import { getMartialGate } from '../data/martialGates'
import { canProgressMartial } from './martialGates'
import { preferEquipLearnedArts } from './journeyPath'
import type { GameState, MartialLoadout } from '../types/game'

function stripFromLoadout(loadout: MartialLoadout, artId: string): MartialLoadout {
  return {
    internalId: loadout.internalId === artId ? null : loadout.internalId,
    heartId: loadout.heartId === artId ? null : loadout.heartId,
    qinggongId: loadout.qinggongId === artId ? null : loadout.qinggongId,
    activeIds: loadout.activeIds.map((id) =>
      id === artId ? null : id,
    ) as MartialLoadout['activeIds'],
  }
}

/** 門派入門／晉升對應傳功武學 */
export const SECT_MARTIAL_GRANTS: Record<
  string,
  { onJoin: string[]; onRank: Record<number, string[]> }
> = {
  sect_shaolin: {
    onJoin: ['ma_shaolin_yi'],
    onRank: { 2: ['ma_shaolin_xisui'], 3: ['ma_act_dragon'] },
  },
  sect_wudang: {
    onJoin: ['ma_wudang_taiji'],
    onRank: { 2: ['ma_act_taiji_sword'], 3: ['ma_qing_cloud'] },
  },
  sect_huashan: {
    onJoin: ['ma_qing_huashan'],
    onRank: { 2: ['ma_act_lonely'], 3: ['ma_heart_yue'] },
  },
  sect_beggar: {
    onJoin: ['ma_act_dog'],
    onRank: { 2: ['ma_heart_wine'], 3: ['ma_act_xiangyang'] },
  },
  sect_mingjiao: {
    onJoin: ['ma_mingjiao_fire'],
    onRank: { 2: ['ma_jiuyang'], 3: ['ma_qing_icefire'] },
  },
  sect_gumupo: {
    onJoin: ['ma_gumupo_jade'],
    onRank: { 2: ['ma_qing_tomb'], 3: ['ma_act_xuantie'] },
  },
  sect_riyue: {
    onJoin: ['ma_kuiying'],
    onRank: { 2: ['ma_act_needle'], 3: ['ma_heart_zhao'] },
  },
  sect_emei: {
    onJoin: ['ma_heart_emei'],
    onRank: { 2: ['ma_qing_emei'], 3: ['ma_act_emei_sword'] },
  },
  sect_taohua: {
    onJoin: ['ma_heart_peach'],
    onRank: { 2: ['ma_act_luoying'], 3: ['ma_qing_wave'] },
  },
}

/** 地點採集／初訪可能發現的武學書冊 */
export const LOCATION_MARTIAL_FINDS: Record<string, string[]> = {
  loc_lingjiu: ['ma_heart_xuzhu', 'ma_qing_lingbo', 'ma_beiming'],
  loc_peach_island: ['ma_heart_peach', 'ma_act_luoying', 'ma_hua_gong'],
  loc_dead_tomb: ['ma_gumupo_jade', 'ma_qing_tomb', 'ma_act_xuantie'],
  loc_huashan: ['ma_qing_huashan', 'ma_act_lonely', 'ma_heart_yue'],
  loc_emei_gate: ['ma_heart_emei', 'ma_qing_emei', 'ma_act_emei_sword'],
  loc_icefire_isle: ['ma_qing_icefire', 'ma_jiuyang', 'ma_mingjiao_fire'],
  loc_xuanmu: ['ma_kuiying', 'ma_act_needle', 'ma_heart_zhao'],
  loc_shaolin: ['ma_shaolin_yi', 'ma_shaolin_xisui'],
  loc_wudang: ['ma_wudang_taiji', 'ma_act_taiji_sword'],
  loc_beggar_hall: ['ma_act_dog', 'ma_heart_wine'],
  loc_yanmen: ['ma_qing_yanmen', 'ma_act_dragon', 'ma_heart_azhu'],
  loc_east_wharf: ['ma_qing_wharf', 'ma_qing_wave'],
  loc_xiake_isle: ['ma_qing_wave', 'ma_qing_wharf', 'ma_qing_swallow'],
  loc_dali: ['ma_act_liumei', 'ma_qing_lingbo'],
  loc_suhang: ['ma_heart_tianji', 'ma_act_liumei'],
  loc_tianji_hall: ['ma_heart_tianji', 'ma_heart_azhu', 'ma_heart_liancheng'],
  loc_snow_ridge: ['ma_qing_snow', 'ma_qing_yanmen', 'ma_act_blood_sword'],
}

/** 戰鬥勝利可能掉落的招式（加重冷門鏈，降低開局五招永遠占滿） */
export const COMBAT_MARTIAL_POOL = [
  'ma_qing_icefire',
  'ma_qing_tomb',
  'ma_act_xuantie',
  'ma_qing_emei',
  'ma_act_emei_sword',
  'ma_act_needle',
  'ma_act_xiangyang',
  'ma_jiuyang',
  'ma_kuiying',
  'ma_mingjiao_fire',
  'ma_qing_huashan',
  'ma_act_lonely',
  'ma_heart_yue',
  'ma_act_first_aid',
  'ma_qing_swallow',
  'ma_qing_yanmen',
  'ma_heart_poison',
  'ma_act_dog',
  'ma_wudang_taiji',
  'ma_shaolin_yi',
  'ma_act_liumei',
  'ma_qing_wharf',
  'ma_heart_wine',
  'ma_act_taiji_sword',
  'ma_qing_snow',
  'ma_heart_liancheng',
  'ma_act_blood_sword',
  'ma_beiming',
  'ma_gumupo_jade',
] as const

export function grantMartialArts(
  state: GameState,
  martialIds: string[],
  opts: { convertExclusives?: boolean } = { convertExclusives: true },
): { state: GameState; learned: string[]; blocked: string[]; converted: string[] } {
  let cursor: GameState = state
  const learned: string[] = []
  const blocked: string[] = []
  const converted: string[] = []
  for (const id of martialIds) {
    if (!getMartialById(id)) continue
    if ((cursor.martialProgress[id] ?? 0) > 0) continue

    // 門派傳功：可卸下互斥舊學以完成轉換
    if (opts.convertExclusives) {
      const gate = getMartialGate(id)
      const conflicts = (gate?.exclusiveWith ?? []).filter(
        (x) => (cursor.martialProgress[x] ?? 0) > 0,
      )
      if (conflicts.length) {
        const martialProgress = { ...cursor.martialProgress }
        let loadout = cursor.martialLoadout
        for (const c of conflicts) {
          delete martialProgress[c]
          loadout = stripFromLoadout(loadout, c)
          converted.push(c)
        }
        // 反向互斥：舊學的 exclusiveWith 含新學
        for (const [oldId, lv] of Object.entries(martialProgress)) {
          if (lv <= 0) continue
          const og = getMartialGate(oldId)
          if (og?.exclusiveWith?.includes(id)) {
            delete martialProgress[oldId]
            loadout = stripFromLoadout(loadout, oldId)
            converted.push(oldId)
          }
        }
        cursor = { ...cursor, martialProgress, martialLoadout: loadout }
      }
    }

    const gate = canProgressMartial(cursor, id, { learning: true })
    if (!gate.ok) {
      blocked.push(id)
      continue
    }
    cursor = {
      ...cursor,
      martialProgress: { ...cursor.martialProgress, [id]: 1 },
    }
    learned.push(id)
  }
  if (!learned.length) return { state, learned, blocked, converted }
  // 新學自動擠進空欄／替換開局招，讓冷門招有配置誘因
  cursor = preferEquipLearnedArts(cursor, learned)
  return { state: cursor, learned, blocked, converted }
}

export function pickUnknownMartial(
  state: GameState,
  pool: string[],
  rng: () => number = Math.random,
): string | null {
  const unknown = pool.filter((id) => (state.martialProgress[id] ?? 0) <= 0)
  if (!unknown.length) return null
  return unknown[Math.floor(rng() * unknown.length)] ?? null
}
