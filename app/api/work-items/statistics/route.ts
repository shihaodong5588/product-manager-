import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // 获取所有工作项
    const workItems = await prisma.workItem.findMany()
    const total = workItems.length

    if (total === 0) {
      return NextResponse.json({
        total: 0,
        categoryStats: [],
        typeStats: [],
        statusStats: [],
      })
    }

    // 按工作类别统计
    const categoryCounts: Record<string, number> = {}
    const typeCounts: Record<string, number> = {}
    const statusCounts: Record<string, number> = {}

    workItems.forEach((item) => {
      // 统计工作类别
      categoryCounts[item.workCategory] = (categoryCounts[item.workCategory] || 0) + 1
      // 统计工作项类型
      typeCounts[item.workItemType] = (typeCounts[item.workItemType] || 0) + 1
      // 统计状态
      statusCounts[item.status] = (statusCounts[item.status] || 0) + 1
    })

    // 工作类别标签映射
    const categoryLabels: Record<string, string> = {
      INDUSTRY_TRACKING: '行业跟踪及竞对分析',
      PRODUCT_REQUIREMENT: '产品需求分析及产品定义',
      PROJECT_MANAGEMENT: '产品开发项目及生命周期管理',
      BUSINESS_SUPPORT: '业务线支持及跨部门组织工作',
      PROFESSIONAL_LEARNING: '专业能力学习',
      OTHER_TASKS: '其它任务',
    }

    // 工作项类型标签映射
    const typeLabels: Record<string, string> = {
      REQUIREMENT: '需求',
      DEFECT: '缺陷',
      TASK: '任务',
      IMPROVEMENT: '改进',
    }

    // 状态标签映射
    const statusLabels: Record<string, string> = {
      NEW: '新建',
      ASSIGNED: '已分配',
      IN_PROGRESS: '进行中',
      IN_REVIEW: '审核中',
      RESOLVED: '已解决',
      CLOSED: '已关闭',
      REJECTED: '已拒绝',
    }

    // 转换为百分比统计
    const categoryStats = Object.entries(categoryCounts).map(([category, count]) => ({
      category,
      label: categoryLabels[category] || category,
      count,
      percentage: ((count / total) * 100).toFixed(2),
    }))

    const typeStats = Object.entries(typeCounts).map(([type, count]) => ({
      type,
      label: typeLabels[type] || type,
      count,
      percentage: ((count / total) * 100).toFixed(2),
    }))

    const statusStats = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      label: statusLabels[status] || status,
      count,
      percentage: ((count / total) * 100).toFixed(2),
    }))

    return NextResponse.json({
      total,
      categoryStats,
      typeStats,
      statusStats,
    })
  } catch (error) {
    console.error('获取统计数据失败:', error)
    return NextResponse.json({ error: '获取统计数据失败' }, { status: 500 })
  }
}
