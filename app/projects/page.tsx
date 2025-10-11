'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import {
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Calendar,
  Users,
  DollarSign,
  FolderKanban,
  ListTodo,
  Filter,
  LayoutGrid,
  LayoutList,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle2,
  Pause,
  XCircle
} from 'lucide-react'
import { format } from 'date-fns'

interface Project {
  id: string
  name: string
  description: string | null
  status: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED'
  startDate: string | null
  endDate: string | null
  budget: number | null
  progress: number
  createdAt: string
  updatedAt: string
  _count?: {
    requirements: number
    tasks: number
    members: number
  }
  requirements?: any[]
  tasks?: any[]
  members?: any[]
  milestones?: any[]
}

interface ProjectFormData {
  name: string
  description: string
  status: string
  startDate: string
  endDate: string
  budget: string
}

const statusConfig = {
  PLANNING: {
    label: '规划中',
    color: 'bg-slate-500',
    icon: Clock,
    badgeClass: 'bg-slate-100 text-slate-800 hover:bg-slate-200'
  },
  ACTIVE: {
    label: '进行中',
    color: 'bg-blue-500',
    icon: TrendingUp,
    badgeClass: 'bg-blue-100 text-blue-800 hover:bg-blue-200'
  },
  ON_HOLD: {
    label: '暂停',
    color: 'bg-yellow-500',
    icon: Pause,
    badgeClass: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
  },
  COMPLETED: {
    label: '已完成',
    color: 'bg-green-500',
    icon: CheckCircle2,
    badgeClass: 'bg-green-100 text-green-800 hover:bg-green-200'
  },
  CANCELLED: {
    label: '已取消',
    color: 'bg-red-500',
    icon: XCircle,
    badgeClass: 'bg-red-100 text-red-800 hover:bg-red-200'
  },
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid')
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    status: 'PLANNING',
    startDate: '',
    endDate: '',
    budget: ''
  })

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    if (statusFilter === 'ALL') {
      setFilteredProjects(projects)
    } else {
      setFilteredProjects(projects.filter(p => p.status === statusFilter))
    }
  }, [statusFilter, projects])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/projects')
      const data = await response.json()
      setProjects(data)
      setFilteredProjects(data)
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setIsCreateOpen(false)
        resetForm()
        fetchProjects()
      }
    } catch (error) {
      console.error('Failed to create project:', error)
    }
  }

  const handleUpdate = async () => {
    if (!selectedProject) return

    try {
      const response = await fetch(`/api/projects/${selectedProject.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setIsEditOpen(false)
        setSelectedProject(null)
        resetForm()
        fetchProjects()
      }
    } catch (error) {
      console.error('Failed to update project:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个项目吗？此操作不可撤销。')) return

    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchProjects()
      }
    } catch (error) {
      console.error('Failed to delete project:', error)
    }
  }

  const openEdit = (project: Project) => {
    setSelectedProject(project)
    setFormData({
      name: project.name,
      description: project.description || '',
      status: project.status,
      startDate: project.startDate ? format(new Date(project.startDate), 'yyyy-MM-dd') : '',
      endDate: project.endDate ? format(new Date(project.endDate), 'yyyy-MM-dd') : '',
      budget: project.budget?.toString() || ''
    })
    setIsEditOpen(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      status: 'PLANNING',
      startDate: '',
      endDate: '',
      budget: ''
    })
  }

  const getStatusStats = () => {
    return {
      all: projects.length,
      planning: projects.filter(p => p.status === 'PLANNING').length,
      active: projects.filter(p => p.status === 'ACTIVE').length,
      onHold: projects.filter(p => p.status === 'ON_HOLD').length,
      completed: projects.filter(p => p.status === 'COMPLETED').length,
      cancelled: projects.filter(p => p.status === 'CANCELLED').length,
    }
  }

  const stats = getStatusStats()

  const renderProjectCard = (project: Project) => {
    const StatusIcon = statusConfig[project.status].icon
    const memberCount = project._count?.members || project.members?.length || 0
    const requirementCount = project._count?.requirements || project.requirements?.length || 0
    const taskCount = project._count?.tasks || project.tasks?.length || 0

    return (
      <Card key={project.id} className="group hover:shadow-lg transition-all duration-300 hover:border-primary/50">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={statusConfig[project.status].badgeClass}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {statusConfig[project.status].label}
                </Badge>
              </div>
              <CardTitle className="text-xl mb-1 group-hover:text-primary transition-colors">
                {project.name}
              </CardTitle>
              <CardDescription className="line-clamp-2">
                {project.description || '暂无描述'}
              </CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>操作</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => openEdit(project)}>
                  <Edit className="w-4 h-4 mr-2" />
                  编辑
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDelete(project.id)}
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  删除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">进度</span>
              <span className="font-semibold">{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-2" />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{memberCount}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>团队成员</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 text-sm">
                    <FolderKanban className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{requirementCount}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>需求数量</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 text-sm">
                    <ListTodo className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{taskCount}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>任务数量</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Budget and Dates */}
          <div className="space-y-2 pt-2 border-t">
            {project.budget && (
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">预算:</span>
                <span className="font-semibold text-green-600">
                  ¥{project.budget.toLocaleString()}
                </span>
              </div>
            )}
            {project.startDate && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">开始:</span>
                <span>{format(new Date(project.startDate), 'yyyy-MM-dd')}</span>
              </div>
            )}
            {project.endDate && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">结束:</span>
                <span>{format(new Date(project.endDate), 'yyyy-MM-dd')}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderTimelineView = () => {
    const projectsWithDates = filteredProjects.filter(p => p.startDate || p.endDate)

    return (
      <div className="space-y-4">
        {projectsWithDates.map(project => {
          const StatusIcon = statusConfig[project.status].icon
          const daysRemaining = project.endDate
            ? Math.ceil((new Date(project.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
            : null

          return (
            <Card key={project.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center gap-6">
                  {/* Project Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{project.name}</h3>
                      <Badge className={statusConfig[project.status].badgeClass}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusConfig[project.status].label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-1">
                      {project.description || '暂无描述'}
                    </p>

                    {/* Timeline Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {project.startDate ? format(new Date(project.startDate), 'yyyy-MM-dd') : '未设置'}
                        </span>
                        <span>
                          {project.endDate ? format(new Date(project.endDate), 'yyyy-MM-dd') : '未设置'}
                        </span>
                      </div>
                      <Progress value={project.progress} className="h-2" />
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">进度: {project.progress}%</span>
                        {daysRemaining !== null && (
                          <span className={daysRemaining < 0 ? 'text-red-600 font-medium' : 'text-muted-foreground'}>
                            {daysRemaining < 0
                              ? `已逾期 ${Math.abs(daysRemaining)} 天`
                              : `剩余 ${daysRemaining} 天`
                            }
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-6 text-sm border-l pl-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {project._count?.members || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">成员</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {project._count?.requirements || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">需求</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {project._count?.tasks || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">任务</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(project)}>
                        <Edit className="w-4 h-4 mr-2" />
                        编辑
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(project.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        删除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          )
        })}
        {projectsWithDates.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">暂无带时间线的项目</p>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">项目管理</h1>
          <p className="text-muted-foreground mt-1">管理和跟踪所有项目进度</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              新建项目
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>创建新项目</DialogTitle>
              <DialogDescription>填写项目基本信息</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">项目名称 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="输入项目名称"
                />
              </div>
              <div>
                <Label htmlFor="description">项目描述</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="输入项目描述"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">状态</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PLANNING">规划中</SelectItem>
                      <SelectItem value="ACTIVE">进行中</SelectItem>
                      <SelectItem value="ON_HOLD">暂停</SelectItem>
                      <SelectItem value="COMPLETED">已完成</SelectItem>
                      <SelectItem value="CANCELLED">已取消</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="budget">预算</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    placeholder="项目预算"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">开始日期</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">结束日期</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                取消
              </Button>
              <Button onClick={handleCreate} disabled={!formData.name}>
                创建
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-6 gap-4">
        <Card
          className={`cursor-pointer transition-all ${statusFilter === 'ALL' ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
          onClick={() => setStatusFilter('ALL')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">全部项目</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.all}</div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${statusFilter === 'PLANNING' ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
          onClick={() => setStatusFilter('PLANNING')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">规划中</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-600">{stats.planning}</div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${statusFilter === 'ACTIVE' ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
          onClick={() => setStatusFilter('ACTIVE')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">进行中</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${statusFilter === 'ON_HOLD' ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
          onClick={() => setStatusFilter('ON_HOLD')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">暂停</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.onHold}</div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${statusFilter === 'COMPLETED' ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
          onClick={() => setStatusFilter('COMPLETED')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">已完成</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${statusFilter === 'CANCELLED' ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
          onClick={() => setStatusFilter('CANCELLED')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">已取消</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
          </CardContent>
        </Card>
      </div>

      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            显示 {filteredProjects.length} / {projects.length} 个项目
          </span>
        </div>
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'grid' | 'timeline')}>
          <TabsList>
            <TabsTrigger value="grid" className="gap-2">
              <LayoutGrid className="w-4 h-4" />
              卡片视图
            </TabsTrigger>
            <TabsTrigger value="timeline" className="gap-2">
              <LayoutList className="w-4 h-4" />
              时间线视图
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Projects Display */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">加载中...</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map(renderProjectCard)}
          {filteredProjects.length === 0 && (
            <Card className="col-span-full">
              <CardContent className="py-12 text-center">
                <FolderKanban className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">暂无项目</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setIsCreateOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  创建第一个项目
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        renderTimelineView()
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>编辑项目</DialogTitle>
            <DialogDescription>修改项目信息</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">项目名称 *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="输入项目名称"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">项目描述</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="输入项目描述"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-status">状态</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PLANNING">规划中</SelectItem>
                    <SelectItem value="ACTIVE">进行中</SelectItem>
                    <SelectItem value="ON_HOLD">暂停</SelectItem>
                    <SelectItem value="COMPLETED">已完成</SelectItem>
                    <SelectItem value="CANCELLED">已取消</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-budget">预算</Label>
                <Input
                  id="edit-budget"
                  type="number"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  placeholder="项目预算"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-startDate">开始日期</Label>
                <Input
                  id="edit-startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-endDate">结束日期</Label>
                <Input
                  id="edit-endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              取消
            </Button>
            <Button onClick={handleUpdate} disabled={!formData.name}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
