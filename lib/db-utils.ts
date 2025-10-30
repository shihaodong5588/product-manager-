import { PrismaClient } from '@prisma/client'

/**
 * 数据库连接工具类
 * 提供健康检查、自动重试、连接预热等功能
 */

// 重试配置
const RETRY_CONFIG = {
  maxRetries: 5,
  initialDelay: 1000, // 1秒
  maxDelay: 10000, // 10秒
  backoffMultiplier: 1.5,
}

// 连接状态
let isConnected = false
let lastHealthCheck = 0
const HEALTH_CHECK_INTERVAL = 30000 // 30秒

/**
 * 指数退避延迟
 */
function getRetryDelay(retryCount: number): number {
  const delay = Math.min(
    RETRY_CONFIG.initialDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, retryCount),
    RETRY_CONFIG.maxDelay
  )
  return delay
}

/**
 * 延迟执行
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * 检查数据库连接健康状态
 */
export async function checkDatabaseHealth(prisma: PrismaClient): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    isConnected = true
    lastHealthCheck = Date.now()
    return true
  } catch (error) {
    isConnected = false
    console.error('数据库健康检查失败:', error)
    return false
  }
}

/**
 * 预热数据库连接
 * 在应用启动时调用，确保数据库连接可用
 */
export async function warmupDatabaseConnection(prisma: PrismaClient): Promise<boolean> {
  console.log('正在预热数据库连接...')

  for (let i = 0; i < RETRY_CONFIG.maxRetries; i++) {
    try {
      const isHealthy = await checkDatabaseHealth(prisma)
      if (isHealthy) {
        console.log('✓ 数据库连接预热成功')
        return true
      }
    } catch (error) {
      console.log(`预热尝试 ${i + 1}/${RETRY_CONFIG.maxRetries} 失败`)
    }

    if (i < RETRY_CONFIG.maxRetries - 1) {
      const delay = getRetryDelay(i)
      console.log(`等待 ${delay}ms 后重试...`)
      await sleep(delay)
    }
  }

  console.error('✗ 数据库连接预热失败')
  return false
}

/**
 * 执行数据库操作，带自动重试
 */
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  operationName: string = '数据库操作'
): Promise<T> {
  let lastError: any

  for (let i = 0; i < RETRY_CONFIG.maxRetries; i++) {
    try {
      const result = await operation()

      // 操作成功后更新连接状态
      if (!isConnected) {
        isConnected = true
        console.log('✓ 数据库连接已恢复')
      }

      return result
    } catch (error: any) {
      lastError = error

      // 检查是否是连接错误
      const isConnectionError =
        error.code === 'P1001' || // 无法连接到数据库
        error.code === 'P1002' || // 数据库服务器超时
        error.errorCode === undefined || // 初始化错误
        error.message?.includes("Can't reach database")

      if (!isConnectionError) {
        // 如果不是连接错误，直接抛出
        throw error
      }

      isConnected = false

      if (i < RETRY_CONFIG.maxRetries - 1) {
        const delay = getRetryDelay(i)
        console.log(
          `${operationName}失败 (尝试 ${i + 1}/${RETRY_CONFIG.maxRetries})，` +
          `${delay}ms 后重试...`
        )
        await sleep(delay)
      } else {
        console.error(`${operationName}失败，已达到最大重试次数`)
      }
    }
  }

  // 所有重试都失败，抛出最后一个错误
  throw lastError
}

/**
 * 获取连接状态
 */
export function getDatabaseStatus() {
  return {
    isConnected,
    lastHealthCheck,
    timeSinceLastCheck: Date.now() - lastHealthCheck,
  }
}

/**
 * 包装Prisma查询，自动添加重试逻辑
 */
export function withRetry<T>(promise: Promise<T>, operationName?: string): Promise<T> {
  return executeWithRetry(() => promise, operationName)
}
