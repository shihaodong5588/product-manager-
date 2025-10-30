import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/prototypes
 * 获取原型图列表
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const requirementId = searchParams.get('requirementId')
    const status = searchParams.get('status')
    const platform = searchParams.get('platform')
    const styleType = searchParams.get('styleType')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // 构建查询条件
    const where: any = {}
    if (projectId) where.projectId = projectId
    if (requirementId) where.requirementId = requirementId
    if (status) where.status = status
    if (platform) where.platform = platform
    if (styleType) where.styleType = styleType

    // 获取原型图列表
    const [prototypes, total] = await Promise.all([
      prisma.prototype.findMany({
        where,
        include: {
          requirement: {
            select: {
              id: true,
              title: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
            },
          },
          parent: {
            select: {
              id: true,
              title: true,
              version: true,
            },
          },
          children: {
            select: {
              id: true,
              title: true,
              version: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.prototype.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: prototypes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching prototypes:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch prototypes',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
