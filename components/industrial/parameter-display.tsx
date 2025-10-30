'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface ParameterDisplayProps {
  label: string
  value: string | number
  unit?: string
  variant?: 'normal' | 'highlight' | 'warning' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function ParameterDisplay({
  label,
  value,
  unit,
  variant = 'normal',
  size = 'md',
  className,
}: ParameterDisplayProps) {
  const variants = {
    normal: 'text-green-500',
    highlight: 'text-cyan-400',
    warning: 'text-yellow-500',
    danger: 'text-red-500',
  }

  const sizes = {
    sm: { value: 'text-lg', label: 'text-xs', unit: 'text-xs' },
    md: { value: 'text-2xl', label: 'text-sm', unit: 'text-sm' },
    lg: { value: 'text-4xl', label: 'text-base', unit: 'text-base' },
  }

  return (
    <div className={cn('bg-black/50 border border-green-500/30 p-3', className)}>
      <div className={cn('font-mono uppercase tracking-wider mb-1', sizes[size].label, 'text-green-500/70')}>
        {label}
      </div>
      <div className="flex items-baseline gap-2">
        <span className={cn('font-mono font-bold tabular-nums', sizes[size].value, variants[variant])}>
          {value}
        </span>
        {unit && (
          <span className={cn('font-mono', sizes[size].unit, 'text-green-500/70')}>{unit}</span>
        )}
      </div>
    </div>
  )
}
