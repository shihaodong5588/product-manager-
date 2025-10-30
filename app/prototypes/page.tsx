'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Plus,
  Palette,
  Eye,
  Sparkles,
  Image as ImageIcon,
  Copy,
  ZoomIn,
  FileText,
  Loader2,
  Pencil,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import CanvasEditor from '@/components/canvas-editor'

interface Prototype {
  id: string
  title: string
  description: string | null
  generationType: string
  platform: string
  styleType: string
  imageUrl: string
  taskId?: string | null
  analysisResult: any
  modelUsed: string
  generationTime: number | null
  status: string
  version: number
  parentId: string | null
  createdAt: string
  updatedAt: string
  parent?: {
    id: string
    title: string
    version: number
  } | null
  children?: Array<{
    id: string
    title: string
    version: number
    imageUrl: string
    generationType: string
    createdAt: string
  }>
}

interface NewPrototype {
  title: string
  description: string
  promptText: string
  platform: string
  styleType: string
}

export default function PrototypesPage() {
  const { toast } = useToast()
  const [prototypes, setPrototypes] = useState<Prototype[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [canvasEditorOpen, setCanvasEditorOpen] = useState(false)
  const [selectedPrototype, setSelectedPrototype] = useState<Prototype | null>(null)
  const [extractedPrompts, setExtractedPrompts] = useState<string[]>([])

  // Form state
  const [newPrototype, setNewPrototype] = useState<NewPrototype>({
    title: '',
    description: '',
    promptText: '',
    platform: 'web',
    styleType: 'wireframe',
  })

  useEffect(() => {
    fetchPrototypes()
  }, [])

  const fetchPrototypes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/prototypes')
      const data = await response.json()
      if (data.success) {
        setPrototypes(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch prototypes:', error)
      toast({
        title: '加载失败',
        description: '无法加载原型图列表',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const createPrototype = async () => {
    try {
      setGenerating(true)
      const response = await fetch('/api/prototypes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPrototype),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: '生成成功',
          description: '原型图已成功生成',
        })
        await fetchPrototypes()
        setCreateDialogOpen(false)
        setNewPrototype({
          title: '',
          description: '',
          promptText: '',
          platform: 'web',
          styleType: 'wireframe',
        })
      } else {
        throw new Error(data.details || data.error)
      }
    } catch (error) {
      console.error('Failed to create prototype:', error)
      toast({
        title: '生成失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      })
    } finally {
      setGenerating(false)
    }
  }

  // 生成变体
  const handleCreateVariation = async (prototype: Prototype) => {
    if (!prototype.taskId) {
      toast({
        title: '无法生成变体',
        description: '此原型图缺少 Task ID，无法进行变体操作',
        variant: 'destructive',
      })
      return
    }

    try {
      setActionLoading('variation')
      const response = await fetch(`/api/prototypes/${prototype.id}/variation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index: 1 }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: '变体生成成功',
          description: '已创建新的变体原型图',
        })
        await fetchPrototypes()
        // 打开新生成的变体
        setSelectedPrototype(data.data)
      } else {
        throw new Error(data.details || data.error)
      }
    } catch (error) {
      console.error('Failed to create variation:', error)
      toast({
        title: '变体生成失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(null)
    }
  }

  // 放大图片
  const handleUpscale = async (prototype: Prototype, index: number = 1) => {
    if (!prototype.taskId) {
      toast({
        title: '无法放大',
        description: '此原型图缺少 Task ID，无法进行放大操作',
        variant: 'destructive',
      })
      return
    }

    try {
      setActionLoading('upscale')
      const response = await fetch(`/api/prototypes/${prototype.id}/upscale`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: '图片放大成功',
          description: '已生成高清版本',
        })
        await fetchPrototypes()
        setSelectedPrototype(data.data)
      } else {
        throw new Error(data.details || data.error)
      }
    } catch (error) {
      console.error('Failed to upscale:', error)
      toast({
        title: '放大失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(null)
    }
  }

  // 提取提示词
  const handleDescribe = async (prototype: Prototype) => {
    try {
      setActionLoading('describe')
      const response = await fetch(`/api/prototypes/${prototype.id}/describe`, {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok) {
        setExtractedPrompts(data.data.prompts || [])
        toast({
          title: '提示词提取成功',
          description: `已提取 ${data.data.prompts?.length || 0} 个提示词`,
        })
      } else {
        throw new Error(data.details || data.error)
      }
    } catch (error) {
      console.error('Failed to describe:', error)
      toast({
        title: '提取失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(null)
    }
  }

  const getPlatformBadge = (platform: string) => {
    const colors: Record<string, string> = {
      web: 'bg-blue-500/10 text-blue-700 border-blue-200',
      ios: 'bg-gray-500/10 text-gray-700 border-gray-200',
      android: 'bg-green-500/10 text-green-700 border-green-200',
    }
    return colors[platform] || colors.web
  }

  const getStyleTypeBadge = (styleType: string) => {
    const colors: Record<string, string> = {
      wireframe: 'bg-slate-500/10 text-slate-700 border-slate-200',
      high_fidelity: 'bg-purple-500/10 text-purple-700 border-purple-200',
      sketch: 'bg-orange-500/10 text-orange-700 border-orange-200',
    }
    return colors[styleType] || colors.wireframe
  }

  const formatStyleType = (styleType: string) => {
    const names: Record<string, string> = {
      wireframe: '线框图',
      high_fidelity: '高保真',
      sketch: '手绘',
    }
    return names[styleType] || styleType
  }

  const getGenerationTypeBadge = (generationType: string) => {
    const types: Record<string, { label: string; color: string }> = {
      text_to_image: { label: '文生图', color: 'bg-blue-500/10 text-blue-700' },
      variation: { label: '变体', color: 'bg-purple-500/10 text-purple-700' },
      upscale: { label: '放大', color: 'bg-green-500/10 text-green-700' },
      vary_region: { label: '局部编辑', color: 'bg-orange-500/10 text-orange-700' },
    }
    return types[generationType] || { label: generationType, color: 'bg-gray-500/10 text-gray-700' }
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Palette className="w-8 h-8" />
            原型图管理
          </h1>
          <p className="text-muted-foreground mt-1">
            使用 AI 生成和分析产品原型图
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          生成新原型图
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">总计</CardTitle>
            <Palette className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{prototypes.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Web 平台</CardTitle>
            <ImageIcon className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {prototypes.filter((p) => p.platform === 'web').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">移动端</CardTitle>
            <ImageIcon className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {prototypes.filter((p) => p.platform === 'ios' || p.platform === 'android').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">变体</CardTitle>
            <Sparkles className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {prototypes.filter((p) => p.generationType === 'variation').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Prototypes Grid */}
      <div>
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            加载中...
          </div>
        ) : prototypes.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center space-y-4">
                <Palette className="w-16 h-16 mx-auto text-muted-foreground/50" />
                <div>
                  <h3 className="text-lg font-semibold mb-1">还没有原型图</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    点击上方按钮，使用 AI 生成您的第一个原型图
                  </p>
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    生成新原型图
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {prototypes.map((prototype) => (
              <Card key={prototype.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg line-clamp-1">{prototype.title}</CardTitle>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge className={getPlatformBadge(prototype.platform)}>
                      {prototype.platform.toUpperCase()}
                    </Badge>
                    <Badge className={getStyleTypeBadge(prototype.styleType)}>
                      {formatStyleType(prototype.styleType)}
                    </Badge>
                    <Badge className={getGenerationTypeBadge(prototype.generationType).color}>
                      {getGenerationTypeBadge(prototype.generationType).label}
                    </Badge>
                    {prototype.children && prototype.children.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {prototype.children.length} 个变体
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 图片预览 */}
                  {prototype.imageUrl && (
                    <div className="aspect-video rounded-lg overflow-hidden border bg-muted/30">
                      <img
                        src={prototype.imageUrl}
                        alt={prototype.title}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}

                  {prototype.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {prototype.description}
                    </p>
                  )}

                  {/* 显示父原型 */}
                  {prototype.parent && (
                    <div className="text-xs text-muted-foreground">
                      基于: {prototype.parent.title}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {new Date(prototype.createdAt).toLocaleDateString()}
                    </span>
                    {prototype.generationTime && (
                      <span>{(prototype.generationTime / 1000).toFixed(1)}s</span>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setSelectedPrototype(prototype)
                      setDetailsDialogOpen(true)
                      setExtractedPrompts([])
                    }}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    查看详情
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Prototype Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>生成新原型图</DialogTitle>
            <DialogDescription>
              使用 AI 根据您的描述生成产品原型图
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">标题</Label>
              <Input
                id="title"
                placeholder="例如：电商购物车页面"
                value={newPrototype.title}
                onChange={(e) =>
                  setNewPrototype({ ...newPrototype, title: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">简短描述</Label>
              <Input
                id="description"
                placeholder="例如：简洁美观的购物车界面"
                value={newPrototype.description}
                onChange={(e) =>
                  setNewPrototype({ ...newPrototype, description: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="promptText">详细需求描述</Label>
              <Textarea
                id="promptText"
                placeholder="详细描述您想要的原型图，包括功能、布局、组件等..."
                value={newPrototype.promptText}
                onChange={(e) =>
                  setNewPrototype({ ...newPrototype, promptText: e.target.value })
                }
                rows={6}
              />
              <p className="text-xs text-muted-foreground">
                提示：描述越详细，生成的原型图越精确
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="platform">平台</Label>
                <Select
                  value={newPrototype.platform}
                  onValueChange={(value) =>
                    setNewPrototype({ ...newPrototype, platform: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="web">Web 网页</SelectItem>
                    <SelectItem value="ios">iOS</SelectItem>
                    <SelectItem value="android">Android</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="styleType">风格</Label>
                <Select
                  value={newPrototype.styleType}
                  onValueChange={(value) =>
                    setNewPrototype({ ...newPrototype, styleType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wireframe">线框图</SelectItem>
                    <SelectItem value="high_fidelity">高保真</SelectItem>
                    <SelectItem value="sketch">手绘风格</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={generating}>
              取消
            </Button>
            <Button
              onClick={createPrototype}
              disabled={!newPrototype.title || !newPrototype.promptText || generating}
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  AI 生成中...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  生成原型图
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          {selectedPrototype && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedPrototype.title}</DialogTitle>
                <div className="flex items-center gap-2 pt-2 flex-wrap">
                  <Badge className={getPlatformBadge(selectedPrototype.platform)}>
                    {selectedPrototype.platform.toUpperCase()}
                  </Badge>
                  <Badge className={getStyleTypeBadge(selectedPrototype.styleType)}>
                    {formatStyleType(selectedPrototype.styleType)}
                  </Badge>
                  <Badge variant="outline">
                    {selectedPrototype.modelUsed}
                  </Badge>
                  <Badge className={getGenerationTypeBadge(selectedPrototype.generationType).color}>
                    {getGenerationTypeBadge(selectedPrototype.generationType).label}
                  </Badge>
                  {selectedPrototype.taskId && (
                    <Badge variant="outline" className="text-xs">
                      Task ID: {selectedPrototype.taskId.substring(0, 8)}...
                    </Badge>
                  )}
                </div>
                {selectedPrototype.parent && (
                  <div className="text-sm text-muted-foreground pt-2">
                    基于原型图: <span className="font-medium">{selectedPrototype.parent.title}</span>
                  </div>
                )}
              </DialogHeader>

              <div className="space-y-6">
                {/* Generated Image */}
                {selectedPrototype.imageUrl && (
                  <div className="space-y-2">
                    <h3 className="font-semibold">生成的原型图</h3>
                    <div className="rounded-lg overflow-hidden border bg-muted/30">
                      <img
                        src={selectedPrototype.imageUrl}
                        alt={selectedPrototype.title}
                        className="w-full h-auto"
                      />
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-2">
                  <h3 className="font-semibold">操作</h3>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      onClick={() => handleCreateVariation(selectedPrototype)}
                      disabled={!selectedPrototype.taskId || actionLoading === 'variation'}
                      size="sm"
                    >
                      {actionLoading === 'variation' ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Copy className="w-4 h-4 mr-2" />
                      )}
                      生成变体
                    </Button>

                    <Button
                      onClick={() => handleUpscale(selectedPrototype)}
                      disabled={!selectedPrototype.taskId || actionLoading === 'upscale'}
                      variant="outline"
                      size="sm"
                    >
                      {actionLoading === 'upscale' ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <ZoomIn className="w-4 h-4 mr-2" />
                      )}
                      放大图片
                    </Button>

                    <Button
                      onClick={() => handleDescribe(selectedPrototype)}
                      disabled={actionLoading === 'describe'}
                      variant="outline"
                      size="sm"
                    >
                      {actionLoading === 'describe' ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <FileText className="w-4 h-4 mr-2" />
                      )}
                      提取提示词
                    </Button>

                    <Button
                      onClick={() => setCanvasEditorOpen(true)}
                      disabled={!selectedPrototype.taskId}
                      variant="outline"
                      size="sm"
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      局部编辑
                    </Button>
                  </div>
                  {!selectedPrototype.taskId && (
                    <p className="text-xs text-muted-foreground">
                      此原型图缺少 Task ID，无法进行变体、放大或局部编辑操作
                    </p>
                  )}
                </div>

                {/* Extracted Prompts */}
                {extractedPrompts.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold">提取的提示词</h3>
                    <div className="border rounded-lg p-4 bg-muted/30 space-y-2">
                      {extractedPrompts.map((prompt, index) => (
                        <div key={index} className="text-sm">
                          <span className="font-medium text-muted-foreground">选项 {index + 1}:</span>
                          <p className="mt-1">{prompt}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Iterations / Children */}
                {selectedPrototype.children && selectedPrototype.children.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold">
                      迭代历史 ({selectedPrototype.children.length})
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {selectedPrototype.children.map((child) => (
                        <Card
                          key={child.id}
                          className="cursor-pointer hover:shadow-lg transition-shadow"
                          onClick={async () => {
                            // 重新获取完整的 child 数据
                            const response = await fetch(`/api/prototypes`)
                            const data = await response.json()
                            if (data.success) {
                              const fullChild = data.data.find((p: Prototype) => p.id === child.id)
                              if (fullChild) {
                                setSelectedPrototype(fullChild)
                                setExtractedPrompts([])
                              }
                            }
                          }}
                        >
                          <CardContent className="p-3 space-y-2">
                            <div className="aspect-video rounded overflow-hidden border bg-muted/30">
                              <img
                                src={child.imageUrl}
                                alt={child.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <p className="text-xs font-medium line-clamp-1">{child.title}</p>
                              <div className="flex items-center gap-1 mt-1">
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${getGenerationTypeBadge(child.generationType).color}`}
                                >
                                  {getGenerationTypeBadge(child.generationType).label}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  v{child.version}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                {selectedPrototype.description && (
                  <div className="space-y-2">
                    <h3 className="font-semibold">描述</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedPrototype.description}
                    </p>
                  </div>
                )}

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">生成类型</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedPrototype.generationType}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">版本</p>
                    <p className="text-sm text-muted-foreground">
                      v{selectedPrototype.version}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">生成耗时</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedPrototype.generationTime ? `${(selectedPrototype.generationTime / 1000).toFixed(2)}秒` : '未记录'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">创建时间</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedPrototype.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
                  关闭
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Canvas Editor Dialog */}
      {selectedPrototype && (
        <CanvasEditor
          imageUrl={selectedPrototype.imageUrl}
          prototypeId={selectedPrototype.id}
          open={canvasEditorOpen}
          onOpenChange={setCanvasEditorOpen}
          onSuccess={async () => {
            await fetchPrototypes()
            setDetailsDialogOpen(false)
          }}
        />
      )}
    </div>
  )
}
