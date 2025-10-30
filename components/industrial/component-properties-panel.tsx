'use client'

import React, { useState } from 'react'
import { CanvasComponent } from './canvas-editor'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Trash2, Upload } from 'lucide-react'

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
  const [uploadingIcon, setUploadingIcon] = useState(false)

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !component) return

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      alert('请上传图片文件')
      return
    }

    setUploadingIcon(true)
    try {
      // 转换为base64
      const reader = new FileReader()
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string
        onUpdate(component.id, {
          props: {
            ...component.props,
            customIconUrl: imageUrl,
            iconType: 'custom',
          },
        })
        setUploadingIcon(false)
      }
      reader.onerror = () => {
        alert('上传失败，请重试')
        setUploadingIcon(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('上传图标失败:', error)
      alert('上传图标失败，请重试')
      setUploadingIcon(false)
    }
  }

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
            <>
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
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="space-y-1">
                  <Label htmlFor="fontSize" className="text-xs">
                    字体大小 (px)
                  </Label>
                  <Input
                    id="fontSize"
                    type="number"
                    value={component.props.fontSize || 16}
                    onChange={(e) => handlePropChange('fontSize', parseInt(e.target.value) || 16)}
                    className="h-8 text-sm"
                    min={8}
                    max={96}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="fontWeight" className="text-xs">
                    字体粗细
                  </Label>
                  <select
                    id="fontWeight"
                    value={component.props.fontWeight || 400}
                    onChange={(e) => handlePropChange('fontWeight', parseInt(e.target.value))}
                    className="h-8 text-sm border rounded-md px-2 w-full"
                  >
                    <option value="300">细 (300)</option>
                    <option value="400">正常 (400)</option>
                    <option value="500">中等 (500)</option>
                    <option value="600">半粗 (600)</option>
                    <option value="700">粗 (700)</option>
                    <option value="800">特粗 (800)</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1 mb-3">
                <Label htmlFor="color" className="text-xs">
                  文字颜色
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={component.props.color || '#334155'}
                    onChange={(e) => handlePropChange('color', e.target.value)}
                    className="h-8 w-16"
                  />
                  <Input
                    type="text"
                    value={component.props.color || '#334155'}
                    onChange={(e) => handlePropChange('color', e.target.value)}
                    className="h-8 text-sm flex-1"
                    placeholder="#334155"
                  />
                </div>
              </div>
              <div className="space-y-1 mb-3">
                <Label htmlFor="textAlign" className="text-xs">
                  对齐方式
                </Label>
                <select
                  id="textAlign"
                  value={component.props.textAlign || 'center'}
                  onChange={(e) => handlePropChange('textAlign', e.target.value)}
                  className="h-8 text-sm border rounded-md px-2 w-full"
                >
                  <option value="left">左对齐</option>
                  <option value="center">居中</option>
                  <option value="right">右对齐</option>
                </select>
              </div>
              <div className="space-y-1 mb-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="showBorder" className="text-xs">
                    显示边框
                  </Label>
                  <input
                    id="showBorder"
                    type="checkbox"
                    checked={component.props.showBorder !== false}
                    onChange={(e) => handlePropChange('showBorder', e.target.checked)}
                    className="h-4 w-4 cursor-pointer"
                  />
                </div>
              </div>
              {component.props.showBorder !== false && (
                <>
                  <div className="space-y-1 mb-3">
                    <Label htmlFor="borderColor" className="text-xs">
                      边框颜色
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="borderColor"
                        type="color"
                        value={component.props.borderColor || '#e2e8f0'}
                        onChange={(e) => handlePropChange('borderColor', e.target.value)}
                        className="h-8 w-16"
                      />
                      <Input
                        type="text"
                        value={component.props.borderColor || '#e2e8f0'}
                        onChange={(e) => handlePropChange('borderColor', e.target.value)}
                        className="h-8 text-sm flex-1"
                        placeholder="#e2e8f0"
                      />
                    </div>
                  </div>
                  <div className="space-y-1 mb-3">
                    <Label htmlFor="borderWidth" className="text-xs">
                      边框宽度 (px)
                    </Label>
                    <Input
                      id="borderWidth"
                      type="number"
                      value={component.props.borderWidth || 1}
                      onChange={(e) => handlePropChange('borderWidth', parseInt(e.target.value) || 1)}
                      className="h-8 text-sm"
                      min={0}
                      max={10}
                    />
                  </div>
                </>
              )}
            </>
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

          {/* 图标组件 */}
          {component.type === 'icon' && (
            <>
              <div className="space-y-1 mb-3">
                <Label htmlFor="iconType" className="text-xs">
                  图标类型
                </Label>
                <select
                  id="iconType"
                  value={component.props.iconType || 'motor'}
                  onChange={(e) => handlePropChange('iconType', e.target.value)}
                  className="h-8 text-sm border rounded-md px-2 w-full"
                >
                  <optgroup label="工业设备">
                    <option value="motor">⚙️ 电机</option>
                    <option value="sensor">📡 传感器</option>
                    <option value="valve">🔧 阀门</option>
                    <option value="pump">⚡ 泵</option>
                    <option value="warning">⚠️ 警告</option>
                    <option value="power">🔌 电源</option>
                  </optgroup>
                  <optgroup label="文字处理">
                    <option value="file-text">📄 文本文件</option>
                    <option value="document">📃 文档</option>
                    <option value="table">📊 表格</option>
                    <option value="list">📋 列表</option>
                    <option value="edit">✏️ 编辑</option>
                    <option value="save">💾 保存</option>
                    <option value="print">🖨️ 打印</option>
                    <option value="clipboard">📎 剪贴板</option>
                  </optgroup>
                  {component.props.customIconUrl && (
                    <optgroup label="自定义">
                      <option value="custom">🎨 自定义图标</option>
                    </optgroup>
                  )}
                </select>
              </div>

              {/* 上传自定义图标按钮 */}
              <div className="mb-3">
                <Label className="text-xs mb-2 block">自定义图标</Label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleIconUpload}
                    className="hidden"
                    id="icon-upload"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => document.getElementById('icon-upload')?.click()}
                    disabled={uploadingIcon}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploadingIcon ? '上传中...' : '上传图标'}
                  </Button>
                </div>
                {component.props.customIconUrl && (
                  <div className="mt-2 p-2 border rounded-lg bg-slate-50 flex items-center justify-between">
                    <span className="text-xs text-slate-600">已上传自定义图标</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePropChange('customIconUrl', '')}
                      className="h-6 text-xs"
                    >
                      删除
                    </Button>
                  </div>
                )}
              </div>
              <div className="space-y-1 mb-3">
                <Label htmlFor="iconSize" className="text-xs">
                  图标大小 (px)
                </Label>
                <Input
                  id="iconSize"
                  type="number"
                  value={component.props.iconSize || 32}
                  onChange={(e) => handlePropChange('iconSize', parseInt(e.target.value) || 32)}
                  className="h-8 text-sm"
                  min={16}
                  max={128}
                />
              </div>
              <div className="space-y-1 mb-3">
                <Label className="text-xs font-semibold">图标设置</Label>
              </div>
              <div className="space-y-1 mb-3">
                <Label htmlFor="iconColor" className="text-xs">
                  图标颜色
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="iconColor"
                    type="color"
                    value={component.props.iconColor || '#00ff00'}
                    onChange={(e) => handlePropChange('iconColor', e.target.value)}
                    className="h-8 w-16"
                  />
                  <Input
                    type="text"
                    value={component.props.iconColor || '#00ff00'}
                    onChange={(e) => handlePropChange('iconColor', e.target.value)}
                    className="h-8 text-sm flex-1"
                    placeholder="#00ff00"
                  />
                </div>
              </div>
              <div className="space-y-1 mb-3">
                <Label htmlFor="iconOpacity" className="text-xs">
                  图标透明度: {((component.props.iconOpacity !== undefined ? component.props.iconOpacity : 1) * 100).toFixed(0)}%
                </Label>
                <Input
                  id="iconOpacity"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={component.props.iconOpacity !== undefined ? component.props.iconOpacity : 1}
                  onChange={(e) => handlePropChange('iconOpacity', parseFloat(e.target.value))}
                  className="h-8"
                />
              </div>
              <div className="space-y-1 mb-3">
                <Label className="text-xs font-semibold">背景设置</Label>
              </div>
              <div className="space-y-1 mb-3">
                <Label htmlFor="bgColor" className="text-xs">
                  背景颜色
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="bgColor"
                    type="color"
                    value={component.props.bgColor || '#1e293b'}
                    onChange={(e) => handlePropChange('bgColor', e.target.value)}
                    className="h-8 w-16"
                  />
                  <Input
                    type="text"
                    value={component.props.bgColor || '#1e293b'}
                    onChange={(e) => handlePropChange('bgColor', e.target.value)}
                    className="h-8 text-sm flex-1"
                    placeholder="#1e293b"
                  />
                </div>
              </div>
              <div className="space-y-1 mb-3">
                <Label htmlFor="bgOpacity" className="text-xs">
                  背景透明度: {((component.props.bgOpacity !== undefined ? component.props.bgOpacity : 0.5) * 100).toFixed(0)}%
                </Label>
                <Input
                  id="bgOpacity"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={component.props.bgOpacity !== undefined ? component.props.bgOpacity : 0.5}
                  onChange={(e) => handlePropChange('bgOpacity', parseFloat(e.target.value))}
                  className="h-8"
                />
              </div>
            </>
          )}

          {/* 箭头组件 */}
          {component.type === 'arrow' && (
            <>
              <div className="space-y-1 mb-3">
                <Label htmlFor="direction" className="text-xs">
                  箭头方向
                </Label>
                <select
                  id="direction"
                  value={component.props.direction || 'right'}
                  onChange={(e) => handlePropChange('direction', e.target.value)}
                  className="h-8 text-sm border rounded-md px-2 w-full"
                >
                  <option value="right">→ 右</option>
                  <option value="left">← 左</option>
                  <option value="up">↑ 上</option>
                  <option value="down">↓ 下</option>
                </select>
              </div>
              <div className="space-y-1 mb-3">
                <Label htmlFor="arrowColor" className="text-xs">
                  箭头颜色
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="arrowColor"
                    type="color"
                    value={component.props.arrowColor || '#00ff00'}
                    onChange={(e) => handlePropChange('arrowColor', e.target.value)}
                    className="h-8 w-16"
                  />
                  <Input
                    type="text"
                    value={component.props.arrowColor || '#00ff00'}
                    onChange={(e) => handlePropChange('arrowColor', e.target.value)}
                    className="h-8 text-sm flex-1"
                    placeholder="#00ff00"
                  />
                </div>
              </div>
              <div className="space-y-1 mb-3">
                <Label htmlFor="arrowThickness" className="text-xs">
                  箭头粗细 (px)
                </Label>
                <Input
                  id="arrowThickness"
                  type="number"
                  value={component.props.arrowThickness || 3}
                  onChange={(e) => handlePropChange('arrowThickness', parseInt(e.target.value) || 3)}
                  className="h-8 text-sm"
                  min={1}
                  max={10}
                />
              </div>
              <div className="space-y-1 mb-3">
                <Label htmlFor="arrowOpacity" className="text-xs">
                  透明度: {((component.props.arrowOpacity !== undefined ? component.props.arrowOpacity : 1) * 100).toFixed(0)}%
                </Label>
                <Input
                  id="arrowOpacity"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={component.props.arrowOpacity !== undefined ? component.props.arrowOpacity : 1}
                  onChange={(e) => handlePropChange('arrowOpacity', parseFloat(e.target.value))}
                  className="h-8"
                />
              </div>
            </>
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
    icon: '图标',
    arrow: '指示箭头',
  }
  return typeNames[type] || type
}
