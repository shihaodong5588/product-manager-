'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import {
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Users,
  Search,
  ListChecks,
  FolderKanban,
  Activity,
  Mail,
  Shield,
  UserCog,
  Eye,
  Crown
} from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  avatar: string | null
  role: string
  createdAt: string
  updatedAt: string
  _count?: {
    assignedTasks: number
    projectMemberships: number
    activities: number
  }
  stats?: {
    totalTasks: number
    completedTasks: number
    activeTasks: number
  }
  assignedTasks?: any[]
  projectMemberships?: any[]
  activities?: any[]
}

interface UserFormData {
  name: string
  email: string
  avatar: string
  role: string
}

const roleConfig = {
  admin: {
    label: '管理员',
    icon: Crown,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    gradient: 'from-purple-500 to-pink-500'
  },
  manager: {
    label: '经理',
    icon: UserCog,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    gradient: 'from-blue-500 to-cyan-500'
  },
  member: {
    label: '成员',
    icon: Users,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    gradient: 'from-green-500 to-emerald-500'
  },
  viewer: {
    label: '观众',
    icon: Eye,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    gradient: 'from-gray-500 to-slate-500'
  },
}

// Avatar gradient backgrounds
const avatarGradients = [
  'from-red-500 to-orange-500',
  'from-blue-500 to-indigo-500',
  'from-green-500 to-teal-500',
  'from-purple-500 to-pink-500',
  'from-yellow-500 to-amber-500',
  'from-cyan-500 to-blue-500',
  'from-pink-500 to-rose-500',
  'from-indigo-500 to-purple-500',
]

export default function TeamPage() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [roleFilter, setRoleFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    avatar: '',
    role: 'member'
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    let filtered = users

    // Filter by role
    if (roleFilter !== 'ALL') {
      filtered = filtered.filter(u => u.role === roleFilter)
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredUsers(filtered)
  }, [roleFilter, searchQuery, users])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/users')
      const data = await response.json()
      setUsers(data)
      setFilteredUsers(data)
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setIsCreateOpen(false)
        resetForm()
        fetchUsers()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create user')
      }
    } catch (error) {
      console.error('Failed to create user:', error)
      alert('Failed to create user')
    }
  }

  const handleUpdate = async () => {
    if (!selectedUser) return

    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setIsEditOpen(false)
        setSelectedUser(null)
        resetForm()
        fetchUsers()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update user')
      }
    } catch (error) {
      console.error('Failed to update user:', error)
      alert('Failed to update user')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this team member? This action cannot be undone.')) return

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchUsers()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete user')
      }
    } catch (error) {
      console.error('Failed to delete user:', error)
      alert('Failed to delete user')
    }
  }

  const openEdit = (user: User) => {
    setSelectedUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      avatar: user.avatar || '',
      role: user.role
    })
    setIsEditOpen(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      avatar: '',
      role: 'member'
    })
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getAvatarGradient = (userId: string) => {
    const index = parseInt(userId.slice(-1), 16) % avatarGradients.length
    return avatarGradients[index]
  }

  const getRoleStats = () => {
    return {
      all: users.length,
      admin: users.filter(u => u.role === 'admin').length,
      manager: users.filter(u => u.role === 'manager').length,
      member: users.filter(u => u.role === 'member').length,
      viewer: users.filter(u => u.role === 'viewer').length,
    }
  }

  const stats = getRoleStats()

  const renderUserCard = (user: User) => {
    const RoleIcon = roleConfig[user.role as keyof typeof roleConfig]?.icon || Shield
    const taskCount = user._count?.assignedTasks || user.assignedTasks?.length || 0
    const projectCount = user._count?.projectMemberships || user.projectMemberships?.length || 0
    const activityCount = user._count?.activities || user.activities?.length || 0
    const activeTasks = user.stats?.activeTasks || 0
    const completedTasks = user.stats?.completedTasks || 0

    return (
      <Card key={user.id} className="group hover:shadow-lg transition-all duration-300 hover:border-primary/50">
        <CardHeader className="pb-4">
          <div className="flex items-start gap-4">
            <div className="relative">
              <Avatar className="h-16 w-16 border-2 border-background shadow-lg">
                {user.avatar ? (
                  <AvatarImage src={user.avatar} alt={user.name} />
                ) : (
                  <AvatarFallback className={`bg-gradient-to-br ${getAvatarGradient(user.id)} text-white text-lg font-semibold`}>
                    {getInitials(user.name)}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className={`absolute -bottom-1 -right-1 p-1.5 rounded-full ${roleConfig[user.role as keyof typeof roleConfig]?.bgColor || 'bg-gray-100'}`}>
                <RoleIcon className={`w-3.5 h-3.5 ${roleConfig[user.role as keyof typeof roleConfig]?.color || 'text-gray-600'}`} />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg mb-1 truncate group-hover:text-primary transition-colors">
                    {user.name}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1.5 text-xs">
                    <Mail className="w-3 h-3" />
                    <span className="truncate">{user.email}</span>
                  </CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>操作</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => openEdit(user)}>
                      <Edit className="w-4 h-4 mr-2" />
                      编辑
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(user.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      删除
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="mt-2">
                <Badge variant="outline" className={`${roleConfig[user.role as keyof typeof roleConfig]?.bgColor || 'bg-gray-100'} border-0`}>
                  <RoleIcon className={`w-3 h-3 mr-1 ${roleConfig[user.role as keyof typeof roleConfig]?.color || 'text-gray-600'}`} />
                  <span className={roleConfig[user.role as keyof typeof roleConfig]?.color || 'text-gray-600'}>
                    {roleConfig[user.role as keyof typeof roleConfig]?.label || user.role}
                  </span>
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Task Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50">
              <ListChecks className="w-4 h-4 text-blue-600" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-blue-600 font-medium">活跃任务</div>
                <div className="text-lg font-bold text-blue-700">{activeTasks}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50">
              <ListChecks className="w-4 h-4 text-green-600" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-green-600 font-medium">已完成</div>
                <div className="text-lg font-bold text-green-700">{completedTasks}</div>
              </div>
            </div>
          </div>

          {/* Project & Activity Stats */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2 text-sm">
              <FolderKanban className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">项目：</span>
              <span className="font-semibold">{projectCount}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Activity className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">活动：</span>
              <span className="font-semibold">{activityCount}</span>
            </div>
          </div>

          {/* Project Memberships */}
          {user.projectMemberships && user.projectMemberships.length > 0 && (
            <div className="pt-2 border-t">
              <div className="text-xs text-muted-foreground mb-2">项目成员身份</div>
              <div className="flex flex-wrap gap-1.5">
                {user.projectMemberships.slice(0, 3).map((membership: any) => (
                  <Badge key={membership.id} variant="secondary" className="text-xs">
                    {membership.project.name}
                  </Badge>
                ))}
                {user.projectMemberships.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{user.projectMemberships.length - 3} 更多
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">团队成员</h1>
          <p className="text-muted-foreground mt-1">管理团队并跟踪成员活动</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              添加成员
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>添加团队成员</DialogTitle>
              <DialogDescription>创建新的团队成员账户</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">姓名 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="输入全名"
                />
              </div>
              <div>
                <Label htmlFor="email">邮箱 *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="邮箱@example.com"
                />
              </div>
              <div>
                <Label htmlFor="avatar">头像URL（可选）</Label>
                <Input
                  id="avatar"
                  value={formData.avatar}
                  onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                  placeholder="头像URL"
                />
              </div>
              <div>
                <Label htmlFor="role">角色</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!formData.name || !formData.email}>
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Role Stats */}
      <div className="grid grid-cols-5 gap-4">
        <Card
          className={`cursor-pointer transition-all ${roleFilter === 'ALL' ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
          onClick={() => setRoleFilter('ALL')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">全部成员</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.all}</div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${roleFilter === 'admin' ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
          onClick={() => setRoleFilter('admin')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Crown className="w-4 h-4 text-purple-600" />
              管理员
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.admin}</div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${roleFilter === 'manager' ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
          onClick={() => setRoleFilter('manager')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <UserCog className="w-4 h-4 text-blue-600" />
              经理
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.manager}</div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${roleFilter === 'member' ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
          onClick={() => setRoleFilter('member')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-green-600" />
              成员
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.member}</div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${roleFilter === 'viewer' ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
          onClick={() => setRoleFilter('viewer')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Eye className="w-4 h-4 text-gray-600" />
              观众
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.viewer}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="搜索姓名或邮箱..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          显示 {filteredUsers.length} / {users.length} 个成员
        </div>
      </div>

      {/* Team Members Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">加载中...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredUsers.map(renderUserCard)}
          {filteredUsers.length === 0 && (
            <Card className="col-span-full">
              <CardContent className="py-12 text-center">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">未找到团队成员</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setIsCreateOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  添加第一个成员
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>编辑团队成员</DialogTitle>
            <DialogDescription>更新团队成员信息</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">姓名 *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="输入全名"
              />
            </div>
            <div>
              <Label htmlFor="edit-email">邮箱 *</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="邮箱@example.com"
              />
            </div>
            <div>
              <Label htmlFor="edit-avatar">头像URL（可选）</Label>
              <Input
                id="edit-avatar"
                value={formData.avatar}
                onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                placeholder="头像URL"
              />
            </div>
            <div>
              <Label htmlFor="edit-role">角色</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">管理员</SelectItem>
                  <SelectItem value="manager">经理</SelectItem>
                  <SelectItem value="member">成员</SelectItem>
                  <SelectItem value="viewer">观众</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              取消
            </Button>
            <Button onClick={handleUpdate} disabled={!formData.name || !formData.email}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
