import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createGeminiImageService } from '@/lib/ai/gemini-image'
import { downloadImageAsBuffer, bufferToBase64 } from '@/lib/supabase-storage'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/prototypes/iterate
 * 基于现有原型图进行迭代优化
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      parentPrototypeId, // 父原型图 ID
      feedback, // 用户反馈
      requirements, // 额外的需求说明
    } = body

    // 验证必填字段
    if (!parentPrototypeId || !feedback) {
      return NextResponse.json(
        { error: 'Parent prototype ID and feedback are required' },
        { status: 400 }
      )
    }

    // 获取父原型图
    const parentPrototype = await prisma.prototype.findUnique({
      where: { id: parentPrototypeId },
      include: {
        requirement: true,
        project: true,
      },
    })

    if (!parentPrototype) {
      return NextResponse.json(
        { error: 'Parent prototype not found' },
        { status: 404 }
      )
    }

    const startTime = Date.now()

    // 创建 Gemini Image Service 实例
    const geminiService = createGeminiImageService()

    // 如果父原型图有图片，下载并转换为 Base64
    let imageBase64 = ''
    let imageMimeType = parentPrototype.imageMimeType

    if (parentPrototype.imageUrl) {
      try {
        const imageBuffer = await downloadImageAsBuffer(parentPrototype.imageUrl)
        imageBase64 = bufferToBase64(imageBuffer, imageMimeType)
      } catch (error) {
        console.error('Failed to download parent prototype image:', error)
        // 如果下载失败，继续执行，但不包含图片
      }
    }

    // 使用 Gemini 进行迭代优化分析
    const optimizationResult = await geminiService.iteratePrototype(
      imageBase64,
      imageMimeType,
      feedback,
      requirements
    )

    const generationTime = Date.now() - startTime

    // 计算新版本号
    const newVersion = parentPrototype.version + 1

    // 创建新的原型图记录（作为迭代版本）
    const newPrototype = await prisma.prototype.create({
      data: {
        title: `${parentPrototype.title} (v${newVersion})`,
        description: `Iteration based on feedback: ${feedback.substring(0, 100)}${feedback.length > 100 ? '...' : ''}`,

        generationType: 'requirement_based',
        platform: parentPrototype.platform,
        styleType: parentPrototype.styleType,

        promptText: `Feedback: ${feedback}\n\n${requirements ? `Requirements: ${requirements}` : ''}`,

        // 暂时复用父原型图的图片（实际应该生成新图片）
        imageUrl: parentPrototype.imageUrl,
        imagePath: parentPrototype.imagePath,
        imageSize: parentPrototype.imageSize,
        imageMimeType: parentPrototype.imageMimeType,
        sourceImageUrl: parentPrototype.sourceImageUrl,

        // AI 分析结果
        analysisResult: optimizationResult.structuredData || {},
        suggestions: optimizationResult.analysis,
        identifiedComponents: optimizationResult.structuredData?.components || [],

        // 关联
        requirementId: parentPrototype.requirementId,
        projectId: parentPrototype.projectId,

        // 版本管理
        parentId: parentPrototypeId,
        version: newVersion,

        // 元数据
        modelUsed: 'gemini-2.5-flash',
        generationTime,
        promptTokens: optimizationResult.metadata.tokensUsed,

        status: 'draft',
      },
      include: {
        requirement: true,
        project: true,
        parent: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: newPrototype,
      optimization: optimizationResult.analysis,
      message: 'Prototype iteration created successfully',
    })

  } catch (error) {
    console.error('Error iterating prototype:', error)
    return NextResponse.json(
      {
        error: 'Failed to iterate prototype',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
