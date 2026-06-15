import { useState, useCallback, useMemo, useRef } from 'react'
import ReactECharts from 'echarts-for-react'
import * as XLSX from 'xlsx'
import {
  Upload,
  FileText,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  Search,
} from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { generateContractAnalysis } from '../data/mockData'
import type { ContractAnalysis as ContractAnalysisType, StandardComparison } from '../types'

type UploadState = {
  file: File | null
  name: string
  parsed?: unknown[]
}

export default function ContractAnalysis() {
  const { getFilteredCommunities } = useAppStore()
  const filteredCommunities = getFilteredCommunities()

  const [contractUpload, setContractUpload] = useState<UploadState>({ file: null, name: '' })
  const [budgetUpload, setBudgetUpload] = useState<UploadState>({ file: null, name: '' })
  const [selectedCommunityId, setSelectedCommunityId] = useState('')
  const [analysis, setAnalysis] = useState<ContractAnalysisType | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const contractInputRef = useRef<HTMLInputElement>(null)
  const budgetInputRef = useRef<HTMLInputElement>(null)

  const [contractDrag, setContractDrag] = useState(false)
  const [budgetDrag, setBudgetDrag] = useState(false)

  const handleContractFile = useCallback((file: File) => {
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      setContractUpload({ file, name: file.name })
    }
  }, [])

  const handleBudgetFile = useCallback((file: File) => {
    if (
      file.name.endsWith('.xlsx') ||
      file.name.endsWith('.xls') ||
      file.name.endsWith('.csv')
    ) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(firstSheet)
        setBudgetUpload({ file, name: file.name, parsed: jsonData })
      }
      reader.readAsArrayBuffer(file)
    }
  }, [])

  const handleDrop = useCallback(
    (type: 'contract' | 'budget', e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const file = e.dataTransfer.files[0]
      if (!file) return
      if (type === 'contract') {
        setContractDrag(false)
        handleContractFile(file)
      } else {
        setBudgetDrag(false)
        handleBudgetFile(file)
      }
    },
    [handleContractFile, handleBudgetFile],
  )

  const handleDragOver = useCallback((type: 'contract' | 'budget', e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (type === 'contract') setContractDrag(true)
    else setBudgetDrag(true)
  }, [])

  const handleDragLeave = useCallback((type: 'contract' | 'budget') => {
    if (type === 'contract') setContractDrag(false)
    else setBudgetDrag(false)
  }, [])

  const handleAnalyze = useCallback(() => {
    if (!selectedCommunityId) return
    setIsAnalyzing(true)
    setTimeout(() => {
      const result = generateContractAnalysis(selectedCommunityId)
      setAnalysis(result)
      setIsAnalyzing(false)
    }, 800)
  }, [selectedCommunityId])

  const summaryStats = useMemo(() => {
    if (!analysis) return null
    const total = analysis.comparisons.length
    const abnormal = analysis.comparisons.filter((c) => c.isAbnormal).length
    const maxDeviation = Math.max(...analysis.comparisons.map((c) => c.deviation))
    return { total, abnormal, maxDeviation: Math.round(maxDeviation * 100) / 100 }
  }, [analysis])

  const chartOption = useMemo(() => {
    if (!analysis) return null
    const sorted = [...analysis.comparisons].sort((a, b) => b.deviation - a.deviation)
    return {
      tooltip: {
        trigger: 'axis' as const,
        axisPointer: { type: 'shadow' as const },
        backgroundColor: '#0F2B46',
        borderColor: '#1B4272',
        textStyle: { color: '#E0E7EF', fontSize: 12 },
        formatter: (params: { name: string; value: number }[]) => {
          const item = params[0]
          return `${item.name}<br/>偏差率: <b>${item.value}%</b>`
        },
      },
      grid: { left: 140, right: 50, top: 10, bottom: 30 },
      xAxis: {
        type: 'value' as const,
        axisLabel: { color: '#8899AA', formatter: '{value}%' },
        splitLine: { lineStyle: { color: '#1B4272', type: 'dashed' as const } },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'category' as const,
        data: sorted.map((c) => c.category),
        axisLabel: { color: '#8899AA', fontSize: 11, width: 120, overflow: 'truncate' as const },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: [
        {
          type: 'bar' as const,
          data: sorted.map((c) => ({
            value: c.deviation,
            itemStyle: {
              color: c.isAbnormal
                ? {
                    type: 'linear' as const,
                    x: 0, y: 0, x2: 1, y2: 0,
                    colorStops: [
                      { offset: 0, color: '#FF4D4F' },
                      { offset: 1, color: '#FAAD14' },
                    ],
                  }
                : {
                    type: 'linear' as const,
                    x: 0, y: 0, x2: 1, y2: 0,
                    colorStops: [
                      { offset: 0, color: '#00D4AA' },
                      { offset: 1, color: '#33DDBB' },
                    ],
                  },
              borderRadius: [0, 3, 3, 0],
            },
          })),
          barWidth: 14,
          label: {
            show: true,
            position: 'right' as const,
            color: '#8899AA',
            fontSize: 11,
            formatter: '{c}%',
          },
          markLine: {
            silent: true,
            symbol: 'none' as const,
            lineStyle: { color: '#FF4D4F', type: 'dashed' as const, width: 2 },
            data: [{ xAxis: 15, label: { show: true, formatter: '15% 阈值', color: '#FF4D4F', fontSize: 11, position: 'insideEndTop' as const } }],
          },
        },
      ],
    }
  }, [analysis])

  function getRowStyle(c: StandardComparison) {
    if (c.isAbnormal) return 'bg-alert-red/5 border-l-2 border-alert-red'
    return 'bg-alert-green/5 border-l-2 border-alert-green'
  }

  function getStatusCell(c: StandardComparison) {
    if (c.isAbnormal) {
      return (
        <span className="badge-red flex items-center gap-1">
          <AlertTriangle size={12} />
          异常
        </span>
      )
    }
    return (
      <span className="badge-green flex items-center gap-1">
        <CheckCircle size={12} />
        正常
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-navy-900 p-6 space-y-6">
      <h2 className="text-gray-200 text-lg font-medium">合同履约分析</h2>

      {/* Upload Section */}
      <div className="grid grid-cols-2 gap-5">
        <div
          className={`card relative flex flex-col items-center justify-center min-h-[180px] border-dashed transition-all duration-300 cursor-pointer ${
            contractDrag
              ? 'border-cyber-500 glow-cyber'
              : contractUpload.name
              ? 'border-alert-green/40'
              : 'border-navy-500 hover:border-cyber-500/50 hover:shadow-[0_0_20px_rgba(0,212,170,0.1)]'
          }`}
          onDrop={(e) => handleDrop('contract', e)}
          onDragOver={(e) => handleDragOver('contract', e)}
          onDragLeave={() => handleDragLeave('contract')}
          onClick={() => contractInputRef.current?.click()}
        >
          <input
            ref={contractInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleContractFile(file)
            }}
          />
          {contractUpload.name ? (
            <>
              <FileText size={36} className="text-cyber-400 mb-3" />
              <span className="text-sm text-gray-300 mb-1">{contractUpload.name}</span>
              <CheckCircle size={18} className="text-alert-green mt-1" />
            </>
          ) : (
            <>
              <FileText size={36} className="text-gray-500 mb-3" />
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                <Upload size={14} />
                <span>上传物业服务合同</span>
              </div>
              <span className="text-xs text-gray-600">支持 PDF 格式，拖拽或点击上传</span>
            </>
          )}
        </div>

        <div
          className={`card relative flex flex-col items-center justify-center min-h-[180px] border-dashed transition-all duration-300 cursor-pointer ${
            budgetDrag
              ? 'border-cyber-500 glow-cyber'
              : budgetUpload.name
              ? 'border-alert-green/40'
              : 'border-navy-500 hover:border-cyber-500/50 hover:shadow-[0_0_20px_rgba(0,212,170,0.1)]'
          }`}
          onDrop={(e) => handleDrop('budget', e)}
          onDragOver={(e) => handleDragOver('budget', e)}
          onDragLeave={() => handleDragLeave('budget')}
          onClick={() => budgetInputRef.current?.click()}
        >
          <input
            ref={budgetInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleBudgetFile(file)
            }}
          />
          {budgetUpload.name ? (
            <>
              <FileSpreadsheet size={36} className="text-cyber-400 mb-3" />
              <span className="text-sm text-gray-300 mb-1">{budgetUpload.name}</span>
              <CheckCircle size={18} className="text-alert-green mt-1" />
              {budgetUpload.parsed && (
                <span className="text-xs text-gray-500 mt-1">
                  已解析 {budgetUpload.parsed.length} 条数据
                </span>
              )}
            </>
          ) : (
            <>
              <FileSpreadsheet size={36} className="text-gray-500 mb-3" />
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                <Upload size={14} />
                <span>上传年度预算表</span>
              </div>
              <span className="text-xs text-gray-600">支持 Excel/CSV 格式，拖拽或点击上传</span>
            </>
          )}
        </div>
      </div>

      {/* Community Selector & Analyze Button */}
      <div className="card flex items-center gap-4">
        <label className="text-sm text-gray-400 whitespace-nowrap">选择社区</label>
        <select
          value={selectedCommunityId}
          onChange={(e) => setSelectedCommunityId(e.target.value)}
          className="bg-navy-900 border border-navy-600 rounded-lg px-4 py-2 text-sm text-gray-200 focus:border-cyber-500/50 focus:outline-none transition-colors min-w-[200px]"
        >
          <option value="">-- 请选择社区 --</option>
          {filteredCommunities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          onClick={handleAnalyze}
          disabled={!selectedCommunityId || isAnalyzing}
          className="btn-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Search size={16} />
          {isAnalyzing ? '分析中...' : '开始分析'}
        </button>
      </div>

      {/* Analysis Result */}
      {analysis && summaryStats && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-5">
            <div className="card text-center">
              <div className="text-xs text-gray-500 mb-2">标准总数</div>
              <div className="metric-value text-cyber-400">{summaryStats.total}</div>
            </div>
            <div className="card text-center">
              <div className="text-xs text-gray-500 mb-2">异常项数</div>
              <div className="metric-value text-alert-red">{summaryStats.abnormal}</div>
            </div>
            <div className="card text-center">
              <div className="text-xs text-gray-500 mb-2">最大偏差</div>
              <div className="metric-value text-alert-orange">{summaryStats.maxDeviation}%</div>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="card overflow-x-auto">
            <h3 className="text-gray-200 font-medium text-sm flex items-center gap-2 mb-4">
              <FileText size={16} className="text-cyber-400" />
              服务标准对比
            </h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy-600">
                  <th className="text-left text-gray-400 font-medium py-3 px-4">类别</th>
                  <th className="text-center text-gray-400 font-medium py-3 px-4">合同标准</th>
                  <th className="text-center text-gray-400 font-medium py-3 px-4">实际表现</th>
                  <th className="text-center text-gray-400 font-medium py-3 px-4">偏差率</th>
                  <th className="text-center text-gray-400 font-medium py-3 px-4">状态</th>
                </tr>
              </thead>
              <tbody>
                {analysis.comparisons.map((c) => (
                  <tr key={c.category} className={`border-b border-navy-700/50 ${getRowStyle(c)}`}>
                    <td className="py-3 px-4 text-gray-200">{c.category}</td>
                    <td className="py-3 px-4 text-center text-gray-300 font-mono">{c.standardValue}</td>
                    <td className="py-3 px-4 text-center text-gray-300 font-mono">{c.actualValue}</td>
                    <td
                      className="py-3 px-4 text-center font-mono font-medium"
                      style={{ color: c.isAbnormal ? '#FF4D4F' : '#00D4AA' }}
                    >
                      {c.deviation}%
                    </td>
                    <td className="py-3 px-4 text-center">{getStatusCell(c)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Deviation Chart */}
          {chartOption && (
            <div className="card">
              <h3 className="text-gray-200 font-medium text-sm flex items-center gap-2 mb-2">
                <AlertTriangle size={16} className="text-alert-orange" />
                偏差率分布
              </h3>
              <ReactECharts
                option={chartOption}
                style={{ height: '400px' }}
                opts={{ renderer: 'canvas' }}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}
