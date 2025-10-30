import { PrismaClient } from '@prisma/client'
import { warmupDatabaseConnection } from './db-utils'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  isWarmedUp: boolean
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// 数据库连接预热 - 在应用启动时自动执行
if (!globalForPrisma.isWarmedUp) {
  globalForPrisma.isWarmedUp = true

  // 异步预热，不阻塞应用启动
  warmupDatabaseConnection(prisma)
    .then((success) => {
      if (success) {
        console.log('✓ 数据库连接已就绪')
      } else {
        console.warn('⚠ 数据库连接预热失败，将在首次请求时重试')
      }
    })
    .catch((error) => {
      console.error('✗ 数据库连接预热出错:', error)
    })
}
