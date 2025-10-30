import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createMidjourneyImageService } from '@/lib/ai/midjourney-image'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 分钟超时

/**
 * POST /api/prototypes/blend
 * 使用 Midjourney Blend 功能混合多张图片生成新原型图
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      canvasImage,      // 画布导出的 base64 图片
      referenceImage,   // 参考图片的 base64
      dimensions = 'SQUARE',
      requirementId,
      projectId,
    } = body

    // 验证必填字段
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    if (!canvasImage || !referenceImage) {
      return NextResponse.json(
        { error: 'Both canvas image and reference image are required' },
        { status: 400 }
      )
    }

    const startTime = Date.now()

    console.log('🎨 Starting blend prototype generation...')
    console.log('📸 Canvas image length:', canvasImage.length)
    console.log('📸 Reference image length:', referenceImage.length)

    // 创建 Midjourney 服务实例
    const midjourneyService = createMidjourneyImageService()

    // 使用 blend 混合两张图片
    const blendResult = await midjourneyService.blend({
      images: [canvasImage, referenceImage],
      dimensions,
    })

    const generationTime = Date.now() - startTime

    console.log('💾 Saving blended prototype to database...')

    // 保存到数据库
    const prototype = await prisma.prototype.create({
      data: {
        title,
        description,
        generationType: 'blend',
        platform: 'industrial',
        styleType: 'industrial_hmi',
        imageUrl: blendResult.imageUrl,
        imagePath: `blend/${blendResult.metadata.taskId}`,
        imageMimeType: blendResult.mimeType,
        taskId: blendResult.metadata.taskId,
        modelUsed: 'midjourney-blend',
        generationTime,
        requirementId,
        projectId,
        status: 'final',
      },
    })

    console.log('✅ Blend prototype saved! ID:', prototype.id)

    return NextResponse.json({
      success: true,
      prototype: {
        id: prototype.id,
        title: prototype.title,
        imageUrl: prototype.imageUrl,
        taskId: prototype.taskId,
        generationTime,
      },
    })
  } catch (error) {
    console.error('❌ Blend prototype generation failed:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate blend prototype',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
