import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsOptional } from 'class-validator'

export class EstimateRequestDto {
  @ApiProperty({ example: 'Apple' })
  @IsString()
  brand: string

  @ApiProperty({ example: 'iPhone 14 Pro Max' })
  @IsString()
  model: string

  @ApiPropertyOptional({ example: 'listing_id_here' })
  @IsOptional()
  @IsString()
  listingId?: string
}

// ---- Response types (không dùng class-validator, chỉ để Swagger) ----

export interface DamageBreakdownItem {
  part: string
  severity: number      // 0.0 → 1.0
  description: string
  weight: number
  deductionPercent: number // (w_i × d_i) × 100
}

export interface PriceRange {
  low: number
  high: number
}

export interface EstimateResponseDto {
  pMarket: number
  pFinal: number
  priceRange: PriceRange
  damageBreakdown: DamageBreakdownItem[]
  confidenceScore: number
  detectedModel: string
  overallCondition: string
  summary: string
  marketSummary: string
  dataPoints: number
}
