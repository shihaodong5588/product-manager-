import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 获取单个设计
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const design = await prisma.prototype.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true } },
        requirement: { select: { id: true, title: true } },
        parent: { select: { id: true, title: true, version: true } },
        children: { select: { id: true, title: true, version: true, updatedAt: true } },
      },
    })

    if (!design) {
      return NextResponse.json({ error: 'Design not found' }, { status: 404 })
    }

    return NextResponse.json({ design })
  } catch (error) {
    console.error('Error fetching design:', error)
    return NextResponse.json({ error: 'Failed to fetch design' }, { status: 500 })
  }
}

// 更新设计
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { title, description, canvasData, canvasSettings, status } = body

    const design = await prisma.prototype.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(canvasData !== undefined && { canvasData }),
        ...(canvasSettings !== undefined && { canvasSettings }),
        ...(status !== undefined && { status }),
      },
    })

    return NextResponse.json({ design })
  } catch (error) {
    console.error('Error updating design:', error)
    return NextResponse.json({ error: 'Failed to update design' }, { status: 500 })
  }
}

// 删除设计
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.prototype.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting design:', error)
    return NextResponse.json({ error: 'Failed to delete design' }, { status: 500 })
  }
}
