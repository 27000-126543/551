import { useState, useMemo } from 'react'
import { useAppStore } from '../store/useAppStore'
import {
  AlertTriangle,
  Filter,
  Search,
  CheckCircle,
  Clock,
  XCircle,
  ChevronDown,
  ChevronUp,
  User,
} from 'lucide-react'
import type { Alert } from '../types'

const TYPE_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'fee', label: '物业费' },
  { value: 'equipment', label: '设备' },
]

const STATUS_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'pending', label: '待确认' },
  { value: 'confirmed', label: '已确认' },
  { value: 'reviewed', label: '已复核' },
  { value: 'approved', label: '已批准' },
  { value: 'resolved', label: '已解决' },
]

const STATUS_LABEL: Record<Alert['status'], string> = {
  pending: '待确认',
  confirmed: '已确认',
  reviewed: '已复核',
  approved: '已批准',
  resolved: '已解决',
}

const STATUS_BADGE: Record<Alert['status'], string> = {
  pending: 'badge-orange',
  confirmed: 'badge-cyber',
  reviewed: 'badge-cyber',
  approved: 'badge-cyber',
  resolved: 'badge-green',
}

const STEP_LABELS = ['项目经理确认', '区域总监复核', '集团总裁批准']

const STEP_ROLE_MAP: Record<number, 'project_manager' | 'regional_director' | 'group_admin'> = {
  1: 'project_manager',
  2: 'regional_director',
  3: 'group_admin',
}

const ROLE_LABEL_MAP: Record<string, string> = {
  project_manager: '项目经理',
  regional_director: '区域总监',
  group_admin: '集团总裁',
  owner_committee: '业主委员会',
}

function getTypeBadge(type: Alert['type']) {
  return type === 'fee' ? 'badge-orange' : 'badge-red'
}

function getTypeLabel(type: Alert['type']) {
  return type === 'fee' ? '物业费' : '设备'
}

export default function AlertCenter() {
  const currentUser = useAppStore((s) => s.currentUser)
  const getFilteredAlerts = useAppStore((s) => s.getFilteredAlerts)
  const approveAlertStep = useAppStore((s) => s.approveAlertStep)
  const updateAlertStatus = useAppStore((s) => s.updateAlertStatus)

  const canApproveStep = (stepNumber: number): boolean => {
    if (!currentUser) return false
    const requiredRole = STEP_ROLE_MAP[stepNumber]
    return currentUser.role === requiredRole
  }

  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [searchText, setSearchText] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const baseAlerts = getFilteredAlerts()

  const filteredAlerts = useMemo(() => {
    let result = baseAlerts
    if (typeFilter) {
      result = result.filter((a) => a.type === typeFilter)
    }
    if (statusFilter) {
      result = result.filter((a) => a.status === statusFilter)
    }
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase()
      result = result.filter((a) => a.communityName.toLowerCase().includes(q))
    }
    return result
  }, [baseAlerts, typeFilter, statusFilter, searchText])

  const stats = useMemo(() => {
    const total = filteredAlerts.length
    const pending = filteredAlerts.filter((a) => a.status === 'pending').length
    const inProgress = filteredAlerts.filter((a) => a.status === 'confirmed' || a.status === 'reviewed').length
    const resolved = filteredAlerts.filter((a) => a.status === 'resolved').length
    return { total, pending, inProgress, resolved }
  }, [filteredAlerts])

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  const handleApprove = (alertId: string, step: number) => {
    approveAlertStep(alertId, step)
    if (step === 3) {
      updateAlertStatus(alertId, 'resolved')
    }
  }

  const getStepStatus = (alert: Alert, stepIndex: number) => {
    const approval = alert.approvals.find((a) => a.step === stepIndex + 1)
    return approval?.status ?? 'pending'
  }

  const getActiveStep = (alert: Alert) => {
    for (let i = 0; i < 3; i++) {
      if (getStepStatus(alert, i) === 'pending') return i
    }
    return 3
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-6 h-6 text-cyber-400" />
        <h1 className="text-xl font-bold text-gray-100">预警中心</h1>
      </div>

      {/* Filter bar */}
      <div className="card flex flex-wrap items-center gap-4">
        <Filter className="w-4 h-4 text-gray-400" />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="input-dark w-32"
        >
          {TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-dark w-32"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="搜索社区名称..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="input-dark w-full pl-9"
          />
        </div>
      </div>

      {/* Statistics row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="预警总数" value={stats.total} color="text-gray-100" />
        <StatCard label="待确认" value={stats.pending} color="text-alert-orange" />
        <StatCard label="处理中" value={stats.inProgress} color="text-cyber-400" />
        <StatCard label="已解决" value={stats.resolved} color="text-alert-green" />
      </div>

      {/* Alert list */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 && (
          <div className="card text-center text-gray-500 py-10">暂无预警数据</div>
        )}
        {filteredAlerts.map((alert) => {
          const isExpanded = expandedId === alert.id
          const activeStep = getActiveStep(alert)

          return (
            <div key={alert.id} className="card">
              <div
                className="flex items-start justify-between cursor-pointer select-none"
                onClick={() => toggleExpand(alert.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-100 truncate">{alert.title}</span>
                    <span className={getTypeBadge(alert.type)}>{getTypeLabel(alert.type)}</span>
                    <span className={STATUS_BADGE[alert.status]}>{STATUS_LABEL[alert.status]}</span>
                  </div>
                  <p className="text-sm text-gray-400 mb-2 truncate">{alert.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{alert.communityName}</span>
                    <span>{alert.triggerDate}</span>
                  </div>
                </div>
                <div className="ml-3 mt-1 text-gray-500">
                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </div>

              {/* Approval flow panel */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-navy-600">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="w-4 h-4 text-cyber-400" />
                    <span className="text-sm font-medium text-gray-300">审批流程</span>
                  </div>

                  <div className="flex items-start gap-0">
                    {STEP_LABELS.map((label, idx) => {
                      const stepStatus = getStepStatus(alert, idx)
                      const isActive = idx === activeStep && alert.status !== 'resolved'
                      const isDone = stepStatus === 'approved'
                      const approval = alert.approvals.find((a) => a.step === idx + 1)

                      return (
                        <div key={idx} className="flex-1 flex">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                                  isDone
                                    ? 'bg-cyber-500/20 border-cyber-500 text-cyber-400'
                                    : isActive
                                      ? 'bg-cyber-500/10 border-cyber-400 text-cyber-400 glow-cyber'
                                      : 'bg-navy-700 border-navy-600 text-gray-500'
                                }`}
                              >
                                {isDone ? (
                                  <CheckCircle className="w-4 h-4" />
                                ) : (
                                  idx + 1
                                )}
                              </div>
                              <div className="min-w-0">
                                <p
                                  className={`text-sm font-medium ${
                                    isDone || isActive ? 'text-gray-200' : 'text-gray-500'
                                  }`}
                                >
                                  {label}
                                </p>
                                <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                                  <User className="w-3 h-3" />
                                  <span>{approval?.assignee ?? '-'}</span>
                                </div>
                              </div>
                            </div>

                            <div className="ml-[18px] mt-2 pl-5 border-l-2 border-navy-600 min-h-[40px]">
                              {stepStatus === 'approved' && (
                                <div className="flex items-center gap-1 text-xs text-cyber-400 mb-1">
                                  <CheckCircle className="w-3 h-3" />
                                  <span>已通过</span>
                                </div>
                              )}
                              {stepStatus === 'approved' && approval?.timestamp && (
                                <p className="text-xs text-gray-500">{approval.timestamp}</p>
                              )}
                              {stepStatus === 'rejected' && (
                                <div className="flex items-center gap-1 text-xs text-alert-red">
                                  <XCircle className="w-3 h-3" />
                                  <span>已驳回</span>
                                </div>
                              )}
                              {stepStatus === 'pending' && !isActive && (
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <Clock className="w-3 h-3" />
                                  <span>等待中</span>
                                </div>
                              )}
                              {isActive && (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-1 text-xs text-cyber-400">
                                    <Clock className="w-3 h-3" />
                                    <span>待审批</span>
                                  </div>
                                  {canApproveStep(idx + 1) ? (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleApprove(alert.id, idx + 1)
                                      }}
                                      className="btn-primary text-xs px-3 py-1.5"
                                    >
                                      审批
                                    </button>
                                  ) : (
                                    <div
                                      className="text-xs text-gray-500 px-3 py-1.5 bg-navy-700 rounded-lg cursor-not-allowed"
                                      title={`需${ROLE_LABEL_MAP[STEP_ROLE_MAP[idx + 1]]}账号审批`}
                                    >
                                      需{ROLE_LABEL_MAP[STEP_ROLE_MAP[idx + 1]]}账号审批
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {idx < 2 && (
                            <div className="flex items-center pt-3 -ml-2">
                              <div
                                className={`w-6 h-0.5 ${
                                  isDone ? 'bg-cyber-500' : 'bg-navy-600'
                                }`}
                              />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="card">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`metric-value ${color}`}>{value}</p>
    </div>
  )
}
