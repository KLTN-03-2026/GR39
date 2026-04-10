import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { analyzeDevice } from './gemini-vision.service'

export const geminiVisionRouter = Router()

const AnalyzeRequestSchema = z.object({
  modelName: z.string().min(1),
  brand: z.string().min(1),
  imageBase64s: z.array(z.string()).min(1).max(10),
  imageMimeTypes: z.array(z.string()).optional(),
  listingId: z.string().optional(),
})

geminiVisionRouter.post('/analyze-device', async (req: Request, res: Response) => {
  const parsed = AnalyzeRequestSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() })
    return
  }

  const { modelName, brand, imageBase64s, imageMimeTypes, listingId } = parsed.data
  const result = await analyzeDevice(modelName, brand, imageBase64s, listingId, imageMimeTypes)
  res.json(result)
})
