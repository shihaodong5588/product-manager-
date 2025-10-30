import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createGeminiImageService } from '@/lib/ai/gemini-image'
import { uploadPrototypeImage, downloadImageAsBuffer, bufferToBase64 } from '@/lib/supabase-storage'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/prototypes/analyze
 * 分析上传的原型图/线框图
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      imageBase64, // Base64 编码的图片
      imageMimeType = 'image/png',
      analysisType = 'wireframe_analysis',
      platform = 'web',
      styleType = 'wireframe',
      requirementId,
      projectId,
    } = body

    // 验证必填字段
    if (!title || !imageBase64) {
      return NextResponse.json(
        { error: 'Title and image are required' },
        { status: 400 }
      )
    }

    const startTime = Date.now()

    // 创建 Gemini Image Service 实例
    const geminiService = createGeminiImageService()

    // 使用 Gemini Vision 分析图片
    const analysisResult = await geminiService.analyzePrototypeImage({
      imageBase64,
      mimeType: imageMimeType,
      analysisType,
    })

    // 上传图片到 Supabase Storage
    const imageBuffer = Buffer.from(imageBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64')
    const uploadResult = await uploadPrototypeImage(
      imageBuffer,
      `${title.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.${imageMimeType.split('/')[1]}`
    )

    const generationTime = Date.now() - startTime

    // 创建数据库记录
    const prototype = await prisma.prototype.create({
      data: {
        title,
        description,
        generationType: 'image_analysis',
        platform,
        styleType,

        // Supabase Storage 信息
        imageUrl: uploadResult.url,
        imagePath: uploadResult.path,
        imageSize: uploadResult.size,
        imageMimeType,

        // 用户上传的原始图片
        sourceImageUrl: uploadResult.url,

        // AI 分析结果
        analysisResult: analysisResult.structuredData || {},
        suggestions: analysisResult.analysis,
        identifiedComponents: analysisResult.structuredData?.components || [],

        // 关联
        requirementId: requirementId || null,
        projectId: projectId || null,

        // 元数据
        modelUsed: 'gemini-2.5-flash',
        generationTime,
        promptTokens: analysisResult.metadata.tokensUsed,

        status: 'draft',
      },
      include: {
        requirement: true,
        project: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: prototype,
      analysis: analysisResult.analysis,
      message: 'Prototype analyzed successfully',
    })

  } catch (error) {
    console.error('Error analyzing prototype:', error)
    return NextResponse.json(
      {
        error: 'Failed to analyze prototype',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
