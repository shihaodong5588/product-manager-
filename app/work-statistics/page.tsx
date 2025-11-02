'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Plus,
  Download,
  Upload,
  Filter,
  Search,
  Edit,
  Trash2,
  BarChart3,
} from 'lucide-react'

interface WorkItem {
  id: string
  title: string
  description?: string
  workItemType: string
  workCategory: string
  priority: string
  importance: string
  status: string
  assigneeName?: string
  reporterName?: string
  estimatedHours?: number
  actualHours?: number
  startDate?: string
  dueDate?: string
  completedDate?: string
  projectName?: string
  version?: string
  module?: string
  severity?: string
  resolution?: string
  testResult?: string
  remarks?: string
  createdAt: string
  updatedAt: string
}

interface Statistics {
  total: number
  categoryStats: Array<{
    category: string
    label: string
    count: number
    percentage: string
  }>
  typeStats: Array<{
    type: string
    label: string
    count: number
    percentage: string
  }>
  statusStats: Array<{
    status: string
    label: string
    count: number
    percentage: string
  }>
  weeklyTrends: Array<{
    week: string
    total: number
    categories: Array<{
      category: string
      label: string
      count: number
      percentage: string
      change: string | null
    }>
  }>
}

export default function WorkStatisticsPage() {
  const [workItems, setWorkItems] = useState<WorkItem[]>([])
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [showStatsDialog, setShowStatsDialog] = useState(false)
  const [selectedItem, setSelectedItem] = useState<WorkItem | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 列宽调整相关状态
  const [columnWidths, setColumnWidths] = useState({
    title: 200,
    type: 120,
    category: 180,
    priority: 100,
    importance: 100,
    status: 100,
    assignee: 120,
    createdAt: 100,
    actions: 100,
  })
  const [resizing, setResizing] = useState<string | null>(null)
  const [startX, setStartX] = useState(0)
  const [startWidth, setStartWidth] = useState(0)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    workItemType: 'REQUIREMENT',
    workCategory: 'PRODUCT_REQUIREMENT',
    priority: 'MEDIUM',
    importance: 'MEDIUM',
    status: 'NEW',
    assigneeName: '',
    reporterName: '',
    estimatedHours: '',
    actualHours: '',
    projectName: '',
    version: '',
    module: '',
    severity: '',
    resolution: '',
    testResult: '',
    remarks: '',
  })

  const workCategoryOptions = [
    { value: 'INDUSTRY_TRACKING', label: '1. 行业跟踪及竞对分析' },
    { value: 'PRODUCT_REQUIREMENT', label: '2. 产品需求分析及产品定义' },
    { value: 'PROJECT_MANAGEMENT', label: '3. 产品开发项目及生命周期管理' },
    { value: 'BUSINESS_SUPPORT', label: '4. 业务线支持及跨部门组织工作' },
    { value: 'PROFESSIONAL_LEARNING', label: '5. 专业能力学习' },
    { value: 'OTHER_TASKS', label: '6. 其它任务' },
  ]

  const workItemTypeOptions = [
    { value: 'REQUIREMENT', label: '需求' },
    { value: 'DEFECT', label: '缺陷' },
    { value: 'TASK', label: '任务' },
    { value: 'IMPROVEMENT', label: '改进' },
  ]

  const priorityOptions = [
    { value: 'LOW', label: '低' },
    { value: 'MEDIUM', label: '中' },
    { value: 'HIGH', label: '高' },
  ]

  const importanceOptions = [
    { value: 'LOW', label: '低' },
    { value: 'MEDIUM', label: '中' },
    { value: 'HIGH', label: '高' },
  ]

  const statusOptions = [
    { value: 'NEW', label: '新建' },
    { value: 'ASSIGNED', label: '已分配' },
    { value: 'IN_PROGRESS', label: '进行中' },
    { value: 'IN_REVIEW', label: '审核中' },
    { value: 'RESOLVED', label: '已解决' },
    { value: 'CLOSED', label: '已关闭' },
    { value: 'REJECTED', label: '已拒绝' },
  ]

  useEffect(() => {
    // 序列化请求，避免并发连接争用
    const fetchData = async () => {
      await fetchWorkItems()
      await fetchStatistics()
    }
    fetchData()
  }, [filterCategory, filterType, filterStatus])

  const fetchWorkItems = async (retryCount = 0) => {
    try {
      setError(null)
      const params = new URLSearchParams()
      if (filterCategory) params.append('workCategory', filterCategory)
      if (filterType) params.append('workItemType', filterType)
      if (filterStatus) params.append('status', filterStatus)
      // 设置大分页以显示所有数据
      params.append('pageSize', '10000')

      const response = await fetch(`/api/work-items?${params}`)

      // 检查响应状态
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '未知错误' }))

        // 如果是503错误（数据库连接问题），自动重试
        if (response.status === 503 && retryCount < 5) {
          const delay = Math.min(1000 * Math.pow(1.5, retryCount), 10000)
          console.log(`数据库连接中，${delay}ms后重试... (${retryCount + 1}/5)`)
          setTimeout(() => fetchWorkItems(retryCount + 1), delay)
          return
        }

        throw new Error(errorData.message || '获取数据失败')
      }

      const data = await response.json()
      setWorkItems(data.workItems || [])

      // 成功后清除任何错误状态
      if (retryCount > 0) {
        console.log('✓ 数据加载成功')
      }
    } catch (error: any) {
      console.error('获取工作项失败:', error)

      // 对于网络错误，也进行重试
      if (retryCount < 5 && (error.message?.includes('fetch') || error.message?.includes('网络'))) {
        const delay = Math.min(1000 * Math.pow(1.5, retryCount), 10000)
        console.log(`网络错误，${delay}ms后重试... (${retryCount + 1}/5)`)
        setTimeout(() => fetchWorkItems(retryCount + 1), delay)
        return
      }

      // 只在最后一次重试失败时才显示错误
      if (retryCount >= 4) {
        setError('无法连接到数据库服务。请稍后再试，或联系管理员。')
        setWorkItems([])
      }
    } finally {
      if (retryCount === 0) {
        setLoading(false)
      }
    }
  }

  const fetchStatistics = async (retryCount = 0) => {
    try {
      const response = await fetch('/api/work-items/statistics')

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '未知错误' }))

        // 如果是503错误（数据库连接问题），自动重试
        if (response.status === 503 && retryCount < 5) {
          const delay = Math.min(1000 * Math.pow(1.5, retryCount), 10000)
          console.log(`统计数据连接中，${delay}ms后重试... (${retryCount + 1}/5)`)
          setTimeout(() => fetchStatistics(retryCount + 1), delay)
          return
        }

        throw new Error(errorData.message || '获取统计失败')
      }

      const data = await response.json()
      setStatistics(data)
    } catch (error: any) {
      console.error('获取统计数据失败:', error)

      // 对于网络错误，也进行重试
      if (retryCount < 5) {
        const delay = Math.min(1000 * Math.pow(1.5, retryCount), 10000)
        setTimeout(() => fetchStatistics(retryCount + 1), delay)
        return
      }

      setStatistics({
        total: 0,
        categoryStats: [],
        typeStats: [],
        statusStats: [],
      })
    }
  }

  const handleSubmit = async () => {
    try {
      const payload = {
        ...formData,
        estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : null,
        actualHours: formData.actualHours ? parseFloat(formData.actualHours) : null,
      }

      let response
      if (showEditDialog && selectedItem) {
        response = await fetch(`/api/work-items/${selectedItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        response = await fetch('/api/work-items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: '保存失败' }))
        throw new Error(error.error || '保存失败')
      }

      setShowAddDialog(false)
      setShowEditDialog(false)
      resetForm()
      fetchWorkItems()
      fetchStatistics()
    } catch (error) {
      console.error('保存工作项失败:', error)
      alert(error instanceof Error ? error.message : '保存失败')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此工作项吗？')) return

    try {
      await fetch(`/api/work-items/${id}`, { method: 'DELETE' })
      fetchWorkItems()
      fetchStatistics()
    } catch (error) {
      console.error('删除工作项失败:', error)
      alert('删除失败')
    }
  }

  const handleDeleteAll = async () => {
    const confirmMessage = `确定要删除所有 ${workItems.length} 个工作项吗？此操作不可撤销！`
    if (!confirm(confirmMessage)) return

    try {
      const response = await fetch('/api/work-items/delete-all', { method: 'DELETE' })
      const result = await response.json()

      if (response.ok) {
        alert(result.message || '删除成功')
        fetchWorkItems()
        fetchStatistics()
      } else {
        throw new Error(result.error || '删除失败')
      }
    } catch (error) {
      console.error('删除全部工作项失败:', error)
      alert(error instanceof Error ? error.message : '删除全部失败')
    }
  }

  // 快速更新单个字段
  const handleQuickUpdate = async (id: string, field: string, value: any) => {
    try {
      const item = workItems.find((i) => i.id === id)
      if (!item) return

      const response = await fetch(`/api/work-items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...item,
          [field]: value,
        }),
      })

      if (!response.ok) {
        throw new Error('更新失败')
      }

      // 更新本地状态
      setWorkItems(workItems.map((i) =>
        i.id === id ? { ...i, [field]: value } : i
      ))
      fetchStatistics()
    } catch (error) {
      console.error('快速更新失败:', error)
      alert('更新失败，请重试')
      // 重新获取数据以恢复原状
      fetchWorkItems()
    }
  }

  const handleEdit = (item: WorkItem) => {
    setSelectedItem(item)
    setFormData({
      title: item.title,
      description: item.description || '',
      workItemType: item.workItemType,
      workCategory: item.workCategory,
      priority: item.priority,
      importance: item.importance || 'MEDIUM',
      status: item.status,
      assigneeName: item.assigneeName || '',
      reporterName: item.reporterName || '',
      estimatedHours: item.estimatedHours?.toString() || '',
      actualHours: item.actualHours?.toString() || '',
      projectName: item.projectName || '',
      version: item.version || '',
      module: item.module || '',
      severity: item.severity || '',
      resolution: item.resolution || '',
      testResult: item.testResult || '',
      remarks: item.remarks || '',
    })
    setShowEditDialog(true)
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      workItemType: 'REQUIREMENT',
      workCategory: 'PRODUCT_REQUIREMENT',
      priority: 'MEDIUM',
      importance: 'MEDIUM',
      status: 'NEW',
      assigneeName: '',
      reporterName: '',
      estimatedHours: '',
      actualHours: '',
      projectName: '',
      version: '',
      module: '',
      severity: '',
      resolution: '',
      testResult: '',
      remarks: '',
    })
    setSelectedItem(null)
  }

  const handleExport = async () => {
    try {
      const response = await fetch('/api/work-items/export-csv')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `work-items-${Date.now()}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('导出失败:', error)
      alert('导出失败')
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const response = await fetch('/api/work-items/import-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvData: text }),
      })

      const result = await response.json()
      alert(result.message || '导入成功')
      setShowImportDialog(false)

      // 等待数据刷新完成
      await fetchWorkItems()
      await fetchStatistics()

      // 重置文件输入以允许重新导入同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('导入失败:', error)
      alert('导入失败')
      // 重置文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const filteredItems = workItems.filter((item) =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getCategoryLabel = (category: string) => {
    return workCategoryOptions.find((opt) => opt.value === category)?.label || category
  }

  const getTypeLabel = (type: string) => {
    return workItemTypeOptions.find((opt) => opt.value === type)?.label || type
  }

  const getStatusLabel = (status: string) => {
    return statusOptions.find((opt) => opt.value === status)?.label || status
  }

  const getPriorityLabel = (priority: string) => {
    return priorityOptions.find((opt) => opt.value === priority)?.label || priority
  }

  const getImportanceLabel = (importance: string) => {
    return importanceOptions.find((opt) => opt.value === importance)?.label || importance
  }

  // 列宽调整处理函数
  const handleMouseDown = (columnKey: string, e: React.MouseEvent) => {
    e.preventDefault()
    setResizing(columnKey)
    setStartX(e.clientX)
    setStartWidth(columnWidths[columnKey as keyof typeof columnWidths])
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!resizing) return
    const diff = e.clientX - startX
    const newWidth = Math.max(50, startWidth + diff) // 最小宽度 50px
    setColumnWidths((prev) => ({
      ...prev,
      [resizing]: newWidth,
    }))
  }

  const handleMouseUp = () => {
    setResizing(null)
  }

  // 监听鼠标事件
  useEffect(() => {
    if (resizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [resizing, startX, startWidth])

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <p className="text-slate-500">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">工作统计</h1>
        <p className="text-slate-600 mt-2">需求和缺陷管理系统</p>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="h-5 w-5 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-amber-800">连接失败</h3>
              <p className="mt-1 text-sm text-amber-700">{error}</p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => {
                    setError(null)
                    fetchWorkItems()
                    fetchStatistics()
                  }}
                  className="text-sm bg-amber-100 hover:bg-amber-200 text-amber-800 px-3 py-1 rounded"
                >
                  重新加载
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 操作栏 */}
      <div className="flex justify-between items-center mb-6 gap-4">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="搜索工作项..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm"
          >
            <option value="">全部类别</option>
            {workCategoryOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm"
          >
            <option value="">全部类型</option>
            {workItemTypeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm"
          >
            <option value="">全部状态</option>
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowStatsDialog(true)}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            统计概览
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleImport}
            className="hidden"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            导入CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            导出CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeleteAll}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            disabled={workItems.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            删除全部
          </Button>
          <Button size="sm" onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            新建工作项
          </Button>
        </div>
      </div>

      {/* 工作项列表 */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-slate-700 relative" style={{ width: `${columnWidths.title}px` }}>
                    标题
                    <div
                      className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-500"
                      onMouseDown={(e) => handleMouseDown('title', e)}
                    />
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-slate-700 relative" style={{ width: `${columnWidths.type}px` }}>
                    类型
                    <div
                      className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-500"
                      onMouseDown={(e) => handleMouseDown('type', e)}
                    />
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-slate-700 relative" style={{ width: `${columnWidths.category}px` }}>
                    工作类别
                    <div
                      className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-500"
                      onMouseDown={(e) => handleMouseDown('category', e)}
                    />
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-slate-700 relative" style={{ width: `${columnWidths.priority}px` }}>
                    优先级
                    <div
                      className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-500"
                      onMouseDown={(e) => handleMouseDown('priority', e)}
                    />
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-slate-700 relative" style={{ width: `${columnWidths.importance}px` }}>
                    重要性
                    <div
                      className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-500"
                      onMouseDown={(e) => handleMouseDown('importance', e)}
                    />
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-slate-700 relative" style={{ width: `${columnWidths.status}px` }}>
                    状态
                    <div
                      className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-500"
                      onMouseDown={(e) => handleMouseDown('status', e)}
                    />
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-slate-700 relative" style={{ width: `${columnWidths.assignee}px` }}>
                    负责人
                    <div
                      className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-500"
                      onMouseDown={(e) => handleMouseDown('assignee', e)}
                    />
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-slate-700 relative" style={{ width: `${columnWidths.createdAt}px` }}>
                    创建时间
                    <div
                      className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-500"
                      onMouseDown={(e) => handleMouseDown('createdAt', e)}
                    />
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-slate-700 relative" style={{ width: `${columnWidths.actions}px` }}>
                    操作
                    <div
                      className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-500"
                      onMouseDown={(e) => handleMouseDown('actions', e)}
                    />
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-slate-500">
                      暂无数据
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-slate-50">
                      <td className="p-4 text-sm" style={{ width: `${columnWidths.title}px` }}>
                        <div className="font-medium text-slate-900">{item.title}</div>
                        {item.description && (
                          <div className="text-xs text-slate-500 mt-1 line-clamp-1">
                            {item.description}
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-sm" style={{ width: `${columnWidths.type}px` }}>
                        <select
                          value={item.workItemType}
                          onChange={(e) => handleQuickUpdate(item.id, 'workItemType', e.target.value)}
                          className="border rounded px-2 py-1 text-sm w-full bg-white hover:bg-slate-50 cursor-pointer"
                        >
                          {workItemTypeOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-4 text-sm" style={{ width: `${columnWidths.category}px` }}>
                        <select
                          value={item.workCategory}
                          onChange={(e) => handleQuickUpdate(item.id, 'workCategory', e.target.value)}
                          className="border rounded px-2 py-1 text-xs w-full bg-white hover:bg-slate-50 cursor-pointer"
                        >
                          {workCategoryOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-4 text-sm" style={{ width: `${columnWidths.priority}px` }}>
                        <select
                          value={item.priority}
                          onChange={(e) => handleQuickUpdate(item.id, 'priority', e.target.value)}
                          className={`px-2 py-1 rounded-full text-xs border-0 cursor-pointer ${
                            item.priority === 'HIGH'
                              ? 'bg-red-100 text-red-700'
                              : item.priority === 'MEDIUM'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {priorityOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-4 text-sm" style={{ width: `${columnWidths.importance}px` }}>
                        <select
                          value={item.importance}
                          onChange={(e) => handleQuickUpdate(item.id, 'importance', e.target.value)}
                          className={`px-2 py-1 rounded-full text-xs border-0 cursor-pointer ${
                            item.importance === 'HIGH'
                              ? 'bg-orange-100 text-orange-700'
                              : item.importance === 'MEDIUM'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {importanceOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-4 text-sm" style={{ width: `${columnWidths.status}px` }}>
                        <select
                          value={item.status}
                          onChange={(e) => handleQuickUpdate(item.id, 'status', e.target.value)}
                          className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 border-0 cursor-pointer"
                        >
                          {statusOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-4 text-sm" style={{ width: `${columnWidths.assignee}px` }}>
                        <input
                          type="text"
                          defaultValue={item.assigneeName || ''}
                          onBlur={(e) => {
                            if (e.target.value !== (item.assigneeName || '')) {
                              handleQuickUpdate(item.id, 'assigneeName', e.target.value || null)
                            }
                          }}
                          className="border rounded px-2 py-1 text-sm w-full bg-white hover:bg-slate-50"
                          placeholder="-"
                        />
                      </td>
                      <td className="p-4 text-sm" style={{ width: `${columnWidths.createdAt}px` }}>
                        <input
                          type="date"
                          defaultValue={new Date(item.createdAt).toISOString().split('T')[0]}
                          onBlur={(e) => {
                            const newDate = e.target.value
                            const oldDate = new Date(item.createdAt).toISOString().split('T')[0]
                            if (newDate !== oldDate) {
                              // 保持原有的时间部分，只更新日期
                              const originalTime = new Date(item.createdAt)
                              const newDateTime = new Date(newDate)
                              newDateTime.setHours(originalTime.getHours())
                              newDateTime.setMinutes(originalTime.getMinutes())
                              newDateTime.setSeconds(originalTime.getSeconds())
                              handleQuickUpdate(item.id, 'createdAt', newDateTime.toISOString())
                            }
                          }}
                          className="border rounded px-2 py-1 text-sm w-full bg-white hover:bg-slate-50"
                        />
                      </td>
                      <td className="p-4" style={{ width: `${columnWidths.actions}px` }}>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 统计概览对话框 */}
      <Dialog open={showStatsDialog} onOpenChange={setShowStatsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>工作统计概览</DialogTitle>
            <DialogDescription>工作类别分布和统计信息</DialogDescription>
          </DialogHeader>
          {statistics && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">总计: {statistics.total} 个工作项</h3>
              </div>

              <div>
                <h4 className="text-md font-semibold mb-3">工作类别分布</h4>
                <div className="space-y-2">
                  {statistics.categoryStats && statistics.categoryStats.length > 0 ? (
                    statistics.categoryStats.map((stat) => (
                      <div key={stat.category} className="flex items-center gap-4">
                        <div className="w-48 text-sm">{stat.label}</div>
                        <div className="flex-1 bg-slate-200 rounded-full h-6">
                          <div
                            className="bg-blue-500 h-6 rounded-full flex items-center justify-end px-2 text-white text-xs font-medium"
                            style={{ width: `${stat.percentage}%` }}
                          >
                            {stat.percentage}%
                          </div>
                        </div>
                        <div className="w-16 text-sm text-slate-600 text-right">{stat.count} 项</div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-4">暂无数据</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-md font-semibold mb-3">工作项类型分布</h4>
                <div className="grid grid-cols-2 gap-4">
                  {statistics.typeStats && statistics.typeStats.length > 0 ? (
                    statistics.typeStats.map((stat) => (
                      <Card key={stat.type}>
                        <CardContent className="p-4">
                          <div className="text-sm text-slate-600">{stat.label}</div>
                          <div className="text-2xl font-bold mt-2">{stat.count}</div>
                          <div className="text-xs text-slate-500 mt-1">{stat.percentage}%</div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <p className="col-span-2 text-sm text-slate-500 text-center py-4">暂无数据</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-md font-semibold mb-3">状态分布</h4>
                <div className="grid grid-cols-3 gap-4">
                  {statistics.statusStats && statistics.statusStats.length > 0 ? (
                    statistics.statusStats.map((stat) => (
                      <Card key={stat.status}>
                        <CardContent className="p-4">
                          <div className="text-sm text-slate-600">{stat.label}</div>
                          <div className="text-2xl font-bold mt-2">{stat.count}</div>
                          <div className="text-xs text-slate-500 mt-1">{stat.percentage}%</div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <p className="col-span-3 text-sm text-slate-500 text-center py-4">暂无数据</p>
                  )}
                </div>
              </div>

              {/* 周趋势分析 */}
              {statistics.weeklyTrends && statistics.weeklyTrends.length > 0 && (
                <div>
                  <h4 className="text-md font-semibold mb-3">工作类别周环比趋势</h4>
                  <p className="text-sm text-slate-500 mb-4">
                    观察各工作类别占比的周变化，帮助识别工作重心的转移
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="border px-3 py-2 text-left font-medium">周次</th>
                          <th className="border px-3 py-2 text-center font-medium">总数</th>
                          {statistics.weeklyTrends[0]?.categories.map((cat) => (
                            <th key={cat.category} className="border px-3 py-2 text-center font-medium">
                              {cat.label.replace(/^\d+\.\s*/, '')}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {statistics.weeklyTrends.map((week) => (
                          <tr key={week.week} className="hover:bg-slate-50">
                            <td className="border px-3 py-2 font-medium">{week.week}</td>
                            <td className="border px-3 py-2 text-center">{week.total}</td>
                            {week.categories.map((cat) => (
                              <td key={cat.category} className="border px-3 py-2 text-center">
                                <div className="space-y-1">
                                  <div className="font-medium">{cat.percentage}%</div>
                                  {cat.change !== null && (
                                    <div
                                      className={`text-xs ${
                                        parseFloat(cat.change) > 0
                                          ? 'text-green-600'
                                          : parseFloat(cat.change) < 0
                                          ? 'text-red-600'
                                          : 'text-slate-500'
                                      }`}
                                    >
                                      {parseFloat(cat.change) > 0 ? '↑' : parseFloat(cat.change) < 0 ? '↓' : ''}
                                      {cat.change}%
                                    </div>
                                  )}
                                </div>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-3 text-xs text-slate-500">
                    <p>说明：</p>
                    <ul className="list-disc list-inside space-y-1 mt-1">
                      <li>百分比表示该类别占当周工作总数的比例</li>
                      <li>环比变化 = 本周占比 - 上周占比</li>
                      <li><span className="text-green-600">↑ 正数</span> 表示该类别占比上升，工作重要性增加</li>
                      <li><span className="text-red-600">↓ 负数</span> 表示该类别占比下降，工作重要性减少</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 新建/编辑工作项对话框 */}
      <Dialog
        open={showAddDialog || showEditDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddDialog(false)
            setShowEditDialog(false)
            resetForm()
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{showEditDialog ? '编辑工作项' : '新建工作项'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>标题 *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="输入工作项标题"
              />
            </div>
            <div className="col-span-2">
              <Label>描述</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="输入详细描述"
                rows={3}
              />
            </div>
            <div>
              <Label>工作项类型</Label>
              <select
                value={formData.workItemType}
                onChange={(e) => setFormData({ ...formData, workItemType: e.target.value })}
                className="w-full border rounded-md px-3 py-2"
              >
                {workItemTypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>工作类别</Label>
              <select
                value={formData.workCategory}
                onChange={(e) => setFormData({ ...formData, workCategory: e.target.value })}
                className="w-full border rounded-md px-3 py-2"
              >
                {workCategoryOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>优先级</Label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full border rounded-md px-3 py-2"
              >
                {priorityOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>重要性</Label>
              <select
                value={formData.importance}
                onChange={(e) => setFormData({ ...formData, importance: e.target.value })}
                className="w-full border rounded-md px-3 py-2"
              >
                {importanceOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>状态</Label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full border rounded-md px-3 py-2"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>负责人</Label>
              <Input
                value={formData.assigneeName}
                onChange={(e) => setFormData({ ...formData, assigneeName: e.target.value })}
                placeholder="输入负责人姓名"
              />
            </div>
            <div>
              <Label>报告人</Label>
              <Input
                value={formData.reporterName}
                onChange={(e) => setFormData({ ...formData, reporterName: e.target.value })}
                placeholder="输入报告人姓名"
              />
            </div>
            <div>
              <Label>预估工时</Label>
              <Input
                type="number"
                value={formData.estimatedHours}
                onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                placeholder="小时"
              />
            </div>
            <div>
              <Label>实际工时</Label>
              <Input
                type="number"
                value={formData.actualHours}
                onChange={(e) => setFormData({ ...formData, actualHours: e.target.value })}
                placeholder="小时"
              />
            </div>
            <div>
              <Label>项目</Label>
              <Input
                value={formData.projectName}
                onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                placeholder="项目名称"
              />
            </div>
            <div>
              <Label>版本</Label>
              <Input
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                placeholder="版本号"
              />
            </div>
            <div>
              <Label>模块</Label>
              <Input
                value={formData.module}
                onChange={(e) => setFormData({ ...formData, module: e.target.value })}
                placeholder="模块名称"
              />
            </div>
            <div>
              <Label>严重程度</Label>
              <Input
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                placeholder="针对缺陷"
              />
            </div>
            <div className="col-span-2">
              <Label>解决方案</Label>
              <Textarea
                value={formData.resolution}
                onChange={(e) => setFormData({ ...formData, resolution: e.target.value })}
                placeholder="输入解决方案"
                rows={2}
              />
            </div>
            <div className="col-span-2">
              <Label>测试结果</Label>
              <Input
                value={formData.testResult}
                onChange={(e) => setFormData({ ...formData, testResult: e.target.value })}
                placeholder="测试结果"
              />
            </div>
            <div className="col-span-2">
              <Label>备注</Label>
              <Textarea
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                placeholder="其他备注信息"
                rows={2}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false)
                setShowEditDialog(false)
                resetForm()
              }}
            >
              取消
            </Button>
            <Button onClick={handleSubmit}>保存</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
