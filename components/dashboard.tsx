'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Requirement {
  id: string
  status: string
}

interface Task {
  id: string
  status: string
  priority: string
}

interface Stats {
  totalRequirements: number
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  highPriorityTasks: number
}

export function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalRequirements: 0,
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    highPriorityTasks: 0,
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

      const requirements: Requirement[] = await reqResponse.json()
      const tasks: Task[] = await taskResponse.json()

      setStats({
        totalRequirements: requirements.length,
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.status === 'DONE').length,
        inProgressTasks: tasks.filter(t => t.status === 'IN_PROGRESS').length,
        highPriorityTasks: tasks.filter(t => t.priority === 'HIGH').length,
      })
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">项目概览</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>需求总数</CardDescription>
            <CardTitle className="text-3xl">{stats.totalRequirements}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>任务总数</CardDescription>
            <CardTitle className="text-3xl">{stats.totalTasks}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>已完成任务</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.completedTasks}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>进行中任务</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{stats.inProgressTasks}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>高优先级任务</CardDescription>
            <CardTitle className="text-3xl text-red-600">{stats.highPriorityTasks}</CardTitle>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}
