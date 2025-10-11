'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

type Priority = 'LOW' | 'MEDIUM' | 'HIGH'
type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE'

interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: Priority
  assignee: string | null
  dueDate: string | null
}

const COLUMNS = [
  { id: 'TODO' as TaskStatus, title: '待办', color: 'bg-gray-100' },
  { id: 'IN_PROGRESS' as TaskStatus, title: '进行中', color: 'bg-blue-100' },
  { id: 'IN_REVIEW' as TaskStatus, title: '审核中', color: 'bg-yellow-100' },
  { id: 'DONE' as TaskStatus, title: '已完成', color: 'bg-green-100' },
]

export function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as Priority,
    assignee: '',
    status: 'TODO' as TaskStatus,
  })

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks')
      const data = await response.json()
      setTasks(data)
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
    }
  }

  const createTask = async () => {
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask),
      })
      setIsDialogOpen(false)
      setNewTask({ title: '', description: '', priority: 'MEDIUM', assignee: '', status: 'TODO' })
      fetchTasks()
    } catch (error) {
      console.error('Failed to create task:', error)
    }
  }

  const updateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      fetchTasks()
    } catch (error) {
      console.error('Failed to update task:', error)
    }
  }

  const getPriorityColor = (priority: Priority) => {
    const colors = { LOW: 'bg-blue-500', MEDIUM: 'bg-yellow-500', HIGH: 'bg-red-500' }
    return colors[priority]
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">任务看板</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>创建任务</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>创建新任务</DialogTitle>
              <DialogDescription>填写任务信息并提交</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="task-title">标题</Label>
                <Input
                  id="task-title"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="task-description">描述</Label>
                <Textarea
                  id="task-description"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="task-priority">优先级</Label>
                <Select
                  value={newTask.priority}
                  onValueChange={(value) => setNewTask({ ...newTask, priority: value as Priority })}
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
              <div>
                <Label htmlFor="task-assignee">负责人</Label>
                <Input
                  id="task-assignee"
                  value={newTask.assignee}
                  onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
                  placeholder="张三"
                />
              </div>
              <div>
                <Label htmlFor="task-status">状态</Label>
                <Select
                  value={newTask.status}
                  onValueChange={(value) => setNewTask({ ...newTask, status: value as TaskStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODO">待办</SelectItem>
                    <SelectItem value="IN_PROGRESS">进行中</SelectItem>
                    <SelectItem value="IN_REVIEW">审核中</SelectItem>
                    <SelectItem value="DONE">已完成</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={createTask} className="w-full">提交</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {COLUMNS.map((column) => (
          <div key={column.id} className={`${column.color} p-4 rounded-lg`}>
            <h3 className="font-bold mb-4 text-center">{column.title}</h3>
            <div className="space-y-3">
              {tasks
                .filter((task) => task.status === column.id)
                .map((task) => (
                  <Card key={task.id} className="cursor-move hover:shadow-lg transition-shadow">
                    <CardHeader className="p-3">
                      <CardTitle className="text-sm">{task.title}</CardTitle>
                      {task.description && (
                        <CardDescription className="text-xs">{task.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <Badge className={getPriorityColor(task.priority)} variant="default">
                            {task.priority}
                          </Badge>
                        </div>
                        {task.assignee && (
                          <div className="text-xs text-muted-foreground">👤 {task.assignee}</div>
                        )}
                        <div className="flex gap-1 mt-2">
                          {COLUMNS.filter((c) => c.id !== column.id).map((targetColumn) => (
                            <Button
                              key={targetColumn.id}
                              size="sm"
                              variant="outline"
                              className="text-xs h-6 px-2"
                              onClick={() => updateTaskStatus(task.id, targetColumn.id)}
                            >
                              → {targetColumn.title}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
