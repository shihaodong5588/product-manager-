'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverEvent,
} from '@dnd-kit/core'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Search,
  Filter,
  User,
} from 'lucide-react'
import { KanbanColumn } from '@/components/kanban/kanban-column'
import { KanbanCard } from '@/components/kanban/kanban-card'

type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE'
type Priority = 'LOW' | 'MEDIUM' | 'HIGH'

interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: Priority
  assigneeId: string | null
  assignee?: {
    id: string
    name: string
    email: string
    avatar: string | null
  } | null
  dueDate: string | null
  estimatedHours: number | null
  actualHours: number | null
  order: number
  projectId: string | null
  project?: {
    id: string
    name: string
  } | null
  createdAt: string
  updatedAt: string
}

interface Column {
  id: TaskStatus
  title: string
  tasks: Task[]
}

const COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'TODO', title: 'To Do', color: 'bg-slate-100' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: 'bg-blue-50' },
  { id: 'IN_REVIEW', title: 'In Review', color: 'bg-purple-50' },
  { id: 'DONE', title: 'Done', color: 'bg-green-50' },
]

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [columns, setColumns] = useState<Column[]>([])
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'ALL'>('ALL')
  const [assigneeFilter, setAssigneeFilter] = useState('ALL')
  const [projectFilter, setProjectFilter] = useState('ALL')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>('TODO')
  const [newTaskData, setNewTaskData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as Priority,
    assigneeId: '',
    dueDate: '',
    estimatedHours: '',
  })

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  useEffect(() => {
    fetchTasks()
  }, [])

  const organizeTasksIntoColumns = useCallback((allTasks: Task[]) => {
    const filteredTasks = allTasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesPriority =
        priorityFilter === 'ALL' || task.priority === priorityFilter
      const matchesAssignee =
        assigneeFilter === 'ALL' || task.assigneeId === assigneeFilter
      const matchesProject =
        projectFilter === 'ALL' || task.projectId === projectFilter

      return matchesSearch && matchesPriority && matchesAssignee && matchesProject
    })

    const newColumns = COLUMNS.map((column) => ({
      id: column.id,
      title: column.title,
      tasks: filteredTasks
        .filter((task) => task.status === column.id)
        .sort((a, b) => a.order - b.order),
    }))

    setColumns(newColumns)
  }, [searchQuery, priorityFilter, assigneeFilter, projectFilter])

  useEffect(() => {
    organizeTasksIntoColumns(tasks)
  }, [tasks, organizeTasksIntoColumns])

  const fetchTasks = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/tasks')
      const data = await response.json()
      setTasks(data)
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
    } finally {
      setIsLoading(false)
    }
  }


  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const task = tasks.find((t) => t.id === active.id)
    setActiveTask(task || null)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeTask = tasks.find((t) => t.id === activeId)
    const overTask = tasks.find((t) => t.id === overId)

    if (!activeTask) return

    const activeColumn = activeTask.status
    const overColumn = overTask?.status || (overId as TaskStatus)

    if (activeColumn !== overColumn) {
      setTasks((prevTasks) => {
        const updatedTasks = prevTasks.map((task) => {
          if (task.id === activeId) {
            return { ...task, status: overColumn }
          }
          return task
        })
        return updatedTasks
      })
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    if (activeId === overId) return

    const activeTask = tasks.find((t) => t.id === activeId)
    const overTask = tasks.find((t) => t.id === overId)

    if (!activeTask) return

    const newStatus = overTask?.status || (overId as TaskStatus)

    try {
      const response = await fetch(`/api/tasks/${activeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          order: overTask?.order || 0,
        }),
      })

      if (!response.ok) throw new Error('Failed to update task')

      await fetchTasks()
    } catch (error) {
      console.error('Failed to update task:', error)
      await fetchTasks()
    }
  }

  const handleCreateTask = async () => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTaskData.title,
          description: newTaskData.description,
          status: newTaskStatus,
          priority: newTaskData.priority,
          assigneeId: newTaskData.assigneeId || null,
          dueDate: newTaskData.dueDate || null,
          estimatedHours: newTaskData.estimatedHours
            ? parseInt(newTaskData.estimatedHours)
            : null,
        }),
      })

      if (!response.ok) throw new Error('Failed to create task')

      setIsCreateDialogOpen(false)
      setNewTaskData({
        title: '',
        description: '',
        priority: 'MEDIUM',
        assigneeId: '',
        dueDate: '',
        estimatedHours: '',
      })
      await fetchTasks()
    } catch (error) {
      console.error('Failed to create task:', error)
    }
  }

  const openCreateDialog = (status: TaskStatus) => {
    setNewTaskStatus(status)
    setIsCreateDialogOpen(true)
  }

  const uniqueAssignees = Array.from(
    new Map(
      tasks
        .filter((t) => t.assignee)
        .map((t) => [t.assignee!.id, t.assignee!])
    ).values()
  )

  const uniqueProjects = Array.from(
    new Map(
      tasks
        .filter((t) => t.project)
        .map((t) => [t.project!.id, t.project!])
    ).values()
  )

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading tasks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="border-b bg-white px-8 py-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">任务看板</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              管理和跟踪团队任务
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索任务..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as Priority | 'ALL')}>
            <SelectTrigger className="w-[160px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="优先级" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">全部优先级</SelectItem>
              <SelectItem value="LOW">低</SelectItem>
              <SelectItem value="MEDIUM">中</SelectItem>
              <SelectItem value="HIGH">高</SelectItem>
            </SelectContent>
          </Select>

          <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
            <SelectTrigger className="w-[200px]">
              <User className="mr-2 h-4 w-4" />
              <SelectValue placeholder="负责人" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">全部负责人</SelectItem>
              {uniqueAssignees.map((assignee) => (
                <SelectItem key={assignee.id} value={assignee.id}>
                  {assignee.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="项目" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">全部项目</SelectItem>
              {uniqueProjects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-8">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex h-full gap-6">
            {COLUMNS.map((columnDef) => {
              const column = columns.find((c) => c.id === columnDef.id)
              if (!column) return null

              return (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  columnDef={columnDef}
                  onAddTask={() => openCreateDialog(column.id)}
                />
              )
            })}
          </div>

          <DragOverlay>
            {activeTask ? (
              <div className="rotate-3 opacity-90">
                <KanbanCard task={activeTask} isDragging />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Create Task Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>创建新任务</DialogTitle>
            <DialogDescription>
              添加新任务到{' '}
              {COLUMNS.find((c) => c.id === newTaskStatus)?.title || '看板'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">标题</Label>
              <Input
                id="title"
                value={newTaskData.title}
                onChange={(e) =>
                  setNewTaskData({ ...newTaskData, title: e.target.value })
                }
                placeholder="输入任务标题"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                value={newTaskData.description}
                onChange={(e) =>
                  setNewTaskData({ ...newTaskData, description: e.target.value })
                }
                placeholder="输入任务描述"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="priority">优先级</Label>
                <Select
                  value={newTaskData.priority}
                  onValueChange={(v) =>
                    setNewTaskData({ ...newTaskData, priority: v as Priority })
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

              <div className="grid gap-2">
                <Label htmlFor="estimatedHours">预估工时</Label>
                <Input
                  id="estimatedHours"
                  type="number"
                  value={newTaskData.estimatedHours}
                  onChange={(e) =>
                    setNewTaskData({
                      ...newTaskData,
                      estimatedHours: e.target.value,
                    })
                  }
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="assignee">负责人</Label>
              <Select
                value={newTaskData.assigneeId}
                onValueChange={(v) =>
                  setNewTaskData({ ...newTaskData, assigneeId: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择负责人" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">未分配</SelectItem>
                  {uniqueAssignees.map((assignee) => (
                    <SelectItem key={assignee.id} value={assignee.id}>
                      {assignee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="dueDate">截止日期</Label>
              <Input
                id="dueDate"
                type="date"
                value={newTaskData.dueDate}
                onChange={(e) =>
                  setNewTaskData({ ...newTaskData, dueDate: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              取消
            </Button>
            <Button onClick={handleCreateTask} disabled={!newTaskData.title}>
              创建任务
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
