import { useMemo, useState } from 'react'
import { ART, ArtBanner } from './ArtBanner'
import { ORIGINS, getOriginDisplayName } from '../data/origins'
import {
  PLAYER_GENDER_LABEL,
  type OriginDef,
  type PlayerGender,
} from '../types/game'

export interface OriginSelectPayload {
  originId: string
  jobTitle: string
  playerName: string
  gender: PlayerGender
}

interface OriginSelectProps {
  onSelect: (payload: OriginSelectPayload) => void
  /** NG+ 結算後強制重選時顯示導引 */
  ngPlusGuide?: boolean
}

type Step = 'pick' | 'job' | 'identity' | 'transit' | 'confirm'

const SHARED_LANDING = [
  '雨變大了。遠方隱約有城火與刀聲——有人會把那座邊城叫做襄揚。',
  '你還不是江湖人。你只是一個剛從現代日程裡被抽離的人。',
]

export function OriginSelect({ onSelect, ngPlusGuide }: OriginSelectProps) {
  const [step, setStep] = useState<Step>('pick')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [pickedId, setPickedId] = useState<string | null>(null)
  const [jobTitle, setJobTitle] = useState('')
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
  const jobDisplay = getOriginDisplayName({
    originId: pickedId,
    originJobTitle: jobTitle,
  })

  const goJob = (id: string) => {
    const cat = ORIGINS.find((o) => o.id === id)
    setPickedId(id)
    setJobTitle('')
    if (cat) setExpandedId(id)
    setStep('job')
  }

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-ink-950">
      {step === 'pick' && (
        <div className="shrink-0 px-3 pt-[max(0.5rem,env(safe-area-inset-top))]">
          <ArtBanner
            src={ART.titleRainTemple}
            alt="雨夜破廟氛圍"
            variant="hero"
            className="rounded-xl"
          >
            <p className="text-[11px] tracking-[0.22em] text-cinnabar-soft">
              穿越諧音武俠
            </p>
            <p className="mt-1 font-display text-lg text-paper">雨夜破廟之前</p>
            <p className="mt-1 text-[11px] leading-relaxed text-paper/60">
              選天賦、填職稱——再墜入襄揚雨夜。
            </p>
          </ArtBanner>
        </div>
      )}
      <div className="shrink-0 border-b border-cinnabar/30 px-4 pb-3 pt-3 text-center">
        <p className="text-[11px] tracking-[0.2em] text-cinnabar-soft">
          {ngPlusGuide ? 'NG+ 新周目' : '開局'}
        </p>
        <h1 className="font-display text-xl text-paper">
          {step === 'pick' && '你來自哪一大類？'}
          {step === 'job' && '具體做什麼？'}
          {step === 'identity' && '你想被怎麼稱呼？'}
          {step === 'transit' && '異變發生了'}
          {step === 'confirm' && '墜入襄揚之前'}
        </h1>
        {ngPlusGuide && step === 'pick' && (
          <p className="mt-2 rounded-lg bg-amber-950/50 px-3 py-2 text-xs leading-relaxed text-amber-100 ring-1 ring-amber-700/35">
            周目已結算：元寶、外觀與結局迴聲已保留。請重新選擇開局大類與職稱——新序章與主線文案會依周目差分，不會原樣重播。
          </p>
        )}
        <p className="mt-1 text-xs leading-relaxed text-paper/55">
          {step === 'pick' &&
            '約十個大類決定天賦；八大與無業也在其中。可捲動展開。'}
          {step === 'job' &&
            '自填職稱可空白——空白則用大類預設名。'}
          {step === 'identity' && '性別與暱稱可之後再改。'}
          {step === 'transit' && '請慢慢讀完，再進破廟。'}
          {step === 'confirm' && '確認後寫入存檔，序章開始。'}
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
              onChoose={() => goJob(o.id)}
            />
          ))}
        </div>
      )}

      {step === 'job' && origin && (
        <div className="flex flex-1 flex-col overflow-y-auto px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <p className="text-sm text-paper/80">
            大類：
            <span className="font-display text-paper"> {origin.name}</span>
          </p>
          <p className="mt-1 text-xs text-paper/50">{origin.summary}</p>
          <label className="mt-4 block text-xs text-paper/55">
            具體工作／身分（可空白）
          </label>
          <input
            type="text"
            maxLength={20}
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder={`例如：${origin.defaultJobTitle}、自由接案…`}
            className="touch-btn mt-1 w-full rounded-xl border border-paper/15 bg-ink-900 px-3 py-3 text-sm text-paper outline-none focus:border-cinnabar/50"
          />
          <p className="mt-2 text-[11px] text-paper/40">
            預覽顯示：{jobDisplay}
          </p>
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
              onClick={() => setStep('identity')}
              className="touch-btn flex-[1.4] rounded-xl bg-cinnabar/90 py-3 text-sm text-paper"
            >
              下一步
            </button>
          </div>
        </div>
      )}

      {step === 'identity' && origin && (
        <div className="flex flex-1 flex-col overflow-y-auto px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <p className="text-sm text-paper/80">
            {origin.name} · {jobDisplay}
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
              onClick={() => setStep('job')}
              className="touch-btn flex-1 rounded-xl bg-paper/10 py-3 text-sm text-paper"
            >
              返回
            </button>
            <button
              type="button"
              onClick={() => {
                setPage(0)
                setStep('transit')
              }}
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
              {jobDisplay} · {displayName}
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
              onClick={() => {
                if (page >= transitPages.length - 1) setStep('confirm')
                else setPage((p) => p + 1)
              }}
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
              你將以「{jobDisplay}·{displayName}」身份墜入襄揚雨夜破廟。
            </p>
            <p className="mt-2 text-xs text-paper/55">
              大類 {origin.name}｜性別 {PLAYER_GENDER_LABEL[gender]}
            </p>
          </div>
          <div className="mt-3 space-y-2 rounded-xl border border-paper/10 bg-ink-900/70 p-3 text-xs leading-relaxed text-paper/70">
            <p>{origin.passiveText}</p>
            <p className="text-paper/50">{origin.startingItemBlurb}</p>
            <p className="text-amber-200/80">
              靈感 +{origin.bonuses.inspiration ?? 0}
              {origin.bonuses.silver ? ` · 銀兩 +${origin.bonuses.silver}` : ''}
            </p>
          </div>
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
                  jobTitle: jobTitle.trim().slice(0, 20),
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
  const order: Step[] = ['pick', 'job', 'identity', 'transit', 'confirm']
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
      className={`rounded-xl border bg-ink-900/90 text-left ${
        selected ? 'border-cinnabar/50' : 'border-paper/15'
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
            <span className="text-paper/40">原型　</span>
            {origin.bio}
          </p>
          <p>
            <span className="text-paper/40">天賦　</span>
            {origin.passiveText}
          </p>
          <p>
            <span className="text-paper/40">初始　</span>
            {origin.startingItemBlurb}
          </p>
          <button
            type="button"
            onClick={onChoose}
            className="touch-btn mt-1 w-full rounded-lg bg-cinnabar/90 py-3 text-sm text-paper"
          >
            選擇「{origin.name}」
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
            選擇此大類
          </button>
        </div>
      )}
    </article>
  )
}
