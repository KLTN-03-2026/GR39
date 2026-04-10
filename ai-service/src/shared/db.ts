import mongoose from 'mongoose'
import Redis from 'ioredis'

let redisClient: Redis | null = null

export async function connectMongoDB(): Promise<void> {
  const uri = process.env['MONGODB_URI'] ?? 'mongodb://localhost:27017/phonemarket'
  await mongoose.connect(uri)
  console.log('MongoDB connected')
}

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(process.env['REDIS_URL'] ?? 'redis://localhost:6379', {
      lazyConnect: true,
      enableOfflineQueue: false,
    })
    redisClient.on('error', (err) => {
      console.warn('Redis error (non-fatal):', err.message)
    })
  }
  return redisClient
}
