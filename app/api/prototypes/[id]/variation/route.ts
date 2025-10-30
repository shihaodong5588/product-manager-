import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createMidjourneyImageService } from '@/lib/ai/midjourney-image'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes

/**
 * POST /api/prototypes/[id]/variation
 * 基于原型图生成变体
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { customPrompt, index = 1 } = await request.json()

    // 获取原始原型图
    const original = await prisma.prototype.findUnique({
      where: { id },
    })

    if (!original) {
      return NextResponse.json(
        { error: 'Original prototype not found' },
        { status: 404 }
      )
    }

    if (!original.taskId) {
      return NextResponse.json(
        { error: 'Original prototype missing taskId. Cannot create variation.' },
        { status: 400 }
      )
    }

    console.log(`Creating variation for prototype: ${original.id}`)
    console.log(`Original task ID: ${original.taskId}`)

    const midjourneyService = createMidjourneyImageService()

    // 生成变体
    const result = await midjourneyService.createVariation({
      taskId: original.taskId,
      index,
      customPrompt,
    })

    // 计算版本号
    const childrenCount = await prisma.prototype.count({
      where: { parentId: original.id },
    })
    const newVersion = childrenCount + 1

    // 保存到数据库
    const variation = await prisma.prototype.create({
      data: {
        title: customPrompt
          ? `${original.title} - ${customPrompt.substring(0, 30)}...`
          : `${original.title} - 变体 ${newVersion}`,
        description: customPrompt || original.description,
        generationType: 'variation',
        platform: original.platform,
        styleType: original.styleType,
        promptText: customPrompt || original.promptText,

        imageUrl: result.imageUrl,
        imagePath: result.metadata.taskId,
        taskId: result.metadata.taskId,

        parentId: original.id, // 关联父图
        version: newVersion,

        modelUsed: 'midjourney',
        generationTime: result.metadata.generationTime,
        status: 'draft',

        // 继承关联
        requirementId: original.requirementId,
        projectId: original.projectId,
      },
      include: {
        parent: true,
        requirement: true,
        project: true,
      },
    })

    console.log(`✅ Variation created: ${variation.id}`)

    return NextResponse.json({
      success: true,
      data: variation,
      message: 'Variation created successfully',
    })
  } catch (error) {
    console.error('Error creating variation:', error)
    return NextResponse.json(
      {
        error: 'Failed to create variation',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
