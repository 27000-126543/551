export interface MonthlyFeeData {
  month: string
  collectionRate: number
  totalHouseholds: number
  paidHouseholds: number
}

export interface Community {
  id: string
  name: string
  province: string
  city: string
  district: string
  propertyCompany: string
  region: string
  buildings: number
  households: number
  equipmentIntactRate: number
  feeCollectionRate: number
  complaintResponseRate: number
  satisfactionScore: number
  equipmentFailureRate: number
  feeHistory: MonthlyFeeData[]
}

export interface ApprovalRecord {
  step: number
  role: string
  assignee: string
  status: 'pending' | 'approved' | 'rejected'
  timestamp?: string
  comment?: string
}

export interface Alert {
  id: string
  communityId: string
  communityName: string
  type: 'fee' | 'equipment'
  level: 1 | 2 | 3
  title: string
  description: string
  triggerDate: string
  status: 'pending' | 'confirmed' | 'reviewed' | 'approved' | 'resolved'
  approvals: ApprovalRecord[]
}

export interface ComplaintRecord {
  id: string
  communityId: string
  buildingId: string
  buildingName: string
  type: string
  description: string
  status: 'pending' | 'processing' | 'resolved'
  createdAt: string
  resolvedAt?: string
}

export interface EquipmentRecord {
  id: string
  communityId: string
  buildingId: string
  buildingName: string
  type: string
  name: string
  status: 'normal' | 'fault' | 'repairing'
  faultDate?: string
  repairDate?: string
  completedDate?: string
}

export interface ServiceStandard {
  category: string
  standard: string
  target: number
  unit: string
}

export interface StandardComparison {
  category: string
  standardValue: number
  actualValue: number
  deviation: number
  isAbnormal: boolean
}

export interface ContractAnalysis {
  id: string
  communityId: string
  contractFile: string
  budgetFile: string
  standards: ServiceStandard[]
  comparisons: StandardComparison[]
}

export interface WeeklyReport {
  id: string
  communityId: string
  communityName: string
  weekStart: string
  weekEnd: string
  feeCollectionYoY: number
  feeCollectionMoM: number
  complaintTypeDistribution: Record<string, number>
  avgMaintenanceResponseHours: number
  suggestions: string[]
}

export interface User {
  id: string
  name: string
  role: 'group_admin' | 'regional_director' | 'project_manager' | 'owner_committee'
  region?: string
  communityIds: string[]
  avatar?: string
}

export interface Building {
  id: string
  communityId: string
  name: string
  floors: number
  households: number
}

export const PROVINCES = [
  '北京', '天津', '河北', '山西', '内蒙古',
  '辽宁', '吉林', '黑龙江', '上海', '江苏',
  '浙江', '安徽', '福建', '江西', '山东',
  '河南', '湖北', '湖南', '广东', '广西',
  '海南', '重庆', '四川', '贵州', '云南',
  '西藏', '陕西', '甘肃', '青海', '宁夏', '新疆'
] as const

export type ProvinceName = typeof PROVINCES[number]

export const REGIONS: Record<string, string[]> = {
  '华北区': ['北京', '天津', '河北', '山西', '内蒙古'],
  '东北区': ['辽宁', '吉林', '黑龙江'],
  '华东区': ['上海', '江苏', '浙江', '安徽', '福建', '江西', '山东'],
  '华中区': ['河南', '湖北', '湖南'],
  '华南区': ['广东', '广西', '海南'],
  '西南区': ['重庆', '四川', '贵州', '云南', '西藏'],
  '西北区': ['陕西', '甘肃', '青海', '宁夏', '新疆'],
}
