import { useState } from 'react'
import {
  MOCK_TOPUP_PACKS,
  MONTHLY_DAILY_POTENTIAL,
  MONTHLY_DAILY_SILVER,
  MONTHLY_DAILY_YUANBAO,
  SILVER_SHOP,
  YUANBAO_SHOP,
} from '../../data/shop'
import {
  GACHA_SINGLE_COST,
  GACHA_TEN_COST,
  yearSealHint,
} from '../../lib/gachaEngine'
import { EQUIP_QUALITY_LABEL } from '../../data/equipments'
import type { EquipmentDef, GameState } from '../../types/game'

interface ShopTabProps {
  state: GameState
  onMockTopUp: (packId: string) => void
  onBuySilver: (offerId: string) => void
  onBuyYuanbao: (offerId: string) => void
  onGacha: (count: 1 | 10) => void
  onClaimMonthly: () => void
  lastGacha: EquipmentDef[]
}

export function ShopTab({
  state,
  onMockTopUp,
  onBuySilver,
  onBuyYuanbao,
  onGacha,
  onClaimMonthly,
  lastGacha,
}: ShopTabProps) {
  const [pane, setPane] = useState<'silver' | 'gacha' | 'topup'>('gacha')
  const year = state.time.year

  return (
    <section className="space-y-4 text-left">
      <div className="rounded-2xl border border-paper/10 bg-ink-900/70 p-4">
        <h2 className="font-display text-xl text-paper">商城</h2>
        <p className="mt-1 text-xs text-paper/55">
          銀兩 {state.currency.silver} · 元寶 {state.currency.yuanbao}
        </p>
        <p className="mt-2 text-sm leading-7 text-paper/80">
          抽卡／月卡／儲值皆為
          <span className="text-amber-200">體驗模擬</span>
          ，不會扣款。真實金流另開上線階段。
        </p>
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {(
            [
              ['gacha', '元寶抽卡'],
              ['silver', '銀兩店'],
              ['topup', '儲值／月卡'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setPane(id)}
              className={`touch-btn rounded-lg py-2 text-[11px] ${
                pane === id
                  ? 'bg-cinnabar/90 text-paper'
                  : 'bg-paper/10 text-paper/70'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {pane === 'gacha' && (
        <div className="space-y-3">
          <div className="rounded-xl border border-amber-700/30 bg-amber-950/20 p-3 text-xs text-amber-100/90">
            <p>{yearSealHint(year)}</p>
            <p className="mt-1 text-paper/55">
              保底：絕品 {state.gachaPityEpic}/10 · 神兵{' '}
              {state.gachaPityLegendary}/30 · 累計抽{' '}
              {state.gachaTotalPulls}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onGacha(1)}
              className="touch-btn rounded-xl bg-cinnabar/90 py-3.5 text-sm text-paper"
            >
              單抽（{GACHA_SINGLE_COST} 元寶）
            </button>
            <button
              type="button"
              onClick={() => onGacha(10)}
              className="touch-btn rounded-xl bg-amber-900/70 py-3.5 text-sm text-amber-50"
            >
              十連（{GACHA_TEN_COST} 元寶）
            </button>
          </div>
          {lastGacha.length > 0 && (
            <div className="space-y-1.5">
              <h3 className="font-display text-sm text-paper/80">本次結果</h3>
              {lastGacha.map((item, i) => (
                <p
                  key={`${item.id}-${i}`}
                  className="rounded-lg bg-ink-900/80 px-3 py-2 text-xs text-paper"
                >
                  {item.name}（{EQUIP_QUALITY_LABEL[item.quality]}）
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {pane === 'silver' && (
        <div className="space-y-2">
          {SILVER_SHOP.map((offer) => (
            <article
              key={offer.id}
              className="rounded-xl border border-paper/10 bg-ink-900/65 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm text-paper">{offer.name}</h4>
                  <p className="mt-1 text-xs text-paper/60">{offer.description}</p>
                </div>
                <span className="text-[11px] text-amber-200">
                  {offer.priceSilver} 銀兩
                </span>
              </div>
              <button
                type="button"
                onClick={() => onBuySilver(offer.id)}
                className="touch-btn mt-2 w-full rounded-lg bg-cinnabar/90 py-2.5 text-xs text-paper"
              >
                購買
              </button>
            </article>
          ))}
        </div>
      )}

      {pane === 'topup' && (
        <div className="space-y-3">
          <div className="rounded-xl border border-paper/10 bg-ink-900/65 p-3">
            <h3 className="font-display text-sm text-paper">江湖月卡</h3>
            <p className="mt-1 text-xs text-paper/60">
              剩餘可領 {state.monthlyCardCharges} 次。每次可領元寶{' '}
              {MONTHLY_DAILY_YUANBAO}＋銀兩 {MONTHLY_DAILY_SILVER}＋潛能{' '}
              {MONTHLY_DAILY_POTENTIAL}（每旬一次）。
            </p>
            <button
              type="button"
              onClick={onClaimMonthly}
              className="touch-btn mt-2 w-full rounded-lg bg-teal-900/60 py-2.5 text-xs text-teal-50"
            >
              領取本旬月卡
            </button>
          </div>

          {YUANBAO_SHOP.map((offer) => (
            <article
              key={offer.id}
              className="rounded-xl border border-paper/10 bg-ink-900/65 p-3"
            >
              <div className="flex justify-between gap-2">
                <div>
                  <h4 className="text-sm text-paper">{offer.name}</h4>
                  <p className="mt-1 text-xs text-paper/60">{offer.description}</p>
                </div>
                <span className="text-[11px] text-yellow-200">
                  {offer.priceYuanbao} 元寶
                </span>
              </div>
              <button
                type="button"
                onClick={() => onBuyYuanbao(offer.id)}
                className="touch-btn mt-2 w-full rounded-lg bg-amber-900/70 py-2.5 text-xs text-amber-50"
              >
                以元寶購買（體驗）
              </button>
            </article>
          ))}

          <h3 className="font-display text-sm text-paper/80">模擬儲值</h3>
          {MOCK_TOPUP_PACKS.map((pack) => (
            <button
              key={pack.id}
              type="button"
              onClick={() => onMockTopUp(pack.id)}
              className="touch-btn flex w-full items-center justify-between gap-3 rounded-xl border border-amber-700/40 bg-gradient-to-r from-ink-900 to-amber-950/40 px-4 py-3.5 text-left"
            >
              <span>
                <span className="block text-sm font-medium text-paper">
                  {pack.label}
                </span>
                <span className="mt-0.5 block text-[11px] text-paper/50">
                  標示 NT${pack.displayPriceTwd}（不會扣款）
                </span>
              </span>
              <span className="shrink-0 rounded-lg bg-yellow-500/20 px-2.5 py-1 text-xs font-semibold text-yellow-200">
                +{pack.yuanbao} 元寶
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
