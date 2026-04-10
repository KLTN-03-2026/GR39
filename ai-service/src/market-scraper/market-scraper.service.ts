import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { getRedisClient } from '../shared/db'
import { MarketPriceRawModel } from '../shared/schemas/market-price-raw.schema'
import { findMarketPrice, toModelSlug } from './mock-data'

const REDIS_TTL_SECONDS = 24 * 60 * 60 // 24 giờ

export interface MarketPriceResult {
  brand: string
  model: string
  pMarket: number
  priceRange: { low: number; high: number }
  marketSummary: string
  dataPoints: number
  cachedAt: string
}

/**
 * Agent định giá thị trường sử dụng LangChain + mock data
 * Thực tế: thay mock data bằng dữ liệu scrape từ hội nhóm mạng xã hội
 */
export async function getMarketPrice(brand: string, model: string): Promise<MarketPriceResult> {
  const cacheKey = `market_price:${toModelSlug(brand, model)}`
  const redis = getRedisClient()

  // 1. Kiểm tra Redis cache
  try {
    const cached = await redis.get(cacheKey)
    if (cached) {
      return JSON.parse(cached) as MarketPriceResult
    }
  } catch {
    // Redis unavailable, continue without cache
  }

  // 2. "Scrape" dữ liệu (mock data mô phỏng dữ liệu thu thập từ thị trường)
  const basePrice = findMarketPrice(brand, model)

  if (!basePrice) {
    // Model không có trong database — trả về estimate mặc định
    const fallback: MarketPriceResult = {
      brand,
      model,
      pMarket: 0,
      priceRange: { low: 0, high: 0 },
      marketSummary: `Không tìm thấy dữ liệu thị trường cho ${brand} ${model}. Vui lòng nhập giá thủ công.`,
      dataPoints: 0,
      cachedAt: new Date().toISOString(),
    }
    return fallback
  }

  // 3. Tạo price range (±8% để phản ánh biến động thực tế)
  const variance = 0.08
  const priceRange = {
    low: Math.round(basePrice * (1 - variance) / 1_000_000) * 1_000_000,
    high: Math.round(basePrice * (1 + variance) / 1_000_000) * 1_000_000,
  }

  // 4. Dùng LangChain để tạo market summary chuyên nghiệp
  const marketSummary = await generateMarketSummary(brand, model, basePrice, priceRange)

  // 5. Lưu raw data vào MongoDB (non-blocking)
  void saveMarketPriceRaw(brand, model, basePrice)

  const result: MarketPriceResult = {
    brand,
    model,
    pMarket: basePrice,
    priceRange,
    marketSummary,
    dataPoints: Math.floor(Math.random() * 20) + 10, // mock số điểm dữ liệu thu thập
    cachedAt: new Date().toISOString(),
  }

  // 6. Cache kết quả vào Redis
  try {
    await redis.setex(cacheKey, REDIS_TTL_SECONDS, JSON.stringify(result))
  } catch {
    // Redis unavailable, skip cache
  }

  return result
}

/**
 * Dùng LangChain ChatPromptTemplate + Gemini để tạo phân tích thị trường
 */
async function generateMarketSummary(
  brand: string,
  model: string,
  pMarket: number,
  priceRange: { low: number; high: number },
): Promise<string> {
  const apiKey = process.env['GEMINI_API_KEY']

  // Fallback nếu không có API key
  if (!apiKey) {
    return `Giá thị trường ${brand} ${model} hiện dao động ${formatVND(priceRange.low)} – ${formatVND(priceRange.high)}, mức giá trung bình khoảng ${formatVND(pMarket)}.`
  }

  try {
    const llm = new ChatGoogleGenerativeAI({
      model: 'gemini-1.5-flash',
      apiKey,
      temperature: 0.3,
      maxOutputTokens: 150,
    })

    const prompt = ChatPromptTemplate.fromMessages([
      [
        'system',
        'Bạn là chuyên gia phân tích thị trường điện thoại cũ tại Việt Nam. Viết ngắn gọn, chuyên nghiệp bằng tiếng Việt.',
      ],
      [
        'human',
        `Tóm tắt giá thị trường cho {brand} {model} trong 1-2 câu:
- Giá trung bình: {pMarket}
- Khoảng giá: {pLow} – {pHigh}
Đề cập xu hướng giá và lý do ngắn gọn.`,
      ],
    ])

    const chain = prompt.pipe(llm).pipe(new StringOutputParser())
    const summary = await chain.invoke({
      brand,
      model,
      pMarket: formatVND(pMarket),
      pLow: formatVND(priceRange.low),
      pHigh: formatVND(priceRange.high),
    })

    return summary.trim()
  } catch {
    return `Giá thị trường ${brand} ${model} dao động ${formatVND(priceRange.low)} – ${formatVND(priceRange.high)}, trung bình ${formatVND(pMarket)}.`
  }
}

async function saveMarketPriceRaw(brand: string, model: string, price: number): Promise<void> {
  try {
    await MarketPriceRawModel.create({
      brand,
      model,
      source: 'mock_market_data_v1',
      price,
      condition: 'GOOD',
      rawText: `Mock market data for ${brand} ${model}: ${price} VND`,
      scrapedAt: new Date(),
    })
  } catch {
    // MongoDB unavailable, skip
  }
}

function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}
