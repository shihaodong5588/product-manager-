'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface IndustrialButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning'
  size?: 'sm' | 'md' | 'lg'
  active?: boolean
  children: React.ReactNode
}

export default function IndustrialButton({
  variant = 'primary',
  size = 'md',
  active = false,
  className,
  children,
  ...props
}: IndustrialButtonProps) {
  const baseStyles = 'font-mono font-bold uppercase tracking-wider transition-all border-2 flex items-center justify-center'

  const variants = {
    primary: 'bg-transparent border-green-500 text-green-500 hover:bg-green-500/20 active:bg-green-500/30',
    secondary: 'bg-transparent border-blue-500 text-blue-500 hover:bg-blue-500/20 active:bg-blue-500/30',
    danger: 'bg-transparent border-red-500 text-red-500 hover:bg-red-500/20 active:bg-red-500/30',
    success: 'bg-green-500/20 border-green-500 text-green-500 hover:bg-green-500/30',
    warning: 'bg-transparent border-yellow-500 text-yellow-500 hover:bg-yellow-500/20 active:bg-yellow-500/30',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  const activeStyles = active ? 'bg-green-500/30 shadow-[0_0_10px_rgba(0,255,0,0.5)]' : ''

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], activeStyles, className)}
      {...props}
    >
      {children}
    </button>
  )
}
