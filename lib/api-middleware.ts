import { NextResponse } from 'next/server'
import { executeWithRetry } from './db-utils'

/**
 * API响应类型
 */
type ApiHandler<T = any> = () => Promise<T>

/**
 * API中间件 - 统一处理数据库操作和错误
 *
 * 使用方法:
 * export async function GET() {
 *   return withDatabaseRetry(async () => {
 *     const data = await prisma.workItem.findMany()
 *     return NextResponse.json(data)
 *   })
 * }
 */
export async function withDatabaseRetry<T>(
  handler: ApiHandler<T>,
  options?: {
    operationName?: string
    onError?: (error: any) => NextResponse
  }
): Promise<T | NextResponse> {
  try {
    // 使用重试逻辑执行处理器
    const result = await executeWithRetry(
      handler,
      options?.operationName || 'API请求'
    )
    return result
  } catch (error: any) {
    console.error('API错误:', error)

    // 如果提供了自定义错误处理器，使用它
    if (options?.onError) {
      return options.onError(error)
    }

    // 默认错误处理
    return handleApiError(error)
  }
}

/**
 * 处理API错误，返回适当的响应
 */
function handleApiError(error: any): NextResponse {
  // 数据库连接错误
  if (
    error.code === 'P1001' ||
    error.code === 'P1002' ||
    error.message?.includes("Can't reach database")
  ) {
    return NextResponse.json(
      {
        error: '数据库连接超时',
        message: '数据库服务暂时不可用，请稍后重试',
        code: 'DATABASE_CONNECTION_ERROR',
        retryable: true,
      },
      { status: 503 } // Service Unavailable
    )
  }

  // 数据库查询错误
  if (error.code?.startsWith('P')) {
    return NextResponse.json(
      {
        error: '数据库查询失败',
        message: error.message,
        code: error.code,
        retryable: false,
      },
      { status: 400 }
    )
  }

  // 通用错误
  return NextResponse.json(
    {
      error: '服务器错误',
      message: error.message || '未知错误',
      code: 'INTERNAL_SERVER_ERROR',
      retryable: false,
    },
    { status: 500 }
  )
}

/**
 * 包装异步API处理器，确保总是返回NextResponse
 */
export function apiHandler<T>(
  handler: () => Promise<NextResponse | T>,
  options?: {
    operationName?: string
  }
): Promise<NextResponse> {
  return withDatabaseRetry(
    async () => {
      const result = await handler()
      // 如果handler已经返回NextResponse，直接返回
      if (result instanceof NextResponse) {
        return result
      }
      // 否则包装成NextResponse
      return NextResponse.json(result)
    },
    options
  ) as Promise<NextResponse>
}
