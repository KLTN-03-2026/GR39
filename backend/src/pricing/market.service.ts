import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

export interface MarketPriceResult {
  pMarket: number
  priceRange: { low: number; high: number }
  marketSummary: string
  dataPoints: number
}

@Injectable()
export class MarketService {
  private readonly logger = new Logger(MarketService.name)

  constructor(private config: ConfigService) {}

  async getMarketPrice(brand: string, model: string): Promise<MarketPriceResult> {
    const aiServiceUrl = this.config.get<string>('AI_SERVICE_URL') ?? 'http://localhost:3002'

    try {
      const params = new URLSearchParams({ brand, model })
      const response = await fetch(`${aiServiceUrl}/market/price?${params.toString()}`, {
        signal: AbortSignal.timeout(10_000),
      })

      if (!response.ok) {
        throw new Error(`ai-service responded ${response.status}`)
      }

      const data = (await response.json()) as MarketPriceResult & { pMarket: number }

      // Model không tìm thấy trong database
      if (data.pMarket === 0) {
        return { pMarket: 0, priceRange: { low: 0, high: 0 }, marketSummary: data.marketSummary, dataPoints: 0 }
      }

      return {
        pMarket: data.pMarket,
        priceRange: data.priceRange,
        marketSummary: data.marketSummary,
        dataPoints: data.dataPoints,
      }
    } catch (err) {
      this.logger.warn(`Market price fetch failed: ${(err as Error).message}`)
      return { pMarket: 0, priceRange: { low: 0, high: 0 }, marketSummary: 'Không thể lấy giá thị trường', dataPoints: 0 }
    }
  }
}
