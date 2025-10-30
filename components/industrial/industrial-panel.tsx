'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface IndustrialPanelProps {
  title?: string
  children: React.ReactNode
  className?: string
  headerAction?: React.ReactNode
}

export default function IndustrialPanel({ title, children, className, headerAction }: IndustrialPanelProps) {
  return (
    <div className={cn('bg-zinc-900 border-2 border-green-500/30 rounded-none', className)}>
      {title && (
        <div className="bg-zinc-950 border-b-2 border-green-500/30 px-4 py-2 flex items-center justify-between">
          <h3 className="text-green-500 font-mono font-bold text-sm uppercase tracking-wider">{title}</h3>
          {headerAction}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  )
}
