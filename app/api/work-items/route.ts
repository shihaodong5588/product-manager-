import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiHandler } from '@/lib/api-middleware'

// GET - 获取所有工作项（支持筛选和分页）
export async function GET(request: NextRequest) {
  return apiHandler(async () => {
    const { searchParams } = new URL(request.url)
    const workCategory = searchParams.get('workCategory')
    const workItemType = searchParams.get('workItemType')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '50')

    const where: any = {}
    if (workCategory) where.workCategory = workCategory
    if (workItemType) where.workItemType = workItemType
    if (status) where.status = status

    // 顺序执行查询，避免连接争用
    const workItems = await prisma.workItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    })

    const total = await prisma.workItem.count({ where })

    return NextResponse.json({
      workItems,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  }, { operationName: '获取工作项列表' })
}

// POST - 创建新工作项
export async function POST(request: NextRequest) {
  return apiHandler(async () => {
    const body = await request.json()

    const workItem = await prisma.workItem.create({
      data: body,
    })

    return NextResponse.json(workItem, { status: 201 })
  }, { operationName: '创建工作项' })
}
