'use client'

import React, { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'

export interface DataPoint {
  displacement: number // 位移 (mm)
  force: number // 力 (kN)
}

export interface EnvelopeCurve {
  upper: DataPoint[]
  lower: DataPoint[]
}

interface ForceDisplacementChartProps {
  data: DataPoint[]
  envelope?: EnvelopeCurve
  width?: string | number
  height?: string | number
  title?: string
  showGrid?: boolean
  realtime?: boolean
  className?: string
}

export default function ForceDisplacementChart({
  data,
  envelope,
  width = '100%',
  height = 400,
  title = '力-位移曲线',
  showGrid = true,
  realtime = false,
  className = '',
}: ForceDisplacementChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!chartRef.current) return

    // 初始化图表
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current, 'dark')
    }

    const option: EChartsOption = {
      title: {
        text: title,
        left: 'center',
        textStyle: {
          color: '#00ff00',
          fontSize: 16,
          fontWeight: 'bold',
        },
      },
      backgroundColor: '#0a0a0a',
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: '#6a7985',
          },
        },
        formatter: (params: any) => {
          if (!Array.isArray(params)) return ''
          const param = params[0]
          return `位移: ${param.data[0].toFixed(2)} mm<br/>力: ${param.data[1].toFixed(2)} kN`
        },
      },
      grid: {
        left: '10%',
        right: '10%',
        bottom: '15%',
        top: '15%',
        containLabel: true,
        show: showGrid,
        borderColor: '#1f1f1f',
      },
      xAxis: {
        type: 'value',
        name: '位移 (mm)',
        nameLocation: 'center',
        nameGap: 30,
        nameTextStyle: {
          color: '#00ff00',
          fontSize: 14,
        },
        axisLine: {
          lineStyle: {
            color: '#00ff00',
            width: 2,
          },
        },
        axisLabel: {
          color: '#00ff00',
          fontSize: 12,
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: '#1f1f1f',
            type: 'dashed',
          },
        },
      },
      yAxis: {
        type: 'value',
        name: '力 (kN)',
        nameLocation: 'center',
        nameGap: 50,
        nameTextStyle: {
          color: '#00ff00',
          fontSize: 14,
        },
        axisLine: {
          lineStyle: {
            color: '#00ff00',
            width: 2,
          },
        },
        axisLabel: {
          color: '#00ff00',
          fontSize: 12,
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: '#1f1f1f',
            type: 'dashed',
          },
        },
      },
      series: [
        // 主曲线
        {
          name: '实际曲线',
          type: 'line',
          data: data.map((point) => [point.displacement, point.force]),
          smooth: true,
          lineStyle: {
            color: '#00ff00',
            width: 2,
          },
          itemStyle: {
            color: '#00ff00',
          },
          symbol: 'circle',
          symbolSize: realtime ? 0 : 4,
          animation: realtime,
          animationDuration: realtime ? 100 : 1000,
        },
        // 上包络线
        ...(envelope
          ? [
              {
                name: '上限',
                type: 'line',
                data: envelope.upper.map((point) => [point.displacement, point.force]),
                lineStyle: {
                  color: '#ff6b00',
                  width: 1,
                  type: 'dashed',
                },
                itemStyle: {
                  color: '#ff6b00',
                },
                symbol: 'none',
              },
              // 下包络线
              {
                name: '下限',
                type: 'line',
                data: envelope.lower.map((point) => [point.displacement, point.force]),
                lineStyle: {
                  color: '#ff6b00',
                  width: 1,
                  type: 'dashed',
                },
                itemStyle: {
                  color: '#ff6b00',
                },
                symbol: 'none',
              },
            ]
          : []),
      ],
      legend: {
        show: !!envelope,
        data: envelope ? ['实际曲线', '上限', '下限'] : ['实际曲线'],
        top: '5%',
        textStyle: {
          color: '#00ff00',
        },
      },
    }

    chartInstance.current.setOption(option)

    // 响应式调整
    const handleResize = () => {
      chartInstance.current?.resize()
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [data, envelope, title, showGrid, realtime])

  useEffect(() => {
    return () => {
      chartInstance.current?.dispose()
    }
  }, [])

  return (
    <div
      ref={chartRef}
      className={className}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
    />
  )
}
