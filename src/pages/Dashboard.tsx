import { useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { useNavigate } from 'react-router-dom'
import {
  TrendingUp,
  TrendingDown,
  Shield,
  CreditCard,
  MessageSquare,
  Heart,
  AlertTriangle,
  MapPin,
  ArrowUpDown,
  ChevronRight,
} from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { PROVINCES, REGIONS, type Community } from '../types'

function getScoreColor(score: number): string {
  if (score >= 90) return '#00D4AA'
  if (score >= 80) return '#33DDBB'
  if (score >= 70) return '#FAAD14'
  if (score >= 60) return '#FF7A45'
  return '#FF4D4F'
}

function getTrend(current: number, baseline: number): { up: boolean; pct: string } {
  const diff = current - baseline
  return {
    up: diff >= 0,
    pct: `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`,
  }
}

type SortType = 'failureRateDesc' | 'collectionRateAsc' | 'satisfactionDesc'

export default function Dashboard() {
  const navigate = useNavigate()
  const [sortType, setSortType] = useState<SortType>('failureRateDesc')

  const {
    selectedProvince,
    setSelectedProvince,
    currentUser,
    getFilteredCommunities,
    getFilteredAlerts,
    getProvinceStats,
  } = useAppStore()

  const communities = getFilteredCommunities()
  const alerts = getFilteredAlerts()
  const provinceStats = getProvinceStats()

  const metrics = useMemo(() => {
    if (communities.length === 0) {
      return {
        equipmentIntactRate: 0,
        feeCollectionRate: 0,
        complaintResponseRate: 0,
        satisfactionScore: 0,
      }
    }
    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length
    return {
      equipmentIntactRate: Math.round(avg(communities.map((c) => c.equipmentIntactRate)) * 100) / 100,
      feeCollectionRate: Math.round(avg(communities.map((c) => c.feeCollectionRate)) * 100) / 100,
      complaintResponseRate: Math.round(avg(communities.map((c) => c.complaintResponseRate)) * 100) / 100,
      satisfactionScore: Math.round(avg(communities.map((c) => c.satisfactionScore)) * 100) / 100,
    }
  }, [communities])

  const alertSummary = useMemo(() => {
    const byLevel = { 1: 0, 2: 0, 3: 0 }
    const byStatus: Record<string, number> = {}
    for (const a of alerts) {
      byLevel[a.level]++
      byStatus[a.status] = (byStatus[a.status] || 0) + 1
    }
    return { byLevel, byStatus, total: alerts.length }
  }, [alerts])

  const heatmapData = useMemo(() => {
    const statsMap = new Map(provinceStats.map((s) => [s.province, s]))
    return Object.entries(REGIONS).map(([region, provs]) => ({
      region,
      provinces: provs.map((p) => {
        const stat = statsMap.get(p)
        return { name: p, score: stat?.avgSatisfaction ?? 0, count: stat?.communityCount ?? 0 }
      }),
    }))
  }, [provinceStats])

  const failureRankSorted = useMemo(() => {
    return [...communities]
      .sort((a, b) => b.equipmentFailureRate - a.equipmentFailureRate)
      .slice(0, 15)
  }, [communities])

  const failureRankOption = useMemo(() => {
    const sorted = failureRankSorted
    return {
      tooltip: {
        trigger: 'axis' as const,
        axisPointer: { type: 'shadow' as const },
        backgroundColor: '#0F2B46',
        borderColor: '#1B4272',
        textStyle: { color: '#E0E7EF', fontSize: 12 },
      },
      grid: { left: 160, right: 40, top: 10, bottom: 20 },
      xAxis: {
        type: 'value' as const,
        axisLabel: { color: '#8899AA', formatter: '{value}%' },
        splitLine: { lineStyle: { color: '#1B4272', type: 'dashed' as const } },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'category' as const,
        data: sorted.map((c) => c.name),
        axisLabel: { color: '#8899AA', fontSize: 11, width: 140, overflow: 'truncate' as const },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: [
        {
          type: 'bar' as const,
          data: sorted.map((c) => ({
            value: c.equipmentFailureRate,
            itemStyle: {
              color: {
                type: 'linear' as const,
                x: 0, y: 0, x2: 1, y2: 0,
                colorStops: [
                  { offset: 0, color: '#FF4D4F' },
                  { offset: 1, color: '#FAAD14' },
                ],
              },
              borderRadius: [0, 3, 3, 0],
            },
          })),
          barWidth: 14,
          label: {
            show: true,
            position: 'right' as const,
            color: '#FF7A45',
            fontSize: 11,
            formatter: '{c}%',
          },
        },
      ],
    }
  }, [failureRankSorted])

  const onChartEvents = useMemo(() => ({
    click: (params: { name: string }) => {
      const community = failureRankSorted.find((c) => c.name === params.name)
      if (community) {
        navigate(`/community/${community.id}`)
      }
    },
  }), [failureRankSorted, navigate])

  const sortedCommunities = useMemo(() => {
    const sorted = [...communities]
    switch (sortType) {
      case 'failureRateDesc':
        return sorted.sort((a, b) => b.equipmentFailureRate - a.equipmentFailureRate)
      case 'collectionRateAsc':
        return sorted.sort((a, b) => a.feeCollectionRate - b.feeCollectionRate)
      case 'satisfactionDesc':
        return sorted.sort((a, b) => b.satisfactionScore - a.satisfactionScore)
      default:
        return sorted
    }
  }, [communities, sortType])

  const handleRowClick = (community: Community) => {
    navigate(`/community/${community.id}`)
  }

  const sortOptions: { value: SortType; label: string }[] = [
    { value: 'failureRateDesc', label: '按设备故障率降序' },
    { value: 'collectionRateAsc', label: '按收缴率升序' },
    { value: 'satisfactionDesc', label: '按满意度降序' },
  ]

  const statusLabels: Record<string, string> = {
    pending: '待确认',
    confirmed: '已确认',
    reviewed: '已复核',
    approved: '已审批',
    resolved: '已解决',
  }

  const statusColors: Record<string, string> = {
    pending: '#FF4D4F',
    confirmed: '#FF7A45',
    reviewed: '#FAAD14',
    approved: '#33DDBB',
    resolved: '#00D4AA',
  }

  return (
    <div className="min-h-screen bg-navy-900 p-6 space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-cyber-400">
            <MapPin size={20} />
            <span className="text-sm font-medium text-gray-400">管辖范围</span>
          </div>
          <select
            value={selectedProvince}
            onChange={(e) => setSelectedProvince(e.target.value as typeof selectedProvince)}
            className="bg-navy-800 border border-navy-600 rounded-lg px-4 py-2 text-sm text-gray-200 focus:border-cyber-500/50 focus:outline-none transition-colors min-w-[120px]"
          >
            <option value="全国">全国</option>
            {PROVINCES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <span className="text-xs text-gray-500">
            共 {communities.length} 个社区
          </span>
        </div>

        <div className="flex items-center gap-5">
          <div className="relative">
            <AlertTriangle size={20} className="text-alert-red" />
            {alertSummary.total > 0 && (
              <span className="absolute -top-2 -right-2 bg-alert-red text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {alertSummary.total > 99 ? '99+' : alertSummary.total}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-cyber-500/20 flex items-center justify-center text-cyber-400 text-sm font-bold">
              {currentUser?.name?.charAt(0) ?? 'U'}
            </div>
            <div className="text-sm">
              <div className="text-gray-200 font-medium">{currentUser?.name ?? '未知'}</div>
              <div className="text-gray-500 text-xs">
                {{ group_admin: '集团管理员', regional_director: '区域总监', project_manager: '项目经理', owner_committee: '业委会' }[currentUser?.role ?? 'group_admin']}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-4 gap-5">
        {[
          {
            label: '设备完好率',
            value: metrics.equipmentIntactRate,
            unit: '%',
            icon: Shield,
            color: '#00D4AA',
            baseline: 95,
          },
          {
            label: '费用收缴率',
            value: metrics.feeCollectionRate,
            unit: '%',
            icon: CreditCard,
            color: '#33DDBB',
            baseline: 85,
          },
          {
            label: '投诉响应率',
            value: metrics.complaintResponseRate,
            unit: '%',
            icon: MessageSquare,
            color: '#FAAD14',
            baseline: 80,
          },
          {
            label: '业主满意度',
            value: metrics.satisfactionScore,
            unit: '分',
            icon: Heart,
            color: '#FF7A45',
            baseline: 80,
          },
        ].map((m) => {
          const trend = getTrend(m.value, m.baseline)
          const IconComp = m.icon
          return (
            <div key={m.label} className="card group hover:border-cyber-500/20 transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <IconComp size={16} style={{ color: m.color }} />
                  <span>{m.label}</span>
                </div>
                <div
                  className={`flex items-center gap-1 text-xs font-medium ${
                    trend.up ? 'text-cyber-400' : 'text-alert-red'
                  }`}
                >
                  {trend.up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {trend.pct}
                </div>
              </div>
              <div className="flex items-end gap-1">
                <span className="metric-value" style={{ color: m.color }}>
                  {m.value.toFixed(1)}
                </span>
                <span className="text-gray-500 text-sm mb-1">{m.unit}</span>
              </div>
              <div className="mt-3 h-1 rounded-full bg-navy-700 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(m.value, 100)}%`,
                    background: `linear-gradient(90deg, ${m.color}66, ${m.color})`,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Main Content: Heatmap + Failure Ranking */}
      <div className="grid grid-cols-12 gap-5">
        {/* Satisfaction Heatmap */}
        <div className="col-span-7 card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-200 font-medium text-sm flex items-center gap-2">
              <MapPin size={16} className="text-cyber-400" />
              各省份业主满意度分布
            </h3>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm" style={{ background: '#FF4D4F' }} />
                {'<60'}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm" style={{ background: '#FAAD14' }} />
                60-70
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm" style={{ background: '#33DDBB' }} />
                70-85
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm" style={{ background: '#00D4AA' }} />
                {'>85'}
              </span>
            </div>
          </div>
          <div className="space-y-3">
            {heatmapData.map((region) => (
              <div key={region.region}>
                <div className="text-xs text-gray-500 mb-1.5 font-medium">{region.region}</div>
                <div className="flex flex-wrap gap-1.5">
                  {region.provinces.map((prov) => (
                    <div
                      key={prov.name}
                      className="relative rounded px-2 py-1.5 text-center min-w-[64px] transition-all duration-200 hover:scale-105 cursor-default group/prov"
                      style={{
                        background: `${getScoreColor(prov.score)}18`,
                        border: `1px solid ${getScoreColor(prov.score)}33`,
                      }}
                    >
                      <div className="text-xs text-gray-300">{prov.name}</div>
                      <div className="text-xs font-bold font-mono" style={{ color: getScoreColor(prov.score) }}>
                        {prov.score > 0 ? prov.score.toFixed(1) : '-'}
                      </div>
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-navy-800 border border-navy-600 rounded px-2 py-1 text-xs text-gray-300 opacity-0 group-hover/prov:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                        {prov.name} · {prov.count}个社区 · {prov.score > 0 ? `${prov.score.toFixed(1)}分` : '暂无数据'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Equipment Failure Ranking */}
        <div className="col-span-5 card">
          <h3 className="text-gray-200 font-medium text-sm flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-alert-red" />
            设备故障率 TOP 15 社区
          </h3>
          <ReactECharts
            option={failureRankOption}
            style={{ height: '520px' }}
            opts={{ renderer: 'canvas' }}
            onEvents={onChartEvents}
          />
        </div>
      </div>

      {/* Alert Summary Panel */}
      <div className="card">
        <h3 className="text-gray-200 font-medium text-sm flex items-center gap-2 mb-4">
          <AlertTriangle size={16} className="text-alert-orange" />
          预警汇总
        </h3>
        <div className="grid grid-cols-12 gap-6">
          {/* By Level */}
          <div className="col-span-4">
            <div className="text-xs text-gray-500 mb-3">按级别分布</div>
            <div className="flex gap-4">
              {([1, 2, 3] as const).map((level) => {
                const count = alertSummary.byLevel[level]
                const colors = { 1: '#FF4D4F', 2: '#FAAD14', 3: '#FAAD14' }
                const labels = { 1: '一级', 2: '二级', 3: '三级' }
                return (
                  <div key={level} className="flex-1 text-center">
                    <div
                      className="rounded-lg p-3 mb-2"
                      style={{
                        background: `${colors[level]}12`,
                        border: `1px solid ${colors[level]}30`,
                      }}
                    >
                      <div className="text-2xl font-bold font-mono" style={{ color: colors[level] }}>
                        {count}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">{labels[level]}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* By Status */}
          <div className="col-span-8">
            <div className="text-xs text-gray-500 mb-3">按状态分布</div>
            <div className="flex flex-wrap gap-3">
              {Object.entries(alertSummary.byStatus).map(([status, count]) => (
                <div
                  key={status}
                  className="flex items-center gap-2 rounded-lg px-4 py-2.5"
                  style={{
                    background: `${statusColors[status] ?? '#666'}12`,
                    border: `1px solid ${statusColors[status] ?? '#666'}30`,
                  }}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: statusColors[status] ?? '#666' }}
                  />
                  <span className="text-xs text-gray-300">{statusLabels[status] ?? status}</span>
                  <span className="text-sm font-bold font-mono" style={{ color: statusColors[status] ?? '#666' }}>
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Community List Panel */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-200 font-medium text-sm flex items-center gap-2">
            <MapPin size={16} className="text-cyber-400" />
            社区列表
          </h3>
          <div className="flex items-center gap-2">
            <ArrowUpDown size={14} className="text-gray-500" />
            {sortOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSortType(option.value)}
                className={`px-3 py-1.5 text-xs rounded-lg transition-all duration-200 ${
                  sortType === option.value
                    ? 'bg-cyber-500/20 text-cyber-400 border border-cyber-500/30'
                    : 'bg-navy-800 text-gray-400 border border-navy-600 hover:border-cyber-500/30 hover:text-gray-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-navy-700">
                <th className="pb-3 font-medium">社区名称</th>
                <th className="pb-3 font-medium">省份</th>
                <th className="pb-3 font-medium text-right">设备完好率</th>
                <th className="pb-3 font-medium text-right">物业费收缴率</th>
                <th className="pb-3 font-medium text-right">投诉响应率</th>
                <th className="pb-3 font-medium text-right">业主满意度</th>
                <th className="pb-3 font-medium text-right">设备故障率</th>
                <th className="pb-3 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {sortedCommunities.map((community) => (
                <tr
                  key={community.id}
                  onClick={() => handleRowClick(community)}
                  className="border-b border-navy-800 hover:bg-cyber-500/5 transition-colors cursor-pointer group/row"
                >
                  <td className="py-3">
                    <span className="text-sm text-gray-200 group-hover/row:text-cyber-400 transition-colors">
                      {community.name}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className="text-sm text-gray-400">{community.province}</span>
                  </td>
                  <td className="py-3 text-right">
                    <span
                      className="text-sm font-mono font-medium"
                      style={{ color: getScoreColor(community.equipmentIntactRate) }}
                    >
                      {community.equipmentIntactRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <span
                      className="text-sm font-mono font-medium"
                      style={{ color: getScoreColor(community.feeCollectionRate) }}
                    >
                      {community.feeCollectionRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <span
                      className="text-sm font-mono font-medium"
                      style={{ color: getScoreColor(community.complaintResponseRate) }}
                    >
                      {community.complaintResponseRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <span
                      className="text-sm font-mono font-medium"
                      style={{ color: getScoreColor(community.satisfactionScore) }}
                    >
                      {community.satisfactionScore.toFixed(1)}分
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <span
                      className="text-sm font-mono font-medium"
                      style={{ color: getScoreColor(100 - community.equipmentFailureRate) }}
                    >
                      {community.equipmentFailureRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRowClick(community)
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-md bg-navy-700 text-gray-400 hover:bg-cyber-500/20 hover:text-cyber-400 transition-colors opacity-0 group-hover/row:opacity-100"
                    >
                      查看详情
                      <ChevronRight size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sortedCommunities.length === 0 && (
          <div className="text-center py-12 text-gray-500 text-sm">
            暂无社区数据
          </div>
        )}
      </div>
    </div>
  )
}
