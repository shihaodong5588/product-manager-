import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createMidjourneyImageService } from '@/lib/ai/midjourney-image'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes

/**
 * POST /api/prototypes/[id]/describe
 * 从原型图提取提示词
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 获取原型图
    const prototype = await prisma.prototype.findUnique({
      where: { id },
    })

    if (!prototype) {
      return NextResponse.json(
        { error: 'Prototype not found' },
        { status: 404 }
      )
    }

    console.log(`Describing prototype: ${prototype.id}`)
    console.log(`Image URL: ${prototype.imageUrl}`)

    const midjourneyService = createMidjourneyImageService()

    // 提取提示词
    const prompts = await midjourneyService.describeImage(prototype.imageUrl)

    console.log(`✅ Extracted ${prompts.length} prompts`)

    // 可选：更新原型图的分析结果
    await prisma.prototype.update({
      where: { id },
      data: {
        analysisResult: {
          ...((prototype.analysisResult as any) || {}),
          extractedPrompts: prompts,
          extractedAt: new Date().toISOString(),
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        prompts,
        prototypeId: prototype.id,
      },
      message: 'Prompts extracted successfully',
    })
  } catch (error) {
    console.error('Error describing image:', error)
    return NextResponse.json(
      {
        error: 'Failed to describe image',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
