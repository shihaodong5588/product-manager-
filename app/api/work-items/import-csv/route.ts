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
      // 添加更多常见别名
      '1': 'INDUSTRY_TRACKING',
      '2': 'PRODUCT_REQUIREMENT',
      '3': 'PROJECT_MANAGEMENT',
      '4': 'BUSINESS_SUPPORT',
      '5': 'PROFESSIONAL_LEARNING',
      '6': 'OTHER_TASKS',
    }

    const workItemTypeMap: Record<string, string> = {
      '需求': 'REQUIREMENT',
      '缺陷': 'DEFECT',
      '任务': 'TASK',
      '改进': 'IMPROVEMENT',
      // 添加更多常见别名
      '软件开发': 'TASK',
      '软硬件开发': 'TASK',
      '软硬件开发P0': 'TASK',
      '软硬件开发P1': 'TASK',
    }

    const priorityMap: Record<string, string> = {
      '低': 'LOW',
      '中': 'MEDIUM',
      '高': 'HIGH',
      // 添加更多常见别名
      'P0': 'HIGH',
      'P1': 'MEDIUM',
      'P2': 'LOW',
      '待评审': 'MEDIUM',
    }

    const importanceMap: Record<string, string> = {
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
      // 添加更多常见别名
      '待开始': 'NEW',
      '待评审': 'IN_REVIEW',
    }

    const headers: string[] = lines[0].split(',').map((h: string) => h.trim())
    const workItems = []
    const skippedRows: Array<{ row: number; reason: string }> = []
    const unmappedValues: Array<{ row: number; field: string; value: string; usedDefault: string }> = []

    // 字段别名映射 - 支持不同的列名
    const fieldAliases: Record<string, string[]> = {
      title: ['标题', '描述', '名称', '工作项名称'],
      description: ['描述', '详细描述', '说明'],
      workItemType: ['工作项类型', '类型'],
      workCategory: ['工作类别', '类别', '分类'],
      priority: ['优先级'],
      importance: ['重要性'],
      status: ['状态'],
      assigneeName: ['负责人', '指派给'],
      reporterName: ['报告人', '创建人'],
      estimatedHours: ['预估工时', '预计工时'],
      actualHours: ['实际工时'],
      projectName: ['项目', '项目名称'],
      version: ['版本'],
      module: ['模块'],
      severity: ['严重程度'],
      resolution: ['解决方案'],
      testResult: ['测试结果'],
      remarks: ['备注', '说明', '注释']
    }

    // 建立列索引映射
    const columnMap: Record<string, number> = {}
    headers.forEach((header, index) => {
      for (const [field, aliases] of Object.entries(fieldAliases)) {
        if (aliases.includes(header)) {
          if (!columnMap[field]) {
            columnMap[field] = index
          }
        }
      }
    })

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v: string) => v.trim())
      const item: any = {}

      // 使用映射获取值
      const getValue = (field: string) => {
        const index = columnMap[field]
        return index !== undefined ? values[index] : undefined
      }

      // 标题字段 - 优先使用"标题"，其次"描述"
      const titleValue = getValue('title')
      if (titleValue) {
        item.title = titleValue
        // 如果有单独的描述列，使用它
        const descValue = getValue('description')
        if (descValue && descValue !== titleValue) {
          item.description = descValue
        }
      } else {
        skippedRows.push({ row: i + 1, reason: '缺少标题或描述字段' })
        continue
      }

      // 工作项类型 - 只使用映射值或默认值，不使用原值
      const workItemTypeValue = getValue('workItemType')
      if (workItemTypeValue && !workItemTypeMap[workItemTypeValue]) {
        unmappedValues.push({ row: i + 1, field: '工作项类型', value: workItemTypeValue, usedDefault: 'REQUIREMENT (任务)' })
      }
      item.workItemType = (workItemTypeValue && workItemTypeMap[workItemTypeValue]) || 'REQUIREMENT'

      // 工作类别 - 只使用映射值或默认值，不使用原值
      const workCategoryValue = getValue('workCategory')
      if (workCategoryValue && !workCategoryMap[workCategoryValue]) {
        unmappedValues.push({ row: i + 1, field: '工作类别', value: workCategoryValue, usedDefault: 'PRODUCT_REQUIREMENT (产品需求分析及产品定义)' })
      }
      item.workCategory = (workCategoryValue && workCategoryMap[workCategoryValue]) || 'PRODUCT_REQUIREMENT'

      // 优先级 - 只使用映射值或默认值，不使用原值
      const priorityValue = getValue('priority')
      if (priorityValue && !priorityMap[priorityValue]) {
        unmappedValues.push({ row: i + 1, field: '优先级', value: priorityValue, usedDefault: 'MEDIUM (中)' })
      }
      item.priority = (priorityValue && priorityMap[priorityValue]) || 'MEDIUM'

      // 重要性 - 可选字段，如果CSV中没有此列或值为空，默认为MEDIUM
      const importanceValue = getValue('importance')
      if (importanceValue) {
        // 只有当CSV中有重要性值时才进行映射检查
        if (!importanceMap[importanceValue]) {
          unmappedValues.push({ row: i + 1, field: '重要性', value: importanceValue, usedDefault: 'MEDIUM (中)' })
        }
        item.importance = importanceMap[importanceValue] || 'MEDIUM'
      } else {
        // CSV中没有重要性列或值为空，使用默认值
        item.importance = 'MEDIUM'
      }

      // 状态 - 只使用映射值或默认值，不使用原值
      const statusValue = getValue('status')
      if (statusValue && !statusMap[statusValue]) {
        unmappedValues.push({ row: i + 1, field: '状态', value: statusValue, usedDefault: 'NEW (新建)' })
      }
      item.status = (statusValue && statusMap[statusValue]) || 'NEW'

      // 其他字段
      item.assigneeName = getValue('assigneeName') || null
      item.reporterName = getValue('reporterName') || null

      const estimatedHours = getValue('estimatedHours')
      item.estimatedHours = estimatedHours ? parseFloat(estimatedHours) : null

      const actualHours = getValue('actualHours')
      item.actualHours = actualHours ? parseFloat(actualHours) : null

      item.projectName = getValue('projectName') || null
      item.version = getValue('version') || null
      item.module = getValue('module') || null
      item.severity = getValue('severity') || null
      item.resolution = getValue('resolution') || null
      item.testResult = getValue('testResult') || null
      item.remarks = getValue('remarks') || null

      workItems.push(item)
    }

    // 批量创建工作项
    const created = await prisma.workItem.createMany({
      data: workItems,
      skipDuplicates: true,
    })

    let message = `成功导入 ${created.count} 个工作项`
    if (skippedRows.length > 0) {
      message += `，跳过 ${skippedRows.length} 行`
    }
    if (unmappedValues.length > 0) {
      message += `，${unmappedValues.length} 个字段值使用了默认值`
    }

    return NextResponse.json({
      message,
      count: created.count,
      totalRows: lines.length - 1,
      skippedRows,
      unmappedValues,
      columnMapping: columnMap,
    })
  } catch (error) {
    console.error('导入CSV失败:', error)
    return NextResponse.json({ error: '导入CSV失败' }, { status: 500 })
  }
}
