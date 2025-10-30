'use client'

import React, { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import CanvasEditor, { CanvasComponent, ComponentType } from '@/components/industrial/canvas-editor'
import ComponentPalette, { componentTypes } from '@/components/industrial/component-palette'
import ComponentPropertiesPanel from '@/components/industrial/component-properties-panel'
import BlendDialog from '@/components/blend-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Save, Download, Trash2, Grid3x3, Eye, Image as ImageIcon, Wand2 } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { exportCanvasToBase64, downloadBase64Image } from '@/lib/canvas-export'

export default function NewCanvasPage() {
  const router = useRouter()
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const [components, setComponents] = useState<CanvasComponent[]>([])
  const [canvasSettings, setCanvasSettings] = useState({
    width: 1920,
    height: 1080,
    gridSize: 20,
    showGrid: true,
  })
  const [designInfo, setDesignInfo] = useState({
    title: '新的工业界面设计',
    description: '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [scale, setScale] = useState(0.5)
  const [showBlendDialog, setShowBlendDialog] = useState(false)
  const [canvasImageBase64, setCanvasImageBase64] = useState<string>('')
  const [selectedComponent, setSelectedComponent] = useState<CanvasComponent | null>(null)
  const [backgroundImage, setBackgroundImage] = useState<string>('')

  const handleAddComponent = useCallback((type: ComponentType) => {
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
  }, [])

  const handleUpdateComponent = useCallback((id: string, updates: Partial<CanvasComponent>) => {
    setComponents((prev) =>
      prev.map((comp) => (comp.id === id ? { ...comp, ...updates } : comp))
    )
    setSelectedComponent((prev) =>
      prev && prev.id === id ? { ...prev, ...updates } : prev
    )
  }, [])

  const handleDeleteComponent = useCallback((id: string) => {
    setComponents((prev) => prev.filter((comp) => comp.id !== id))
    setSelectedComponent(null)
    toast.success('组件已删除')
  }, [])

  const handleBackgroundImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      setBackgroundImage(base64)
      toast.success('背景图片已上传')
    }
    reader.onerror = () => {
      toast.error('图片上传失败')
    }
    reader.readAsDataURL(file)
  }

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
            backgroundImage,
          },
          canvasSettings: {
            showGrid: canvasSettings.showGrid,
            theme: 'modern',
            backgroundColor: '#ffffff',
          },
        }),
      })

      if (!response.ok) throw new Error('保存失败')

      const { design } = await response.json()
      toast.success('设计已保存')
      router.push(`/canvas/${design.id}`)
    } catch (error) {
      console.error('Save error:', error)
      toast.error('保存失败，请重试')
    } finally {
      setIsSaving(false)
    }
  }

  const handleClear = () => {
    if (confirm('确定要清空画布吗？')) {
      setComponents([])
      toast.success('画布已清空')
    }
  }

  const handleExportImage = async () => {
    if (!canvasContainerRef.current) {
      toast.error('画布未加载')
      return
    }

    try {
      const canvasElement = canvasContainerRef.current.querySelector('.relative.bg-white') as HTMLElement
      if (!canvasElement) {
        toast.error('找不到画布元素')
        return
      }

      toast.info('正在导出图片...')
      const dataUrl = await exportCanvasToBase64(canvasElement, 'png')
      downloadBase64Image(dataUrl, `${designInfo.title || 'canvas-design'}.png`)
      toast.success('图片已导出')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('导出失败')
    }
  }

  const handleBlendGenerate = async () => {
    if (!canvasContainerRef.current) {
      toast.error('画布未加载')
      return
    }

    if (components.length === 0) {
      toast.error('画布为空，请先添加组件')
      return
    }

    try {
      const canvasElement = canvasContainerRef.current.querySelector('.relative.bg-white') as HTMLElement
      if (!canvasElement) {
        toast.error('找不到画布元素')
        return
      }

      toast.info('正在准备画布图片...')
      const dataUrl = await exportCanvasToBase64(canvasElement, 'jpeg', 0.95)
      setCanvasImageBase64(dataUrl)
      setShowBlendDialog(true)
    } catch (error) {
      console.error('Prepare blend error:', error)
      toast.error('准备失败')
    }
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Bar */}
      <div className="border-b bg-card">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Link href="/canvas">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">{designInfo.title}</h1>
              <p className="text-sm text-muted-foreground">工业上位机界面设计</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportImage}>
              <ImageIcon className="h-4 w-4 mr-2" />
              导出图片
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleBlendGenerate}
              disabled={components.length === 0}
            >
              <Wand2 className="h-4 w-4 mr-2" />
              以图生图
            </Button>
            <Button variant="outline" size="sm" onClick={handleClear}>
              <Trash2 className="h-4 w-4 mr-2" />
              清空
            </Button>
            <Button variant="default" size="sm" onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? '保存中...' : '保存'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Component Palette */}
        <div className="w-80 border-r bg-card overflow-y-auto p-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">设计信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="title">标题</Label>
                <Input
                  id="title"
                  value={designInfo.title}
                  onChange={(e) =>
                    setDesignInfo((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="输入设计标题"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">描述</Label>
                <Textarea
                  id="description"
                  value={designInfo.description}
                  onChange={(e) =>
                    setDesignInfo((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="输入描述（可选）"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">组件库</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {componentTypes.map((component) => (
                <Button
                  key={component.type}
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => handleAddComponent(component.type)}
                >
                  <span className="text-xl">{component.icon}</span>
                  <div className="text-left flex-1">
                    <div className="font-medium text-sm">{component.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {component.defaultSize.width} × {component.defaultSize.height}
                    </div>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Center - Canvas */}
        <div className="flex-1 overflow-auto bg-muted/30 p-6">
          <div className="mb-4 flex items-center justify-between bg-card border rounded-lg p-3">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Grid3x3 className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {canvasSettings.width} × {canvasSettings.height}
                </span>
              </div>
              <div className="text-muted-foreground">
                组件: <span className="font-semibold text-foreground">{components.length}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="showGrid" className="text-sm cursor-pointer">
                显示网格
              </Label>
              <input
                id="showGrid"
                type="checkbox"
                checked={canvasSettings.showGrid}
                onChange={(e) =>
                  setCanvasSettings((prev) => ({ ...prev, showGrid: e.target.checked }))
                }
                className="cursor-pointer"
              />
            </div>
          </div>

          <div
            ref={canvasContainerRef}
            className="bg-card border rounded-lg p-4 inline-block"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
          >
            <CanvasEditor
              components={components}
              onComponentsChange={setComponents}
              width={canvasSettings.width}
              height={canvasSettings.height}
              gridSize={canvasSettings.gridSize}
              showGrid={canvasSettings.showGrid}
              backgroundImage={backgroundImage}
              onComponentSelect={setSelectedComponent}
            />
          </div>
        </div>

        {/* Right Sidebar - Settings */}
        <div className="w-80 border-l bg-card overflow-y-auto p-4 space-y-4">
          {/* 组件属性面板 */}
          <ComponentPropertiesPanel
            component={selectedComponent}
            onUpdate={handleUpdateComponent}
            onDelete={handleDeleteComponent}
          />

          {/* 背景图片上传 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">背景图片</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="bg-upload" className="text-xs">
                  上传背景图片
                </Label>
                <Input
                  id="bg-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleBackgroundImageUpload}
                  className="h-9 text-sm"
                />
              </div>
              {backgroundImage && (
                <>
                  <div className="space-y-2">
                    <Label className="text-xs">预览</Label>
                    <div className="border rounded-md overflow-hidden">
                      <img
                        src={backgroundImage}
                        alt="背景预览"
                        className="w-full h-32 object-cover"
                      />
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setBackgroundImage('')
                      toast.success('背景图片已清除')
                    }}
                  >
                    清除背景
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">画布设置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="width">宽度 (px)</Label>
                <Input
                  id="width"
                  type="number"
                  value={canvasSettings.width}
                  onChange={(e) =>
                    setCanvasSettings((prev) => ({ ...prev, width: parseInt(e.target.value) || 1920 }))
                  }
                  min={800}
                  max={3840}
                  step={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">高度 (px)</Label>
                <Input
                  id="height"
                  type="number"
                  value={canvasSettings.height}
                  onChange={(e) =>
                    setCanvasSettings((prev) => ({ ...prev, height: parseInt(e.target.value) || 1080 }))
                  }
                  min={600}
                  max={2160}
                  step={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gridSize">网格大小 (px)</Label>
                <Input
                  id="gridSize"
                  type="number"
                  value={canvasSettings.gridSize}
                  onChange={(e) =>
                    setCanvasSettings((prev) => ({ ...prev, gridSize: parseInt(e.target.value) || 20 }))
                  }
                  min={10}
                  max={100}
                  step={10}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scale">缩放比例</Label>
                <Input
                  id="scale"
                  type="range"
                  min="0.25"
                  max="1"
                  step="0.05"
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                />
                <div className="text-xs text-center text-muted-foreground">
                  {(scale * 100).toFixed(0)}%
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">快捷键</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">拖拽组件</span>
                <kbd className="px-2 py-1 bg-muted rounded text-foreground">鼠标</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">保存</span>
                <kbd className="px-2 py-1 bg-muted rounded text-foreground">Ctrl+S</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">删除组件</span>
                <kbd className="px-2 py-1 bg-muted rounded text-foreground">Delete</kbd>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Blend Dialog */}
      <BlendDialog
        open={showBlendDialog}
        onOpenChange={setShowBlendDialog}
        canvasImageBase64={canvasImageBase64}
        defaultTitle={`${designInfo.title} - Blend`}
      />
    </div>
  )
}
