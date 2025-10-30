'use client'

import React, { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Upload, Wand2, X } from 'lucide-react'
import { toast } from 'sonner'
import { fileToBase64 } from '@/lib/canvas-export'
import { useRouter } from 'next/navigation'

interface BlendDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  canvasImageBase64: string
  defaultTitle?: string
}

export default function BlendDialog({
  open,
  onOpenChange,
  canvasImageBase64,
  defaultTitle,
}: BlendDialogProps) {
  const router = useRouter()
  const [referenceImage, setReferenceImage] = useState<string | null>(null)
  const [referenceImageName, setReferenceImageName] = useState<string>('')
  const [title, setTitle] = useState(defaultTitle || '混合生成的原型图')
  const [description, setDescription] = useState('')
  const [dimensions, setDimensions] = useState<'PORTRAIT' | 'SQUARE' | 'LANDSCAPE'>('SQUARE')
  const [isGenerating, setIsGenerating] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      toast.error('请上传图片文件')
      return
    }

    // 验证文件大小 (最大 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('图片文件不能超过 10MB')
      return
    }

    try {
      const base64 = await fileToBase64(file)
      setReferenceImage(base64)
      setReferenceImageName(file.name)
      toast.success('参考图片已上传')
    } catch (error) {
      console.error('Failed to read file:', error)
      toast.error('读取图片失败')
    }
  }

  const handleGenerate = async () => {
    if (!referenceImage) {
      toast.error('请上传参考图片')
      return
    }

    if (!title.trim()) {
      toast.error('请输入标题')
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch('/api/prototypes/blend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          canvasImage: canvasImageBase64,
          referenceImage,
          dimensions,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || '生成失败')
      }

      await response.json()
      toast.success('混合生成成功！')

      // 跳转到原型图列表
      router.push('/prototypes')
      onOpenChange(false)
    } catch (error) {
      console.error('Blend generation error:', error)
      toast.error(error instanceof Error ? error.message : '生成失败，请重试')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRemoveReference = () => {
    setReferenceImage(null)
    setReferenceImageName('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>以图生图 - Midjourney Blend</DialogTitle>
          <DialogDescription>
            将你的画布设计与参考图片混合，生成新的原型图
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 预览区 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">画布设计</Label>
              <div className="border rounded-lg p-2 bg-muted/50">
                <img
                  src={canvasImageBase64}
                  alt="Canvas design"
                  className="w-full h-auto rounded"
                />
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  当前画布设计
                </p>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">参考图片</Label>
              {referenceImage ? (
                <div className="border rounded-lg p-2 bg-muted/50 relative">
                  <img
                    src={referenceImage}
                    alt="Reference"
                    className="w-full h-auto rounded"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-3 right-3"
                    onClick={handleRemoveReference}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2 text-center truncate">
                    {referenceImageName}
                  </p>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-1">
                    点击上传参考图片
                  </p>
                  <p className="text-xs text-muted-foreground">
                    支持 JPG、PNG 格式，最大 10MB
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          </div>

          {/* 设置 */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="blend-title">标题</Label>
              <Input
                id="blend-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="输入生成图片的标题"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="blend-description">描述（可选）</Label>
              <Textarea
                id="blend-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="输入描述信息"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>图片比例</Label>
              <div className="flex gap-2">
                {[
                  { value: 'PORTRAIT', label: '竖版 (2:3)' },
                  { value: 'SQUARE', label: '方形 (1:1)' },
                  { value: 'LANDSCAPE', label: '横版 (3:2)' },
                ].map((option) => (
                  <Button
                    key={option.value}
                    variant={dimensions === option.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDimensions(option.value as any)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* 提示信息 */}
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              💡 <strong>提示：</strong>Blend 功能会将你的画布设计和参考图片混合，
              生成一张结合两者特征的新图片。参考图片可以是色彩方案、风格参考或设计灵感。
            </p>
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isGenerating}
            >
              取消
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={!referenceImage || isGenerating}
              className="gap-2"
            >
              <Wand2 className="h-4 w-4" />
              {isGenerating ? '生成中...' : '开始混合生成'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
