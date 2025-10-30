'use client'

import React from 'react'
import { CanvasComponent } from './canvas-editor'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

interface ComponentPropertiesPanelProps {
  component: CanvasComponent | null
  onUpdate: (id: string, updates: Partial<CanvasComponent>) => void
  onDelete: (id: string) => void
}

export default function ComponentPropertiesPanel({
  component,
  onUpdate,
  onDelete,
}: ComponentPropertiesPanelProps) {
  if (!component) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">属性面板</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            选择一个组件以编辑属性
          </p>
        </CardContent>
      </Card>
    )
  }

  const handlePositionChange = (axis: 'x' | 'y', value: string) => {
    const numValue = parseInt(value) || 0
    onUpdate(component.id, { [axis]: numValue })
  }

  const handleSizeChange = (dimension: 'width' | 'height', value: string) => {
    const numValue = parseInt(value) || 0
    onUpdate(component.id, { [dimension]: Math.max(10, numValue) })
  }

  const handlePropChange = (propKey: string, value: any) => {
    onUpdate(component.id, {
      props: {
        ...component.props,
        [propKey]: value,
      },
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">属性面板</CardTitle>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(component.id)}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            删除
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 组件类型 */}
        <div>
          <Label className="text-xs text-muted-foreground">组件类型</Label>
          <div className="mt-1 px-3 py-2 bg-slate-100 rounded-md text-sm">
            {getComponentTypeName(component.type)}
          </div>
        </div>

        {/* 位置 */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="pos-x" className="text-xs">
              X 位置 (px)
            </Label>
            <Input
              id="pos-x"
              type="number"
              value={component.x}
              onChange={(e) => handlePositionChange('x', e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="pos-y" className="text-xs">
              Y 位置 (px)
            </Label>
            <Input
              id="pos-y"
              type="number"
              value={component.y}
              onChange={(e) => handlePositionChange('y', e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        </div>

        {/* 大小 */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="width" className="text-xs">
              宽度 (px)
            </Label>
            <Input
              id="width"
              type="number"
              value={component.width}
              onChange={(e) => handleSizeChange('width', e.target.value)}
              className="h-8 text-sm"
              min={10}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="height" className="text-xs">
              高度 (px)
            </Label>
            <Input
              id="height"
              type="number"
              value={component.height}
              onChange={(e) => handleSizeChange('height', e.target.value)}
              className="h-8 text-sm"
              min={10}
            />
          </div>
        </div>

        {/* 组件特定属性 */}
        <div className="pt-2 border-t">
          <Label className="text-xs font-semibold mb-3 block">组件属性</Label>

          {/* Label 属性 (大多数组件都有) */}
          {component.type !== 'text' && (
            <div className="space-y-1 mb-3">
              <Label htmlFor="label" className="text-xs">
                标签
              </Label>
              <Input
                id="label"
                value={component.props.label || ''}
                onChange={(e) => handlePropChange('label', e.target.value)}
                className="h-8 text-sm"
                placeholder="组件标签"
              />
            </div>
          )}

          {/* 文本组件 */}
          {component.type === 'text' && (
            <div className="space-y-1 mb-3">
              <Label htmlFor="text" className="text-xs">
                文本内容
              </Label>
              <Textarea
                id="text"
                value={component.props.text || ''}
                onChange={(e) => handlePropChange('text', e.target.value)}
                className="text-sm"
                placeholder="输入文本内容"
                rows={3}
              />
            </div>
          )}

          {/* 参数显示组件 */}
          {component.type === 'parameter-display' && (
            <>
              <div className="space-y-1 mb-3">
                <Label htmlFor="value" className="text-xs">
                  数值
                </Label>
                <Input
                  id="value"
                  value={component.props.value || ''}
                  onChange={(e) => handlePropChange('value', e.target.value)}
                  className="h-8 text-sm"
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1 mb-3">
                <Label htmlFor="unit" className="text-xs">
                  单位
                </Label>
                <Input
                  id="unit"
                  value={component.props.unit || ''}
                  onChange={(e) => handlePropChange('unit', e.target.value)}
                  className="h-8 text-sm"
                  placeholder="kN"
                />
              </div>
            </>
          )}

          {/* 输入框组件 */}
          {component.type === 'input' && (
            <div className="space-y-1 mb-3">
              <Label htmlFor="placeholder" className="text-xs">
                占位符
              </Label>
              <Input
                id="placeholder"
                value={component.props.placeholder || ''}
                onChange={(e) => handlePropChange('placeholder', e.target.value)}
                className="h-8 text-sm"
                placeholder="输入占位符文本"
              />
            </div>
          )}

          {/* 面板组件 */}
          {component.type === 'panel' && (
            <div className="space-y-1 mb-3">
              <Label htmlFor="title" className="text-xs">
                标题
              </Label>
              <Input
                id="title"
                value={component.props.title || ''}
                onChange={(e) => handlePropChange('title', e.target.value)}
                className="h-8 text-sm"
                placeholder="面板标题"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function getComponentTypeName(type: string): string {
  const typeNames: Record<string, string> = {
    'force-displacement-chart': '力-位移曲线',
    'parameter-display': '参数显示',
    'status-indicator': '状态指示',
    button: '按钮',
    panel: '面板',
    input: '输入框',
    slider: '滑块',
    gauge: '仪表盘',
    table: '表格',
    text: '文本',
  }
  return typeNames[type] || type
}
