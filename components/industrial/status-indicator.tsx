'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface StatusIndicatorProps {
  status: 'running' | 'stopped' | 'error' | 'warning' | 'ok'
  label?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function StatusIndicator({ status, label, size = 'md', className }: StatusIndicatorProps) {
  const statusConfig = {
    running: { color: 'bg-green-500', label: '运行中', animate: true },
    stopped: { color: 'bg-gray-500', label: '已停止', animate: false },
    error: { color: 'bg-red-500', label: '错误', animate: true },
    warning: { color: 'bg-yellow-500', label: '警告', animate: true },
    ok: { color: 'bg-green-500', label: '正常', animate: false },
  }

  const sizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  }

  const config = statusConfig[status]
  const displayLabel = label || config.label

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative">
        <div className={cn('rounded-full', config.color, sizes[size])} />
        {config.animate && (
          <div
            className={cn(
              'absolute top-0 left-0 rounded-full animate-ping',
              config.color,
              sizes[size]
            )}
          />
        )}
      </div>
      {displayLabel && (
        <span className="text-green-500 font-mono text-sm uppercase">{displayLabel}</span>
      )}
    </div>
  )
}
