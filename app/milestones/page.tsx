'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import {
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Calendar,
  Flag,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Filter
} from 'lucide-react'
import { format, formatDistanceToNow, isPast, isFuture, isToday } from 'date-fns'

interface Project {
  id: string
  name: string
  status: string
}

interface Milestone {
  id: string
  title: string
  description: string | null
  status: 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED'
  dueDate: string
  completedAt: string | null
  projectId: string
  createdAt: string
  updatedAt: string
  project: Project
}

interface MilestoneFormData {
  title: string
  description: string
  status: string
  dueDate: string
  projectId: string
}

const statusConfig = {
  UPCOMING: {
    label: 'Upcoming',
    color: 'bg-blue-500',
    icon: Clock,
    badgeClass: 'bg-blue-100 text-blue-800 hover:bg-blue-200'
  },
  IN_PROGRESS: {
    label: '进行中',
    color: 'bg-yellow-500',
    icon: TrendingUp,
    badgeClass: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
  },
  COMPLETED: {
    label: '已完成',
    color: 'bg-green-500',
    icon: CheckCircle2,
    badgeClass: 'bg-green-100 text-green-800 hover:bg-green-200'
  },
  DELAYED: {
    label: 'Delayed',
    color: 'bg-red-500',
    icon: AlertCircle,
    badgeClass: 'bg-red-100 text-red-800 hover:bg-red-200'
  },
}

export default function MilestonesPage() {
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [filteredMilestones, setFilteredMilestones] = useState<Milestone[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [formData, setFormData] = useState<MilestoneFormData>({
    title: '',
    description: '',
    status: 'UPCOMING',
    dueDate: '',
    projectId: ''
  })

  useEffect(() => {
    fetchMilestones()
    fetchProjects()
  }, [])

  useEffect(() => {
    if (statusFilter === 'ALL') {
      setFilteredMilestones(milestones)
    } else {
      setFilteredMilestones(milestones.filter(m => m.status === statusFilter))
    }
  }, [statusFilter, milestones])

  const fetchMilestones = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/milestones')
      const data = await response.json()
      setMilestones(data)
      setFilteredMilestones(data)
    } catch (error) {
      console.error('Failed to fetch milestones:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      const data = await response.json()
      setProjects(data)
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    }
  }

  const handleCreate = async () => {
    try {
      const response = await fetch('/api/milestones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setIsCreateOpen(false)
        resetForm()
        fetchMilestones()
      }
    } catch (error) {
      console.error('Failed to create milestone:', error)
    }
  }

  const handleUpdate = async () => {
    if (!selectedMilestone) return

    try {
      const response = await fetch(`/api/milestones/${selectedMilestone.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setIsEditOpen(false)
        setSelectedMilestone(null)
        resetForm()
        fetchMilestones()
      }
    } catch (error) {
      console.error('Failed to update milestone:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this milestone?')) return

    try {
      const response = await fetch(`/api/milestones/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchMilestones()
      }
    } catch (error) {
      console.error('Failed to delete milestone:', error)
    }
  }

  const openEdit = (milestone: Milestone) => {
    setSelectedMilestone(milestone)
    setFormData({
      title: milestone.title,
      description: milestone.description || '',
      status: milestone.status,
      dueDate: format(new Date(milestone.dueDate), 'yyyy-MM-dd'),
      projectId: milestone.projectId
    })
    setIsEditOpen(true)
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      status: 'UPCOMING',
      dueDate: '',
      projectId: ''
    })
  }

  const getStatusStats = () => {
    return {
      all: milestones.length,
      upcoming: milestones.filter(m => m.status === 'UPCOMING').length,
      inProgress: milestones.filter(m => m.status === 'IN_PROGRESS').length,
      completed: milestones.filter(m => m.status === 'COMPLETED').length,
      delayed: milestones.filter(m => m.status === 'DELAYED').length,
    }
  }

  const calculateProgress = () => {
    if (milestones.length === 0) return 0
    const completed = milestones.filter(m => m.status === 'COMPLETED').length
    return Math.round((completed / milestones.length) * 100)
  }

  const getDueDateStatus = (dueDate: string, status: string) => {
    if (status === 'COMPLETED') return 'completed'
    const date = new Date(dueDate)
    if (isToday(date)) return 'today'
    if (isPast(date)) return 'overdue'
    if (isFuture(date)) return 'upcoming'
    return 'upcoming'
  }

  const stats = getStatusStats()
  const progress = calculateProgress()

  const renderTimelineView = () => {
    // Group milestones by month
    const groupedMilestones = filteredMilestones.reduce((acc, milestone) => {
      const monthKey = format(new Date(milestone.dueDate), 'yyyy-MM')
      if (!acc[monthKey]) {
        acc[monthKey] = []
      }
      acc[monthKey].push(milestone)
      return acc
    }, {} as Record<string, Milestone[]>)

    const sortedMonths = Object.keys(groupedMilestones).sort()

    return (
      <div className="space-y-8">
        {sortedMonths.map(monthKey => {
          const monthMilestones = groupedMilestones[monthKey]
          const monthDate = new Date(monthKey + '-01')

          return (
            <div key={monthKey} className="space-y-4">
              {/* Month Header */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">
                    {format(monthDate, 'MMMM yyyy')}
                  </h2>
                </div>
                <div className="h-px bg-border flex-1"></div>
                <Badge variant="outline">
                  {monthMilestones.length} {monthMilestones.length === 1 ? 'milestone' : 'milestones'}
                </Badge>
              </div>

              {/* Timeline */}
              <div className="relative border-l-2 border-border ml-3 space-y-6 pl-8">
                {monthMilestones.map((milestone, index) => {
                  const StatusIcon = statusConfig[milestone.status].icon
                  const dueDateStatus = getDueDateStatus(milestone.dueDate, milestone.status)
                  const dueDate = new Date(milestone.dueDate)

                  return (
                    <div key={milestone.id} className="relative group">
                      {/* Timeline Dot */}
                      <div className={`absolute -left-[41px] mt-1.5 w-6 h-6 rounded-full border-4 border-background ${statusConfig[milestone.status].color} flex items-center justify-center`}>
                        <StatusIcon className="w-3 h-3 text-white" />
                      </div>

                      {/* Milestone Card */}
                      <Card className="hover:shadow-lg transition-all duration-300 hover:border-primary/50">
                        <CardHeader>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge className={statusConfig[milestone.status].badgeClass}>
                                  <StatusIcon className="w-3 h-3 mr-1" />
                                  {statusConfig[milestone.status].label}
                                </Badge>
                                <Badge variant="outline" className="gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {format(dueDate, 'MMM dd, yyyy')}
                                </Badge>
                                {dueDateStatus === 'overdue' && (
                                  <Badge className="bg-red-100 text-red-800">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    Overdue
                                  </Badge>
                                )}
                                {dueDateStatus === 'today' && (
                                  <Badge className="bg-orange-100 text-orange-800">
                                    <Clock className="w-3 h-3 mr-1" />
                                    Due Today
                                  </Badge>
                                )}
                              </div>
                              <CardTitle className="text-lg group-hover:text-primary transition-colors">
                                {milestone.title}
                              </CardTitle>
                              {milestone.description && (
                                <CardDescription className="line-clamp-2">
                                  {milestone.description}
                                </CardDescription>
                              )}
                            </div>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => openEdit(milestone)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDelete(milestone.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-3">
                          {/* Project Info */}
                          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                            <Flag className="w-4 h-4 text-muted-foreground" />
                            <div className="flex-1">
                              <div className="text-sm font-medium">{milestone.project.name}</div>
                              <div className="text-xs text-muted-foreground">Project</div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {milestone.project.status}
                            </Badge>
                          </div>

                          {/* Date Information */}
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="space-y-1">
                              <div className="text-xs text-muted-foreground">Due Date</div>
                              <div className="font-medium">
                                {format(dueDate, 'PPP')}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {dueDateStatus === 'completed'
                                  ? '已完成'
                                  : dueDateStatus === 'overdue'
                                  ? `${formatDistanceToNow(dueDate)} overdue`
                                  : `in ${formatDistanceToNow(dueDate)}`
                                }
                              </div>
                            </div>

                            {milestone.completedAt && (
                              <div className="space-y-1">
                                <div className="text-xs text-muted-foreground">Completed At</div>
                                <div className="font-medium text-green-600">
                                  {format(new Date(milestone.completedAt), 'PPP')}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(milestone.completedAt))} ago
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {filteredMilestones.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Flag className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No milestones found</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setIsCreateOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create your first milestone
              </Button>
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
          <h1 className="text-3xl font-bold">里程碑</h1>
          <p className="text-muted-foreground mt-1">跟踪和管理项目里程碑</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              新建里程碑
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>创建新里程碑</DialogTitle>
              <DialogDescription>添加新的里程碑以跟踪项目进度</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">标题 *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="输入里程碑标题"
                />
              </div>
              <div>
                <Label htmlFor="description">描述</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="输入里程碑描述"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="project">项目 *</Label>
                  <Select value={formData.projectId} onValueChange={(value) => setFormData({ ...formData, projectId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择项目" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map(project => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UPCOMING">Upcoming</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="DELAYED">Delayed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!formData.title || !formData.projectId || !formData.dueDate}
              >
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card
          className={`cursor-pointer transition-all ${statusFilter === 'ALL' ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
          onClick={() => setStatusFilter('ALL')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">全部里程碑</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.all}</div>
            <div className="text-xs text-muted-foreground mt-1">{progress}% 已完成</div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${statusFilter === 'UPCOMING' ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
          onClick={() => setStatusFilter('UPCOMING')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">即将到来</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.upcoming}</div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${statusFilter === 'IN_PROGRESS' ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
          onClick={() => setStatusFilter('IN_PROGRESS')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">进行中</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
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
          className={`cursor-pointer transition-all ${statusFilter === 'DELAYED' ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
          onClick={() => setStatusFilter('DELAYED')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">延期</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.delayed}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">进度</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{progress}%</div>
            <div className="text-xs text-muted-foreground mt-1">总体完成度</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Info */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          显示 {filteredMilestones.length} / {milestones.length} 个里程碑
        </span>
      </div>

      {/* Timeline View */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">Loading milestones...</p>
        </div>
      ) : (
        renderTimelineView()
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Milestone</DialogTitle>
            <DialogDescription>Update milestone information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="输入里程碑标题"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="输入里程碑描述"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-project">Project *</Label>
                <Select value={formData.projectId} onValueChange={(value) => setFormData({ ...formData, projectId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择项目" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UPCOMING">Upcoming</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="DELAYED">Delayed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-dueDate">Due Date *</Label>
              <Input
                id="edit-dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={!formData.title || !formData.projectId || !formData.dueDate}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
