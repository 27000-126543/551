import { create } from 'zustand'
import type { Community, Alert, User, ProvinceName } from '../types'
import { communities as mockCommunities, alerts as mockAlerts, users as mockUsers } from '../data/mockData'

type AuditAction = 'view_community' | 'export_report' | 'approve_alert'

interface AuditLogEntry {
  id: string
  userId: string
  userName: string
  action: AuditAction
  targetId: string
  targetName: string
  timestamp: string
  region?: string
}

interface AppState {
  currentUser: User | null
  communities: Community[]
  alerts: Alert[]
  auditLogs: AuditLogEntry[]
  selectedProvince: ProvinceName | '全国'
  selectedCommunity: Community | null
  sidebarCollapsed: boolean
  contractHistory: Array<{ id: string; communityId: string; communityName: string; contractFileName: string; budgetFileName: string; analysis: unknown; dataSource: 'excel' | 'mock'; timestamp: string }>

  login: (userId: string) => void
  logout: () => void
  setSelectedProvince: (province: ProvinceName | '全国') => void
  setSelectedCommunity: (community: Community | null) => void
  toggleSidebar: () => void
  updateAlertStatus: (alertId: string, status: Alert['status']) => void
  approveAlertStep: (alertId: string, step: number, comment?: string) => void
  addAuditLog: (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => void
  addContractHistory: (record: Omit<{ id: string; communityId: string; communityName: string; contractFileName: string; budgetFileName: string; analysis: unknown; dataSource: 'excel' | 'mock'; timestamp: string }, 'id' | 'timestamp'> & { analysis: unknown }) => void

  getFilteredCommunities: () => Community[]
  getFilteredAlerts: () => Alert[]
  getProvinceStats: () => { province: string; avgSatisfaction: number; communityCount: number }[]
}

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: mockUsers[0],
  communities: mockCommunities,
  alerts: mockAlerts,
  auditLogs: [
    { id: 'log_1', userId: 'u1', userName: '王建国', action: 'view_community', targetId: 'c001', targetName: '北京花园小区', timestamp: '2026/6/15 09:12:30', region: '华北区' },
    { id: 'log_2', userId: 'u2', userName: '李强', action: 'export_report', targetId: 'c010', targetName: '上海名苑小区', timestamp: '2026/6/15 09:45:22', region: '华东区' },
    { id: 'log_3', userId: 'u1', userName: '王建国', action: 'approve_alert', targetId: 'a001', targetName: '物业费收缴率持续偏低', timestamp: '2026/6/15 10:03:15', region: '华北区' },
    { id: 'log_4', userId: 'u3', userName: '赵明', action: 'view_community', targetId: 'c045', targetName: '广东雅居小区', timestamp: '2026/6/15 10:22:48', region: '华南区' },
    { id: 'log_5', userId: 'u4', userName: '张明', action: 'view_community', targetId: 'c002', targetName: '北京华庭小区', timestamp: '2026/6/15 10:51:09', region: '华北区' },
    { id: 'log_6', userId: 'u2', userName: '李强', action: 'view_community', targetId: 'c015', targetName: '江苏丽景小区', timestamp: '2026/6/15 11:15:33', region: '华东区' },
    { id: 'log_7', userId: 'u3', userName: '赵明', action: 'export_report', targetId: 'c050', targetName: '广东新城小区', timestamp: '2026/6/15 11:48:17', region: '华南区' },
    { id: 'log_8', userId: 'u5', userName: '刘芳', action: 'view_community', targetId: 'c001', targetName: '北京花园小区', timestamp: '2026/6/15 13:05:42', region: '华北区' },
    { id: 'log_9', userId: 'u2', userName: '李强', action: 'approve_alert', targetId: 'a008', targetName: '设备故障率超标', timestamp: '2026/6/15 13:32:28', region: '华东区' },
    { id: 'log_10', userId: 'u1', userName: '王建国', action: 'export_report', targetId: 'c030', targetName: '四川佳园小区', timestamp: '2026/6/15 14:10:55', region: '西南区' },
    { id: 'log_11', userId: 'u4', userName: '张明', action: 'export_report', targetId: 'c001', targetName: '北京花园小区', timestamp: '2026/6/15 14:38:20', region: '华北区' },
    { id: 'log_12', userId: 'u3', userName: '赵明', action: 'approve_alert', targetId: 'a015', targetName: '物业费收缴率持续偏低', timestamp: '2026/6/15 15:05:11', region: '华南区' },
    { id: 'log_13', userId: 'u1', userName: '王建国', action: 'view_community', targetId: 'c060', targetName: '湖北御府小区', timestamp: '2026/6/15 15:33:47', region: '华中区' },
    { id: 'log_14', userId: 'u2', userName: '李强', action: 'view_community', targetId: 'c020', targetName: '浙江府邸小区', timestamp: '2026/6/15 16:02:19', region: '华东区' },
    { id: 'log_15', userId: 'u4', userName: '张明', action: 'approve_alert', targetId: 'a002', targetName: '设备故障率超标', timestamp: '2026/6/15 16:28:54', region: '华北区' },
    { id: 'log_16', userId: 'u1', userName: '王建国', action: 'view_community', targetId: 'c070', targetName: '山东国际小区', timestamp: '2026/6/14 17:12:33', region: '华东区' },
    { id: 'log_17', userId: 'u3', userName: '赵明', action: 'view_community', targetId: 'c055', targetName: '广西花园小区', timestamp: '2026/6/14 18:22:10', region: '华南区' },
    { id: 'log_18', userId: 'u2', userName: '李强', action: 'export_report', targetId: 'c025', targetName: '安徽名苑小区', timestamp: '2026/6/14 19:05:45', region: '华东区' },
  ],
  selectedProvince: '全国',
  selectedCommunity: null,
  sidebarCollapsed: false,
  contractHistory: [],

  login: (userId: string) => {
    const user = mockUsers.find((u) => u.id === userId)
    if (user) set({ currentUser: user })
  },

  logout: () => set({ currentUser: null }),

  setSelectedProvince: (province) => set({ selectedProvince: province }),

  setSelectedCommunity: (community) => set({ selectedCommunity: community }),

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  addAuditLog: (entry) =>
    set((s) => ({
      auditLogs: [
        { ...entry, id: 'log_' + Date.now(), timestamp: new Date().toLocaleString('zh-CN') },
        ...s.auditLogs,
      ],
    })),

  addContractHistory: (record) => set((s) => ({ contractHistory: [{ ...record, id: 'h_' + Date.now(), timestamp: new Date().toLocaleString('zh-CN') }, ...s.contractHistory] })),

  updateAlertStatus: (alertId, status) =>
    set((s) => ({
      alerts: s.alerts.map((a) => (a.id === alertId ? { ...a, status } : a)),
    })),

  approveAlertStep: (alertId, step, comment) =>
    set((s) => ({
      alerts: s.alerts.map((a) => {
        if (a.id !== alertId) return a
        const approvals = a.approvals.map((apr) => {
          if (apr.step === step) {
            return { ...apr, status: 'approved' as const, timestamp: new Date().toISOString().slice(0, 10), comment: comment || '同意' }
          }
          if (apr.step === step + 1 && apr.status === 'pending') {
            return apr
          }
          return apr
        })
        const newStatus = step === 1 ? 'confirmed' : step === 2 ? 'reviewed' : step === 3 ? 'approved' : a.status
        return { ...a, approvals, status: newStatus }
      }),
    })),

  getFilteredCommunities: () => {
    const { communities, selectedProvince, currentUser } = get()
    let filtered = communities
    if (selectedProvince !== '全国') {
      filtered = filtered.filter((c) => c.province === selectedProvince)
    }
    if (currentUser && currentUser.role !== 'group_admin') {
      if (currentUser.role === 'regional_director') {
        filtered = filtered.filter((c) => c.region === currentUser.region)
      } else if (currentUser.communityIds.length > 0) {
        filtered = filtered.filter((c) => currentUser.communityIds.includes(c.id))
      }
    }
    return filtered
  },

  getFilteredAlerts: () => {
    const { alerts, selectedProvince, communities, currentUser } = get()
    let filtered = alerts
    if (selectedProvince !== '全国') {
      const provinceCommIds = communities.filter((c) => c.province === selectedProvince).map((c) => c.id)
      filtered = filtered.filter((a) => provinceCommIds.includes(a.communityId))
    }
    if (currentUser && currentUser.role !== 'group_admin') {
      if (currentUser.role === 'regional_director') {
        const regionCommIds = communities.filter((c) => c.region === currentUser.region).map((c) => c.id)
        filtered = filtered.filter((a) => regionCommIds.includes(a.communityId))
      } else if (currentUser.communityIds.length > 0) {
        filtered = filtered.filter((a) => currentUser.communityIds.includes(a.communityId))
      }
    }
    return filtered
  },

  getProvinceStats: () => {
    const filteredCommunities = get().getFilteredCommunities()
    const provinceMap = new Map<string, { total: number; count: number }>()
    for (const c of filteredCommunities) {
      const existing = provinceMap.get(c.province) ?? { total: 0, count: 0 }
      existing.total += c.satisfactionScore
      existing.count += 1
      provinceMap.set(c.province, existing)
    }
    return Array.from(provinceMap.entries()).map(([province, { total, count }]) => ({
      province,
      avgSatisfaction: Math.round((total / count) * 100) / 100,
      communityCount: count,
    }))
  },
}))
