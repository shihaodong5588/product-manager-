import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 获取所有工业原型设计
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const requirementId = searchParams.get('requirementId')

    const where = {
      generationType: 'canvas_design',
      platform: 'industrial',
      ...(projectId ? { projectId } : {}),
      ...(requirementId ? { requirementId } : {}),
    }

    const designs = await prisma.prototype.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        project: { select: { id: true, name: true } },
        requirement: { select: { id: true, title: true } },
      },
    })

    return NextResponse.json({ designs })
  } catch (error) {
    console.error('Error fetching designs:', error)
    return NextResponse.json({ error: 'Failed to fetch designs' }, { status: 500 })
  }
}

// 创建新的工业原型设计
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      canvasData,
      canvasSettings,
      projectId,
      requirementId,
    } = body

    const design = await prisma.prototype.create({
      data: {
        title,
        description,
        generationType: 'canvas_design',
        platform: 'industrial',
        styleType: 'industrial_hmi',
        canvasData,
        canvasSettings,
        projectId,
        requirementId,
        modelUsed: 'canvas_editor',
        status: 'draft',
      },
    })

    return NextResponse.json({ design }, { status: 201 })
  } catch (error) {
    console.error('Error creating design:', error)
    return NextResponse.json({ error: 'Failed to create design' }, { status: 500 })
  }
}
