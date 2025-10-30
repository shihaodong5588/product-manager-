import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createMidjourneyImageService } from '@/lib/ai/midjourney-image'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes

/**
 * POST /api/prototypes/[id]/upscale
 * 放大原型图
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { index = 1 } = await request.json()

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
        { error: 'Original prototype missing taskId. Cannot upscale.' },
        { status: 400 }
      )
    }

    console.log(`Upscaling prototype: ${original.id}`)
    console.log(`Original task ID: ${original.taskId}, Index: ${index}`)

    const midjourneyService = createMidjourneyImageService()

    // 放大图片
    const result = await midjourneyService.upscaleImage({
      taskId: original.taskId,
      index,
    })

    // 计算版本号
    const childrenCount = await prisma.prototype.count({
      where: { parentId: original.id },
    })
    const newVersion = childrenCount + 1

    // 保存到数据库
    const upscaled = await prisma.prototype.create({
      data: {
        title: `${original.title} - 放大版`,
        description: original.description,
        generationType: 'upscale',
        platform: original.platform,
        styleType: original.styleType,
        promptText: original.promptText,

        imageUrl: result.imageUrl,
        imagePath: result.metadata.taskId,
        taskId: result.metadata.taskId,
        imageIndex: index,

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

    console.log(`✅ Upscaled image created: ${upscaled.id}`)

    return NextResponse.json({
      success: true,
      data: upscaled,
      message: 'Image upscaled successfully',
    })
  } catch (error) {
    console.error('Error upscaling image:', error)
    return NextResponse.json(
      {
        error: 'Failed to upscale image',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
