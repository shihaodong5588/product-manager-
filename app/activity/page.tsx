'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Calendar,
  CheckCircle2,
  FileText,
  GitCommit,
  Layers,
  ListTodo,
  MessageSquare,
  Rocket,
  User,
  AlertCircle,
  Filter,
  X,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface ActivityUser {
  id: string
  name: string
  email: string
  avatar: string | null
}

interface Activity {
  id: string
  type: string
  description: string
  userId: string
  entityType: string | null
  entityId: string | null
  createdAt: string
  user: ActivityUser
}

interface PaginationInfo {
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

const ACTIVITY_TYPES = [
  { value: 'requirement_created', label: '需求已创建', icon: FileText, color: 'bg-blue-500' },
  { value: 'requirement_updated', label: '需求已更新', icon: FileText, color: 'bg-blue-400' },
  { value: 'requirement_completed', label: '需求已完成', icon: CheckCircle2, color: 'bg-green-500' },
  { value: 'task_created', label: '任务已创建', icon: ListTodo, color: 'bg-purple-500' },
  { value: 'task_updated', label: '任务已更新', icon: ListTodo, color: 'bg-purple-400' },
  { value: 'task_completed', label: '任务已完成', icon: CheckCircle2, color: 'bg-green-500' },
  { value: 'project_created', label: '项目已创建', icon: Layers, color: 'bg-orange-500' },
  { value: 'project_updated', label: '项目已更新', icon: Layers, color: 'bg-orange-400' },
  { value: 'project_completed', label: '项目已完成', icon: Rocket, color: 'bg-green-500' },
  { value: 'comment_added', label: '评论已添加', icon: MessageSquare, color: 'bg-indigo-500' },
  { value: 'milestone_reached', label: '里程碑已达成', icon: GitCommit, color: 'bg-yellow-500' },
  { value: 'user_assigned', label: '用户已分配', icon: User, color: 'bg-teal-500' },
]

const getActivityIcon = (type: string) => {
  const activityType = ACTIVITY_TYPES.find((t) => t.value === type)
  if (!activityType) return { icon: AlertCircle, color: 'bg-gray-500' }
  return { icon: activityType.icon, color: activityType.color }
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const groupActivitiesByDate = (activities: Activity[]) => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const thisWeekStart = new Date(today)
  thisWeekStart.setDate(thisWeekStart.getDate() - 7)

  const groups: { [key: string]: Activity[] } = {
    '今天': [],
    '昨天': [],
    '本周': [],
    '更早': [],
  }

  activities.forEach((activity) => {
    const activityDate = new Date(activity.createdAt)
    const activityDateOnly = new Date(
      activityDate.getFullYear(),
      activityDate.getMonth(),
      activityDate.getDate()
    )

    if (activityDateOnly.getTime() === today.getTime()) {
      groups['今天'].push(activity)
    } else if (activityDateOnly.getTime() === yesterday.getTime()) {
      groups['昨天'].push(activity)
    } else if (activityDateOnly >= thisWeekStart) {
      groups['本周'].push(activity)
    } else {
      groups['更早'].push(activity)
    }
  })

  return groups
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [showFilters, setShowFilters] = useState(false)

  const observerTarget = useRef<HTMLDivElement>(null)

  const fetchActivities = useCallback(
    async (offset = 0, append = false) => {
      try {
        if (offset === 0) {
          setIsLoading(true)
        } else {
          setIsLoadingMore(true)
        }

        const params = new URLSearchParams({
          limit: '50',
          offset: offset.toString(),
        })

        if (typeFilter !== 'ALL') {
          params.append('type', typeFilter)
        }

        if (dateRange.start) {
          params.append('startDate', dateRange.start)
        }

        if (dateRange.end) {
          params.append('endDate', dateRange.end)
        }

        const response = await fetch(`/api/activities?${params.toString()}`)
        if (!response.ok) throw new Error('Failed to fetch activities')

        const data = await response.json()

        if (append) {
          setActivities((prev) => [...prev, ...data.activities])
        } else {
          setActivities(data.activities)
        }

        setPagination(data.pagination)
      } catch (error) {
        console.error('Failed to fetch activities:', error)
      } finally {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    },
    [typeFilter, dateRange]
  )

  useEffect(() => {
    fetchActivities(0, false)
  }, [fetchActivities])

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          pagination?.hasMore &&
          !isLoadingMore &&
          !isLoading
        ) {
          fetchActivities(pagination.offset + pagination.limit, true)
        }
      },
      { threshold: 0.1 }
    )

    const currentTarget = observerTarget.current
    if (currentTarget) {
      observer.observe(currentTarget)
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
    }
  }, [pagination, isLoadingMore, isLoading, fetchActivities])

  const clearFilters = () => {
    setTypeFilter('ALL')
    setDateRange({ start: '', end: '' })
  }

  const hasActiveFilters = typeFilter !== 'ALL' || dateRange.start || dateRange.end

  const groupedActivities = groupActivitiesByDate(activities)

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-sm text-muted-foreground">
            加载活动中...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="border-b bg-white px-8 py-6 shadow-sm">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                活动动态
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                跟踪项目和任务的所有活动
              </p>
            </div>
            <Button
              variant={showFilters ? 'default' : 'outline'}
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              筛选
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1 px-1.5 py-0">
                  {(typeFilter !== 'ALL' ? 1 : 0) +
                    (dateRange.start ? 1 : 0) +
                    (dateRange.end ? 1 : 0)}
                </Badge>
              )}
            </Button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-6 space-y-4 rounded-lg border bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">筛选器</h3>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-8 gap-2"
                  >
                    <X className="h-3 w-3" />
                    清除全部
                  </Button>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    活动类型
                  </label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="所有类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">所有类型</SelectItem>
                      {ACTIVITY_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    开始日期
                  </label>
                  <Input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) =>
                      setDateRange({ ...dateRange, start: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    结束日期
                  </label>
                  <Input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) =>
                      setDateRange({ ...dateRange, end: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="mx-auto max-w-4xl px-8 py-8">
        {activities.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed bg-white p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <GitCommit className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">未找到活动</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {hasActiveFilters
                ? '尝试调整筛选器以查看更多活动。'
                : '当您的团队开始项目工作时，活动将显示在这里。'}
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={clearFilters}
                className="mt-4"
              >
                清除筛选器
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedActivities).map(
              ([groupName, groupActivities]) => {
                if (groupActivities.length === 0) return null

                return (
                  <div key={groupName}>
                    <div className="mb-4 flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <h2 className="text-sm font-semibold text-muted-foreground">
                        {groupName}
                      </h2>
                      <div className="h-px flex-1 bg-border" />
                    </div>

                    <div className="relative ml-6 space-y-6 border-l-2 border-slate-200 pl-8">
                      {groupActivities.map((activity, index) => {
                        const { icon: Icon, color } = getActivityIcon(
                          activity.type
                        )

                        return (
                          <div
                            key={activity.id}
                            className="group relative animate-in fade-in slide-in-from-left-4"
                            style={{
                              animationDelay: `${index * 50}ms`,
                              animationFillMode: 'backwards',
                            }}
                          >
                            {/* Timeline dot */}
                            <div
                              className={`absolute -left-[41px] flex h-8 w-8 items-center justify-center rounded-full ${color} shadow-lg`}
                            >
                              <Icon className="h-4 w-4 text-white" />
                            </div>

                            {/* Activity card */}
                            <div className="rounded-lg border bg-white p-4 shadow-sm transition-all hover:shadow-md">
                              <div className="flex items-start gap-4">
                                {/* User avatar */}
                                <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                                  {activity.user.avatar ? (
                                    <AvatarImage
                                      src={activity.user.avatar}
                                      alt={activity.user.name}
                                    />
                                  ) : null}
                                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-xs font-semibold text-white">
                                    {getInitials(activity.user.name)}
                                  </AvatarFallback>
                                </Avatar>

                                {/* Activity details */}
                                <div className="flex-1 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold">
                                      {activity.user.name}
                                    </span>
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {
                                        ACTIVITY_TYPES.find(
                                          (t) => t.value === activity.type
                                        )?.label || activity.type
                                      }
                                    </Badge>
                                  </div>

                                  <p className="text-sm text-slate-600">
                                    {activity.description}
                                  </p>

                                  {activity.entityType && (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <Badge
                                        variant="outline"
                                        className="capitalize"
                                      >
                                        {activity.entityType}
                                      </Badge>
                                      {activity.entityId && (
                                        <span className="font-mono">
                                          #{activity.entityId.slice(-6)}
                                        </span>
                                      )}
                                    </div>
                                  )}

                                  <p className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(
                                      new Date(activity.createdAt),
                                      { addSuffix: true }
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              }
            )}
          </div>
        )}

        {/* Infinite scroll trigger & loading indicator */}
        {pagination?.hasMore && (
          <div
            ref={observerTarget}
            className="mt-8 flex items-center justify-center py-4"
          >
            {isLoadingMore && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                加载更多活动...
              </div>
            )}
          </div>
        )}

        {/* End message */}
        {!pagination?.hasMore && activities.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              已到达活动动态的末尾
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
