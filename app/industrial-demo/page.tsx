'use client'

import React, { useState } from 'react'
import ForceDisplacementChart, { DataPoint, EnvelopeCurve } from '@/components/industrial/force-displacement-chart'
import ParameterDisplay from '@/components/industrial/parameter-display'
import StatusIndicator from '@/components/industrial/status-indicator'
import IndustrialButton from '@/components/industrial/industrial-button'
import IndustrialPanel from '@/components/industrial/industrial-panel'

// 模拟压机数据生成
function generatePressData(phase: 'idle' | 'pressing' | 'holding' | 'releasing'): DataPoint[] {
  const points: DataPoint[] = []

  switch (phase) {
    case 'idle':
      for (let i = 0; i <= 10; i++) {
        points.push({ displacement: i, force: 0 })
      }
      break
    case 'pressing':
      for (let i = 0; i <= 50; i++) {
        const displacement = i
        const force = Math.pow(i / 50, 2) * 100 + Math.random() * 2
        points.push({ displacement, force })
      }
      break
    case 'holding':
      for (let i = 0; i <= 20; i++) {
        const displacement = 50 + i * 0.5
        const force = 100 + Math.random() * 3
        points.push({ displacement, force })
      }
      break
    case 'releasing':
      for (let i = 0; i <= 30; i++) {
        const displacement = 60 - i * 2
        const force = Math.max(0, 100 - i * 3.5) + Math.random() * 2
        points.push({ displacement, force })
      }
      break
  }

  return points
}

// 包络线数据
const envelope: EnvelopeCurve = {
  upper: [
    { displacement: 0, force: 5 },
    { displacement: 20, force: 45 },
    { displacement: 40, force: 95 },
    { displacement: 50, force: 110 },
    { displacement: 60, force: 110 },
  ],
  lower: [
    { displacement: 0, force: -5 },
    { displacement: 20, force: 35 },
    { displacement: 40, force: 85 },
    { displacement: 50, force: 90 },
    { displacement: 60, force: 90 },
  ],
}

export default function DemoPage() {
  const [data, setData] = useState<DataPoint[]>(generatePressData('idle'))
  const [currentForce, setCurrentForce] = useState(0)
  const [currentDisplacement, setCurrentDisplacement] = useState(0)
  const [status, setStatus] = useState<'running' | 'stopped' | 'error'>('stopped')
  const [isSimulating, setIsSimulating] = useState(false)

  // 模拟压机运行
  const runSimulation = () => {
    setIsSimulating(true)
    setStatus('running')

    // 阶段1：压下
    setTimeout(() => {
      const pressingData = generatePressData('pressing')
      setData(pressingData)
      setCurrentForce(100)
      setCurrentDisplacement(50)
    }, 100)

    // 阶段2：保持
    setTimeout(() => {
      const holdingData = [...generatePressData('pressing'), ...generatePressData('holding')]
      setData(holdingData)
    }, 2000)

    // 阶段3：释放
    setTimeout(() => {
      const allData = [
        ...generatePressData('pressing'),
        ...generatePressData('holding'),
        ...generatePressData('releasing'),
      ]
      setData(allData)
      setCurrentForce(0)
      setCurrentDisplacement(0)
      setStatus('stopped')
      setIsSimulating(false)
    }, 4000)
  }

  return (
    <div className="min-h-screen bg-black text-green-500 p-8">
      <div className="max-w-7xl mx-auto">
        {/* 标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-mono font-bold uppercase tracking-wider mb-2">
            工业伺服压机上位机 Demo
          </h1>
          <p className="text-green-500/70 font-mono">
            Industrial Servo Press HMI Demonstration
          </p>
        </div>

        {/* 主要监控区域 */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          {/* 实时参数 */}
          <ParameterDisplay
            label="当前压力"
            value={currentForce.toFixed(2)}
            unit="kN"
            variant="highlight"
            size="lg"
          />
          <ParameterDisplay
            label="当前位移"
            value={currentDisplacement.toFixed(2)}
            unit="mm"
            variant="normal"
            size="lg"
          />
          <ParameterDisplay
            label="循环次数"
            value="1,234"
            unit="次"
            variant="normal"
            size="lg"
          />
        </div>

        {/* 曲线图和控制面板 */}
        <div className="grid grid-cols-[1fr_400px] gap-6">
          {/* 力-位移曲线 */}
          <IndustrialPanel title="力-位移曲线监控">
            <ForceDisplacementChart
              data={data}
              envelope={envelope}
              height={500}
              realtime={isSimulating}
              showGrid={true}
            />
          </IndustrialPanel>

          {/* 控制面板 */}
          <div className="space-y-6">
            <IndustrialPanel title="系统状态">
              <div className="space-y-4">
                <StatusIndicator status={status} size="lg" />
                <div className="pt-4 border-t border-green-500/30">
                  <div className="flex justify-between text-xs font-mono mb-2">
                    <span className="text-green-500/70">温度</span>
                    <span className="text-green-500">45°C</span>
                  </div>
                  <div className="flex justify-between text-xs font-mono mb-2">
                    <span className="text-green-500/70">油压</span>
                    <span className="text-green-500">2.5 MPa</span>
                  </div>
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-green-500/70">运行时间</span>
                    <span className="text-green-500">12:34:56</span>
                  </div>
                </div>
              </div>
            </IndustrialPanel>

            <IndustrialPanel title="控制操作">
              <div className="space-y-3">
                <IndustrialButton
                  variant="success"
                  size="lg"
                  className="w-full"
                  onClick={runSimulation}
                  disabled={isSimulating}
                >
                  {isSimulating ? '运行中...' : '启动压制'}
                </IndustrialButton>
                <IndustrialButton variant="danger" size="lg" className="w-full">
                  紧急停止
                </IndustrialButton>
                <IndustrialButton variant="secondary" size="md" className="w-full">
                  复位
                </IndustrialButton>
              </div>
            </IndustrialPanel>

            <IndustrialPanel title="工艺参数">
              <div className="space-y-3 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-green-500/70">目标压力</span>
                  <span className="text-green-500">100.0 kN</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-500/70">目标位移</span>
                  <span className="text-green-500">50.0 mm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-500/70">保压时间</span>
                  <span className="text-green-500">2.0 s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-500/70">压制速度</span>
                  <span className="text-green-500">10 mm/s</span>
                </div>
              </div>
            </IndustrialPanel>
          </div>
        </div>

        {/* 说明 */}
        <div className="mt-8 bg-zinc-900 border border-green-500/30 p-6">
          <h3 className="text-green-500 font-mono font-bold text-sm uppercase mb-3">
            演示说明
          </h3>
          <div className="text-green-500/70 font-mono text-xs space-y-2">
            <p>• 点击&ldquo;启动压制&rdquo;按钮查看模拟的压机工作过程</p>
            <p>• 曲线显示力-位移关系，橙色虚线为包络线（上下限）</p>
            <p>• 实时参数显示当前压力和位移值</p>
            <p>• 这是一个完全可定制的工业上位机界面示例</p>
          </div>
        </div>
      </div>
    </div>
  )
}
