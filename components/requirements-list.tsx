'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

type Priority = 'LOW' | 'MEDIUM' | 'HIGH'
type RequirementStatus = 'SUBMITTED' | 'APPROVED' | 'IN_DEVELOPMENT' | 'IN_TESTING' | 'COMPLETED' | 'REJECTED'

interface Requirement {
  id: string
  title: string
  description: string | null
  priority: Priority
  status: RequirementStatus
  tags: string | null
  createdAt: string
}

export function RequirementsList() {
  const [requirements, setRequirements] = useState<Requirement[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newRequirement, setNewRequirement] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as Priority,
    tags: '',
  })

  useEffect(() => {
    fetchRequirements()
  }, [])

  const fetchRequirements = async () => {
    try {
      const response = await fetch('/api/requirements')
      const data = await response.json()
      setRequirements(data)
    } catch (error) {
      console.error('Failed to fetch requirements:', error)
    }
  }

  const createRequirement = async () => {
    try {
      await fetch('/api/requirements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRequirement),
      })
      setIsDialogOpen(false)
      setNewRequirement({ title: '', description: '', priority: 'MEDIUM', tags: '' })
      fetchRequirements()
    } catch (error) {
      console.error('Failed to create requirement:', error)
    }
  }

  const getPriorityColor = (priority: Priority) => {
    const colors = { LOW: 'bg-blue-500', MEDIUM: 'bg-yellow-500', HIGH: 'bg-red-500' }
    return colors[priority]
  }

  const getStatusColor = (status: RequirementStatus) => {
    const colors = {
      SUBMITTED: 'bg-gray-500',
      APPROVED: 'bg-green-500',
      IN_DEVELOPMENT: 'bg-blue-500',
      IN_TESTING: 'bg-purple-500',
      COMPLETED: 'bg-emerald-500',
      REJECTED: 'bg-red-500',
    }
    return colors[status]
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">需求管理</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>创建需求</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>创建新需求</DialogTitle>
              <DialogDescription>填写需求信息并提交</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">标题</Label>
                <Input
                  id="title"
                  value={newRequirement.title}
                  onChange={(e) => setNewRequirement({ ...newRequirement, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="description">描述</Label>
                <Textarea
                  id="description"
                  value={newRequirement.description}
                  onChange={(e) => setNewRequirement({ ...newRequirement, description: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="priority">优先级</Label>
                <Select
                  value={newRequirement.priority}
                  onValueChange={(value) => setNewRequirement({ ...newRequirement, priority: value as Priority })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">低</SelectItem>
                    <SelectItem value="MEDIUM">中</SelectItem>
                    <SelectItem value="HIGH">高</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="tags">标签 (逗号分隔)</Label>
                <Input
                  id="tags"
                  value={newRequirement.tags}
                  onChange={(e) => setNewRequirement({ ...newRequirement, tags: e.target.value })}
                  placeholder="功能,优化,紧急"
                />
              </div>
              <Button onClick={createRequirement} className="w-full">提交</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {requirements.map((req) => (
          <Card key={req.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle>{req.title}</CardTitle>
                  <CardDescription>{req.description}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge className={getPriorityColor(req.priority)}>{req.priority}</Badge>
                  <Badge className={getStatusColor(req.status)}>{req.status}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                {req.tags && req.tags.split(',').map((tag) => (
                  <Badge key={tag} variant="outline">{tag.trim()}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
