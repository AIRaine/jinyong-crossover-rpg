import { useMemo, useState } from 'react'
import { ORIGINS } from '../data/origins'
import {
  PLAYER_GENDER_LABEL,
  type OriginDef,
  type PlayerGender,
} from '../types/game'

export interface OriginSelectPayload {
  originId: string
  playerName: string
  gender: PlayerGender
}

interface OriginSelectProps {
  onSelect: (payload: OriginSelectPayload) => void
}

type Step = 'pick' | 'identity' | 'transit' | 'confirm'

const SHARED_LANDING = [
  '雨變大了。遠方隱約有城火與刀聲——有人會把那座邊城叫做襄揚。',
  '你還不是江湖人。你只是一個剛從加班、螢幕與心跳監測裡被抽離的現代人。',
]

export function OriginSelect({ onSelect }: OriginSelectProps) {
  const [step, setStep] = useState<Step>('pick')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [pickedId, setPickedId] = useState<string | null>(null)
  const [gender, setGender] = useState<PlayerGender>('unspecified')
  const [nickname, setNickname] = useState('')
  const [page, setPage] = useState(0)

  const origin = useMemo(
    () => ORIGINS.find((o) => o.id === pickedId) ?? null,
    [pickedId],
  )

  const transitPages = useMemo(() => {
    if (!origin) return []
    return [...origin.transitPages, ...SHARED_LANDING, origin.monologue]
  }, [origin])

  const displayName = nickname.trim() || '無名穿越客'

  const goIdentity = (id: string) => {
    setPickedId(id)
    setStep('identity')
  }

  const goTransit = () => {
    setPage(0)
    setStep('transit')
  }

  const advanceTransit = () => {
    if (page >= transitPages.length - 1) {
      setStep('confirm')
      return
    }
    setPage((p) => p + 1)
  }

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-ink-950">
      <div className="shrink-0 border-b border-cinnabar/30 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] text-center">
        <p className="text-[11px] tracking-[0.2em] text-cinnabar-soft">開局</p>
        <h1 className="font-display text-xl text-paper">
          {step === 'pick' && '你穿越前是誰？'}
          {step === 'identity' && '你想被怎麼稱呼？'}
          {step === 'transit' && '異變發生了'}
          {step === 'confirm' && '墜入襄揚之前'}
        </h1>
        <p className="mt-1 text-xs leading-relaxed text-paper/55">
          {step === 'pick' &&
            '共 12 種現代身份，可捲動瀏覽；點卡片展開小傳後再確認。'}
          {step === 'identity' && '性別與暱稱可之後在人物頁再改。'}
          {step === 'transit' && '加班、猝死或異變——請慢慢讀完，再進破廟。'}
          {step === 'confirm' && '最後確認。確認後寫入存檔，破廟序章開始。'}
        </p>
        <StepDots step={step} />
      </div>

      {step === 'pick' && (
        <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {ORIGINS.map((o) => (
            <OriginCard
              key={o.id}
              origin={o}
              expanded={expandedId === o.id}
              selected={pickedId === o.id}
              onToggle={() =>
                setExpandedId((cur) => (cur === o.id ? null : o.id))
              }
              onChoose={() => goIdentity(o.id)}
            />
          ))}
        </div>
      )}

      {step === 'identity' && origin && (
        <div className="flex flex-1 flex-col overflow-y-auto px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <p className="text-sm text-paper/80">
            已選職業：
            <span className="font-display text-paper"> {origin.name}</span>
          </p>
          <label className="mt-4 block text-xs text-paper/55">江湖暱稱</label>
          <input
            type="text"
            maxLength={12}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="例如：夜雨行、阿準…"
            className="touch-btn mt-1 w-full rounded-xl border border-paper/15 bg-ink-900 px-3 py-3 text-sm text-paper outline-none focus:border-cinnabar/50"
          />
          <p className="mt-4 text-xs text-paper/55">性別（敘事用）</p>
          <div className="mt-2 grid grid-cols-1 gap-2">
            {(Object.keys(PLAYER_GENDER_LABEL) as PlayerGender[]).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGender(g)}
                className={`touch-btn rounded-xl border px-3 py-3 text-left text-sm ${
                  gender === g
                    ? 'border-cinnabar/60 bg-cinnabar/20 text-paper'
                    : 'border-paper/15 bg-ink-900 text-paper/75'
                }`}
              >
                {PLAYER_GENDER_LABEL[g]}
              </button>
            ))}
          </div>
          <div className="mt-auto flex gap-2 pt-6">
            <button
              type="button"
              onClick={() => setStep('pick')}
              className="touch-btn flex-1 rounded-xl bg-paper/10 py-3 text-sm text-paper"
            >
              返回
            </button>
            <button
              type="button"
              onClick={goTransit}
              className="touch-btn flex-[1.4] rounded-xl bg-cinnabar/90 py-3 text-sm text-paper"
            >
              進入異變
            </button>
          </div>
        </div>
      )}

      {step === 'transit' && origin && (
        <div className="relative flex flex-1 flex-col overflow-hidden">
          <div className="pointer-events-none absolute inset-0 rain-layer opacity-70" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink-950/20 via-transparent to-ink-950/90" />
          <div
            key={page}
            className="origin-fade relative z-10 flex flex-1 flex-col px-4 py-5"
          >
            <p className="text-[11px] tracking-wider text-cinnabar-soft">
              {page + 1} / {transitPages.length}
            </p>
            <p className="mt-4 font-display text-base leading-8 text-paper">
              {transitPages[page]}
            </p>
            <p className="mt-auto pt-8 text-[11px] text-paper/40">
              {origin.name} · {displayName}
            </p>
          </div>
          <div className="relative z-10 flex gap-2 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
            <button
              type="button"
              onClick={() => setStep('identity')}
              className="touch-btn flex-1 rounded-xl bg-paper/10 py-3 text-sm text-paper"
            >
              返回
            </button>
            <button
              type="button"
              onClick={advanceTransit}
              className="touch-btn flex-[1.6] rounded-xl bg-cinnabar/90 py-3 text-sm text-paper"
            >
              {page >= transitPages.length - 1 ? '醒來' : '繼續'}
            </button>
          </div>
        </div>
      )}

      {step === 'confirm' && origin && (
        <div className="flex flex-1 flex-col overflow-y-auto px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="rounded-2xl border border-amber-700/40 bg-amber-950/25 p-4">
            <p className="font-display text-lg leading-relaxed text-amber-50">
              你將以「{origin.name}·{displayName}」身份墜入襄揚雨夜破廟。
            </p>
            <p className="mt-2 text-xs text-paper/55">
              性別：{PLAYER_GENDER_LABEL[gender]}
            </p>
          </div>
          <div className="mt-3 space-y-2 rounded-xl border border-paper/10 bg-ink-900/70 p-3 text-xs leading-relaxed text-paper/70">
            <p>{origin.passiveText}</p>
            <p className="text-paper/50">{origin.startingItemBlurb}</p>
            <p className="text-paper/50">{origin.startingTechBlurb}</p>
            <p className="text-amber-200/80">
              靈感 +{origin.bonuses.inspiration ?? 0}
              {origin.bonuses.silver ? ` · 銀兩 +${origin.bonuses.silver}` : ''}
            </p>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-paper/45">
            確認後不會瞬間變成大俠——你會先在破廟面對序章抉擇。
          </p>
          <div className="mt-auto flex gap-2 pt-6">
            <button
              type="button"
              onClick={() => {
                setPage(Math.max(0, transitPages.length - 2))
                setStep('transit')
              }}
              className="touch-btn flex-1 rounded-xl bg-paper/10 py-3 text-sm text-paper"
            >
              返回
            </button>
            <button
              type="button"
              onClick={() =>
                onSelect({
                  originId: origin.id,
                  playerName: displayName.slice(0, 12),
                  gender,
                })
              }
              className="touch-btn flex-[1.6] rounded-xl bg-cinnabar/90 py-3.5 text-sm font-medium text-paper"
            >
              墜入雨夜
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function StepDots({ step }: { step: Step }) {
  const order: Step[] = ['pick', 'identity', 'transit', 'confirm']
  const idx = order.indexOf(step)
  return (
    <div className="mt-2 flex justify-center gap-1.5">
      {order.map((s, i) => (
        <span
          key={s}
          className={`h-1.5 w-1.5 rounded-full ${
            i <= idx ? 'bg-cinnabar-soft' : 'bg-paper/20'
          }`}
        />
      ))}
    </div>
  )
}

function OriginCard({
  origin,
  expanded,
  selected,
  onToggle,
  onChoose,
}: {
  origin: OriginDef
  expanded: boolean
  selected: boolean
  onToggle: () => void
  onChoose: () => void
}) {
  return (
    <article
      className={`rounded-xl border bg-ink-900/90 text-left transition ${
        selected
          ? 'border-cinnabar/50'
          : 'border-paper/15'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="touch-btn w-full px-4 py-3.5 text-left active:scale-[0.99]"
      >
        <span className="flex items-start justify-between gap-2">
          <span className="font-display text-base text-paper">{origin.name}</span>
          <span className="shrink-0 text-[11px] text-paper/40">
            {expanded ? '收合' : '詳情'}
          </span>
        </span>
        <span className="mt-1 block text-xs leading-relaxed text-paper/70">
          {origin.summary}
        </span>
        <span className="mt-2 flex flex-wrap gap-1">
          {origin.tags.map((t) => (
            <span
              key={t}
              className="rounded bg-paper/10 px-1.5 py-0.5 text-[10px] text-paper/60"
            >
              {t}
            </span>
          ))}
        </span>
      </button>

      {expanded && (
        <div className="space-y-2 border-t border-paper/10 px-4 py-3 text-xs leading-relaxed text-paper/65">
          <p>
            <span className="text-paper/40">小傳　</span>
            {origin.bio}
          </p>
          <p>
            <span className="text-paper/40">契機　</span>
            {origin.crossoverHook}
          </p>
          <p>
            <span className="text-paper/40">被動　</span>
            {origin.passiveText}
          </p>
          <p>
            <span className="text-paper/40">道具　</span>
            {origin.startingItemBlurb}
          </p>
          <p>
            <span className="text-paper/40">科技　</span>
            {origin.startingTechBlurb}
          </p>
          <p className="text-amber-200/80">
            靈感 +{origin.bonuses.inspiration ?? 0}
            {origin.bonuses.silver ? ` · 銀兩 +${origin.bonuses.silver}` : ''}
          </p>
          <button
            type="button"
            onClick={onChoose}
            className="touch-btn mt-1 w-full rounded-lg bg-cinnabar/90 py-3 text-sm text-paper"
          >
            以「{origin.name}」繼續
          </button>
        </div>
      )}

      {!expanded && (
        <div className="border-t border-paper/10 px-4 py-2">
          <button
            type="button"
            onClick={onChoose}
            className="touch-btn w-full rounded-lg bg-paper/10 py-2.5 text-xs text-paper/85"
          >
            選擇此職業
          </button>
        </div>
      )}
    </article>
  )
}
