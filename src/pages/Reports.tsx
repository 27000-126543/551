import { useMemo, useState, useCallback, useEffect } from 'react'
import ReactECharts from 'echarts-for-react'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  Lightbulb,
  FileText,
  Download,
  GitCompare,
  FileClock,
} from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { weeklyReports } from '../data/mockData'
import type { WeeklyReport } from '../types'

function highlightNumbers(text: string): React.ReactNode {
  const regex = /([\d.]+(?:%|小时|分钟|件|次|天|个月|个))/g
  const parts = text.split(regex)
  return parts.map((part, idx) => {
    if (part.match(regex)) {
      return (
        <span key={idx} className="text-alert-orange font-bold">
          {part}
        </span>
      )
    }
    return part
  })
}

type ReportTabKey = 'single' | 'compare'

const reportTabColors = [
  { key: 'single' as const, label: '单小区报告', icon: FileText },
  { key: 'compare' as const, label: '多小区对比', icon: GitCompare },
]

export default function Reports() {
  const { communities, getFilteredCommunities, selectedCommunity, setSelectedCommunity, currentUser } = useAppStore()
  const filteredCommunities = getFilteredCommunities()

  const [reportTab, setReportTab] = useState<ReportTabKey>('single')
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>(
    selectedCommunity?.id ?? filteredCommunities[0]?.id ?? ''
  )
  const [selectedCompareIds, setSelectedCompareIds] = useState<string[]>([])

  useEffect(() => {
    const isSelectedInFiltered = filteredCommunities.some((c) => c.id === selectedCommunityId)
    if (!isSelectedInFiltered) {
      const newId = filteredCommunities[0]?.id ?? ''
      setSelectedCommunityId(newId)
      const found = communities.find((c) => c.id === newId) ?? null
      setSelectedCommunity(found)
    }
  }, [currentUser, filteredCommunities, selectedCommunityId, communities, setSelectedCommunity])

  const report: WeeklyReport | undefined = useMemo(() => {
    if (selectedCommunityId) {
      return weeklyReports.find((r) => r.communityId === selectedCommunityId)
    }
    return weeklyReports[0]
  }, [selectedCommunityId])

  const weekRange = report
    ? `${report.weekStart} ~ ${report.weekEnd}`
    : ''

  const handleExport = useCallback(() => {
    if (!report) return

    const totalComplaints = Object.values(report.complaintTypeDistribution).reduce((a, b) => a + b, 0)

    let content = ''
    content += '========================================\n'
    content += '           运营诊断周报\n'
    content += '========================================\n\n'
    content += `社区名称：${report.communityName}\n`
    content += `报告周期：${weekRange}\n\n`

    content += '----------------------------------------\n'
    content += '                关键指标\n'
    content += '----------------------------------------\n'
    content += `费用收缴率同比：${report.feeCollectionYoY >= 0 ? '+' : ''}${report.feeCollectionYoY.toFixed(1)}%\n`
    content += `费用收缴率环比：${report.feeCollectionMoM >= 0 ? '+' : ''}${report.feeCollectionMoM.toFixed(1)}%\n`
    content += `平均维修响应时长：${report.avgMaintenanceResponseHours.toFixed(1)} 小时\n\n`

    content += '----------------------------------------\n'
    content += '            投诉类型分布\n'
    content += '----------------------------------------\n'
    for (const [type, count] of Object.entries(report.complaintTypeDistribution)) {
      const percentage = totalComplaints > 0 ? ((count / totalComplaints) * 100).toFixed(1) : '0.0'
      content += `${type}：${count} 件 (${percentage}%)\n`
    }
    content += `合计：${totalComplaints} 件\n\n`

    content += '----------------------------------------\n'
    content += '              优化建议\n'
    content += '----------------------------------------\n'
    report.suggestions.forEach((suggestion, idx) => {
      content += `${idx + 1}. ${suggestion}\n`
    })
    content += '\n========================================\n'
    content += `报告生成时间：${new Date().toLocaleString('zh-CN')}\n`
    content += '========================================\n'

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `运营诊断报告_${report.communityName}_${report.weekStart}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [report, weekRange])

  const feeTrendOption = useMemo(() => {
    if (!report) return {}
    const months = [
      '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06',
    ]
    const barData = [78.5, 82.1, 85.3, 80.7, 83.9, 86.2]
    const lineData = barData.map((v) =>
      Math.round((v + report.feeCollectionYoY * 0.5 + (Math.random() - 0.5) * 4) * 10) / 10
    )
    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#0F2B46',
        borderColor: '#1B4272',
        textStyle: { color: '#E0E7EF', fontSize: 12 },
      },
      legend: {
        data: ['收缴率', '同比趋势'],
        textStyle: { color: '#8899AA', fontSize: 12 },
        top: 0,
        right: 0,
      },
      grid: { left: 50, right: 40, top: 40, bottom: 30 },
      xAxis: {
        type: 'category',
        data: months,
        axisLabel: { color: '#8899AA', fontSize: 11 },
        axisLine: { lineStyle: { color: '#1B4272' } },
        axisTick: { show: false },
      },
      yAxis: [
        {
          type: 'value',
          name: '收缴率(%)',
          nameTextStyle: { color: '#8899AA', fontSize: 11 },
          axisLabel: { color: '#8899AA', formatter: '{value}%' },
          splitLine: { lineStyle: { color: '#1B4272', type: 'dashed' } },
          axisLine: { show: false },
          axisTick: { show: false },
        },
        {
          type: 'value',
          name: '同比(%)',
          nameTextStyle: { color: '#8899AA', fontSize: 11 },
          axisLabel: { color: '#8899AA', formatter: '{value}%' },
          splitLine: { show: false },
          axisLine: { show: false },
          axisTick: { show: false },
        },
      ],
      series: [
        {
          name: '收缴率',
          type: 'bar',
          barWidth: 24,
          data: barData.map((v) => ({
            value: v,
            itemStyle: {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: '#00D4AA' },
                  { offset: 1, color: '#00D4AA44' },
                ],
              },
              borderRadius: [3, 3, 0, 0],
            },
          })),
        },
        {
          name: '同比趋势',
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { color: '#FAAD14', width: 2 },
          itemStyle: { color: '#FAAD14' },
          data: lineData,
        },
      ],
    }
  }, [report])

  const complaintPieOption = useMemo(() => {
    if (!report) return {}
    const entries = Object.entries(report.complaintTypeDistribution)
    const colors = ['#00D4AA', '#33DDBB', '#FAAD14', '#FF7A45', '#FF4D4F', '#66E6CC']
    return {
      tooltip: {
        trigger: 'item',
        backgroundColor: '#0F2B46',
        borderColor: '#1B4272',
        textStyle: { color: '#E0E7EF', fontSize: 12 },
        formatter: (params: { name: string; value: number; percent: number }) =>
          `${params.name}: ${params.value}件 (${params.percent}%)`,
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center',
        textStyle: { color: '#8899AA', fontSize: 12 },
        itemWidth: 12,
        itemHeight: 12,
        itemGap: 14,
      },
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: false,
          label: { show: false },
          emphasis: {
            label: { show: true, fontSize: 14, fontWeight: 'bold', color: '#E0E7EF' },
          },
          data: entries.map(([name, value], i) => ({
            name,
            value,
            itemStyle: { color: colors[i % colors.length] },
          })),
        },
      ],
    }
  }, [report])

  const maintenanceBarOption = useMemo(() => {
    if (!report) return {}
    const types = ['电梯', '门禁', '监控', '消防', '供水', '配电', '照明', '通风']
    const hours = types.map(() =>
      Math.round((report.avgMaintenanceResponseHours + (Math.random() - 0.5) * 10) * 10) / 10
    )
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: '#0F2B46',
        borderColor: '#1B4272',
        textStyle: { color: '#E0E7EF', fontSize: 12 },
      },
      grid: { left: 60, right: 30, top: 20, bottom: 35 },
      xAxis: {
        type: 'category',
        data: types,
        axisLabel: { color: '#8899AA', fontSize: 11 },
        axisLine: { lineStyle: { color: '#1B4272' } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        name: '小时',
        nameTextStyle: { color: '#8899AA', fontSize: 11 },
        axisLabel: { color: '#8899AA' },
        splitLine: { lineStyle: { color: '#1B4272', type: 'dashed' } },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: [
        {
          type: 'bar',
          barWidth: 20,
          data: hours.map((v) => ({
            value: v,
            itemStyle: {
              color: v > 24
                ? {
                    type: 'linear',
                    x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [
                      { offset: 0, color: '#FF4D4F' },
                      { offset: 1, color: '#FF4D4F44' },
                    ],
                  }
                : {
                    type: 'linear',
                    x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [
                      { offset: 0, color: '#00D4AA' },
                      { offset: 1, color: '#00D4AA44' },
                    ],
                  },
              borderRadius: [3, 3, 0, 0],
            },
          })),
          label: {
            show: true,
            position: 'top',
            color: '#8899AA',
            fontSize: 10,
            formatter: '{c}h',
          },
        },
      ],
    }
  }, [report])

  if (!report || filteredCommunities.length === 0) {
    return (
      <div className="min-h-screen bg-navy-900 p-6 flex items-center justify-center">
        <p className="text-gray-500">暂无报告数据</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-navy-900 p-6 space-y-6">
      {/* Report Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <FileText size={24} className="text-cyber-400" />
          <div>
            <h1 className="text-xl font-bold text-gray-100">运营诊断周报</h1>
            <p className="text-sm text-gray-500 mt-0.5">{weekRange}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedCommunityId}
            onChange={(e) => {
              setSelectedCommunityId(e.target.value)
              const found = communities.find((c) => c.id === e.target.value)
              if (found) setSelectedCommunity(found)
            }}
            className="bg-navy-800 border border-navy-600 rounded-lg px-4 py-2 text-sm text-gray-200 focus:border-cyber-500/50 focus:outline-none transition-colors min-w-[180px]"
          >
            {filteredCommunities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button onClick={handleExport} className="btn-secondary flex items-center gap-2 text-sm">
            <Download size={14} />
            导出报告
          </button>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-3 gap-5">
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <BarChart3 size={16} className="text-cyber-400" />
              <span>费用收缴率同比</span>
            </div>
            <div
              className={`flex items-center gap-1 text-xs font-medium ${
                report.feeCollectionYoY >= 0 ? 'text-cyber-400' : 'text-alert-red'
              }`}
            >
              {report.feeCollectionYoY >= 0 ? (
                <TrendingUp size={14} />
              ) : (
                <TrendingDown size={14} />
              )}
              {report.feeCollectionYoY >= 0 ? '+' : ''}
              {report.feeCollectionYoY.toFixed(1)}%
            </div>
          </div>
          <span
            className="metric-value"
            style={{ color: report.feeCollectionYoY >= 0 ? '#00D4AA' : '#FF4D4F' }}
          >
            {report.feeCollectionYoY >= 0 ? '+' : ''}
            {report.feeCollectionYoY.toFixed(1)}%
          </span>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <BarChart3 size={16} className="text-alert-orange" />
              <span>费用收缴率环比</span>
            </div>
            <div
              className={`flex items-center gap-1 text-xs font-medium ${
                report.feeCollectionMoM >= 0 ? 'text-cyber-400' : 'text-alert-red'
              }`}
            >
              {report.feeCollectionMoM >= 0 ? (
                <TrendingUp size={14} />
              ) : (
                <TrendingDown size={14} />
              )}
              {report.feeCollectionMoM >= 0 ? '+' : ''}
              {report.feeCollectionMoM.toFixed(1)}%
            </div>
          </div>
          <span
            className="metric-value"
            style={{ color: report.feeCollectionMoM >= 0 ? '#00D4AA' : '#FF4D4F' }}
          >
            {report.feeCollectionMoM >= 0 ? '+' : ''}
            {report.feeCollectionMoM.toFixed(1)}%
          </span>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Clock size={16} className="text-alert-orange" />
              <span>平均维修响应时长</span>
            </div>
            <div
              className={`flex items-center gap-1 text-xs font-medium ${
                report.avgMaintenanceResponseHours <= 24 ? 'text-cyber-400' : 'text-alert-red'
              }`}
            >
              {report.avgMaintenanceResponseHours <= 24 ? (
                <TrendingDown size={14} />
              ) : (
                <TrendingUp size={14} />
              )}
              {report.avgMaintenanceResponseHours <= 24 ? '达标' : '超标'}
            </div>
          </div>
          <span
            className="metric-value"
            style={{
              color: report.avgMaintenanceResponseHours <= 24 ? '#00D4AA' : '#FF4D4F',
            }}
          >
            {report.avgMaintenanceResponseHours.toFixed(1)}
          </span>
          <span className="text-gray-500 text-sm ml-1">小时</span>
        </div>
      </div>

      {/* Charts Row 1: Fee Trend + Complaint Distribution */}
      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-7 card">
          <h3 className="text-gray-200 font-medium text-sm flex items-center gap-2 mb-2">
            <BarChart3 size={16} className="text-cyber-400" />
            费用收缴趋势
          </h3>
          <ReactECharts
            option={feeTrendOption}
            style={{ height: '300px' }}
            opts={{ renderer: 'canvas' }}
          />
        </div>

        <div className="col-span-5 card">
          <h3 className="text-gray-200 font-medium text-sm flex items-center gap-2 mb-2">
            <BarChart3 size={16} className="text-alert-orange" />
            投诉类型分布
          </h3>
          <ReactECharts
            option={complaintPieOption}
            style={{ height: '300px' }}
            opts={{ renderer: 'canvas' }}
          />
        </div>
      </div>

      {/* Charts Row 2: Maintenance Response Time */}
      <div className="card">
        <h3 className="text-gray-200 font-medium text-sm flex items-center gap-2 mb-2">
          <Clock size={16} className="text-cyber-400" />
          维修响应时长（按设备类型）
        </h3>
        <ReactECharts
          option={maintenanceBarOption}
          style={{ height: '280px' }}
          opts={{ renderer: 'canvas' }}
        />
      </div>

      {/* Optimization Suggestions */}
      <div className="card">
        <h3 className="text-gray-200 font-medium text-sm flex items-center gap-2 mb-4">
          <Lightbulb size={16} className="text-alert-orange" />
          优化建议
        </h3>
        <div className="space-y-3">
          {report.suggestions.map((suggestion, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 rounded-lg px-4 py-3 bg-navy-900/50 border border-navy-600/50"
            >
              <div className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-alert-orange/15 flex items-center justify-center">
                <Lightbulb size={12} className="text-alert-orange" />
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">
                {highlightNumbers(suggestion)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
