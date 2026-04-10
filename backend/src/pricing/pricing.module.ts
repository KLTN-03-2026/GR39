import { Module } from '@nestjs/common'
import { PricingController } from './pricing.controller'
import { VisionService } from './vision.service'
import { MarketService } from './market.service'
import { PricingCalculatorService } from './pricing-calculator.service'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [PricingController],
  providers: [VisionService, MarketService, PricingCalculatorService],
  exports: [PricingCalculatorService],
})
export class PricingModule {}
