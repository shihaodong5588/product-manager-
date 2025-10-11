'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MessageSquare,
  Paperclip,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Tag,
} from 'lucide-react'

type Priority = 'LOW' | 'MEDIUM' | 'HIGH'
type RequirementStatus = 'SUBMITTED' | 'APPROVED' | 'IN_DEVELOPMENT' | 'IN_TESTING' | 'COMPLETED' | 'REJECTED'

interface Requirement {
  id: string
  title: string
  description: string | null
  priority: Priority
  status: RequirementStatus
  tags: string | null
  estimatedHours: number | null
  actualHours: number | null
  projectId: string | null
  createdById: string | null
  createdAt: string
  updatedAt: string
  tasks?: any[]
  comments?: Comment[]
  attachments?: Attachment[]
}

interface Comment {
  id: string
  content: string
  authorId: string
  createdAt: string
}

interface Attachment {
  id: string
  filename: string
  url: string
  size: number
  createdAt: string
}

interface NewRequirement {
  title: string
  description: string
  priority: Priority
  status: RequirementStatus
  tags: string
  estimatedHours: number | null
  projectId: string
}

type SortField = 'title' | 'priority' | 'status' | 'createdAt' | 'estimatedHours'
type SortDirection = 'asc' | 'desc'

export default function RequirementsPage() {
  const [requirements, setRequirements] = useState<Requirement[]>([])
  const [filteredRequirements, setFilteredRequirements] = useState<Requirement[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<RequirementStatus | 'ALL'>('ALL')
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'ALL'>('ALL')
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [selectedRequirement, setSelectedRequirement] = useState<Requirement | null>(null)
  const [editingRequirement, setEditingRequirement] = useState<Requirement | null>(null)

  // Form state
  const [newRequirement, setNewRequirement] = useState<NewRequirement>({
    title: '',
    description: '',
    priority: 'MEDIUM',
    status: 'SUBMITTED',
    tags: '',
    estimatedHours: null,
    projectId: '',
  })

  // Comment state
  const [newComment, setNewComment] = useState('')

  useEffect(() => {
    fetchRequirements()
  }, [])

  useEffect(() => {
    filterAndSortRequirements()
  }, [requirements, searchQuery, statusFilter, priorityFilter, sortField, sortDirection])

  const fetchRequirements = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/requirements')
      const data = await response.json()
      setRequirements(data)
    } catch (error) {
      console.error('Failed to fetch requirements:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortRequirements = () => {
    let filtered = requirements.filter((req) => {
      const matchesSearch =
        req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (req.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
        (req.tags?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)

      const matchesStatus = statusFilter === 'ALL' || req.status === statusFilter
      const matchesPriority = priorityFilter === 'ALL' || req.priority === priorityFilter

      return matchesSearch && matchesStatus && matchesPriority
    })

    filtered.sort((a, b) => {
      let aValue: any = a[sortField]
      let bValue: any = b[sortField]

      if (sortField === 'createdAt') {
        aValue = new Date(a.createdAt).getTime()
        bValue = new Date(b.createdAt).getTime()
      }

      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredRequirements(filtered)
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const createRequirement = async () => {
    try {
      const response = await fetch('/api/requirements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newRequirement,
          estimatedHours: newRequirement.estimatedHours || undefined,
          projectId: newRequirement.projectId || undefined,
        }),
      })

      if (response.ok) {
        await fetchRequirements()
        setCreateDialogOpen(false)
        setNewRequirement({
          title: '',
          description: '',
          priority: 'MEDIUM',
          status: 'SUBMITTED',
          tags: '',
          estimatedHours: null,
          projectId: '',
        })
      }
    } catch (error) {
      console.error('Failed to create requirement:', error)
    }
  }

  const updateRequirement = async (id: string, updates: Partial<Requirement>) => {
    try {
      const response = await fetch(`/api/requirements/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (response.ok) {
        await fetchRequirements()
        setEditingRequirement(null)
      }
    } catch (error) {
      console.error('Failed to update requirement:', error)
    }
  }

  const deleteRequirement = async (id: string) => {
    if (!confirm('Are you sure you want to delete this requirement?')) return

    try {
      const response = await fetch(`/api/requirements/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchRequirements()
        setDetailsDialogOpen(false)
      }
    } catch (error) {
      console.error('Failed to delete requirement:', error)
    }
  }

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-500/10 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-400'
      case 'MEDIUM':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-400'
      case 'LOW':
        return 'bg-blue-500/10 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400'
    }
  }

  const getStatusColor = (status: RequirementStatus) => {
    switch (status) {
      case 'SUBMITTED':
        return 'bg-slate-500/10 text-slate-700 border-slate-200 dark:bg-slate-500/20 dark:text-slate-400'
      case 'APPROVED':
        return 'bg-green-500/10 text-green-700 border-green-200 dark:bg-green-500/20 dark:text-green-400'
      case 'IN_DEVELOPMENT':
        return 'bg-blue-500/10 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400'
      case 'IN_TESTING':
        return 'bg-purple-500/10 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-400'
      case 'COMPLETED':
        return 'bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400'
      case 'REJECTED':
        return 'bg-red-500/10 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-400'
    }
  }

  const getStatusIcon = (status: RequirementStatus) => {
    switch (status) {
      case 'SUBMITTED':
        return <FileText className="w-3 h-3" />
      case 'APPROVED':
        return <CheckCircle2 className="w-3 h-3" />
      case 'IN_DEVELOPMENT':
        return <Clock className="w-3 h-3" />
      case 'IN_TESTING':
        return <AlertCircle className="w-3 h-3" />
      case 'COMPLETED':
        return <CheckCircle2 className="w-3 h-3" />
      case 'REJECTED':
        return <XCircle className="w-3 h-3" />
    }
  }

  const formatStatus = (status: RequirementStatus) => {
    return status.replace(/_/g, ' ')
  }

  const SortButton = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-foreground transition-colors"
    >
      {label}
      {sortField === field ? (
        sortDirection === 'asc' ? (
          <ArrowUp className="w-3 h-3" />
        ) : (
          <ArrowDown className="w-3 h-3" />
        )
      ) : (
        <ArrowUpDown className="w-3 h-3 opacity-50" />
      )}
    </button>
  )

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">需求管理</h1>
          <p className="text-muted-foreground mt-1">
            管理和跟踪产品需求
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          新建需求
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">总计</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{requirements.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">开发中</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {requirements.filter((r) => r.status === 'IN_DEVELOPMENT').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">已完成</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {requirements.filter((r) => r.status === 'COMPLETED').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">高优先级</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {requirements.filter((r) => r.priority === 'HIGH').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="搜索需求..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as RequirementStatus | 'ALL')}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">全部状态</SelectItem>
                <SelectItem value="SUBMITTED">已提交</SelectItem>
                <SelectItem value="APPROVED">已批准</SelectItem>
                <SelectItem value="IN_DEVELOPMENT">开发中</SelectItem>
                <SelectItem value="IN_TESTING">测试中</SelectItem>
                <SelectItem value="COMPLETED">已完成</SelectItem>
                <SelectItem value="REJECTED">已拒绝</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as Priority | 'ALL')}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="优先级" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">全部优先级</SelectItem>
                <SelectItem value="HIGH">高</SelectItem>
                <SelectItem value="MEDIUM">中</SelectItem>
                <SelectItem value="LOW">低</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Requirements Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">加载中...</div>
          ) : filteredRequirements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              未找到需求
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <SortButton field="title" label="标题" />
                  </TableHead>
                  <TableHead>
                    <SortButton field="priority" label="优先级" />
                  </TableHead>
                  <TableHead>
                    <SortButton field="status" label="状态" />
                  </TableHead>
                  <TableHead>标签</TableHead>
                  <TableHead className="text-right">
                    <SortButton field="estimatedHours" label="预估工时" />
                  </TableHead>
                  <TableHead>
                    <SortButton field="createdAt" label="创建时间" />
                  </TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequirements.map((requirement) => (
                  <TableRow key={requirement.id}>
                    <TableCell className="font-medium max-w-[300px]">
                      <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="truncate">{requirement.title}</div>
                          {requirement.description && (
                            <div className="text-xs text-muted-foreground truncate mt-1">
                              {requirement.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(requirement.priority)}>
                        {requirement.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(requirement.status)}>
                        {getStatusIcon(requirement.status)}
                        {formatStatus(requirement.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {requirement.tags && (
                        <div className="flex flex-wrap gap-1">
                          {requirement.tags.split(',').slice(0, 2).map((tag, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              <Tag className="w-2.5 h-2.5 mr-1" />
                              {tag.trim()}
                            </Badge>
                          ))}
                          {requirement.tags.split(',').length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{requirement.tags.split(',').length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {requirement.estimatedHours ? (
                        <div className="flex items-center justify-end gap-1 text-sm">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          {requirement.estimatedHours}h
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {new Date(requirement.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedRequirement(requirement)
                              setDetailsDialogOpen(true)
                            }}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setEditingRequirement(requirement)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => deleteRequirement(requirement.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Requirement Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>创建新需求</DialogTitle>
            <DialogDescription>
              添加一个新需求以便跟踪和管理
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">标题</Label>
              <Input
                id="title"
                placeholder="输入需求标题"
                value={newRequirement.title}
                onChange={(e) =>
                  setNewRequirement({ ...newRequirement, title: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                placeholder="输入详细描述"
                value={newRequirement.description}
                onChange={(e) =>
                  setNewRequirement({ ...newRequirement, description: e.target.value })
                }
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">优先级</Label>
                <Select
                  value={newRequirement.priority}
                  onValueChange={(value: Priority) =>
                    setNewRequirement({ ...newRequirement, priority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">低</SelectItem>
                    <SelectItem value="MEDIUM">中</SelectItem>
                    <SelectItem value="HIGH">高</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">状态</Label>
                <Select
                  value={newRequirement.status}
                  onValueChange={(value: RequirementStatus) =>
                    setNewRequirement({ ...newRequirement, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SUBMITTED">已提交</SelectItem>
                    <SelectItem value="APPROVED">已批准</SelectItem>
                    <SelectItem value="IN_DEVELOPMENT">开发中</SelectItem>
                    <SelectItem value="IN_TESTING">测试中</SelectItem>
                    <SelectItem value="COMPLETED">已完成</SelectItem>
                    <SelectItem value="REJECTED">已拒绝</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tags">标签（逗号分隔）</Label>
                <Input
                  id="tags"
                  placeholder="功能, UI, 后端"
                  value={newRequirement.tags}
                  onChange={(e) =>
                    setNewRequirement({ ...newRequirement, tags: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimatedHours">预估工时</Label>
                <Input
                  id="estimatedHours"
                  type="number"
                  placeholder="40"
                  value={newRequirement.estimatedHours || ''}
                  onChange={(e) =>
                    setNewRequirement({
                      ...newRequirement,
                      estimatedHours: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={createRequirement} disabled={!newRequirement.title}>
              创建需求
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedRequirement && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedRequirement.title}</DialogTitle>
                <div className="flex items-center gap-2 pt-2">
                  <Badge className={getPriorityColor(selectedRequirement.priority)}>
                    {selectedRequirement.priority}
                  </Badge>
                  <Badge className={getStatusColor(selectedRequirement.status)}>
                    {getStatusIcon(selectedRequirement.status)}
                    {formatStatus(selectedRequirement.status)}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="space-y-6">
                {/* Description */}
                <div className="space-y-2">
                  <h3 className="font-semibold">描述</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedRequirement.description || '暂无描述'}
                  </p>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">预估工时</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedRequirement.estimatedHours ? `${selectedRequirement.estimatedHours}h` : '未设置'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">实际工时</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedRequirement.actualHours ? `${selectedRequirement.actualHours}h` : '未跟踪'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">创建时间</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedRequirement.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">最后更新</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedRequirement.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Tags */}
                {selectedRequirement.tags && (
                  <div className="space-y-2">
                    <h3 className="font-semibold">标签</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedRequirement.tags.split(',').map((tag, i) => (
                        <Badge key={i} variant="outline">
                          <Tag className="w-3 h-3 mr-1" />
                          {tag.trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Attachments Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Paperclip className="w-4 h-4" />
                      Attachments
                    </h3>
                    <Button variant="outline" size="sm" disabled>
                      <Plus className="w-4 h-4 mr-2" />
                      Add File
                    </Button>
                  </div>
                  <div className="border rounded-lg p-4">
                    <p className="text-sm text-muted-foreground text-center">
                      No attachments yet. File upload will be implemented soon.
                    </p>
                  </div>
                </div>

                {/* Comments Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Comments
                  </h3>

                  {/* Comments List */}
                  <div className="space-y-3">
                    {selectedRequirement.comments && selectedRequirement.comments.length > 0 ? (
                      selectedRequirement.comments.map((comment) => (
                        <div key={comment.id} className="border rounded-lg p-3">
                          <div className="flex items-start justify-between mb-2">
                            <p className="text-sm font-medium">User {comment.authorId}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(comment.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <p className="text-sm">{comment.content}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No comments yet</p>
                    )}
                  </div>

                  {/* Add Comment */}
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={3}
                    />
                    <Button size="sm" disabled={!newComment}>
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Add Comment
                    </Button>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingRequirement(selectedRequirement)
                    setDetailsDialogOpen(false)
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => deleteRequirement(selectedRequirement.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingRequirement} onOpenChange={(open) => !open && setEditingRequirement(null)}>
        <DialogContent className="max-w-2xl">
          {editingRequirement && (
            <>
              <DialogHeader>
                <DialogTitle>Edit Requirement</DialogTitle>
                <DialogDescription>
                  Update requirement details
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Title</Label>
                  <Input
                    id="edit-title"
                    value={editingRequirement.title}
                    onChange={(e) =>
                      setEditingRequirement({ ...editingRequirement, title: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editingRequirement.description || ''}
                    onChange={(e) =>
                      setEditingRequirement({ ...editingRequirement, description: e.target.value })
                    }
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-priority">Priority</Label>
                    <Select
                      value={editingRequirement.priority}
                      onValueChange={(value: Priority) =>
                        setEditingRequirement({ ...editingRequirement, priority: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-status">Status</Label>
                    <Select
                      value={editingRequirement.status}
                      onValueChange={(value: RequirementStatus) =>
                        setEditingRequirement({ ...editingRequirement, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SUBMITTED">Submitted</SelectItem>
                        <SelectItem value="APPROVED">Approved</SelectItem>
                        <SelectItem value="IN_DEVELOPMENT">In Development</SelectItem>
                        <SelectItem value="IN_TESTING">In Testing</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="REJECTED">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
                    <Input
                      id="edit-tags"
                      value={editingRequirement.tags || ''}
                      onChange={(e) =>
                        setEditingRequirement({ ...editingRequirement, tags: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-estimatedHours">Estimated Hours</Label>
                    <Input
                      id="edit-estimatedHours"
                      type="number"
                      value={editingRequirement.estimatedHours || ''}
                      onChange={(e) =>
                        setEditingRequirement({
                          ...editingRequirement,
                          estimatedHours: e.target.value ? parseInt(e.target.value) : null,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-actualHours">Actual Hours</Label>
                  <Input
                    id="edit-actualHours"
                    type="number"
                    value={editingRequirement.actualHours || ''}
                    onChange={(e) =>
                      setEditingRequirement({
                        ...editingRequirement,
                        actualHours: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingRequirement(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => updateRequirement(editingRequirement.id, editingRequirement)}
                  disabled={!editingRequirement.title}
                >
                  Save Changes
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
