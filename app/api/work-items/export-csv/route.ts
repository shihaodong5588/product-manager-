import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const workItems = await prisma.workItem.findMany({
      orderBy: { createdAt: 'desc' },
    })

    // CSV标题行
    const headers = [
      '标题',
      '描述',
      '工作项类型',
      '工作类别',
      '优先级',
      '状态',
      '负责人',
      '报告人',
      '预估工时',
      '实际工时',
      '开始日期',
      '截止日期',
      '完成日期',
      '项目',
      '版本',
      '模块',
      '严重程度',
      '解决方案',
      '测试结果',
      '备注',
      '创建时间',
      '更新时间',
    ]

    // 类型标签映射
    const workCategoryLabels: Record<string, string> = {
      INDUSTRY_TRACKING: '行业跟踪及竞对分析',
      PRODUCT_REQUIREMENT: '产品需求分析及产品定义',
      PROJECT_MANAGEMENT: '产品开发项目及生命周期管理',
      BUSINESS_SUPPORT: '业务线支持及跨部门组织工作',
      PROFESSIONAL_LEARNING: '专业能力学习',
      OTHER_TASKS: '其它任务',
    }

    const workItemTypeLabels: Record<string, string> = {
      REQUIREMENT: '需求',
      DEFECT: '缺陷',
      TASK: '任务',
      IMPROVEMENT: '改进',
    }

    const priorityLabels: Record<string, string> = {
      LOW: '低',
      MEDIUM: '中',
      HIGH: '高',
    }

    const statusLabels: Record<string, string> = {
      NEW: '新建',
      ASSIGNED: '已分配',
      IN_PROGRESS: '进行中',
      IN_REVIEW: '审核中',
      RESOLVED: '已解决',
      CLOSED: '已关闭',
      REJECTED: '已拒绝',
    }

    // 转换数据为CSV行
    const rows = workItems.map((item) => [
      item.title,
      item.description || '',
      workItemTypeLabels[item.workItemType] || item.workItemType,
      workCategoryLabels[item.workCategory] || item.workCategory,
      priorityLabels[item.priority] || item.priority,
      statusLabels[item.status] || item.status,
      item.assigneeName || '',
      item.reporterName || '',
      item.estimatedHours?.toString() || '',
      item.actualHours?.toString() || '',
      item.startDate ? new Date(item.startDate).toLocaleDateString('zh-CN') : '',
      item.dueDate ? new Date(item.dueDate).toLocaleDateString('zh-CN') : '',
      item.completedDate ? new Date(item.completedDate).toLocaleDateString('zh-CN') : '',
      item.projectName || '',
      item.version || '',
      item.module || '',
      item.severity || '',
      item.resolution || '',
      item.testResult || '',
      item.remarks || '',
      new Date(item.createdAt).toLocaleString('zh-CN'),
      new Date(item.updatedAt).toLocaleString('zh-CN'),
    ])

    // 组装CSV内容
    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')

    // 返回CSV文件
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv;charset=utf-8;',
        'Content-Disposition': `attachment; filename=work-items-${Date.now()}.csv`,
      },
    })
  } catch (error) {
    console.error('导出CSV失败:', error)
    return NextResponse.json({ error: '导出CSV失败' }, { status: 500 })
  }
}
