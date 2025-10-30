'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'

export type ComponentType =
  | 'force-displacement-chart'
  | 'parameter-display'
  | 'status-indicator'
  | 'button'
  | 'panel'
  | 'input'
  | 'slider'
  | 'gauge'
  | 'table'
  | 'text'

export interface CanvasComponent {
  id: string
  type: ComponentType
  x: number
  y: number
  width: number
  height: number
  props: Record<string, any>
}

interface CanvasEditorProps {
  components: CanvasComponent[]
  onComponentsChange: (components: CanvasComponent[]) => void
  width?: number
  height?: number
  gridSize?: number
  showGrid?: boolean
  backgroundImage?: string
  onComponentSelect?: (component: CanvasComponent | null) => void
}

export default function CanvasEditor({
  components,
  onComponentsChange,
  width = 1920,
  height = 1080,
  gridSize = 20,
  showGrid = true,
  backgroundImage,
  onComponentSelect,
}: CanvasEditorProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)

  // 键盘微调移动
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedId) return

      const step = e.shiftKey ? gridSize : 1
      let deltaX = 0
      let deltaY = 0

      switch (e.key) {
        case 'ArrowUp':
          deltaY = -step
          break
        case 'ArrowDown':
          deltaY = step
          break
        case 'ArrowLeft':
          deltaX = -step
          break
        case 'ArrowRight':
          deltaX = step
          break
        default:
          return
      }

      e.preventDefault()
      moveComponent(selectedId, deltaX, deltaY)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedId, gridSize])

  const moveComponent = (id: string, deltaX: number, deltaY: number) => {
    const component = components.find((c) => c.id === id)
    if (!component) return

    let newX = component.x + deltaX
    let newY = component.y + deltaY

    // 限制在画布内
    newX = Math.max(0, Math.min(newX, width - component.width))
    newY = Math.max(0, Math.min(newY, height - component.height))

    const updatedComponents = components.map((comp) =>
      comp.id === id ? { ...comp, x: newX, y: newY } : comp
    )
    onComponentsChange(updatedComponents)
  }

  const handleMouseDown = useCallback(
    (componentId: string, e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()

      setSelectedId(componentId)

      const component = components.find((c) => c.id === componentId)
      if (component && onComponentSelect) {
        onComponentSelect(component)
      }
      if (!component) return

      const canvasRect = canvasRef.current?.getBoundingClientRect()
      if (!canvasRect) return

      // 计算鼠标相对于组件的偏移
      const offsetX = e.clientX - canvasRect.left - component.x
      const offsetY = e.clientY - canvasRect.top - component.y

      setDraggingId(componentId)
      isDraggingRef.current = true

      const handleMouseMove = (e: MouseEvent) => {
        if (!isDraggingRef.current || !canvasRef.current) return

        const canvasRect = canvasRef.current.getBoundingClientRect()

        let newX = e.clientX - canvasRect.left - offsetX
        let newY = e.clientY - canvasRect.top - offsetY

        // 限制在画布内
        newX = Math.max(0, Math.min(newX, width - component.width))
        newY = Math.max(0, Math.min(newY, height - component.height))

        // 对齐网格
        if (showGrid) {
          newX = Math.round(newX / gridSize) * gridSize
          newY = Math.round(newY / gridSize) * gridSize
        }

        const updatedComponents = components.map((comp) =>
          comp.id === componentId ? { ...comp, x: newX, y: newY } : comp
        )
        onComponentsChange(updatedComponents)
      }

      const handleMouseUp = () => {
        isDraggingRef.current = false
        setDraggingId(null)
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    },
    [components, onComponentsChange, width, height, gridSize, showGrid]
  )

  const renderComponent = (component: CanvasComponent) => {
    const isDragging = draggingId === component.id
    const isSelected = selectedId === component.id

    const componentStyle = {
      position: 'absolute' as const,
      left: component.x,
      top: component.y,
      width: component.width,
      height: component.height,
      cursor: isDragging ? 'grabbing' : 'grab',
      opacity: isDragging ? 0.7 : 1,
      transition: isDragging ? 'none' : 'all 0.15s ease',
      userSelect: 'none' as const,
      pointerEvents: 'auto' as const,
      zIndex: isDragging ? 1000 : isSelected ? 100 : 1,
    }

    let content
    switch (component.type) {
      case 'force-displacement-chart':
        content = (
          <div className="w-full h-full bg-white rounded-lg shadow-md border-2 border-slate-300 flex items-center justify-center hover:border-blue-400 transition-colors">
            <span className="text-slate-600 font-sans text-sm pointer-events-none">📊 力-位移曲线</span>
          </div>
        )
        break
      case 'parameter-display':
        content = (
          <div className="w-full h-full bg-gradient-to-br from-white to-slate-50 rounded-lg shadow-md border-2 border-slate-300 p-3 hover:border-blue-400 transition-colors">
            <div className="text-slate-500 font-sans text-xs mb-1 pointer-events-none">
              {component.props.label || '参数'}
            </div>
            <div className="text-slate-800 font-sans font-bold text-2xl pointer-events-none flex items-baseline gap-1">
              {component.props.value || '0.00'}
              <span className="text-sm text-slate-500 font-normal">{component.props.unit || ''}</span>
            </div>
          </div>
        )
        break
      case 'status-indicator':
        content = (
          <div className="w-full h-full flex items-center gap-2 px-3 bg-white rounded-lg shadow-sm border-2 border-slate-300 hover:border-blue-400 transition-colors">
            <div className="w-3 h-3 rounded-full bg-green-500 pointer-events-none shadow-sm" />
            <span className="text-slate-700 font-sans text-sm pointer-events-none">
              {component.props.label || '状态'}
            </span>
          </div>
        )
        break
      case 'button':
        content = (
          <div className="w-full h-full bg-gradient-to-b from-blue-500 to-blue-600 rounded-lg shadow-md flex items-center justify-center hover:from-blue-600 hover:to-blue-700 transition-all border-2 border-blue-700">
            <span className="text-white font-sans text-sm font-medium pointer-events-none">
              {component.props.label || '按钮'}
            </span>
          </div>
        )
        break
      case 'panel':
        content = (
          <div className="w-full h-full bg-white rounded-lg shadow-lg border-2 border-slate-300 hover:border-blue-400 transition-colors overflow-hidden">
            <div className="bg-gradient-to-r from-slate-100 to-slate-50 border-b-2 border-slate-200 px-3 py-2">
              <span className="text-slate-700 font-sans text-sm font-semibold pointer-events-none">
                {component.props.title || '面板'}
              </span>
            </div>
            <div className="p-3 bg-slate-50/30"></div>
          </div>
        )
        break
      case 'input':
        content = (
          <div className="w-full h-full bg-white rounded-md shadow-sm border-2 border-slate-300 px-3 py-2 flex items-center hover:border-blue-400 transition-colors">
            <span className="text-slate-400 font-sans text-sm pointer-events-none">
              {component.props.placeholder || '输入文本...'}
            </span>
          </div>
        )
        break
      case 'slider':
        content = (
          <div className="w-full h-full bg-white rounded-lg shadow-sm border-2 border-slate-300 p-4 flex flex-col justify-center hover:border-blue-400 transition-colors">
            <div className="text-slate-600 font-sans text-xs mb-2 pointer-events-none">
              {component.props.label || '滑块'}
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden pointer-events-none">
              <div className="h-full w-1/2 bg-blue-500 rounded-full"></div>
            </div>
          </div>
        )
        break
      case 'gauge':
        content = (
          <div className="w-full h-full bg-white rounded-lg shadow-md border-2 border-slate-300 flex items-center justify-center hover:border-blue-400 transition-colors">
            <div className="text-center pointer-events-none">
              <div className="text-3xl mb-1">🎯</div>
              <div className="text-slate-600 font-sans text-xs">
                {component.props.label || '仪表盘'}
              </div>
            </div>
          </div>
        )
        break
      case 'table':
        content = (
          <div className="w-full h-full bg-white rounded-lg shadow-md border-2 border-slate-300 overflow-hidden hover:border-blue-400 transition-colors">
            <div className="grid grid-cols-3 gap-px bg-slate-200 pointer-events-none">
              {[...Array(6)].map((_, i) => (
                <div key={i} className={cn("bg-white p-2", i < 3 && "bg-slate-50")}>
                  <div className="h-3 bg-slate-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        )
        break
      case 'text':
        content = (
          <div className="w-full h-full flex items-center justify-center pointer-events-none">
            <span className="text-slate-700 font-sans text-base">
              {component.props.text || '文本'}
            </span>
          </div>
        )
        break
      default:
        content = (
          <div className="w-full h-full bg-white rounded-lg shadow-sm border-2 border-slate-300 flex items-center justify-center">
            <span className="text-slate-500 font-sans text-sm pointer-events-none">组件</span>
          </div>
        )
    }

    return (
      <div key={component.id}>
        <div
          style={componentStyle}
          onMouseDown={(e) => handleMouseDown(component.id, e)}
          onClick={(e) => {
            e.stopPropagation()
            setSelectedId(component.id)
          }}
          className={cn(
            'canvas-component',
            isSelected && 'ring-2 ring-blue-500',
            isDragging && 'shadow-2xl'
          )}
        >
          {content}
        </div>

        {/* 微调控制按钮 */}
        {isSelected && !isDragging && (
          <div
            className="absolute bg-white rounded-lg shadow-lg border border-slate-300 p-1 flex gap-1"
            style={{
              left: component.x + component.width + 8,
              top: component.y,
              pointerEvents: 'auto',
              zIndex: 200,
            }}
          >
            <button
              onMouseDown={(e) => {
                e.stopPropagation()
                moveComponent(component.id, 0, -1)
              }}
              className="p-1 hover:bg-slate-100 rounded"
              title="向上移动"
            >
              <ChevronUp className="w-4 h-4 text-slate-600" />
            </button>
            <button
              onMouseDown={(e) => {
                e.stopPropagation()
                moveComponent(component.id, 0, 1)
              }}
              className="p-1 hover:bg-slate-100 rounded"
              title="向下移动"
            >
              <ChevronDown className="w-4 h-4 text-slate-600" />
            </button>
            <button
              onMouseDown={(e) => {
                e.stopPropagation()
                moveComponent(component.id, -1, 0)
              }}
              className="p-1 hover:bg-slate-100 rounded"
              title="向左移动"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <button
              onMouseDown={(e) => {
                e.stopPropagation()
                moveComponent(component.id, 1, 0)
              }}
              className="p-1 hover:bg-slate-100 rounded"
              title="向右移动"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        )}
      </div>
    )
  }

  const gridStyle = showGrid
    ? {
        backgroundImage: `
          linear-gradient(to right, rgba(148, 163, 184, 0.12) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(148, 163, 184, 0.12) 1px, transparent 1px)
        `,
        backgroundSize: `${gridSize}px ${gridSize}px`,
      }
    : {}

  return (
    <div
      ref={canvasRef}
      className="relative bg-white border border-slate-200 overflow-hidden"
      style={{
        width,
        height,
        ...gridStyle,
        boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.03)',
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
      onClick={() => {
        setSelectedId(null)
        if (onComponentSelect) {
          onComponentSelect(null)
        }
      }}
    >
      {components.map(renderComponent)}

      {/* 提示信息 */}
      {selectedId && (
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-md border border-slate-200 text-xs text-slate-600 font-sans pointer-events-none">
          💡 使用方向键微调位置 | Shift+方向键快速移动
        </div>
      )}
    </div>
  )
}
