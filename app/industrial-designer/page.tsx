'use client'

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import CanvasEditor, { CanvasComponent, ComponentType } from '@/components/industrial/canvas-editor'
import ComponentPalette, { componentTypes } from '@/components/industrial/component-palette'
import IndustrialButton from '@/components/industrial/industrial-button'
import IndustrialPanel from '@/components/industrial/industrial-panel'
import { toast } from 'sonner'

export default function IndustrialDesignerPage() {
  const router = useRouter()
  const [components, setComponents] = useState<CanvasComponent[]>([])
  const [selectedComponent, setSelectedComponent] = useState<CanvasComponent | null>(null)
  const [canvasSettings, setCanvasSettings] = useState({
    width: 1920,
    height: 1080,
    gridSize: 20,
    showGrid: true,
  })
  const [designInfo, setDesignInfo] = useState({
    title: '新的工业上位机设计',
    description: '',
  })
  const [isSaving, setIsSaving] = useState(false)

  // 添加组件
  const handleAddComponent = useCallback(
    (type: ComponentType) => {
      const componentConfig = componentTypes.find((c) => c.type === type)
      if (!componentConfig) return

      const newComponent: CanvasComponent = {
        id: `${type}-${Date.now()}`,
        type,
        x: 100,
        y: 100,
        width: componentConfig.defaultSize.width,
        height: componentConfig.defaultSize.height,
        props: {
          label: componentConfig.label,
          ...(type === 'parameter-display' && { value: '0.00', unit: 'kN' }),
          ...(type === 'status-indicator' && { status: 'ok' }),
          ...(type === 'button' && { variant: 'primary' }),
          ...(type === 'panel' && { title: '控制面板' }),
        },
      }

      setComponents((prev) => [...prev, newComponent])
      toast.success(`已添加 ${componentConfig.label}`)
    },
    []
  )

  // 保存设计
  const handleSave = async () => {
    if (!designInfo.title.trim()) {
      toast.error('请输入设计标题')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/industrial-designs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: designInfo.title,
          description: designInfo.description,
          canvasData: {
            components,
            width: canvasSettings.width,
            height: canvasSettings.height,
            gridSize: canvasSettings.gridSize,
          },
          canvasSettings: {
            showGrid: canvasSettings.showGrid,
            theme: 'industrial',
            backgroundColor: '#0a0a0a',
          },
        }),
      })

      if (!response.ok) throw new Error('保存失败')

      const { design } = await response.json()
      toast.success('设计已保存')
      router.push(`/industrial-designer/${design.id}`)
    } catch (error) {
      console.error('Save error:', error)
      toast.error('保存失败，请重试')
    } finally {
      setIsSaving(false)
    }
  }

  // 导出为图片
  const handleExport = () => {
    toast.info('导出功能即将推出')
  }

  // 清空画布
  const handleClear = () => {
    if (confirm('确定要清空画布吗？')) {
      setComponents([])
      toast.success('画布已清空')
    }
  }

  return (
    <div className="min-h-screen bg-black text-green-500">
      {/* 顶部工具栏 */}
      <div className="bg-zinc-950 border-b-2 border-green-500/30 p-4">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-mono font-bold uppercase tracking-wider mb-2">
              工业上位机原型设计器
            </h1>
            <p className="text-green-500/70 text-sm font-mono">
              Industrial HMI Prototype Designer
            </p>
          </div>
          <div className="flex items-center gap-3">
            <IndustrialButton variant="secondary" size="sm" onClick={handleClear}>
              清空画布
            </IndustrialButton>
            <IndustrialButton variant="primary" size="sm" onClick={handleExport}>
              导出图片
            </IndustrialButton>
            <IndustrialButton
              variant="success"
              size="md"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? '保存中...' : '保存设计'}
            </IndustrialButton>
          </div>
        </div>
      </div>

      {/* 主要内容区 */}
      <div className="max-w-screen-2xl mx-auto p-4 grid grid-cols-[300px_1fr_300px] gap-4">
        {/* 左侧：组件面板 */}
        <div className="space-y-4">
          <ComponentPalette onAddComponent={handleAddComponent} />

          <IndustrialPanel title="设计信息">
            <div className="space-y-3">
              <div>
                <label className="block text-green-500 font-mono text-xs uppercase mb-1">
                  设计标题
                </label>
                <input
                  type="text"
                  value={designInfo.title}
                  onChange={(e) =>
                    setDesignInfo((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full bg-black border border-green-500/30 text-green-500 font-mono text-sm px-3 py-2 focus:border-green-500 focus:outline-none"
                  placeholder="输入设计标题"
                />
              </div>
              <div>
                <label className="block text-green-500 font-mono text-xs uppercase mb-1">
                  描述
                </label>
                <textarea
                  value={designInfo.description}
                  onChange={(e) =>
                    setDesignInfo((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full bg-black border border-green-500/30 text-green-500 font-mono text-sm px-3 py-2 focus:border-green-500 focus:outline-none resize-none"
                  placeholder="输入描述（可选）"
                  rows={4}
                />
              </div>
            </div>
          </IndustrialPanel>
        </div>

        {/* 中间：画布编辑器 */}
        <div className="flex flex-col">
          <div className="mb-4 bg-zinc-900 border-2 border-green-500/30 p-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-green-500 font-mono text-xs uppercase">
                画布尺寸: {canvasSettings.width} × {canvasSettings.height}
              </div>
              <div className="text-green-500/50 font-mono text-xs">
                组件数量: {components.length}
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={canvasSettings.showGrid}
                onChange={(e) =>
                  setCanvasSettings((prev) => ({ ...prev, showGrid: e.target.checked }))
                }
                className="w-4 h-4 accent-green-500"
              />
              <span className="text-green-500 font-mono text-xs uppercase">显示网格</span>
            </label>
          </div>

          <div className="overflow-auto bg-zinc-900 p-4 border-2 border-green-500/30">
            <div
              style={{
                transform: 'scale(0.5)',
                transformOrigin: 'top left',
                width: canvasSettings.width * 2,
                height: canvasSettings.height * 2,
              }}
            >
              <CanvasEditor
                components={components}
                onComponentsChange={setComponents}
                width={canvasSettings.width}
                height={canvasSettings.height}
                gridSize={canvasSettings.gridSize}
                showGrid={canvasSettings.showGrid}
              />
            </div>
          </div>
        </div>

        {/* 右侧：属性面板 */}
        <div>
          <IndustrialPanel title="画布设置">
            <div className="space-y-3">
              <div>
                <label className="block text-green-500 font-mono text-xs uppercase mb-1">
                  宽度 (px)
                </label>
                <input
                  type="number"
                  value={canvasSettings.width}
                  onChange={(e) =>
                    setCanvasSettings((prev) => ({ ...prev, width: parseInt(e.target.value) }))
                  }
                  className="w-full bg-black border border-green-500/30 text-green-500 font-mono text-sm px-3 py-2 focus:border-green-500 focus:outline-none"
                  min={800}
                  max={3840}
                  step={100}
                />
              </div>
              <div>
                <label className="block text-green-500 font-mono text-xs uppercase mb-1">
                  高度 (px)
                </label>
                <input
                  type="number"
                  value={canvasSettings.height}
                  onChange={(e) =>
                    setCanvasSettings((prev) => ({ ...prev, height: parseInt(e.target.value) }))
                  }
                  className="w-full bg-black border border-green-500/30 text-green-500 font-mono text-sm px-3 py-2 focus:border-green-500 focus:outline-none"
                  min={600}
                  max={2160}
                  step={100}
                />
              </div>
              <div>
                <label className="block text-green-500 font-mono text-xs uppercase mb-1">
                  网格大小 (px)
                </label>
                <input
                  type="number"
                  value={canvasSettings.gridSize}
                  onChange={(e) =>
                    setCanvasSettings((prev) => ({ ...prev, gridSize: parseInt(e.target.value) }))
                  }
                  className="w-full bg-black border border-green-500/30 text-green-500 font-mono text-sm px-3 py-2 focus:border-green-500 focus:outline-none"
                  min={10}
                  max={100}
                  step={10}
                />
              </div>
            </div>
          </IndustrialPanel>

          <div className="mt-4 bg-zinc-900 border-2 border-green-500/30 p-4">
            <h3 className="text-green-500 font-mono font-bold text-xs uppercase mb-3">
              快捷键
            </h3>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-green-500/70">拖拽</span>
                <span className="text-green-500">移动组件</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-500/70">Ctrl+S</span>
                <span className="text-green-500">保存</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-500/70">Delete</span>
                <span className="text-green-500">删除组件</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
