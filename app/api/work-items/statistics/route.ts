import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiHandler } from '@/lib/api-middleware'

export async function GET(request: NextRequest) {
  return apiHandler(async () => {
    // 获取所有工作项
    const workItems = await prisma.workItem.findMany({
      orderBy: { createdAt: 'desc' }
    })
    const total = workItems.length

    if (total === 0) {
      return NextResponse.json({
        total: 0,
        categoryStats: [],
        typeStats: [],
        statusStats: [],
        weeklyTrends: [],
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

    // 计算周趋势数据
    const getWeekKey = (date: Date) => {
      const year = date.getFullYear()
      const weekNumber = getWeekNumber(date)
      return `${year}-W${weekNumber.toString().padStart(2, '0')}`
    }

    const getWeekNumber = (date: Date) => {
      const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
      const dayNum = d.getUTCDay() || 7
      d.setUTCDate(d.getUTCDate() + 4 - dayNum)
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
      return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
    }

    // 按周分组统计
    const weeklyData: Record<string, Record<string, number>> = {}
    const weeklyTotals: Record<string, number> = {}

    workItems.forEach((item) => {
      const weekKey = getWeekKey(new Date(item.createdAt))

      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = {}
        weeklyTotals[weekKey] = 0
      }

      weeklyData[weekKey][item.workCategory] = (weeklyData[weekKey][item.workCategory] || 0) + 1
      weeklyTotals[weekKey]++
    })

    // 获取最近8周的数据（包括当前周）
    const weeks = Object.keys(weeklyData).sort().reverse().slice(0, 8).reverse()

    // 计算每周的类别占比和环比变化
    const weeklyTrends = weeks.map((weekKey, index) => {
      const weekData = weeklyData[weekKey]
      const weekTotal = weeklyTotals[weekKey]

      const categoryPercentages: Record<string, number> = {}
      const categoryChanges: Record<string, number | null> = {}

      Object.keys(categoryLabels).forEach((category) => {
        const count = weekData[category] || 0
        const percentage = weekTotal > 0 ? (count / weekTotal) * 100 : 0
        categoryPercentages[category] = percentage

        // 计算环比变化（与上周对比）
        if (index > 0) {
          const prevWeek = weeks[index - 1]
          const prevWeekData = weeklyData[prevWeek]
          const prevWeekTotal = weeklyTotals[prevWeek]
          const prevCount = prevWeekData[category] || 0
          const prevPercentage = prevWeekTotal > 0 ? (prevCount / prevWeekTotal) * 100 : 0
          categoryChanges[category] = percentage - prevPercentage
        } else {
          categoryChanges[category] = null
        }
      })

      return {
        week: weekKey,
        total: weekTotal,
        categories: Object.keys(categoryLabels).map((category) => ({
          category,
          label: categoryLabels[category],
          count: weekData[category] || 0,
          percentage: categoryPercentages[category].toFixed(2),
          change: categoryChanges[category] !== null ? categoryChanges[category].toFixed(2) : null,
        })),
      }
    })

    return NextResponse.json({
      total,
      categoryStats,
      typeStats,
      statusStats,
      weeklyTrends,
    })
  }, { operationName: '获取工作项统计' })
}
