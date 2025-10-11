'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { Activity, CheckCircle2, Clock, AlertCircle, TrendingUp, Users, FolderKanban } from 'lucide-react'

interface Stats {
  totalProjects: number
  totalRequirements: number
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  highPriorityTasks: number
  todoTasks: number
  inReviewTasks: number
}

export default function Home() {
  const [stats, setStats] = useState<Stats>({
    totalProjects: 0,
    totalRequirements: 0,
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    highPriorityTasks: 0,
    todoTasks: 0,
    inReviewTasks: 0,
  })

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const [reqResponse, taskResponse] = await Promise.all([
        fetch('/api/requirements'),
        fetch('/api/tasks'),
      ])

      const requirements = await reqResponse.json()
      const tasks = await taskResponse.json()

      setStats({
        totalProjects: 0,
        totalRequirements: requirements.length,
        totalTasks: tasks.length,
        completedTasks: tasks.filter((t: any) => t.status === 'DONE').length,
        inProgressTasks: tasks.filter((t: any) => t.status === 'IN_PROGRESS').length,
        highPriorityTasks: tasks.filter((t: any) => t.priority === 'HIGH').length,
        todoTasks: tasks.filter((t: any) => t.status === 'TODO').length,
        inReviewTasks: tasks.filter((t: any) => t.status === 'IN_REVIEW').length,
      })
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const taskDistributionData = [
    { name: '待办', value: stats.todoTasks, color: '#94a3b8' },
    { name: '进行中', value: stats.inProgressTasks, color: '#3b82f6' },
    { name: '审核中', value: stats.inReviewTasks, color: '#f59e0b' },
    { name: '已完成', value: stats.completedTasks, color: '#10b981' },
  ]

  const priorityData = [
    { name: '高优先级', value: stats.highPriorityTasks },
    { name: '其他', value: stats.totalTasks - stats.highPriorityTasks },
  ]

  const completionRate = stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">项目概览</h1>
        <p className="text-muted-foreground mt-1">实时监控项目进度和团队绩效</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">需求总数</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRequirements}</div>
            <p className="text-xs text-muted-foreground mt-1">产品需求</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">任务总数</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-600 font-semibold">{stats.completedTasks}</span> 已完成
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">进行中</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inProgressTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">正在执行的任务</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">高优先级</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.highPriorityTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">需要关注</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>任务完成率</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>总体进度</span>
                <span className="font-bold">{completionRate.toFixed(1)}%</span>
              </div>
              <Progress value={completionRate} className="h-2" />
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">已完成</p>
                <p className="text-2xl font-bold text-green-600">{stats.completedTasks}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">待完成</p>
                <p className="text-2xl font-bold text-slate-600">{stats.totalTasks - stats.completedTasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>任务状态分布</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={taskDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props: any) => `${props.name} ${(props.percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {taskDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Task Status Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>任务状态详情</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={taskDistributionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">待办任务</CardTitle>
            <Clock className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todoTasks}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">审核中</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inReviewTasks}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">完成率</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
