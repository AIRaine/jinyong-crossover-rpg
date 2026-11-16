import { useMemo, useState } from 'react'
import { summarizeAtlas } from '../../lib/jianghuAtlas'
import { listAllSlotMeta } from '../../lib/saveManager'
import { isAudioUnlocked, isMuted, setMuted } from '../../lib/soundEngine'
import type { GameState, SaveSlotId } from '../../types/game'
import { ART, ArtBanner } from '../ArtBanner'

interface SystemTabProps {
  state: GameState
  onSave: (slot: SaveSlotId) => void
  onLoad: (slot: SaveSlotId) => void
  onNewGame: () => void
  canNgPlus: boolean
  onNgPlus: () => void
}

export function SystemTab({
  state,
  onSave,
  onLoad,
  onNewGame,
  canNgPlus,
  onNgPlus,
}: SystemTabProps) {
  const [mute, setMuteLocal] = useState(isMuted())
  const [tick, setTick] = useState(0)
  const metas = useMemo(() => listAllSlotMeta(), [state.updatedAt, tick])
  const atlas = summarizeAtlas(state)

  return (
    <section className="space-y-4 text-left">
      <ArtBanner
        src={ART.atlasScroll}
        alt="系統與見聞氛圍"
        variant="banner"
      >
        <h2 className="font-display text-xl text-paper">系統</h2>
        <p className="mt-2 text-xs leading-relaxed text-paper/60">
          自動存檔槽會在每次進度寫入時更新。另有三個手動槽供你備份。資料存在此瀏覽器的
          LocalStorage，清除網站資料即會遺失。
        </p>
        <p className="mt-2 text-[11px] text-paper/40">
          存檔版本 v{state.version} · 最近更新 {new Date(state.updatedAt).toLocaleString('zh-TW')}
        </p>
        <p className="mt-2 text-[11px] leading-relaxed text-teal-100/75">
          {atlas.line}
        </p>
        <p className="mt-1 text-[10px] text-paper/40">
          見聞錄未通關也會累積；NG+ 結算時帶入下一世（開新局則重來）。
        </p>
      </ArtBanner>

      <div className="space-y-2">
        <h3 className="font-display text-sm text-paper/80">存檔槽</h3>
        {metas.map((meta) => (
          <div
            key={meta.slot}
            className="rounded-xl border border-paper/10 bg-ink-900/65 p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm text-paper">
                  {meta.slot === 0 ? '自動存檔' : `手動槽 ${meta.slot}`}
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-paper/50">
                  {meta.empty
                    ? '空存檔'
                    : `${meta.playerName}｜${meta.summary}`}
                </p>
                {!meta.empty && meta.updatedAt && (
                  <p className="mt-0.5 text-[10px] text-paper/35">
                    {new Date(meta.updatedAt).toLocaleString('zh-TW')}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-2 flex gap-2">
              {meta.slot !== 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onSave(meta.slot)
                    setTick((n) => n + 1)
                  }}
                  className="touch-btn flex-1 rounded-lg bg-cinnabar/90 py-2.5 text-xs text-paper active:scale-[0.98]"
                >
                  儲存
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  onLoad(meta.slot)
                  setTick((n) => n + 1)
                }}
                disabled={meta.empty}
                className="touch-btn flex-1 rounded-lg bg-paper/10 py-2.5 text-xs text-paper disabled:opacity-35 active:scale-[0.98]"
              >
                讀取
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-paper/10 bg-ink-900/70 p-4">
        <h3 className="font-display text-sm text-paper">音效</h3>
        <p className="mt-1 text-[11px] text-paper/45">
          音訊狀態：{isAudioUnlocked() ? '已解鎖' : '待首次點擊解鎖'}
        </p>
        <button
          type="button"
          onClick={() => {
            const next = !mute
            setMuted(next)
            setMuteLocal(next)
          }}
          className="touch-btn mt-2 w-full rounded-lg bg-paper/10 py-3 text-sm text-paper active:scale-[0.98]"
        >
          {mute ? '目前靜音（點擊開啟）' : '音效開啟中（點擊靜音）'}
        </button>
      </div>

      <div className="rounded-2xl border border-amber-700/35 bg-amber-950/25 p-4">
        <h3 className="font-display text-sm text-paper">多周目（NG+）</h3>
        <p className="mt-1 text-xs leading-relaxed text-paper/60">
          已完成周目 {state.ngPlusCount}。結算後保留元寶、月卡餘額、外觀、切磋勝場、結局標籤與
          <span className="text-teal-100/90">江湖見聞錄</span>
          ，重置劇情／地圖／裝備進度；二／三周目主線、奇遇與序章會換文案，並略加永久攻防。
        </p>
        <p className="mt-1 text-[11px] text-paper/45">
          {typeof state.flags.lastEnding === 'string'
            ? `上周目結局迴聲仍在（標籤已保留）。`
            : null}
          {canNgPlus
            ? '五年主線已齊（或已標記可結算），可開啟下一周目。'
            : '需完成五年主線事件後方可結算。'}
        </p>
        <button
          type="button"
          disabled={!canNgPlus}
          onClick={() => {
            if (
              window.confirm(
                '確定結算本周目並開啟 NG+？劇情進度會重置，元寶與外觀會保留。',
              )
            ) {
              onNgPlus()
              setTick((n) => n + 1)
            }
          }}
          className="touch-btn mt-3 w-full rounded-xl bg-amber-800/80 py-3.5 text-sm text-amber-50 disabled:opacity-40 active:scale-[0.99]"
        >
          結算並開啟下一周目
        </button>
      </div>

      <button
        type="button"
        onClick={() => {
          if (window.confirm('確定開新局？自動存檔會被覆寫。手動槽不受影響。')) {
            onNewGame()
            setTick((n) => n + 1)
          }
        }}
        className="touch-btn w-full rounded-xl border border-rose-700/50 bg-rose-950/40 py-3.5 text-sm text-rose-100 active:scale-[0.99]"
      >
        開新局
      </button>
    </section>
  )
}
