import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - 获取单个工作项
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const workItem = await prisma.workItem.findUnique({
      where: { id },
    })

    if (!workItem) {
      return NextResponse.json({ error: '工作项不存在' }, { status: 404 })
    }

    return NextResponse.json(workItem)
  } catch (error) {
    console.error('获取工作项失败:', error)
    return NextResponse.json({ error: '获取工作项失败' }, { status: 500 })
  }
}

// PUT - 更新工作项
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const workItem = await prisma.workItem.update({
      where: { id },
      data: body,
    })

    return NextResponse.json(workItem)
  } catch (error) {
    console.error('更新工作项失败:', error)
    return NextResponse.json({ error: '更新工作项失败' }, { status: 500 })
  }
}

// DELETE - 删除工作项
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.workItem.delete({
      where: { id },
    })

    return NextResponse.json({ message: '删除成功' })
  } catch (error) {
    console.error('删除工作项失败:', error)
    return NextResponse.json({ error: '删除工作项失败' }, { status: 500 })
  }
}
