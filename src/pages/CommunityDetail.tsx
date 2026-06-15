import { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import * as echarts from 'echarts'
import ReactECharts from 'echarts-for-react'
import { ArrowLeft, Building2, Wrench, CreditCard, ShieldCheck } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { generateBuildings, generateComplaints, generateEquipment } from '../data/mockData'

function getLast7Days(): string[] {
  const days: string[] = []
  const now = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().slice(0, 10))
  }
  return days
}

const radarDimensions = ['安保', '保洁', '维修', '响应速度', '绿化', '公共设施']

function generateSatisfactionScores(): number[] {
  return radarDimensions.map(() => Math.round(Math.random() * 30 + 70))
}

const chartColors = [
  '#00D4AA', '#FAAD14', '#FF4D4F', '#36CFC9', '#F759AB',
  '#9254DE', '#597EF7', '#73D13D', '#FF7A45', '#B37FEB',
  '#5CDBD3', '#FFC53D', '#FF85C0', '#85A5FF', '#95DE64',
  '#40A9FF', '#FF9C6E', '#D3ADF7', '#87E8DE', '#FFD666',
  '#69C0FF', '#FFBB96', '#B37FEB', '#5CDBD3', '#95DE64',
  '#36CFC9', '#F759AB', '#9254DE', '#597EF7', '#73D13D',
]

export default function CommunityDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const communities = useAppStore((s) => s.communities)

  const community = useMemo(
    () => communities.find((c) => c.id === id),
    [communities, id]
  )

  const buildings = useMemo(
    () => (community ? generateBuildings(community.id, community.buildings) : []),
    [community]
  )

  const complaints = useMemo(
    () => (community ? generateComplaints(community.id, buildings) : []),
    [community, buildings]
  )

  const equipmentRecords = useMemo(
    () => (community ? generateEquipment(community.id, buildings) : []),
    [community, buildings]
  )

  const satisfactionScores = useMemo(() => generateSatisfactionScores(), [])

  const last7Days = useMemo(() => getLast7Days(), [])

  const complaintTrendOption = useMemo(() => {
    if (!buildings.length) return {}

    const buildingNames = buildings.map((b) => b.name)
    const seriesData = buildings.map((b) => {
      const counts = last7Days.map((day) =>
        complaints.filter((c) => c.buildingId === b.id && c.createdAt === day).length
      )
      return counts
    })

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15,43,70,0.95)',
        borderColor: '#1B4272',
        textStyle: { color: '#E0E7EF', fontSize: 12 },
      },
      legend: {
        data: buildingNames,
        textStyle: { color: '#9CA3AF', fontSize: 10 },
        type: 'scroll',
        bottom: 0,
        pageTextStyle: { color: '#9CA3AF' },
        pageIconColor: '#00D4AA',
        pageIconInactiveColor: '#1B4272',
      },
      grid: { top: 20, right: 20, bottom: 40, left: 45 },
      xAxis: {
        type: 'category',
        data: last7Days.map((d) => d.slice(5)),
        axisLine: { lineStyle: { color: '#1B4272' } },
        axisLabel: { color: '#9CA3AF', fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisLabel: { color: '#9CA3AF', fontSize: 11 },
        splitLine: { lineStyle: { color: '#1B4272', type: 'dashed' } },
      },
      series: buildingNames.map((name, i) => ({
        name,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 2, color: chartColors[i % chartColors.length] },
        itemStyle: { color: chartColors[i % chartColors.length] },
        data: seriesData[i],
      })),
    }
  }, [buildings, complaints, last7Days])

  const feeBarOption = useMemo(() => {
    if (!community) return {}

    const months = community.feeHistory.map((f) => f.month)
    const rates = community.feeHistory.map((f) => f.collectionRate)

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15,43,70,0.95)',
        borderColor: '#1B4272',
        textStyle: { color: '#E0E7EF', fontSize: 12 },
        formatter: (params: any) => {
          const p = params[0]
          return `${p.name}<br/>收缴率: <b>${p.value}%</b>`
        },
      },
      grid: { top: 30, right: 20, bottom: 30, left: 45 },
      xAxis: {
        type: 'category',
        data: months.map((m) => m.slice(5)),
        axisLine: { lineStyle: { color: '#1B4272' } },
        axisLabel: { color: '#9CA3AF', fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        max: 100,
        axisLine: { show: false },
        axisLabel: { color: '#9CA3AF', fontSize: 11, formatter: '{value}%' },
        splitLine: { lineStyle: { color: '#1B4272', type: 'dashed' } },
      },
      series: [
        {
          type: 'bar',
          data: rates.map((r) => ({
            value: r,
            itemStyle: {
              color: r < 70
                ? new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: '#FF4D4F' },
                    { offset: 1, color: '#CF1322' },
                  ])
                : new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: '#00D4AA' },
                    { offset: 1, color: '#00896B' },
                  ]),
              borderRadius: [3, 3, 0, 0],
            },
          })),
          barWidth: '50%',
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: { color: '#FAAD14', type: 'dashed', width: 2 },
            label: {
              formatter: '预警线 70%',
              color: '#FAAD14',
              fontSize: 11,
            },
            data: [{ yAxis: 70 }],
          },
        },
      ],
    }
  }, [community])

  const radarOption = useMemo(() => {
    return {
      backgroundColor: 'transparent',
      tooltip: {
        backgroundColor: 'rgba(15,43,70,0.95)',
        borderColor: '#1B4272',
        textStyle: { color: '#E0E7EF', fontSize: 12 },
      },
      radar: {
        indicator: radarDimensions.map((dim) => ({ name: dim, max: 100 })),
        shape: 'polygon',
        splitNumber: 4,
        axisName: { color: '#9CA3AF', fontSize: 12 },
        splitLine: { lineStyle: { color: '#1B4272' } },
        splitArea: { areaStyle: { color: ['rgba(27,66,114,0.1)', 'rgba(27,66,114,0.2)'] } },
        axisLine: { lineStyle: { color: '#1B4272' } },
      },
      series: [
        {
          type: 'radar',
          data: [
            {
              value: satisfactionScores,
              name: '满意度评分',
              areaStyle: { color: 'rgba(0,212,170,0.15)' },
              lineStyle: { color: '#00D4AA', width: 2 },
              itemStyle: { color: '#00D4AA' },
            },
          ],
        },
      ],
    }
  }, [satisfactionScores])

  const faultEquipments = useMemo(
    () => equipmentRecords.filter((e) => e.status === 'fault' || e.status === 'repairing'),
    [equipmentRecords]
  )

  if (!community) {
    return (
      <div className="flex items-center justify-center h-screen bg-navy-900">
        <p className="text-gray-400 text-lg">未找到该社区信息</p>
      </div>
    )
  }

  const metrics = [
    { label: '设备完好率', value: `${community.equipmentIntactRate}%`, icon: Wrench, color: 'text-cyber-400' },
    { label: '费用收缴率', value: `${community.feeCollectionRate}%`, icon: CreditCard, color: community.feeCollectionRate < 70 ? 'text-alert-red' : 'text-cyber-400' },
    { label: '投诉响应率', value: `${community.complaintResponseRate}%`, icon: ShieldCheck, color: 'text-cyber-400' },
    { label: '满意度评分', value: `${community.satisfactionScore}`, icon: Building2, color: 'text-cyber-400' },
  ]

  const statusColorMap: Record<string, string> = {
    fault: 'bg-alert-red',
    repairing: 'bg-alert-orange',
    normal: 'bg-alert-green',
  }
  const statusLabelMap: Record<string, string> = {
    fault: '故障',
    repairing: '维修中',
    normal: '正常',
  }

  return (
    <div className="min-h-screen bg-navy-900 p-6 space-y-6">
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-lg bg-navy-700 flex items-center justify-center hover:bg-navy-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-300" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">{community.name}</h1>
              <p className="text-sm text-gray-400 mt-1">
                {community.province} · {community.city} · {community.district}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <span>物业公司: <span className="text-gray-200">{community.propertyCompany}</span></span>
            <span>楼栋数: <span className="text-cyber-400 font-mono">{community.buildings}</span></span>
            <span>住户数: <span className="text-cyber-400 font-mono">{community.households}</span></span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="card flex items-center gap-4">
            <div className={`w-11 h-11 rounded-lg bg-navy-700 flex items-center justify-center ${m.color}`}>
              <m.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">{m.label}</p>
              <p className={`metric-value ${m.color}`}>{m.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 className="text-base font-semibold text-white mb-4">各楼栋投诉趋势（近7天）</h2>
        <ReactECharts option={complaintTrendOption} style={{ height: 340 }} />
      </div>

      <div className="card">
        <h2 className="text-base font-semibold text-white mb-4">设备维修时间线</h2>
        {faultEquipments.length === 0 ? (
          <p className="text-gray-500 text-sm py-6 text-center">暂无故障设备</p>
        ) : (
          <div className="relative pl-6">
            <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-navy-600" />
            <div className="space-y-4">
              {faultEquipments.map((eq) => (
                <div key={eq.id} className="relative flex items-start gap-4">
                  <div
                    className={`absolute left-[-20px] top-1 w-5 h-5 rounded-full ${statusColorMap[eq.status]} flex items-center justify-center z-10`}
                    style={{ border: '3px solid #0F2B46' }}
                  />
                  <div className="flex-1 bg-navy-900 border border-navy-600 rounded-lg p-4 ml-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-white">{eq.name}</span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          eq.status === 'fault'
                            ? 'bg-alert-red/15 text-alert-red'
                            : 'bg-alert-orange/15 text-alert-orange'
                        }`}
                      >
                        {statusLabelMap[eq.status]}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>楼栋: {eq.buildingName}</span>
                      <span>类型: {eq.type}</span>
                      {eq.faultDate && <span className="text-alert-red">故障: {eq.faultDate}</span>}
                      {eq.repairDate && <span className="text-alert-orange">报修: {eq.repairDate}</span>}
                      {eq.completedDate && <span className="text-alert-green">完成: {eq.completedDate}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <h2 className="text-base font-semibold text-white mb-4">物业费收缴率（近12月）</h2>
          <ReactECharts option={feeBarOption} style={{ height: 300 }} />
        </div>
        <div className="card">
          <h2 className="text-base font-semibold text-white mb-4">满意度多维雷达图</h2>
          <ReactECharts option={radarOption} style={{ height: 300 }} />
        </div>
      </div>
    </div>
  )
}
