'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { ComponentType } from './canvas-editor'

interface ComponentPaletteProps {
  onAddComponent: (type: ComponentType) => void
  className?: string
}

const componentTypes: Array<{
  type: ComponentType
  label: string
  icon: string
  defaultSize: { width: number; height: number }
}> = [
  {
    type: 'force-displacement-chart',
    label: '力-位移曲线',
    icon: '📊',
    defaultSize: { width: 600, height: 400 },
  },
  {
    type: 'parameter-display',
    label: '参数显示',
    icon: '🔢',
    defaultSize: { width: 200, height: 100 },
  },
  {
    type: 'status-indicator',
    label: '状态指示',
    icon: '🔴',
    defaultSize: { width: 150, height: 40 },
  },
  {
    type: 'button',
    label: '按钮',
    icon: '🔘',
    defaultSize: { width: 120, height: 50 },
  },
  {
    type: 'panel',
    label: '面板',
    icon: '📦',
    defaultSize: { width: 400, height: 300 },
  },
  {
    type: 'input',
    label: '输入框',
    icon: '📝',
    defaultSize: { width: 300, height: 50 },
  },
  {
    type: 'slider',
    label: '滑块',
    icon: '🎚️',
    defaultSize: { width: 250, height: 80 },
  },
  {
    type: 'gauge',
    label: '仪表盘',
    icon: '🎯',
    defaultSize: { width: 200, height: 200 },
  },
  {
    type: 'table',
    label: '表格',
    icon: '📋',
    defaultSize: { width: 400, height: 300 },
  },
  {
    type: 'text',
    label: '文本',
    icon: '📄',
    defaultSize: { width: 200, height: 40 },
  },
  {
    type: 'icon',
    label: '图标',
    icon: '⚙️',
    defaultSize: { width: 80, height: 80 },
  },
  {
    type: 'arrow',
    label: '指示箭头',
    icon: '➡️',
    defaultSize: { width: 150, height: 50 },
  },
]

export default function ComponentPalette({ onAddComponent, className }: ComponentPaletteProps) {
  return (
    <div className={cn('bg-white border border-slate-200 p-4 rounded-lg shadow-sm', className)}>
      <h3 className="text-slate-700 font-sans font-semibold text-sm mb-4">
        组件库
      </h3>
      <div className="space-y-2">
        {componentTypes.map((component) => (
          <button
            key={component.type}
            onClick={() => onAddComponent(component.type)}
            className="w-full bg-slate-50 border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all p-3 rounded-md text-left group"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{component.icon}</span>
              <div>
                <div className="text-slate-700 font-sans text-sm group-hover:text-blue-600">
                  {component.label}
                </div>
                <div className="text-slate-400 font-sans text-xs">
                  {component.defaultSize.width} × {component.defaultSize.height}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

export { componentTypes }
