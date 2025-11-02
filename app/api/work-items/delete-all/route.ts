import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiHandler } from '@/lib/api-middleware'

// DELETE - 删除所有工作项
export async function DELETE(request: NextRequest) {
  return apiHandler(async () => {
    const result = await prisma.workItem.deleteMany({})

    return NextResponse.json({
      success: true,
      message: `成功删除 ${result.count} 个工作项`,
      count: result.count,
    })
  }, { operationName: '删除所有工作项' })
}
