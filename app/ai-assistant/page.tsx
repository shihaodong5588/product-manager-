'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Brain, Sparkles, FileText, CheckSquare, FolderKanban, AlertTriangle, Loader2, History } from 'lucide-react'
import { marked } from 'marked'

interface ContentItem {
  id: string
  title: string
  preview: string
  type: string
  metadata: any
  createdAt: string
}

interface AnalysisResult {
  id: string
  result: string
  metadata: {
    model: string
    tokensUsed?: number
    processingTime: number
  }
}

export default function AIAssistantPage() {
  const [contentList, setContentList] = useState<ContentItem[]>([])
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null)
  const [analysisType, setAnalysisType] = useState('requirement_analysis')
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash')
  const [userPrompt, setUserPrompt] = useState('')
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [filterType, setFilterType] = useState('all')
  const [historyList, setHistoryList] = useState<any[]>([])

  useEffect(() => {
    fetchContent()
    fetchHistory()
  }, [filterType])

  const fetchContent = async () => {
    try {
      const response = await fetch(`/api/ai/content?type=${filterType}`)
      const data = await response.json()
      setContentList(data.content || [])
    } catch (error) {
      console.error('Failed to fetch content:', error)
    }
  }

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/ai/history?limit=10')
      const data = await response.json()
      setHistoryList(data.analyses || [])
    } catch (error) {
      console.error('Failed to fetch history:', error)
    }
  }

  const handleAnalyze = async () => {
    if (!selectedContent) return

    setIsAnalyzing(true)
    setAnalysisResult(null)

    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceType: selectedContent.type,
          sourceId: selectedContent.id,
          analysisType,
          userPrompt: userPrompt || undefined,
          model: selectedModel, // 发送用户选择的模型
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '分析失败')
      }

      const result = await response.json()
      setAnalysisResult(result)
      fetchHistory() // 刷新历史记录
    } catch (error: any) {
      alert(error.message || '分析失败，请重试')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'requirement': return <FileText className="h-4 w-4" />
      case 'task': return <CheckSquare className="h-4 w-4" />
      case 'project': return <FolderKanban className="h-4 w-4" />
      case 'risk': return <AlertTriangle className="h-4 w-4" />
      default: return null
    }
  }

  const getTypeName = (type: string) => {
    const names = {
      requirement: '需求',
      task: '任务',
      project: '项目',
      risk: '风险',
    }
    return names[type as keyof typeof names] || type
  }

  const getAnalysisTypeName = (type: string) => {
    const names = {
      requirement_analysis: '需求分析',
      risk_assessment: '风险识别',
      technical_feasibility: '技术可行性',
    }
    return names[type as keyof typeof names] || type
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
          <Brain className="h-6 w-6 text-purple-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">AI 智能助手</h1>
          <p className="text-muted-foreground">工业伺服产品专业分析</p>
        </div>
      </div>

      <Tabs defaultValue="analyze" className="w-full">
        <TabsList>
          <TabsTrigger value="analyze">
            <Sparkles className="h-4 w-4 mr-2" />
            智能分析
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            历史记录
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analyze" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 左侧：内容选择 */}
            <Card>
              <CardHeader>
                <CardTitle>选择分析内容</CardTitle>
                <CardDescription>从数据库中选择一条内容进行分析</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 类型过滤 */}
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部类型</SelectItem>
                    <SelectItem value="requirement">需求</SelectItem>
                    <SelectItem value="task">任务</SelectItem>
                    <SelectItem value="project">项目</SelectItem>
                    <SelectItem value="risk">风险</SelectItem>
                  </SelectContent>
                </Select>

                {/* 内容列表 */}
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {contentList.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedContent(item)}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                        selectedContent?.id === item.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {getTypeIcon(item.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {getTypeName(item.type)}
                            </Badge>
                            {item.metadata.priority && (
                              <Badge variant={item.metadata.priority === 'HIGH' ? 'destructive' : 'secondary'} className="text-xs">
                                {item.metadata.priority}
                              </Badge>
                            )}
                          </div>
                          <h4 className="font-medium text-sm mb-1 line-clamp-1">{item.title}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-2">{item.preview}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {contentList.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">暂无数据</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 右侧：分析表单 */}
            <Card>
              <CardHeader>
                <CardTitle>配置分析参数</CardTitle>
                <CardDescription>选择分析类型并输入额外提示</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 选中的内容 */}
                {selectedContent && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">已选择：</p>
                    <p className="font-medium">{selectedContent.title}</p>
                  </div>
                )}

                {/* 分析类型 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">分析类型</label>
                  <Select value={analysisType} onValueChange={setAnalysisType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="requirement_analysis">📋 需求分析</SelectItem>
                      <SelectItem value="risk_assessment">⚠️ 风险识别</SelectItem>
                      <SelectItem value="technical_feasibility">🔧 技术可行性</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* AI 模型选择 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">AI 模型</label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gemini-2.5-flash">
                        <div className="flex items-center gap-2">
                          <span>⚡ Flash</span>
                          <span className="text-xs text-muted-foreground">（快速、经济、推荐）</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="gemini-2.5-pro">
                        <div className="flex items-center gap-2">
                          <span>🧠 Pro</span>
                          <span className="text-xs text-muted-foreground">（最强性能）</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="gemini-2.5-flash-lite">
                        <div className="flex items-center gap-2">
                          <span>🚀 Lite</span>
                          <span className="text-xs text-muted-foreground">（超快速）</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {selectedModel === 'gemini-2.5-flash' && '平衡速度与质量，适合日常使用'}
                    {selectedModel === 'gemini-2.5-pro' && '最强分析能力，适合复杂技术决策'}
                    {selectedModel === 'gemini-2.5-flash-lite' && '极速响应，适合简单分析'}
                  </p>
                </div>

                {/* 用户提示词 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">额外提示（可选）</label>
                  <Textarea
                    value={userPrompt}
                    onChange={(e) => setUserPrompt(e.target.value)}
                    placeholder="例如：重点关注EMC风险、关注成本控制、需要符合CE认证要求..."
                    rows={4}
                  />
                </div>

                {/* 开始分析按钮 */}
                <Button
                  onClick={handleAnalyze}
                  disabled={!selectedContent || isAnalyzing}
                  className="w-full"
                  size="lg"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      分析中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      开始分析
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* 分析结果 */}
          {analysisResult && (
            <Card>
              <CardHeader>
                <CardTitle>分析结果</CardTitle>
                <CardDescription>
                  模型：{analysisResult.metadata.model} |
                  耗时：{analysisResult.metadata.processingTime}ms |
                  Tokens：{analysisResult.metadata.tokensUsed || '未知'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: marked(analysisResult.result) }}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 左侧：历史记录列表 */}
            <Card>
              <CardHeader>
                <CardTitle>分析历史</CardTitle>
                <CardDescription>最近10条分析记录</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {historyList.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setAnalysisResult({
                        id: item.id,
                        result: item.analysisResult,
                        metadata: {
                          model: item.modelUsed,
                          tokensUsed: item.tokensUsed,
                          processingTime: item.processingTime,
                        },
                      })}
                      className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                        analysisResult?.id === item.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{getTypeName(item.sourceType)}</Badge>
                          <Badge>{getAnalysisTypeName(item.analysisType)}</Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(item.createdAt).toLocaleString('zh-CN')}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {item.inputContent.substring(0, 150)}...
                      </p>
                    </div>
                  ))}
                  {historyList.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">暂无历史记录</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 右侧：分析结果 */}
            <Card>
              <CardHeader>
                <CardTitle>分析结果</CardTitle>
                <CardDescription>
                  {analysisResult ? (
                    <>
                      模型：{analysisResult.metadata.model} |
                      耗时：{analysisResult.metadata.processingTime}ms |
                      Tokens：{analysisResult.metadata.tokensUsed || '未知'}
                    </>
                  ) : (
                    '点击左侧记录查看详情'
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analysisResult ? (
                  <div className="max-h-[600px] overflow-y-auto">
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: marked(analysisResult.result) }}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    <div className="text-center">
                      <History className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>请从左侧选择一条历史记录</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
