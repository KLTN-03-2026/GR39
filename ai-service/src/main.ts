import express from 'express'
import dotenv from 'dotenv'
import { connectMongoDB } from './shared/db'
import { geminiVisionRouter } from './gemini-vision/gemini-vision.router'
import { marketScraperRouter } from './market-scraper/market-scraper.router'

dotenv.config()

const app = express()
app.use(express.json({ limit: '50mb' })) // base64 ảnh có thể lớn
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'ai-service' })
})

// Routes Phase 3
app.use('/ai', geminiVisionRouter)
app.use('/market', marketScraperRouter)

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err.message)
  res.status(500).json({ error: 'Internal server error' })
})

const PORT = process.env['PORT'] ?? 3002

async function bootstrap(): Promise<void> {
  try {
    await connectMongoDB()
  } catch (err) {
    console.warn('MongoDB connection failed (non-fatal):', err)
  }

  app.listen(PORT, () => {
    console.log(`AI Service running on port ${PORT}`)
  })
}

bootstrap()
