/**
 * Mock market price data — mô phỏng dữ liệu thu thập từ các hội nhóm mua bán điện thoại.
 * Key: slug của model (lowercase, dấu gạch ngang)
 * Value: giá thị trường trung bình (VND), tình trạng tốt (GOOD ~90%)
 */
export const MOCK_MARKET_PRICES: Record<string, number> = {
  // ===== APPLE iPHONE =====
  'iphone-16-pro-max': 34_000_000,
  'iphone-16-pro': 29_000_000,
  'iphone-16-plus': 27_000_000,
  'iphone-16': 24_000_000,
  'iphone-15-pro-max': 28_000_000,
  'iphone-15-pro': 24_000_000,
  'iphone-15-plus': 22_000_000,
  'iphone-15': 20_000_000,
  'iphone-14-pro-max': 22_000_000,
  'iphone-14-pro': 19_000_000,
  'iphone-14-plus': 17_000_000,
  'iphone-14': 16_000_000,
  'iphone-13-pro-max': 17_000_000,
  'iphone-13-pro': 15_000_000,
  'iphone-13': 13_000_000,
  'iphone-13-mini': 11_000_000,
  'iphone-12-pro-max': 14_000_000,
  'iphone-12-pro': 12_000_000,
  'iphone-12': 10_000_000,
  'iphone-12-mini': 8_500_000,
  'iphone-11-pro-max': 10_000_000,
  'iphone-11-pro': 8_500_000,
  'iphone-11': 7_500_000,
  'iphone-se-2022': 7_500_000,
  'iphone-se-2020': 5_500_000,
  'iphone-xr': 5_000_000,
  'iphone-xs-max': 5_500_000,

  // ===== SAMSUNG GALAXY S SERIES =====
  'samsung-galaxy-s25-ultra': 33_000_000,
  'samsung-galaxy-s25+': 27_000_000,
  'samsung-galaxy-s25': 23_000_000,
  'samsung-galaxy-s24-ultra': 26_000_000,
  'samsung-galaxy-s24+': 22_000_000,
  'samsung-galaxy-s24': 18_000_000,
  'samsung-galaxy-s23-ultra': 22_000_000,
  'samsung-galaxy-s23+': 17_000_000,
  'samsung-galaxy-s23': 14_000_000,
  'samsung-galaxy-s22-ultra': 18_000_000,
  'samsung-galaxy-s22+': 13_000_000,
  'samsung-galaxy-s22': 11_000_000,

  // ===== SAMSUNG GALAXY Z FOLD/FLIP =====
  'samsung-galaxy-z-fold-6': 38_000_000,
  'samsung-galaxy-z-fold-5': 32_000_000,
  'samsung-galaxy-z-flip-6': 23_000_000,
  'samsung-galaxy-z-flip-5': 19_000_000,

  // ===== SAMSUNG GALAXY A SERIES =====
  'samsung-galaxy-a55': 8_500_000,
  'samsung-galaxy-a54': 7_000_000,
  'samsung-galaxy-a35': 6_500_000,
  'samsung-galaxy-a34': 5_500_000,
  'samsung-galaxy-a25': 5_000_000,
  'samsung-galaxy-a15': 4_000_000,

  // ===== XIAOMI =====
  'xiaomi-14-ultra': 22_000_000,
  'xiaomi-14-pro': 18_000_000,
  'xiaomi-14': 15_000_000,
  'xiaomi-13-ultra': 18_000_000,
  'xiaomi-13-pro': 15_000_000,
  'xiaomi-13': 13_000_000,
  'xiaomi-12-pro': 12_000_000,
  'xiaomi-redmi-note-13-pro+': 9_000_000,
  'xiaomi-redmi-note-13-pro': 7_500_000,
  'xiaomi-redmi-note-13': 6_000_000,
  'xiaomi-redmi-note-12-pro': 6_500_000,
  'xiaomi-redmi-12': 4_500_000,
  'xiaomi-poco-x6-pro': 9_000_000,
  'xiaomi-poco-x6': 7_000_000,
  'xiaomi-poco-f5': 8_000_000,

  // ===== OPPO =====
  'oppo-find-x8-pro': 22_000_000,
  'oppo-find-x8': 18_000_000,
  'oppo-find-x7-ultra': 22_000_000,
  'oppo-find-x7': 18_000_000,
  'oppo-find-n3-flip': 18_000_000,
  'oppo-reno-12-pro': 11_000_000,
  'oppo-reno-12': 9_000_000,
  'oppo-reno-11-pro': 9_500_000,
  'oppo-reno-11': 8_000_000,
  'oppo-reno-10-pro': 8_500_000,
  'oppo-a3-pro': 6_500_000,
  'oppo-a3': 5_000_000,

  // ===== VIVO =====
  'vivo-x100-ultra': 24_000_000,
  'vivo-x100-pro': 22_000_000,
  'vivo-x100': 18_000_000,
  'vivo-v30-pro': 11_000_000,
  'vivo-v30': 9_000_000,
  'vivo-v29-pro': 9_500_000,
  'vivo-v29': 8_000_000,

  // ===== REALME =====
  'realme-gt-6': 12_000_000,
  'realme-gt-5-pro': 13_000_000,
  'realme-12-pro+': 8_000_000,
  'realme-12-pro': 7_000_000,
  'realme-c65': 4_000_000,

  // ===== ONEPLUS =====
  'oneplus-12': 18_000_000,
  'oneplus-11': 14_000_000,
  'oneplus-open': 28_000_000,
}

/**
 * Chuẩn hóa tên model thành slug để tra cứu trong mock data
 */
export function toModelSlug(brand: string, model: string): string {
  const combined = `${brand} ${model}`
  return combined
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-+]/g, '')
    .replace(/-+/g, '-')
    .trim()
}

/**
 * Tìm giá trong mock data với fuzzy matching
 * - Exact match trước
 * - Sau đó partial match
 */
export function findMarketPrice(brand: string, model: string): number | null {
  const slug = toModelSlug(brand, model)

  // Exact match
  if (MOCK_MARKET_PRICES[slug] !== undefined) {
    return MOCK_MARKET_PRICES[slug]
  }

  // Partial match: tìm key nào chứa slug hoặc slug chứa key
  for (const [key, price] of Object.entries(MOCK_MARKET_PRICES)) {
    if (slug.includes(key) || key.includes(slug)) {
      return price
    }
  }

  // Fuzzy: so sánh từng token
  const slugTokens = slug.split('-').filter((t) => t.length > 2)
  let bestMatch: { key: string; score: number } | null = null

  for (const key of Object.keys(MOCK_MARKET_PRICES)) {
    const keyTokens = key.split('-').filter((t) => t.length > 2)
    const matched = slugTokens.filter((t) => keyTokens.includes(t)).length
    const score = matched / Math.max(slugTokens.length, keyTokens.length)
    if (score > 0.6 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { key, score }
    }
  }

  return bestMatch ? (MOCK_MARKET_PRICES[bestMatch.key] ?? null) : null
}
