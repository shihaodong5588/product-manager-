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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import {
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  AlertTriangle,
  AlertCircle,
  AlertOctagon,
  Shield,
  Search,
  Grid3x3,
  List,
  Filter,
  User,
  CheckCircle2,
  XCircle,
  Clock,
  Target,
  TrendingUp
} from 'lucide-react'

interface Risk {
  id: string
  title: string
  description: string | null
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  impact: string | null
  mitigation: string | null
  owner: string | null
  status: string
  projectId: string
  createdAt: string
  updatedAt: string
  project?: {
    id: string
    name: string
    status: string
  }
}

interface RiskFormData {
  title: string
  description: string
  level: string
  impact: string
  mitigation: string
  owner: string
  status: string
  projectId: string
}

interface Project {
  id: string
  name: string
  status: string
}

// Risk level configuration with colors and icons
const riskLevelConfig = {
  CRITICAL: {
    label: 'Critical',
    color: 'bg-red-500',
    textColor: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    badgeClass: 'bg-red-100 text-red-800 hover:bg-red-200',
    icon: AlertOctagon,
    probability: 5,
    impact: 5,
  },
  HIGH: {
    label: 'High',
    color: 'bg-orange-500',
    textColor: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    badgeClass: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
    icon: AlertTriangle,
    probability: 4,
    impact: 4,
  },
  MEDIUM: {
    label: 'Medium',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    badgeClass: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
    icon: AlertCircle,
    probability: 3,
    impact: 3,
  },
  LOW: {
    label: 'Low',
    color: 'bg-green-500',
    textColor: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    badgeClass: 'bg-green-100 text-green-800 hover:bg-green-200',
    icon: Shield,
    probability: 2,
    impact: 2,
  },
}

// Status configuration
const statusConfig = {
  open: {
    label: 'Open',
    badgeClass: 'bg-blue-100 text-blue-800',
    icon: Clock,
  },
  mitigated: {
    label: 'Mitigated',
    badgeClass: 'bg-purple-100 text-purple-800',
    icon: CheckCircle2,
  },
  closed: {
    label: 'Closed',
    badgeClass: 'bg-gray-100 text-gray-800',
    icon: XCircle,
  },
}

export default function RisksPage() {
  const [risks, setRisks] = useState<Risk[]>([])
  const [filteredRisks, setFilteredRisks] = useState<Risk[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null)
  const [levelFilter, setLevelFilter] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [projectFilter, setProjectFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'matrix' | 'list'>('list')
  const [formData, setFormData] = useState<RiskFormData>({
    title: '',
    description: '',
    level: 'MEDIUM',
    impact: '',
    mitigation: '',
    owner: '',
    status: 'open',
    projectId: ''
  })

  useEffect(() => {
    fetchRisks()
    fetchProjects()
  }, [])

  useEffect(() => {
    let filtered = risks

    if (levelFilter !== 'ALL') {
      filtered = filtered.filter(r => r.level === levelFilter)
    }

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(r => r.status === statusFilter)
    }

    if (projectFilter !== 'ALL') {
      filtered = filtered.filter(r => r.projectId === projectFilter)
    }

    if (searchQuery) {
      filtered = filtered.filter(r =>
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.owner?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredRisks(filtered)
  }, [levelFilter, statusFilter, projectFilter, searchQuery, risks])

  const fetchRisks = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/risks')
      const data = await response.json()
      setRisks(data)
      setFilteredRisks(data)
    } catch (error) {
      console.error('Failed to fetch risks:', error)
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
    if (!formData.title || !formData.projectId) {
      alert('Please fill in required fields: Title and Project')
      return
    }

    try {
      const response = await fetch('/api/risks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setIsCreateOpen(false)
        resetForm()
        fetchRisks()
      } else {
        const error = await response.json()
        alert(`Failed to create risk: ${error.error}`)
      }
    } catch (error) {
      console.error('Failed to create risk:', error)
      alert('Failed to create risk')
    }
  }

  const handleUpdate = async () => {
    if (!selectedRisk || !formData.title) {
      alert('Title is required')
      return
    }

    try {
      const response = await fetch(`/api/risks/${selectedRisk.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setIsEditOpen(false)
        setSelectedRisk(null)
        resetForm()
        fetchRisks()
      } else {
        const error = await response.json()
        alert(`Failed to update risk: ${error.error}`)
      }
    } catch (error) {
      console.error('Failed to update risk:', error)
      alert('Failed to update risk')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this risk? This action cannot be undone.')) return

    try {
      const response = await fetch(`/api/risks/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchRisks()
      } else {
        const error = await response.json()
        alert(`Failed to delete risk: ${error.error}`)
      }
    } catch (error) {
      console.error('Failed to delete risk:', error)
      alert('Failed to delete risk')
    }
  }

  const openEdit = (risk: Risk) => {
    setSelectedRisk(risk)
    setFormData({
      title: risk.title,
      description: risk.description || '',
      level: risk.level,
      impact: risk.impact || '',
      mitigation: risk.mitigation || '',
      owner: risk.owner || '',
      status: risk.status,
      projectId: risk.projectId
    })
    setIsEditOpen(true)
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      level: 'MEDIUM',
      impact: '',
      mitigation: '',
      owner: '',
      status: 'open',
      projectId: ''
    })
  }

  const getLevelStats = () => {
    return {
      all: risks.length,
      critical: risks.filter(r => r.level === 'CRITICAL').length,
      high: risks.filter(r => r.level === 'HIGH').length,
      medium: risks.filter(r => r.level === 'MEDIUM').length,
      low: risks.filter(r => r.level === 'LOW').length,
    }
  }

  const getStatusStats = () => {
    return {
      open: risks.filter(r => r.status === 'open').length,
      mitigated: risks.filter(r => r.status === 'mitigated').length,
      closed: risks.filter(r => r.status === 'closed').length,
    }
  }

  const stats = getLevelStats()
  const statusStats = getStatusStats()

  // Risk Matrix View
  const renderRiskMatrix = () => {
    const matrix: Risk[][][] = Array(5).fill(null).map(() => Array(5).fill(null).map(() => [] as Risk[]))

    filteredRisks.forEach(risk => {
      const config = riskLevelConfig[risk.level]
      const probability = config.probability - 1
      const impact = config.impact - 1
      matrix[4 - probability][impact].push(risk)
    })

    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Risk Matrix - Probability vs Impact</CardTitle>
            <CardDescription>Visual representation of risks based on their level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* Y-axis label */}
              <div className="flex items-center gap-4">
                <div className="w-20 text-sm font-medium text-center -rotate-0">
                  <div className="transform -rotate-90 origin-center">Probability</div>
                </div>
                <div className="flex-1 space-y-1">
                  {matrix.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex gap-1">
                      {row.map((cell, colIndex) => {
                        const riskCount = cell.length
                        const cellLevel =
                          rowIndex === 0 && colIndex >= 3 ? 'CRITICAL' :
                          rowIndex === 0 && colIndex >= 1 ? 'HIGH' :
                          rowIndex === 1 && colIndex >= 3 ? 'CRITICAL' :
                          rowIndex === 1 && colIndex >= 2 ? 'HIGH' :
                          rowIndex <= 2 && colIndex >= 2 ? 'HIGH' :
                          rowIndex <= 3 && colIndex >= 1 ? 'MEDIUM' :
                          'LOW'

                        const config = riskLevelConfig[cellLevel as keyof typeof riskLevelConfig]

                        return (
                          <div
                            key={colIndex}
                            className={`flex-1 h-20 border-2 rounded ${config.borderColor} ${config.bgColor} flex items-center justify-center cursor-pointer hover:shadow-lg transition-all ${riskCount > 0 ? 'ring-2 ring-offset-1 ring-primary/20' : ''}`}
                            title={`${riskCount} risk(s)`}
                          >
                            {riskCount > 0 && (
                              <div className="text-center">
                                <div className={`text-2xl font-bold ${config.textColor}`}>{riskCount}</div>
                                <div className="text-xs text-muted-foreground">risks</div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
              {/* X-axis label */}
              <div className="flex items-center gap-4">
                <div className="w-20"></div>
                <div className="flex-1 text-sm font-medium text-center">Impact</div>
              </div>
            </div>

            {/* Legend */}
            <div className="mt-6 pt-6 border-t flex items-center gap-4">
              <span className="text-sm font-medium">Risk Levels:</span>
              {Object.entries(riskLevelConfig).map(([key, config]) => (
                <Badge key={key} className={config.badgeClass}>
                  <config.icon className="w-3 h-3 mr-1" />
                  {config.label}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Risk List Below Matrix */}
        <div className="grid gap-4">
          {filteredRisks.map(renderRiskCard)}
        </div>
      </div>
    )
  }

  // Risk Card Component
  const renderRiskCard = (risk: Risk) => {
    const levelConfig = riskLevelConfig[risk.level]
    const statusCfg = statusConfig[risk.status as keyof typeof statusConfig] || statusConfig.open
    const LevelIcon = levelConfig.icon
    const StatusIcon = statusCfg.icon

    return (
      <Card key={risk.id} className={`group hover:shadow-lg transition-all border-l-4 ${levelConfig.borderColor}`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Badge className={levelConfig.badgeClass}>
                  <LevelIcon className="w-3 h-3 mr-1" />
                  {levelConfig.label}
                </Badge>
                <Badge className={statusCfg.badgeClass}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {statusCfg.label}
                </Badge>
                {risk.project && (
                  <Badge variant="outline">
                    {risk.project.name}
                  </Badge>
                )}
              </div>
              <CardTitle className="text-xl group-hover:text-primary transition-colors">
                {risk.title}
              </CardTitle>
              {risk.description && (
                <CardDescription className="line-clamp-2">
                  {risk.description}
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
                <DropdownMenuItem onClick={() => openEdit(risk)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDelete(risk.id)}
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {risk.impact && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Target className="w-4 h-4" />
                  Impact
                </div>
                <p className="text-sm">{risk.impact}</p>
              </div>
            )}
            {risk.mitigation && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Shield className="w-4 h-4" />
                  Mitigation Strategy
                </div>
                <p className="text-sm">{risk.mitigation}</p>
              </div>
            )}
          </div>

          {risk.owner && (
            <div className="flex items-center gap-2 text-sm pt-2 border-t">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Owner:</span>
              <span className="font-medium">{risk.owner}</span>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Form Dialog Content
  const renderFormDialog = (isEdit: boolean) => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="title">标题 *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="输入风险标题"
        />
      </div>

      <div>
        <Label htmlFor="description">描述</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="描述风险"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="level">风险等级 *</Label>
          <Select value={formData.level} onValueChange={(value) => setFormData({ ...formData, level: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LOW">低</SelectItem>
              <SelectItem value="MEDIUM">中</SelectItem>
              <SelectItem value="HIGH">高</SelectItem>
              <SelectItem value="CRITICAL">严重</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="status">状态 *</Label>
          <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">待处理</SelectItem>
              <SelectItem value="mitigated">已缓解</SelectItem>
              <SelectItem value="closed">已关闭</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

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
        <Label htmlFor="impact">影响</Label>
        <Textarea
          id="impact"
          value={formData.impact}
          onChange={(e) => setFormData({ ...formData, impact: e.target.value })}
          placeholder="描述潜在影响"
          rows={2}
        />
      </div>

      <div>
        <Label htmlFor="mitigation">缓解策略</Label>
        <Textarea
          id="mitigation"
          value={formData.mitigation}
          onChange={(e) => setFormData({ ...formData, mitigation: e.target.value })}
          placeholder="描述缓解策略"
          rows={2}
        />
      </div>

      <div>
        <Label htmlFor="owner">负责人</Label>
        <Input
          id="owner"
          value={formData.owner}
          onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
          placeholder="输入负责人姓名"
        />
      </div>
    </div>
  )

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">风险管理</h1>
          <p className="text-muted-foreground mt-1">识别、评估和缓解项目风险</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              新建风险
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>创建新风险</DialogTitle>
              <DialogDescription>添加新的风险以便跟踪和管理</DialogDescription>
            </DialogHeader>
            {renderFormDialog(false)}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                取消
              </Button>
              <Button onClick={handleCreate} disabled={!formData.title || !formData.projectId}>
                创建
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card
          className={`cursor-pointer transition-all ${levelFilter === 'ALL' ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
          onClick={() => setLevelFilter('ALL')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">全部风险</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.all}</div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${levelFilter === 'CRITICAL' ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
          onClick={() => setLevelFilter('CRITICAL')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">严重</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${levelFilter === 'HIGH' ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
          onClick={() => setLevelFilter('HIGH')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">高</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.high}</div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${levelFilter === 'MEDIUM' ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
          onClick={() => setLevelFilter('MEDIUM')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">中</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.medium}</div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${levelFilter === 'LOW' ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
          onClick={() => setLevelFilter('LOW')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">低</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.low}</div>
          </CardContent>
        </Card>
      </div>

      {/* Status Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card
          className={`cursor-pointer transition-all ${statusFilter === 'open' ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
          onClick={() => setStatusFilter(statusFilter === 'open' ? 'ALL' : 'open')}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <CardTitle className="text-sm font-medium text-muted-foreground">待处理</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{statusStats.open}</div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${statusFilter === 'mitigated' ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
          onClick={() => setStatusFilter(statusFilter === 'mitigated' ? 'ALL' : 'mitigated')}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-600" />
              <CardTitle className="text-sm font-medium text-muted-foreground">已缓解</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{statusStats.mitigated}</div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${statusFilter === 'closed' ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
          onClick={() => setStatusFilter(statusFilter === 'closed' ? 'ALL' : 'closed')}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-gray-600" />
              <CardTitle className="text-sm font-medium text-muted-foreground">已关闭</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{statusStats.closed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and View Toggle */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 flex-1">
          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search risks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Project Filter */}
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Projects</SelectItem>
              {projects.map(project => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="w-4 h-4" />
            <span>
              Showing {filteredRisks.length} / {risks.length} risks
            </span>
          </div>
        </div>

        {/* View Toggle */}
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'matrix' | 'list')}>
          <TabsList>
            <TabsTrigger value="list" className="gap-2">
              <List className="w-4 h-4" />
              List View
            </TabsTrigger>
            <TabsTrigger value="matrix" className="gap-2">
              <Grid3x3 className="w-4 h-4" />
              Matrix View
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">Loading risks...</p>
        </div>
      ) : viewMode === 'matrix' ? (
        renderRiskMatrix()
      ) : (
        <div className="space-y-4">
          {filteredRisks.map(renderRiskCard)}
          {filteredRisks.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No risks found</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setIsCreateOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create your first risk
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Risk</DialogTitle>
            <DialogDescription>Update risk information</DialogDescription>
          </DialogHeader>
          {renderFormDialog(true)}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={!formData.title}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
