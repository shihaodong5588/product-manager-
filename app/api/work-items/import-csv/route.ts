import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { csvData } = await request.json()

    // CSV格式: 每行是一个工作项，第一行是标题
    const lines = csvData.trim().split('\n')
    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV文件为空或格式不正确' }, { status: 400 })
    }

    // 中文标签到枚举值的反向映射
    const workCategoryMap: Record<string, string> = {
      '行业跟踪及竞对分析': 'INDUSTRY_TRACKING',
      '产品需求分析及产品定义': 'PRODUCT_REQUIREMENT',
      '产品开发项目及生命周期管理': 'PROJECT_MANAGEMENT',
      '业务线支持及跨部门组织工作': 'BUSINESS_SUPPORT',
      '专业能力学习': 'PROFESSIONAL_LEARNING',
      '其它任务': 'OTHER_TASKS',
    }

    const workItemTypeMap: Record<string, string> = {
      '需求': 'REQUIREMENT',
      '缺陷': 'DEFECT',
      '任务': 'TASK',
      '改进': 'IMPROVEMENT',
    }

    const priorityMap: Record<string, string> = {
      '低': 'LOW',
      '中': 'MEDIUM',
      '高': 'HIGH',
    }

    const statusMap: Record<string, string> = {
      '新建': 'NEW',
      '已分配': 'ASSIGNED',
      '进行中': 'IN_PROGRESS',
      '审核中': 'IN_REVIEW',
      '已解决': 'RESOLVED',
      '已关闭': 'CLOSED',
      '已拒绝': 'REJECTED',
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
            // 将中文标签转换为枚举值
            item.workItemType = workItemTypeMap[value] || value || 'REQUIREMENT'
            break
          case '工作类别':
            // 将中文标签转换为枚举值
            item.workCategory = workCategoryMap[value] || value || 'PRODUCT_REQUIREMENT'
            break
          case '优先级':
            // 将中文标签转换为枚举值
            item.priority = priorityMap[value] || value || 'MEDIUM'
            break
          case '状态':
            // 将中文标签转换为枚举值
            item.status = statusMap[value] || value || 'NEW'
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
