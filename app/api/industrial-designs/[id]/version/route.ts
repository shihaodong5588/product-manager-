import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 创建设计的新版本
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { title, description, canvasData, canvasSettings } = body

    // 获取原始设计
    const original = await prisma.prototype.findUnique({
      where: { id },
    })

    if (!original) {
      return NextResponse.json({ error: 'Original design not found' }, { status: 404 })
    }

    // 计算新版本号
    const newVersion = original.version + 1

    // 创建新版本
    const newDesign = await prisma.prototype.create({
      data: {
        title: title || `${original.title} - v${newVersion}`,
        description: description || original.description,
        generationType: 'canvas_design',
        platform: 'industrial',
        styleType: 'industrial_hmi',
        canvasData: canvasData || original.canvasData,
        canvasSettings: canvasSettings || original.canvasSettings,
        projectId: original.projectId,
        requirementId: original.requirementId,
        parentId: id,
        version: newVersion,
        modelUsed: 'canvas_editor',
        status: 'draft',
      },
    })

    return NextResponse.json({ design: newDesign }, { status: 201 })
  } catch (error) {
    console.error('Error creating new version:', error)
    return NextResponse.json({ error: 'Failed to create new version' }, { status: 500 })
  }
}
