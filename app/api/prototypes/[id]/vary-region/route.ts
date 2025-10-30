import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createMidjourneyImageService } from '@/lib/ai/midjourney-image'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes

/**
 * POST /api/prototypes/[id]/vary-region
 * 局部编辑原型图（Vary Region）
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { maskDataUrl, prompt, editRegionData } = await request.json()

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
        { error: 'Original prototype missing taskId. Cannot vary region.' },
        { status: 400 }
      )
    }

    if (!maskDataUrl || !prompt) {
      return NextResponse.json(
        { error: 'maskDataUrl and prompt are required' },
        { status: 400 }
      )
    }

    console.log(`Varying region for prototype: ${original.id}`)
    console.log(`Original task ID: ${original.taskId}`)

    const midjourneyService = createMidjourneyImageService()

    // 执行 Vary Region 操作
    const result = await midjourneyService.varyRegion({
      taskId: original.taskId,
      imageUrl: original.imageUrl, // 传递原始图片URL
      maskDataUrl,
      prompt,
    })

    // 计算版本号
    const childrenCount = await prisma.prototype.count({
      where: { parentId: original.id },
    })
    const newVersion = childrenCount + 1

    // 保存到数据库
    const varyRegionPrototype = await prisma.prototype.create({
      data: {
        title: `${original.title} - 局部编辑 ${newVersion}`,
        description: prompt,
        generationType: 'vary_region',
        platform: original.platform,
        styleType: original.styleType,
        promptText: prompt,

        imageUrl: result.imageUrl,
        imagePath: result.metadata.taskId,
        taskId: result.metadata.taskId,

        // 保存遮罩和编辑区域信息
        maskImageUrl: maskDataUrl,
        editRegionData: editRegionData || null,

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

    console.log(`✅ Vary Region image created: ${varyRegionPrototype.id}`)

    return NextResponse.json({
      success: true,
      data: varyRegionPrototype,
      message: 'Region edited successfully',
    })
  } catch (error) {
    console.error('Error varying region:', error)
    return NextResponse.json(
      {
        error: 'Failed to vary region',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
