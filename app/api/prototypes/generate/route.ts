import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createMidjourneyImageService } from '@/lib/ai/midjourney-image'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 设置最大执行时间为 5 分钟

/**
 * POST /api/prototypes/generate
 * 生成原型图（使用 Midjourney API）
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      promptText,
      platform = 'web',
      styleType = 'wireframe',
      requirementId,
      projectId,
    } = body

    // 验证必填字段
    if (!title || !promptText) {
      return NextResponse.json(
        { error: 'Title and prompt text are required' },
        { status: 400 }
      )
    }

    const startTime = Date.now()

    // 创建 Midjourney Image Service 实例
    const midjourneyService = createMidjourneyImageService()

    // 使用 Midjourney 生成真实的原型图
    console.log('🎨 Starting prototype image generation with Midjourney...')
    const imageResult = await midjourneyService.generatePrototypeImage({
      prompt: promptText,
      platform,
      styleType,
      translate: true, // 自动翻译中文为英文
    })

    const generationTime = Date.now() - startTime

    console.log('💾 Saving to database...')
    // 创建数据库记录
    // 注意: Midjourney 返回的是图片 URL，直接存储，不需要上传到 Supabase Storage
    const prototype = await prisma.prototype.create({
      data: {
        title,
        description,
        generationType: 'text_to_image',
        platform,
        styleType,
        promptText,

        // 直接使用 Midjourney 返回的图片 URL
        imageUrl: imageResult.imageUrl,
        imagePath: imageResult.metadata.taskId, // 存储 task ID 作为 path
        imageSize: 0, // Midjourney 不提供图片大小
        imageMimeType: imageResult.mimeType,

        // Midjourney 特有字段
        taskId: imageResult.metadata.taskId, // 保存 taskId 用于后续 Vary/Upscale 操作

        // AI 元数据
        analysisResult: {
          generatedAt: new Date().toISOString(),
          prompt: promptText,
          taskId: imageResult.metadata.taskId,
          progress: imageResult.metadata.progress,
        },

        // 关联
        requirementId: requirementId || null,
        projectId: projectId || null,

        // 元数据
        modelUsed: 'midjourney',
        generationTime: imageResult.metadata.generationTime,
        promptTokens: null,

        status: 'draft',
      },
      include: {
        requirement: true,
        project: true,
      },
    })

    console.log('✅ Prototype generated successfully!')

    return NextResponse.json({
      success: true,
      data: prototype,
      message: 'Prototype image generated successfully using Midjourney!',
    })

  } catch (error) {
    console.error('Error generating prototype:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate prototype',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
