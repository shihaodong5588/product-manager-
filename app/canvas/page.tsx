'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlusCircle, Pencil, Trash2, Copy, Eye, Clock, Layers } from 'lucide-react'
import { toast } from 'sonner'

interface CanvasDesign {
  id: string
  title: string
  description: string | null
  version: number
  status: string
  canvasData: any
  updatedAt: string
  createdAt: string
  project: { id: string; name: string } | null
  requirement: { id: string; title: string } | null
}

export default function CanvasListPage() {
  const router = useRouter()
  const [designs, setDesigns] = useState<CanvasDesign[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDesigns()
  }, [])

  const fetchDesigns = async () => {
    try {
      const response = await fetch('/api/industrial-designs')
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      setDesigns(data.designs || [])
    } catch (error) {
      console.error('Error fetching designs:', error)
      toast.error('获取设计列表失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个设计吗？')) return

    try {
      const response = await fetch(`/api/industrial-designs/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete')
      toast.success('设计已删除')
      fetchDesigns()
    } catch (error) {
      console.error('Error deleting design:', error)
      toast.error('删除失败')
    }
  }

  const handleDuplicate = async (id: string) => {
    try {
      const response = await fetch(`/api/industrial-designs/${id}`)
      if (!response.ok) throw new Error('Failed to fetch')
      const { design } = await response.json()

      const duplicateResponse = await fetch('/api/industrial-designs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${design.title} (副本)`,
          description: design.description,
          canvasData: design.canvasData,
          canvasSettings: design.canvasSettings,
        }),
      })

      if (!duplicateResponse.ok) throw new Error('Failed to duplicate')
      toast.success('设计已复制')
      fetchDesigns()
    } catch (error) {
      console.error('Error duplicating design:', error)
      toast.error('复制失败')
    }
  }

  const getComponentCount = (design: CanvasDesign) => {
    return design.canvasData?.components?.length || 0
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">加载中...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">原型画布</h1>
          <p className="text-muted-foreground mt-1">
            工业上位机界面设计工具 - 拖拽式可视化编辑器
          </p>
        </div>
        <Link href="/canvas/new">
          <Button size="lg" className="gap-2">
            <PlusCircle className="h-5 w-5" />
            新建画布
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              总设计数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{designs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              草稿
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {designs.filter((d) => d.status === 'draft').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              最终版本
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {designs.filter((d) => d.status === 'final').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              总组件数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {designs.reduce((sum, d) => sum + getComponentCount(d), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Design Grid */}
      {designs.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <Layers className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">还没有设计</h3>
            <p className="text-muted-foreground mb-4">
              创建你的第一个工业上位机界面设计
            </p>
            <Link href="/canvas/new">
              <Button className="gap-2">
                <PlusCircle className="h-4 w-4" />
                新建画布
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {designs.map((design) => (
            <Card key={design.id} className="group hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1">{design.title}</CardTitle>
                    {design.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {design.description}
                      </p>
                    )}
                  </div>
                  <div
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      design.status === 'final'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {design.status === 'final' ? '最终' : '草稿'}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Preview placeholder */}
                <div className="aspect-video bg-zinc-950 border-2 border-green-500/30 rounded flex items-center justify-center">
                  <div className="text-center">
                    <Layers className="h-12 w-12 mx-auto text-green-500/50 mb-2" />
                    <p className="text-xs text-green-500/70 font-mono">
                      {getComponentCount(design)} 个组件
                    </p>
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-2 text-xs text-muted-foreground">
                  {design.project && (
                    <div className="flex items-center gap-2">
                      <span>项目:</span>
                      <span className="font-medium text-foreground">
                        {design.project.name}
                      </span>
                    </div>
                  )}
                  {design.requirement && (
                    <div className="flex items-center gap-2">
                      <span>需求:</span>
                      <span className="font-medium text-foreground">
                        {design.requirement.title}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    <span>{formatDate(design.updatedAt)}</span>
                  </div>
                  {design.version > 1 && (
                    <div className="flex items-center gap-2">
                      <span>版本: v{design.version}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t">
                  <Link href={`/canvas/${design.id}`} className="flex-1">
                    <Button variant="default" size="sm" className="w-full gap-2">
                      <Pencil className="h-4 w-4" />
                      编辑
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDuplicate(design.id)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(design.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
