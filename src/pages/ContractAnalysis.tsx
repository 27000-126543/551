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
  Filter,
} from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { generateContractAnalysis } from '../data/mockData'
import type { ContractAnalysis as ContractAnalysisType, StandardComparison } from '../types'
import { ArrowLeft } from 'lucide-react'

type UploadState = {
  file: File | null
  name: string
  parsed?: unknown[]
}

type HistoryRecord = {
  id: string
  communityId: string
  communityName: string
  contractFileName: string
  budgetFileName: string
  analysis: ContractAnalysisType
  dataSource: 'excel' | 'mock'
  timestamp: string
}

type TimeFilter = 'all' | '7days' | '30days'

function isWithinDays(timestamp: string, days: number): boolean {
  const date = new Date(timestamp.replace(/\//g, '-'))
  if (isNaN(date.getTime())) return true
  const now = new Date()
  const diff = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  return diff <= days
}

function HistoryFilter({ history, onView }: { history: HistoryRecord[]; onView: (record: HistoryRecord) => void }) {
  const communityOptions = useMemo(() => {
    const names = new Set(history.map((r) => r.communityName))
    return Array.from(names)
  }, [history])

  const budgetOptions = useMemo(() => {
    const names = new Set(history.map((r) => r.budgetFileName))
    return Array.from(names)
  }, [history])

  const [filterCommunity, setFilterCommunity] = useState('')
  const [filterBudget, setFilterBudget] = useState('')
  const [filterTime, setFilterTime] = useState<TimeFilter>('all')

  const filtered = useMemo(() => {
    return history.filter((r) => {
      if (filterCommunity && r.communityName !== filterCommunity) return false
      if (filterBudget && r.budgetFileName !== filterBudget) return false
      if (filterTime === '7days' && !isWithinDays(r.timestamp, 7)) return false
      if (filterTime === '30days' && !isWithinDays(r.timestamp, 30)) return false
      return true
    })
  }, [history, filterCommunity, filterBudget, filterTime])

  return (
    <>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <Filter size={14} className="text-gray-500" />
        <select
          value={filterTime}
          onChange={(e) => setFilterTime(e.target.value as TimeFilter)}
          className="bg-navy-900 border border-navy-600 rounded-lg px-3 py-1.5 text-xs text-gray-200 focus:border-cyber-500/50 focus:outline-none transition-colors min-w-[120px]"
        >
          <option value="all">全部时间</option>
          <option value="7days">近7天</option>
          <option value="30days">近30天</option>
        </select>
        <select
          value={filterCommunity}
          onChange={(e) => setFilterCommunity(e.target.value)}
          className="bg-navy-900 border border-navy-600 rounded-lg px-3 py-1.5 text-xs text-gray-200 focus:border-cyber-500/50 focus:outline-none transition-colors min-w-[140px]"
        >
          <option value="">全部社区</option>
          {communityOptions.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
        <select
          value={filterBudget}
          onChange={(e) => setFilterBudget(e.target.value)}
          className="bg-navy-900 border border-navy-600 rounded-lg px-3 py-1.5 text-xs text-gray-200 focus:border-cyber-500/50 focus:outline-none transition-colors min-w-[160px]"
        >
          <option value="">全部预算表</option>
          {budgetOptions.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy-600">
              <th className="text-left text-gray-400 font-medium py-3 px-4">时间</th>
              <th className="text-left text-gray-400 font-medium py-3 px-4">社区</th>
              <th className="text-left text-gray-400 font-medium py-3 px-4">合同文件</th>
              <th className="text-left text-gray-400 font-medium py-3 px-4">预算表文件</th>
              <th className="text-center text-gray-400 font-medium py-3 px-4">数据来源</th>
              <th className="text-center text-gray-400 font-medium py-3 px-4">异常项数</th>
              <th className="text-center text-gray-400 font-medium py-3 px-4">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((record) => (
              <tr key={record.id} className="border-b border-navy-700/50 hover:bg-navy-800/50 transition-colors">
                <td className="py-3 px-4 text-gray-300 text-xs">{record.timestamp}</td>
                <td className="py-3 px-4 text-gray-200">{record.communityName}</td>
                <td className="py-3 px-4 text-gray-300 text-xs">{record.contractFileName}</td>
                <td className="py-3 px-4 text-gray-300">{record.budgetFileName}</td>
                <td className="py-3 px-4 text-center">
                  <span className={`text-xs px-2 py-0.5 rounded ${record.dataSource === 'excel' ? 'bg-cyber-500/10 text-cyber-400' : 'bg-alert-orange/10 text-alert-orange'}`}>
                    {record.dataSource === 'excel' ? '已上传预算表' : '模拟数据'}
                  </span>
                </td>
                <td className="py-3 px-4 text-center font-mono">
                  <span className={record.analysis.comparisons.filter(c => c.isAbnormal).length > 0 ? 'text-alert-red' : 'text-cyber-400'}>
                    {record.analysis.comparisons.filter(c => c.isAbnormal).length}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => onView(record)}
                    className="px-3 py-1 text-xs rounded-md bg-navy-700 text-gray-400 hover:bg-cyber-500/20 hover:text-cyber-400 transition-colors"
                  >
                    查看
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default function ContractAnalysis() {
  const { getFilteredCommunities, contractHistory, addContractHistory } = useAppStore()
  const filteredCommunities = getFilteredCommunities()

  const [contractUpload, setContractUpload] = useState<UploadState>({ file: null, name: '' })
  const [budgetUpload, setBudgetUpload] = useState<UploadState>({ file: null, name: '' })
  const [selectedCommunityId, setSelectedCommunityId] = useState('')
  const [analysis, setAnalysis] = useState<ContractAnalysisType | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [dataSource, setDataSource] = useState<'excel' | 'mock' | null>(null)
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null)

  const contractInputRef = useRef<HTMLInputElement>(null)
  const budgetInputRef = useRef<HTMLInputElement>(null)

  const [contractDrag, setContractDrag] = useState(false)
  const [budgetDrag, setBudgetDrag] = useState(false)

  const handleContractFile = useCallback((file: File) => {
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      setAnalysis(null)
      setDataSource(null)
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
        setAnalysis(null)
        setDataSource(null)
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

  const extractActualValue = useCallback((category: string): number | null => {
    if (!budgetUpload.parsed || budgetUpload.parsed.length === 0) return null

    const categoryKeys = ['类别', '分类', 'category', '类型', '项目']
    const valueKeys = ['实际表现', '实际值', 'actual', 'actualValue', '数值', '值', '数量']

    for (const row of budgetUpload.parsed) {
      const rowData = row as Record<string, unknown>
      let categoryMatch = false
      let actualValue: number | null = null

      for (const key of Object.keys(rowData)) {
        const lowerKey = key.toLowerCase().trim()
        const value = rowData[key]

        for (const catKey of categoryKeys) {
          if (lowerKey.includes(catKey.toLowerCase()) || key.includes(catKey)) {
            const cellValue = String(value).trim()
            if (cellValue.includes(category) || category.includes(cellValue)) {
              categoryMatch = true
            }
          }
        }

        for (const valKey of valueKeys) {
          if (lowerKey.includes(valKey.toLowerCase()) || key.includes(valKey)) {
            const num = parseFloat(String(value).replace(/[^\d.]/g, ''))
            if (!isNaN(num)) {
              actualValue = num
            }
          }
        }
      }

      if (!categoryMatch) {
        for (const key of Object.keys(rowData)) {
          const value = rowData[key]
          const cellValue = String(value).trim()
          if (cellValue.includes(category) || category.includes(cellValue)) {
            categoryMatch = true
            break
          }
        }
      }

      if (actualValue === null || actualValue === undefined) {
        for (const key of Object.keys(rowData)) {
          const value = rowData[key]
          if (typeof value === 'number') {
            actualValue = value
            break
          }
          const num = parseFloat(String(value).replace(/[^\d.]/g, ''))
          if (!isNaN(num)) {
            actualValue = num
            break
          }
        }
      }

      if (categoryMatch && actualValue !== null && actualValue !== undefined) {
        return actualValue
      }
    }

    return null
  }, [budgetUpload.parsed])

  const isButtonDisabled = !contractUpload.name || !budgetUpload.name || !selectedCommunityId || isAnalyzing
  const buttonTooltip = !contractUpload.name
    ? '请先上传物业服务合同'
    : !budgetUpload.name
    ? '请先上传年度预算表'
    : !selectedCommunityId
    ? '请先选择社区'
    : ''

  const handleAnalyze = useCallback(() => {
    if (isButtonDisabled) return
    setIsAnalyzing(true)
    setTimeout(() => {
      const mockResult = generateContractAnalysis(selectedCommunityId)
      let usedExcelData = false

      const comparisons = mockResult.standards.map((standard) => {
        const standardValue = standard.target
        let actualValue: number | null = null

        if (budgetUpload.parsed) {
          actualValue = extractActualValue(standard.category)
        }

        let finalActualValue: number
        let deviation: number
        let isAbnormal: boolean

        if (actualValue !== null && actualValue !== undefined) {
          usedExcelData = true
          finalActualValue = actualValue
          deviation = Math.round(Math.abs((actualValue - standardValue) / standardValue * 100) * 100) / 100
          isAbnormal = deviation > 15
        } else {
          const mockComparison = mockResult.comparisons.find((c) => c.category === standard.category)
          finalActualValue = mockComparison?.actualValue ?? standardValue
          deviation = mockComparison?.deviation ?? 0
          isAbnormal = mockComparison?.isAbnormal ?? false
        }

        return {
          category: standard.category,
          standardValue,
          actualValue: Math.round(finalActualValue * 100) / 100,
          deviation,
          isAbnormal,
        }
      })

      const finalAnalysis = { ...mockResult, comparisons }
      setAnalysis(finalAnalysis)
      setDataSource(usedExcelData ? 'excel' : 'mock')
      const communityName = filteredCommunities.find(c => c.id === selectedCommunityId)?.name ?? ''
      addContractHistory({
        communityId: selectedCommunityId,
        communityName,
        contractFileName: contractUpload.name,
        budgetFileName: budgetUpload.name,
        analysis: finalAnalysis,
        dataSource: usedExcelData ? 'excel' : 'mock',
      })
      setSelectedHistoryId(null)
      setIsAnalyzing(false)
    }, 800)
  }, [selectedCommunityId, budgetUpload.parsed, isButtonDisabled, extractActualValue, contractUpload.name, budgetUpload.name, filteredCommunities, addContractHistory])

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

  const selectedHistoryRecord = useMemo(() => {
    if (!selectedHistoryId) return null
    return contractHistory.find((r) => r.id === selectedHistoryId) as HistoryRecord | undefined
  }, [selectedHistoryId, contractHistory])

  function handleReturnToLive() {
    setSelectedHistoryId(null)
    setAnalysis(null)
    setDataSource(null)
  }

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
          onChange={(e) => {
            setSelectedCommunityId(e.target.value)
            setAnalysis(null)
            setDataSource(null)
          }}
          className="bg-navy-900 border border-navy-600 rounded-lg px-4 py-2 text-sm text-gray-200 focus:border-cyber-500/50 focus:outline-none transition-colors min-w-[200px]"
        >
          <option value="">-- 请选择社区 --</option>
          {filteredCommunities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <div className="relative group">
          <button
            onClick={handleAnalyze}
            disabled={isButtonDisabled}
            className="btn-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Search size={16} />
            {isAnalyzing ? '分析中...' : '开始分析'}
          </button>
          {isButtonDisabled && buttonTooltip && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-2 bg-navy-800 border border-navy-600 rounded-lg text-xs text-gray-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              {buttonTooltip}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-8 border-transparent border-b-navy-800" />
            </div>
          )}
        </div>
      </div>

      {/* Analysis Result */}
      {analysis && summaryStats && (
        <>
          {/* History Detail Info Card */}
          {selectedHistoryRecord && (
            <div className="card border-2 border-cyber-500/40">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 text-xs rounded bg-cyber-500/20 text-cyber-400 flex items-center gap-1">
                    <AlertTriangle size={12} />
                    历史记录查看模式
                  </span>
                </div>
                <button
                  onClick={handleReturnToLive}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-navy-700 text-gray-300 hover:bg-cyber-500/20 hover:text-cyber-400 transition-colors"
                >
                  <ArrowLeft size={14} />
                  返回实时分析
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">📄 合同文件名</div>
                  <div className="text-sm text-gray-200 truncate" title={selectedHistoryRecord.contractFileName}>
                    {selectedHistoryRecord.contractFileName}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">📊 预算表文件名</div>
                  <div className="text-sm text-gray-200 truncate" title={selectedHistoryRecord.budgetFileName}>
                    {selectedHistoryRecord.budgetFileName}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">🏢 社区</div>
                  <div className="text-sm text-gray-200">{selectedHistoryRecord.communityName}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">⏰ 分析时间</div>
                  <div className="text-sm text-gray-200">{selectedHistoryRecord.timestamp}</div>
                </div>
              </div>
            </div>
          )}

          {/* Data Source */}
          <div className={`text-sm px-4 py-2 rounded-lg flex items-center justify-between ${dataSource === 'excel' ? 'bg-cyber-500/10 text-cyber-400' : 'bg-alert-orange/10 text-alert-orange'}`}>
            <span>
              数据来源：{dataSource === 'excel' ? '已上传预算表' : '模拟数据'}
              {dataSource === 'mock' && <span className="ml-2 text-xs text-gray-500">（未找到匹配的Excel数据列，已使用默认数据）</span>}
            </span>
            {selectedHistoryRecord && (
              <span className="text-xs text-gray-400">
                (历史记录快照)
              </span>
            )}
          </div>

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

      {contractHistory.length > 0 && (
        <div className="card">
          <h3 className="text-gray-200 font-medium text-sm flex items-center gap-2 mb-4">
            <FileText size={16} className="text-cyber-400" />
            分析历史
          </h3>
          <HistoryFilter
            history={contractHistory as HistoryRecord[]}
            onView={(record) => {
              setSelectedHistoryId(record.id)
              setSelectedCommunityId(record.communityId)
              setAnalysis(record.analysis)
              setDataSource(record.dataSource)
            }}
          />
        </div>
      )}
    </div>
  )
}
