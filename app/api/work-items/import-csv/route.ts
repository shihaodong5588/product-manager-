import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { csvData } = await request.json()

    // CSV格式: 每行是一个工作项，第一行是标题
    const lines = csvData.trim().split('\n')
    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV文件为空或格式不正确' }, { status: 400 })
    }

    const headers: string[] = lines[0].split(',').map((h: string) => h.trim())
    const workItems = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v: string) => v.trim())
      const item: any = {}

      headers.forEach((header, index) => {
        const value = values[index]
        // 映射CSV字段到数据库字段
        switch (header) {
          case '标题':
            item.title = value
            break
          case '描述':
            item.description = value || null
            break
          case '工作项类型':
            item.workItemType = value || 'REQUIREMENT'
            break
          case '工作类别':
            item.workCategory = value || 'PRODUCT_REQUIREMENT'
            break
          case '优先级':
            item.priority = value || 'MEDIUM'
            break
          case '状态':
            item.status = value || 'NEW'
            break
          case '负责人':
            item.assigneeName = value || null
            break
          case '报告人':
            item.reporterName = value || null
            break
          case '预估工时':
            item.estimatedHours = value ? parseFloat(value) : null
            break
          case '实际工时':
            item.actualHours = value ? parseFloat(value) : null
            break
          case '项目':
            item.projectName = value || null
            break
          case '版本':
            item.version = value || null
            break
          case '模块':
            item.module = value || null
            break
          case '严重程度':
            item.severity = value || null
            break
          case '解决方案':
            item.resolution = value || null
            break
          case '测试结果':
            item.testResult = value || null
            break
          case '备注':
            item.remarks = value || null
            break
        }
      })

      if (item.title) {
        workItems.push(item)
      }
    }

    // 批量创建工作项
    const created = await prisma.workItem.createMany({
      data: workItems,
      skipDuplicates: true,
    })

    return NextResponse.json({
      message: `成功导入 ${created.count} 个工作项`,
      count: created.count,
    })
  } catch (error) {
    console.error('导入CSV失败:', error)
    return NextResponse.json({ error: '导入CSV失败' }, { status: 500 })
  }
}
