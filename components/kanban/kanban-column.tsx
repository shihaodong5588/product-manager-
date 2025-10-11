'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus } from 'lucide-react'
import { KanbanCard } from './kanban-card'

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

interface KanbanColumnProps {
  column: Column
  columnDef: {
    id: TaskStatus
    title: string
    color: string
  }
  onAddTask: () => void
}

export function KanbanColumn({ column, columnDef, onAddTask }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id: column.id,
  })

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'TODO':
        return 'border-slate-300 bg-slate-50'
      case 'IN_PROGRESS':
        return 'border-blue-300 bg-blue-50'
      case 'IN_REVIEW':
        return 'border-purple-300 bg-purple-50'
      case 'DONE':
        return 'border-green-300 bg-green-50'
    }
  }

  const getStatusBadgeColor = (status: TaskStatus) => {
    switch (status) {
      case 'TODO':
        return 'bg-slate-500'
      case 'IN_PROGRESS':
        return 'bg-blue-500'
      case 'IN_REVIEW':
        return 'bg-purple-500'
      case 'DONE':
        return 'bg-green-500'
    }
  }

  return (
    <div className="flex h-full w-[350px] flex-shrink-0 flex-col">
      <Card className={`flex h-full flex-col border-2 ${getStatusColor(column.id)} shadow-sm`}>
        {/* Column Header */}
        <div className="border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`h-3 w-3 rounded-full ${getStatusBadgeColor(column.id)}`} />
              <h3 className="font-semibold text-slate-900">{columnDef.title}</h3>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-xs font-medium text-slate-700">
                {column.tasks.length}
              </span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={onAddTask}
              className="h-8 w-8 p-0 hover:bg-slate-200"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tasks List */}
        <ScrollArea className="flex-1 p-3">
          <div
            ref={setNodeRef}
            className="min-h-[200px] space-y-3"
          >
            <SortableContext
              items={column.tasks.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              {column.tasks.map((task) => (
                <KanbanCard key={task.id} task={task} />
              ))}
            </SortableContext>

            {column.tasks.length === 0 && (
              <div className="flex h-[200px] items-center justify-center rounded-lg border-2 border-dashed border-slate-200">
                <p className="text-sm text-muted-foreground">No tasks</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </Card>
    </div>
  )
}
