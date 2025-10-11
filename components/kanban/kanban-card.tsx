'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Calendar, Clock, AlertCircle, GripVertical } from 'lucide-react'
import { format } from 'date-fns'

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

interface KanbanCardProps {
  task: Task
  isDragging?: boolean
}

export function KanbanCard({ task, isDragging = false }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  }

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'LOW':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'HIGH':
        return 'bg-red-100 text-red-800 border-red-200'
    }
  }

  const getPriorityIcon = (priority: Priority) => {
    switch (priority) {
      case 'HIGH':
        return <AlertCircle className="h-3 w-3" />
      default:
        return null
    }
  }

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE'

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase()
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`group cursor-grab active:cursor-grabbing border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md ${
        isDragging ? 'rotate-3 shadow-lg' : ''
      }`}
    >
      <div className="space-y-3">
        {/* Header with drag handle and priority */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h4 className="font-medium leading-snug text-slate-900 line-clamp-2">
              {task.title}
            </h4>
          </div>
          <div className="flex items-start gap-2">
            <Badge
              variant="outline"
              className={`${getPriorityColor(task.priority)} flex items-center gap-1 border text-xs`}
            >
              {getPriorityIcon(task.priority)}
              {task.priority}
            </Badge>
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
            >
              <GripVertical className="h-4 w-4 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Description */}
        {task.description && (
          <p className="text-sm text-slate-600 line-clamp-2">
            {truncateText(task.description, 80)}
          </p>
        )}

        {/* Project badge */}
        {task.project && (
          <Badge variant="secondary" className="text-xs">
            {task.project.name}
          </Badge>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            {/* Due date */}
            {task.dueDate && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={`flex items-center gap-1 ${
                        isOverdue ? 'text-red-600 font-medium' : ''
                      }`}
                    >
                      <Calendar className="h-3 w-3" />
                      <span>
                        {format(new Date(task.dueDate), 'MMM d')}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Due: {format(new Date(task.dueDate), 'PPP')}</p>
                    {isOverdue && <p className="text-red-600">Overdue!</p>}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Estimated hours */}
            {task.estimatedHours !== null && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{task.estimatedHours}h</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Estimated: {task.estimatedHours} hours</p>
                    {task.actualHours !== null && (
                      <p>Actual: {task.actualHours} hours</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          {/* Assignee avatar */}
          {task.assignee && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Avatar className="h-7 w-7 border-2 border-white shadow-sm">
                    {task.assignee.avatar ? (
                      <AvatarImage
                        src={task.assignee.avatar}
                        alt={task.assignee.name}
                      />
                    ) : null}
                    <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-xs font-semibold text-white">
                      {getInitials(task.assignee.name)}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{task.assignee.name}</p>
                  <p className="text-xs text-slate-400">{task.assignee.email}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    </Card>
  )
}
