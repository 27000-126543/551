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
  Inbox,
  CheckSquare,
  AlertOctagon,
} from 'lucide-react'
import type { Alert } from '../types'

type WorkbenchTab = 'pending' | 'processed' | 'overdue'

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

const STEP_DURATION_SIM: Record<number, string> = {
  1: '2.3h',
  2: '5.1h',
  3: '3.7h',
}

function getTypeBadge(type: Alert['type']) {
  return type === 'fee' ? 'badge-orange' : 'badge-red'
}

function getTypeLabel(type: Alert['type']) {
  return type === 'fee' ? '物业费' : '设备'
}

type DerivedStatus = 'pending' | 'confirmed' | 'reviewed' | 'approved' | 'resolved'

function deriveDisplayStatus(alert: Alert): DerivedStatus {
  const step1Approved = alert.approvals.find((a) => a.step === 1)?.status === 'approved'
  const step2Approved = alert.approvals.find((a) => a.step === 2)?.status === 'approved'
  const step3Approved = alert.approvals.find((a) => a.step === 3)?.status === 'approved'
  const allApproved = step1Approved && step2Approved && step3Approved

  if (allApproved && alert.status === 'resolved') return 'resolved'
  if (step3Approved) return 'approved'
  if (step2Approved) return 'reviewed'
  if (step1Approved) return 'confirmed'
  return 'pending'
}

const DERIVED_STATUS_LABEL: Record<DerivedStatus, string> = {
  pending: '待确认',
  confirmed: '已确认',
  reviewed: '已复核',
  approved: '已批准',
  resolved: '已解决',
}

const DERIVED_STATUS_BADGE: Record<DerivedStatus, string> = {
  pending: 'badge-orange',
  confirmed: 'badge-cyber',
  reviewed: 'badge-cyber',
  approved: 'badge-cyber',
  resolved: 'badge-green',
}

function parseDaysAgo(dateStr: string, todayStr: string = '2026-06-15'): number {
  const d = new Date(dateStr)
  const t = new Date(todayStr)
  const diffMs = t.getTime() - d.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

function isOverdue(alert: Alert): boolean {
  const daysAgo = parseDaysAgo(alert.triggerDate)
  if (alert.type === 'equipment') {
    return daysAgo > 5
  }
  if (alert.type === 'fee') {
    return daysAgo > 3
  }
  return false
}

export default function AlertCenter() {
  const currentUser = useAppStore((s) => s.currentUser)
  const getFilteredAlerts = useAppStore((s) => s.getFilteredAlerts)
  const approveAlertStep = useAppStore((s) => s.approveAlertStep)
  const updateAlertStatus = useAppStore((s) => s.updateAlertStatus)

  const [activeTab, setActiveTab] = useState<WorkbenchTab>('pending')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [searchText, setSearchText] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({})

  const canApproveStep = (stepNumber: number): boolean => {
    if (!currentUser) return false
    const requiredRole = STEP_ROLE_MAP[stepNumber]
    return currentUser.role === requiredRole
  }

  const baseAlerts = getFilteredAlerts()

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

  const getActiveStepNumber = (alert: Alert): number => {
    const idx = getActiveStep(alert)
    return idx < 3 ? idx + 1 : 0
  }

  const isAlertInMyPending = (alert: Alert): boolean => {
    if (!currentUser) return false
    const derivedStatus = deriveDisplayStatus(alert)
    if (derivedStatus === 'resolved') return false
    if (alert.status === 'resolved') return false
    const activeStepNum = getActiveStepNumber(alert)
    if (activeStepNum === 0) return false
    const requiredRole = STEP_ROLE_MAP[activeStepNum]
    return currentUser.role === requiredRole
  }

  const isAlertInMyProcessed = (alert: Alert): boolean => {
    if (!currentUser) return false
    const myRole = currentUser.role
    const hasMyApproval = alert.approvals.some(
      (a) => a.status === 'approved' && STEP_ROLE_MAP[a.step] === myRole
    )
    const derivedStatus = deriveDisplayStatus(alert)
    const inScopeResolved = derivedStatus === 'resolved'
    return hasMyApproval || inScopeResolved
  }

  const tabAlerts = useMemo(() => {
    switch (activeTab) {
      case 'pending':
        return baseAlerts.filter(isAlertInMyPending)
      case 'processed':
        return baseAlerts.filter(isAlertInMyProcessed)
      case 'overdue':
        return baseAlerts.filter((a) => isAlertInMyPending(a) && isOverdue(a))
    }
  }, [activeTab, baseAlerts, currentUser])

  const filteredAlerts = useMemo(() => {
    let result = tabAlerts
    if (typeFilter) {
      result = result.filter((a) => a.type === typeFilter)
    }
    if (statusFilter) {
      result = result.filter((a) => {
        const derived = deriveDisplayStatus(a)
        return derived === statusFilter
      })
    }
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase()
      result = result.filter((a) => a.communityName.toLowerCase().includes(q))
    }
    return result
  }, [tabAlerts, typeFilter, statusFilter, searchText])

  const tabCounts = useMemo(() => {
    return {
      pending: baseAlerts.filter(isAlertInMyPending).length,
      processed: baseAlerts.filter(isAlertInMyProcessed).length,
      overdue: baseAlerts.filter((a) => isAlertInMyPending(a) && isOverdue(a)).length,
    }
  }, [baseAlerts, currentUser])

  const stats = useMemo(() => {
    const total = filteredAlerts.length
    const pending = filteredAlerts.filter((a) => deriveDisplayStatus(a) === 'pending').length
    const inProgress = filteredAlerts.filter(
      (a) => {
        const s = deriveDisplayStatus(a)
        return s === 'confirmed' || s === 'reviewed'
      }
    ).length
    const resolved = filteredAlerts.filter((a) => deriveDisplayStatus(a) === 'resolved').length
    return { total, pending, inProgress, resolved }
  }, [filteredAlerts])

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  const handleApprove = (alertId: string, step: number, comment: string) => {
    approveAlertStep(alertId, step, comment)
    setCommentInputs((prev) => {
      const next = { ...prev }
      delete next[`${alertId}-${step}`]
      return next
    })
    if (step === 3) {
      updateAlertStatus(alertId, 'resolved')
    }
  }

  const getStepDuration = (alert: Alert, stepIdx: number): string => {
    const stepStatus = getStepStatus(alert, stepIdx)
    if (stepStatus === 'approved') {
      return STEP_DURATION_SIM[stepIdx + 1] ?? '2.0h'
    }
    if (stepStatus === 'pending') {
      const activeStep = getActiveStep(alert)
      if (stepIdx === activeStep) {
        return '处理中'
      }
      return '-'
    }
    return '-'
  }

  const getNextResponsible = (alert: Alert): string => {
    const activeStep = getActiveStep(alert)
    if (activeStep >= 3) return '无'
    const nextRole = STEP_ROLE_MAP[activeStep + 1]
    return nextRole ? ROLE_LABEL_MAP[nextRole] : '无'
  }

  const getCurrentStuckStep = (alert: Alert): string => {
    const activeStep = getActiveStep(alert)
    if (activeStep >= 3) return '已完成'
    return STEP_LABELS[activeStep]
  }

  const renderTabs = () => {
    const tabs: { key: WorkbenchTab; label: string; icon: typeof Inbox }[] = [
      { key: 'pending', label: '待我处理', icon: Inbox },
      { key: 'processed', label: '已处理', icon: CheckSquare },
      { key: 'overdue', label: '超时未处理', icon: AlertOctagon },
    ]

    return (
      <div className="card p-1.5 flex gap-1.5">
        {tabs.map(({ key, label, icon: Icon }) => {
          const isActive = activeTab === key
          const count = tabCounts[key]
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                isActive
                  ? key === 'overdue'
                    ? 'bg-alert-red/20 text-alert-red border border-alert-red/30'
                    : 'bg-cyber-500/20 text-cyber-400 border border-cyber-500/30'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-navy-700/50 border border-transparent'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
              <span
                className={`ml-1 px-2 py-0.5 text-xs rounded-full ${
                  isActive
                    ? key === 'overdue'
                      ? 'bg-alert-red/30 text-alert-red'
                      : 'bg-cyber-500/30 text-cyber-400'
                    : 'bg-navy-700 text-gray-400'
                }`}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-6 h-6 text-cyber-400" />
        <h1 className="text-xl font-bold text-gray-100">预警调度工作台</h1>
        {currentUser && (
          <div className="ml-auto flex items-center gap-2 text-sm text-gray-400">
            <User className="w-4 h-4" />
            <span>{currentUser.name}</span>
            <span className="text-gray-600">|</span>
            <span className="text-cyber-400">{ROLE_LABEL_MAP[currentUser.role]}</span>
          </div>
        )}
      </div>

      {renderTabs()}

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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="预警总数" value={stats.total} color="text-gray-100" />
        <StatCard label="待确认" value={stats.pending} color="text-alert-orange" />
        <StatCard label="处理中" value={stats.inProgress} color="text-cyber-400" />
        <StatCard label="已解决" value={stats.resolved} color="text-alert-green" />
      </div>

      <div className="space-y-3">
        {filteredAlerts.length === 0 && (
          <div className="card text-center text-gray-500 py-10">暂无预警数据</div>
        )}
        {filteredAlerts.map((alert) => {
          const isExpanded = expandedId === alert.id
          const activeStep = getActiveStep(alert)
          const derivedStatus = deriveDisplayStatus(alert)
          const overdueMark = activeTab === 'overdue' || (activeTab === 'pending' && isOverdue(alert))

          return (
            <div
              key={alert.id}
              className={`card transition-all ${
                overdueMark ? 'border-alert-red/40 ring-1 ring-alert-red/20' : ''
              }`}
            >
              <div
                className="flex items-start justify-between cursor-pointer select-none"
                onClick={() => toggleExpand(alert.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-medium text-gray-100 truncate">{alert.title}</span>
                    <span className={getTypeBadge(alert.type)}>{getTypeLabel(alert.type)}</span>
                    <span className={DERIVED_STATUS_BADGE[derivedStatus]}>
                      {DERIVED_STATUS_LABEL[derivedStatus]}
                    </span>
                    {overdueMark && (
                      <span className="badge-red flex items-center gap-1">
                        <AlertOctagon className="w-3 h-3" />
                        已超时
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 mb-2 truncate">{alert.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                    <span>{alert.communityName}</span>
                    <span>{alert.triggerDate}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      当前: {getCurrentStuckStep(alert)}
                    </span>
                  </div>
                </div>
                <div className="ml-3 mt-1 text-gray-500 flex-shrink-0">
                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </div>

              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-navy-600 space-y-5">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="w-4 h-4 text-cyber-400" />
                      <span className="text-sm font-medium text-gray-300">处理信息</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="bg-navy-700/50 rounded-lg p-3">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
                          <Clock className="w-3.5 h-3.5" />
                          <span>每步处理耗时</span>
                        </div>
                        <div className="space-y-1.5">
                          {STEP_LABELS.map((label, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-xs"
                            >
                              <span className="text-gray-400">{label}</span>
                              <span
                                className={`font-mono ${
                                  getStepDuration(alert, idx) === '处理中'
                                    ? 'text-cyber-400 animate-pulse'
                                    : getStepDuration(alert, idx) === '-'
                                      ? 'text-gray-600'
                                      : 'text-gray-300'
                                }`}
                              >
                                {getStepDuration(alert, idx)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-navy-700/50 rounded-lg p-3">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-alert-orange" />
                          <span>当前卡在哪一步</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <div
                            className={`w-2 h-2 mt-1.5 rounded-full ${
                              getActiveStep(alert) >= 3
                                ? 'bg-alert-green'
                                : 'bg-alert-orange animate-pulse'
                            }`}
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-200">
                              {getCurrentStuckStep(alert)}
                            </p>
                            {getActiveStep(alert) < 3 && (
                              <p className="text-xs text-gray-500 mt-0.5">
                                第 {getActiveStep(alert) + 1} 步 / 共 3 步
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="bg-navy-700/50 rounded-lg p-3">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
                          <User className="w-3.5 h-3.5" />
                          <span>下一步负责人</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                              getNextResponsible(alert) === '无'
                                ? 'bg-navy-600 text-gray-500'
                                : 'bg-cyber-500/20 text-cyber-400'
                            }`}
                          >
                            <User className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-200">
                              {getNextResponsible(alert)}
                            </p>
                            {getNextResponsible(alert) !== '无' && (
                              <p className="text-xs text-gray-500 mt-0.5">
                                待处理
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle className="w-4 h-4 text-cyber-400" />
                      <span className="text-sm font-medium text-gray-300">审批流程</span>
                    </div>

                    <div className="flex items-start gap-0">
                      {STEP_LABELS.map((label, idx) => {
                        const stepStatus = getStepStatus(alert, idx)
                        const isActive = idx === activeStep && derivedStatus !== 'resolved'
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
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-1 text-xs text-cyber-400">
                                      <CheckCircle className="w-3 h-3" />
                                      <span>已通过</span>
                                    </div>
                                    {approval?.timestamp && (
                                      <p className="text-xs text-gray-500">{approval.timestamp}</p>
                                    )}
                                    {approval?.comment && (
                                      <p className="text-xs text-gray-400">处理意见: {approval.comment}</p>
                                    )}
                                  </div>
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
                                      <>
                                        <textarea
                                          value={commentInputs[`${alert.id}-${idx + 1}`] || ''}
                                          onChange={(e) =>
                                            setCommentInputs((prev) => ({
                                              ...prev,
                                              [`${alert.id}-${idx + 1}`]: e.target.value,
                                            }))
                                          }
                                          placeholder="请输入审批意见..."
                                          className="input-dark w-full text-xs resize-none"
                                          rows={2}
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            const comment = commentInputs[`${alert.id}-${idx + 1}`] || ''
                                            handleApprove(alert.id, idx + 1, comment)
                                          }}
                                          className="btn-primary text-xs px-3 py-1.5"
                                        >
                                          审批
                                        </button>
                                      </>
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
