import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { deletePrototypeImage } from '@/lib/supabase-storage'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/prototypes/[id]
 * 获取单个原型图详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const prototype = await prisma.prototype.findUnique({
      where: { id },
      include: {
        requirement: true,
        project: true,
        parent: {
          select: {
            id: true,
            title: true,
            version: true,
            imageUrl: true,
            createdAt: true,
          },
        },
        children: {
          select: {
            id: true,
            title: true,
            version: true,
            imageUrl: true,
            createdAt: true,
          },
          orderBy: {
            version: 'asc',
          },
        },
      },
    })

    if (!prototype) {
      return NextResponse.json(
        { error: 'Prototype not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: prototype,
    })
  } catch (error) {
    console.error('Error fetching prototype:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch prototype',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/prototypes/[id]
 * 更新原型图
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      title,
      description,
      status,
      platform,
      styleType,
      requirementId,
      projectId,
    } = body

    // 检查原型图是否存在
    const existing = await prisma.prototype.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Prototype not found' },
        { status: 404 }
      )
    }

    // 构建更新数据
    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (status !== undefined) updateData.status = status
    if (platform !== undefined) updateData.platform = platform
    if (styleType !== undefined) updateData.styleType = styleType
    if (requirementId !== undefined) updateData.requirementId = requirementId
    if (projectId !== undefined) updateData.projectId = projectId

    // 更新原型图
    const prototype = await prisma.prototype.update({
      where: { id },
      data: updateData,
      include: {
        requirement: true,
        project: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: prototype,
      message: 'Prototype updated successfully',
    })
  } catch (error) {
    console.error('Error updating prototype:', error)
    return NextResponse.json(
      {
        error: 'Failed to update prototype',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/prototypes/[id]
 * 删除原型图
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 获取原型图信息
    const prototype = await prisma.prototype.findUnique({
      where: { id },
      include: {
        children: true,
      },
    })

    if (!prototype) {
      return NextResponse.json(
        { error: 'Prototype not found' },
        { status: 404 }
      )
    }

    // 检查是否有子版本
    if (prototype.children.length > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete prototype with child versions. Please delete child versions first.',
          childrenCount: prototype.children.length,
        },
        { status: 400 }
      )
    }

    // 删除 Supabase Storage 中的图片
    if (prototype.imagePath) {
      try {
        await deletePrototypeImage(prototype.imagePath)
      } catch (error) {
        console.error('Failed to delete image from storage:', error)
        // 继续删除数据库记录，即使图片删除失败
      }
    }

    // 删除数据库记录
    await prisma.prototype.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Prototype deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting prototype:', error)
    return NextResponse.json(
      {
        error: 'Failed to delete prototype',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
