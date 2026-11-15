import type { MockTopUpPack, ShopOffer } from '../types/game'

/** 銀兩店：可實際購買 */
export const SILVER_SHOP: (ShopOffer & {
  grant?: { kind: 'item' | 'stat'; id?: string; qty?: number; stamina?: number }
})[] = [
  {
    id: 'shop_stamina_soup',
    name: '回氣湯一碗',
    description: '立刻回復 25 精力。',
    priceYuanbao: 0,
    priceSilver: 30,
    kind: 'item',
    available: true,
    grant: { kind: 'stat', stamina: 25 },
  },
  {
    id: 'shop_herb_bundle',
    name: '草藥三株',
    description: '新鮮草藥×3，可煉丹或塗毒。',
    priceYuanbao: 0,
    priceSilver: 45,
    kind: 'item',
    available: true,
    grant: { kind: 'item', id: 'mat_herb', qty: 3 },
  },
  {
    id: 'shop_ore_chunk',
    name: '粗煉礦石兩塊',
    description: '礦石×2，可供淬火或煉丹。',
    priceYuanbao: 0,
    priceSilver: 55,
    kind: 'item',
    available: true,
    grant: { kind: 'item', id: 'mat_ore', qty: 2 },
  },
  {
    id: 'shop_tea_gift',
    name: '邊城茶磚',
    description: '送禮佳品，百曉笙與橋峰都吃這套。',
    priceYuanbao: 0,
    priceSilver: 40,
    kind: 'item',
    available: true,
    grant: { kind: 'item', id: 'gift_tea_brick', qty: 1 },
  },
  {
    id: 'shop_wine_gift',
    name: '一葫蘆烈酒',
    description: '凌狐沖看見會兩眼放光。',
    priceYuanbao: 0,
    priceSilver: 35,
    kind: 'item',
    available: true,
    grant: { kind: 'item', id: 'gift_wine_gourd', qty: 1 },
  },
]

/** 元寶貨架（非抽卡）——加速／便利／外觀為主，戰鬥加值有軟上限，避免 pay-to-win */
export const YUANBAO_SHOP: ShopOffer[] = [
  {
    id: 'shop_convenience_kit',
    name: '遊歷便利錦囊（體驗）',
    description:
      '一次打包：AP +3、精力回一半、通票 +2 次。小額首選，不加成戰鬥。',
    priceYuanbao: 48,
    kind: 'boost',
    available: true,
  },
  {
    id: 'shop_monthly_pass',
    name: '江湖月卡（體驗）',
    description:
      '模擬購買：+30 次每旬領取（元寶／銀兩／潛能／AP +1）。便利養成，非戰力碾壓。',
    priceYuanbao: 68,
    kind: 'monthly',
    available: true,
  },
  {
    id: 'shop_ap_incense',
    name: '行動香篆（體驗）',
    description: '行動點（AP）立刻 +4（不超過上限）。便利推進旬制／採集。',
    priceYuanbao: 14,
    kind: 'boost',
    available: true,
  },
  {
    id: 'shop_stamina_elixir',
    name: '回氣仙露（體驗）',
    description: '精力回滿，方便遠行至冷門秘境。',
    priceYuanbao: 16,
    kind: 'boost',
    available: true,
  },
  {
    id: 'shop_travel_pass',
    name: '遊歷通票（體驗）',
    description: '之後 8 次移動精力消耗減半（便利探秘，非戰力）。',
    priceYuanbao: 36,
    kind: 'boost',
    available: true,
  },
  {
    id: 'shop_potential_pack',
    name: '潛能果三枚（體驗）',
    description: '立刻獲得 18 點潛能，加速武學修練。無課亦可靠遊歷累積。',
    priceYuanbao: 32,
    kind: 'boost',
    available: true,
  },
  {
    id: 'shop_exp_charm',
    name: '悟性符（體驗）',
    description: '永久悟性 +3（可重複，瓶頸較易過）。',
    priceYuanbao: 28,
    kind: 'boost',
    available: true,
  },
  {
    id: 'shop_title_frame',
    name: '破廟夜雨頭像框',
    description: '解鎖外觀：破廟夜雨（僅標記收藏）。',
    priceYuanbao: 18,
    kind: 'cosmetic',
    available: true,
  },
  {
    id: 'shop_combat_charm',
    name: '護身小符（體驗）',
    description: '永久攻擊 +1、防禦 +1（各最多叠至 +6）。小優勢，壓不垮無課。',
    priceYuanbao: 40,
    kind: 'boost',
    available: true,
  },
]

/** @deprecated 相容舊引用 */
export const SHOP_OFFERS: ShopOffer[] = [
  ...SILVER_SHOP.map(({ grant: _g, ...o }) => o),
  ...YUANBAO_SHOP,
]

/** 模擬儲值（體驗用）——按下只加本機元寶，不扣款 */
export const MOCK_TOPUP_PACKS: MockTopUpPack[] = [
  {
    id: 'topup_tiny',
    label: '一撮元寶',
    yuanbao: 60,
    displayPriceTwd: 30,
  },
  {
    id: 'topup_small',
    label: '一匣元寶',
    yuanbao: 300,
    displayPriceTwd: 150,
  },
  {
    id: 'topup_month',
    label: '體驗月卡包',
    yuanbao: 680,
    displayPriceTwd: 320,
  },
]

export const MONTHLY_DAILY_YUANBAO = 25
export const MONTHLY_DAILY_SILVER = 40
/** 月卡每日額外潛能（養成加速，非直接戰力碾壓） */
export const MONTHLY_DAILY_POTENTIAL = 3
/** 月卡每旬額外 AP（上限內；跳過少量推旬肝，不能跳過主線決策） */
export const MONTHLY_DAILY_AP = 1
