'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2, Eraser, Pen, Undo, Download } from 'lucide-react'

interface CanvasEditorProps {
  imageUrl: string
  prototypeId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export default function CanvasEditor({
  imageUrl,
  prototypeId,
  open,
  onOpenChange,
  onSuccess,
}: CanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [brushSize, setBrushSize] = useState(20)
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [drawingHistory, setDrawingHistory] = useState<ImageData[]>([])

  // 加载图片
  useEffect(() => {
    if (!open || !imageUrl) return

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = imageUrl
    img.onload = () => {
      setImage(img)
      initializeCanvas(img)
    }
  }, [open, imageUrl])

  const initializeCanvas = (img: HTMLImageElement) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 设置画布尺寸
    const maxWidth = 800
    const scale = Math.min(1, maxWidth / img.width)
    canvas.width = img.width * scale
    canvas.height = img.height * scale

    // 绘制图片
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    // 保存初始状态
    saveToHistory(ctx)
  }

  const saveToHistory = (ctx: CanvasRenderingContext2D) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    setDrawingHistory((prev) => [...prev, imageData])
  }

  const undo = () => {
    if (drawingHistory.length <= 1) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 移除最后一个状态
    const newHistory = drawingHistory.slice(0, -1)
    setDrawingHistory(newHistory)

    // 恢复上一个状态
    const previousState = newHistory[newHistory.length - 1]
    ctx.putImageData(previousState, 0, 0)
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    draw(e)
  }

  const stopDrawing = () => {
    if (isDrawing) {
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (ctx) {
        saveToHistory(ctx)
      }
    }
    setIsDrawing(false)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing && e.type !== 'mousedown') return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // 设置画笔样式（白色遮罩）
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.lineWidth = brushSize
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    if (e.type === 'mousedown') {
      ctx.beginPath()
      ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2)
      ctx.fill()
    } else {
      ctx.lineTo(x, y)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(x, y)
    }
  }

  const clearCanvas = () => {
    if (!image) return
    initializeCanvas(image)
  }

  const getMaskDataUrl = (): string => {
    const canvas = canvasRef.current
    if (!canvas || !image) return ''

    console.log('Canvas size:', canvas.width, 'x', canvas.height)
    console.log('Original image size:', image.width, 'x', image.height)

    // 创建一个与**原图尺寸相同**的mask画布
    const maskCanvas = document.createElement('canvas')
    maskCanvas.width = image.width
    maskCanvas.height = image.height
    const maskCtx = maskCanvas.getContext('2d')
    if (!maskCtx) return ''

    // 填充黑色背景
    maskCtx.fillStyle = 'black'
    maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height)

    // 获取当前画布的像素数据
    const ctx = canvas.getContext('2d')
    if (!ctx) return ''

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data

    // 创建临时画布来缩放遮罩到原图尺寸
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = canvas.width
    tempCanvas.height = canvas.height
    const tempCtx = tempCanvas.getContext('2d')
    if (!tempCtx) return ''

    // 创建白色遮罩图像
    const maskImageData = tempCtx.createImageData(canvas.width, canvas.height)
    const maskData = maskImageData.data

    // 检测白色遮罩区域（用户绘制的区域）
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const a = data[i + 3]

      // 如果像素接近白色且有透明度，标记为白色（需要编辑的区域）
      if (r > 200 && g > 200 && b > 200 && a > 100) {
        maskData[i] = 255 // R
        maskData[i + 1] = 255 // G
        maskData[i + 2] = 255 // B
        maskData[i + 3] = 255 // A
      } else {
        maskData[i] = 0 // R
        maskData[i + 1] = 0 // G
        maskData[i + 2] = 0 // B
        maskData[i + 3] = 255 // A
      }
    }

    tempCtx.putImageData(maskImageData, 0, 0)

    // 将遮罩缩放到原图尺寸
    maskCtx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height, 0, 0, maskCanvas.width, maskCanvas.height)

    console.log('Mask canvas size:', maskCanvas.width, 'x', maskCanvas.height)

    // 使用 JPEG 格式和较低质量来减小文件大小
    // 注意：虽然是黑白图，但JPEG比PNG小很多
    const dataUrl = maskCanvas.toDataURL('image/jpeg', 0.8)
    console.log('Mask data URL length:', dataUrl.length)

    return dataUrl
  }

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      alert('请输入编辑提示词')
      return
    }

    const maskDataUrl = getMaskDataUrl()
    if (!maskDataUrl) {
      alert('无法生成遮罩图片')
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/prototypes/${prototypeId}/vary-region`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maskDataUrl,
          prompt,
          editRegionData: null, // 可以添加坐标数据
        }),
      })

      const data = await response.json()

      if (response.ok) {
        alert('局部编辑成功！')
        onOpenChange(false)
        onSuccess?.()
      } else {
        throw new Error(data.details || data.error)
      }
    } catch (error) {
      console.error('Failed to vary region:', error)
      alert(error instanceof Error ? error.message : '局部编辑失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>局部编辑 - Vary Region</DialogTitle>
          <DialogDescription>
            在图片上绘制白色遮罩来标记需要编辑的区域，然后输入提示词描述想要的效果
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Canvas */}
          <div className="border rounded-lg overflow-hidden bg-gray-100">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              className="cursor-crosshair max-w-full"
            />
          </div>

          {/* Controls */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>画笔大小: {brushSize}px</Label>
              <Slider
                value={[brushSize]}
                onValueChange={(value) => setBrushSize(value[0])}
                min={5}
                max={100}
                step={5}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={undo}
                disabled={drawingHistory.length <= 1}
              >
                <Undo className="w-4 h-4 mr-2" />
                撤销
              </Button>
              <Button variant="outline" size="sm" onClick={clearCanvas}>
                <Eraser className="w-4 h-4 mr-2" />
                清除遮罩
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-prompt">编辑提示词</Label>
              <Textarea
                id="edit-prompt"
                placeholder="描述你想要在标记区域生成的内容，例如：将窗户改成落地窗、添加一只猫、改成红色..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                提示：白色区域表示需要编辑的部分，黑色区域保持不变
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={!prompt.trim() || loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                AI 生成中...
              </>
            ) : (
              <>
                <Pen className="w-4 h-4 mr-2" />
                生成编辑结果
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
