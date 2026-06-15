import { create } from 'zustand'
import type { Community, Alert, User, ProvinceName } from '../types'
import { communities as mockCommunities, alerts as mockAlerts, users as mockUsers } from '../data/mockData'

interface AppState {
  currentUser: User | null
  communities: Community[]
  alerts: Alert[]
  selectedProvince: ProvinceName | '全国'
  selectedCommunity: Community | null
  sidebarCollapsed: boolean

  login: (userId: string) => void
  logout: () => void
  setSelectedProvince: (province: ProvinceName | '全国') => void
  setSelectedCommunity: (community: Community | null) => void
  toggleSidebar: () => void
  updateAlertStatus: (alertId: string, status: Alert['status']) => void
  approveAlertStep: (alertId: string, step: number, comment?: string) => void

  getFilteredCommunities: () => Community[]
  getFilteredAlerts: () => Alert[]
  getProvinceStats: () => { province: string; avgSatisfaction: number; communityCount: number }[]
}

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: mockUsers[0],
  communities: mockCommunities,
  alerts: mockAlerts,
  selectedProvince: '全国',
  selectedCommunity: null,
  sidebarCollapsed: false,

  login: (userId: string) => {
    const user = mockUsers.find((u) => u.id === userId)
    if (user) set({ currentUser: user })
  },

  logout: () => set({ currentUser: null }),

  setSelectedProvince: (province) => set({ selectedProvince: province }),

  setSelectedCommunity: (community) => set({ selectedCommunity: community }),

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

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
