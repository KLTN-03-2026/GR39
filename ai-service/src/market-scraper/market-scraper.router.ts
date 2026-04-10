import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { getMarketPrice } from './market-scraper.service'

export const marketScraperRouter = Router()

const QuerySchema = z.object({
  brand: z.string().min(1),
  model: z.string().min(1),
})

// GET /market/price?brand=Apple&model=iPhone+14+Pro+Max
marketScraperRouter.get('/price', async (req: Request, res: Response) => {
  const parsed = QuerySchema.safeParse(req.query)
  if (!parsed.success) {
    res.status(400).json({ error: 'brand và model là bắt buộc' })
    return
  }

  const result = await getMarketPrice(parsed.data.brand, parsed.data.model)
  res.json(result)
})
