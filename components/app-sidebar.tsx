'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FileText, KanbanSquare, FolderKanban, Users, Target, AlertTriangle, Activity, Brain, Palette, PenTool, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const navigation = [
  { name: '概览', href: '/', icon: LayoutDashboard },
  { name: 'AI 助手', href: '/ai-assistant', icon: Brain },
  { name: '需求管理', href: '/requirements', icon: FileText },
  { name: '工作统计', href: '/work-statistics', icon: BarChart3 },
  { name: '原型图', href: '/prototypes', icon: Palette },
  { name: '原型画布', href: '/canvas', icon: PenTool },
  { name: '任务看板', href: '/tasks', icon: KanbanSquare },
  { name: '项目', href: '/projects', icon: FolderKanban },
  { name: '里程碑', href: '/milestones', icon: Target },
  { name: '风险管理', href: '/risks', icon: AlertTriangle },
  { name: '团队成员', href: '/team', icon: Users },
  { name: '活动日志', href: '/activity', icon: Activity },
]

interface AppSidebarProps {
  collapsed?: boolean
  onToggle?: () => void
}

export function AppSidebar({ collapsed = false, onToggle }: AppSidebarProps) {
  const pathname = usePathname()

  return (
    <div
      className={cn(
        "flex h-full flex-col border-r bg-background transition-all duration-300 ease-in-out relative",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* 折叠/展开按钮 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className="absolute -right-3 top-6 z-10 h-6 w-6 rounded-full border bg-background p-0 shadow-md hover:bg-muted"
        title={collapsed ? "展开侧边栏" : "收起侧边栏"}
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </Button>

      <div className="flex h-16 items-center border-b px-6">
        <h1 className={cn(
          "text-xl font-bold whitespace-nowrap transition-opacity duration-300",
          collapsed ? "opacity-0" : "opacity-100"
        )}>
          {collapsed ? "" : "产品管理系统"}
        </h1>
      </div>

      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                collapsed ? 'justify-center' : 'gap-3'
              )}
              title={collapsed ? item.name : undefined}
            >
              <item.icon className={cn("h-5 w-5 flex-shrink-0", collapsed && "mx-auto")} />
              <span className={cn(
                "transition-opacity duration-300 whitespace-nowrap",
                collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
              )}>
                {item.name}
              </span>
            </Link>
          )
        })}
      </nav>

      <div className="border-t p-4">
        <div className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2",
          collapsed && "justify-center"
        )}>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold flex-shrink-0">
            U
          </div>
          <div className={cn(
            "flex-1 transition-opacity duration-300",
            collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
          )}>
            <p className="text-sm font-medium whitespace-nowrap">用户名</p>
            <p className="text-xs text-muted-foreground whitespace-nowrap">user@example.com</p>
          </div>
        </div>
      </div>
    </div>
  )
}
