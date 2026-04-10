import { Injectable } from '@nestjs/common'
import { DamageItem } from './vision.service'
import { DamageBreakdownItem, EstimateResponseDto, PriceRange } from './dto/estimate.dto'

@Injectable()
export class PricingCalculatorService {
  /**
   * P_final = P_market × ∏(1 - w_i × d_i)
   *
   * Trọng số:
   *   screen  = 0.40
   *   battery = 0.20
   *   housing = 0.20
   *   camera  = 0.15
   *   other   = 0.05
   */
  calculate(
    pMarket: number,
    damages: DamageItem[],
    confidenceScore: number,
    priceRange: PriceRange,
    detectedModel: string,
    overallCondition: string,
    summary: string,
    marketSummary: string,
    dataPoints: number,
  ): EstimateResponseDto {
    const damageBreakdown: DamageBreakdownItem[] = damages.map((d) => ({
      part: d.part,
      severity: d.severity,
      description: d.description,
      weight: d.weight,
      deductionPercent: Math.round(d.weight * d.severity * 100 * 10) / 10,
    }))

    // Tính P_final bằng công thức nhân liên tiếp
    const multiplier = damages.reduce((acc, d) => acc * (1 - d.weight * d.severity), 1)
    const pFinal = pMarket > 0 ? Math.round((pMarket * multiplier) / 100_000) * 100_000 : 0

    // Price range cho P_final dựa trên confidence score
    // confidence thấp → khoảng giá rộng hơn
    const spread = (1 - confidenceScore) * 0.10 + 0.03 // 3–13%
    const estimatedPriceRange: PriceRange = pFinal > 0
      ? {
          low: Math.round((pFinal * (1 - spread)) / 100_000) * 100_000,
          high: Math.round((pFinal * (1 + spread)) / 100_000) * 100_000,
        }
      : priceRange

    return {
      pMarket,
      pFinal,
      priceRange: estimatedPriceRange,
      damageBreakdown,
      confidenceScore,
      detectedModel,
      overallCondition,
      summary,
      marketSummary,
      dataPoints,
    }
  }
}
