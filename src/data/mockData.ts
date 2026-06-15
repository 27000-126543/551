import type { Community, Alert, ComplaintRecord, EquipmentRecord, ContractAnalysis, WeeklyReport, User, Building } from '../types'

const propertyCompanies = ['万科物业', '碧桂园服务', '龙湖智创', '保利物业', '中海物业', '绿城服务', '融创服务', '金地物业', '雅生活', '彩生活']

const complaintTypes = ['安保', '保洁', '噪音', '漏水', '电梯', '绿化', '停车', '装修', '公共设施', '物业服务']

const equipmentTypes = ['电梯', '门禁', '监控', '消防', '供水', '配电', '照明', '通风', '排水', '供暖']

function rand(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateFeeHistory(): Community['feeHistory'] {
  const history: Community['feeHistory'] = []
  const now = new Date()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const rate = rand(55, 98)
    const total = randInt(200, 1200)
    history.push({
      month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      collectionRate: rate,
      totalHouseholds: total,
      paidHouseholds: Math.round(total * rate / 100),
    })
  }
  return history
}

export function generateCommunities(): Community[] {
  const communities: Community[] = []
  const provinces = ['北京', '上海', '广东', '江苏', '浙江', '四川', '湖北', '山东', '河南', '福建', '湖南', '安徽', '河北', '重庆', '陕西', '辽宁', '云南', '广西', '江西', '天津']

  let id = 1
  for (const province of provinces) {
    const count = randInt(3, 12)
    for (let i = 0; i < count; i++) {
      const feeHistory = generateFeeHistory()
      const last3 = feeHistory.slice(-3)
      const avgFeeRate = last3.reduce((s, f) => s + f.collectionRate, 0) / 3
      const feeCollectionRate = Math.round(avgFeeRate * 100) / 100
      const equipmentFailureRate = rand(0.5, 8)
      const equipmentIntactRate = Math.round((100 - equipmentFailureRate) * 100) / 100

      communities.push({
        id: `c${String(id).padStart(3, '0')}`,
        name: `${province}${['花园', '名苑', '雅居', '华庭', '丽景', '新城', '佳园', '御府', '府邸', '国际'][i % 10]}小区`,
        province,
        city: province,
        district: `${['朝阳', '海淀', '浦东', '天河', '鼓楼', '西湖', '武侯', '洪山', '历下', '金水'][i % 10]}区`,
        propertyCompany: pick(propertyCompanies),
        region: getRegion(province),
        buildings: randInt(5, 30),
        households: randInt(300, 3000),
        equipmentIntactRate,
        feeCollectionRate,
        complaintResponseRate: rand(60, 99),
        satisfactionScore: rand(60, 95),
        equipmentFailureRate,
        feeHistory,
      })
      id++
    }
  }
  return communities
}

function getRegion(province: string): string {
  const regions: Record<string, string[]> = {
    '华北区': ['北京', '天津', '河北', '山西', '内蒙古'],
    '东北区': ['辽宁', '吉林', '黑龙江'],
    '华东区': ['上海', '江苏', '浙江', '安徽', '福建', '江西', '山东'],
    '华中区': ['河南', '湖北', '湖南'],
    '华南区': ['广东', '广西', '海南'],
    '西南区': ['重庆', '四川', '贵州', '云南', '西藏'],
    '西北区': ['陕西', '甘肃', '青海', '宁夏', '新疆'],
  }
  for (const [region, provs] of Object.entries(regions)) {
    if (provs.includes(province)) return region
  }
  return '华东区'
}

export function generateAlerts(communities: Community[]): Alert[] {
  const alerts: Alert[] = []
  let id = 1

  for (const c of communities) {
    const last3 = c.feeHistory.slice(-3)
    const avgFee = last3.reduce((s, f) => s + f.collectionRate, 0) / 3

    if (avgFee < 70) {
      alerts.push({
        id: `a${String(id).padStart(3, '0')}`,
        communityId: c.id,
        communityName: c.name,
        type: 'fee',
        level: 1,
        title: `物业费收缴率持续偏低`,
        description: `${c.name}连续3个月物业费收缴率平均为${avgFee.toFixed(1)}%，低于70%预警线`,
        triggerDate: '2026-06-10',
        status: pick(['pending', 'confirmed', 'reviewed', 'approved', 'resolved']),
        approvals: generateApprovals(pick(['pending', 'confirmed', 'reviewed', 'approved', 'resolved'])),
      })
      id++
    }

    if (c.equipmentFailureRate > 5) {
      alerts.push({
        id: `a${String(id).padStart(3, '0')}`,
        communityId: c.id,
        communityName: c.name,
        type: 'equipment',
        level: 1,
        title: `设备故障率超标`,
        description: `${c.name}设备故障率达${c.equipmentFailureRate.toFixed(1)}%，超过5%预警线`,
        triggerDate: '2026-06-08',
        status: pick(['pending', 'confirmed', 'reviewed', 'approved', 'resolved']),
        approvals: generateApprovals(pick(['pending', 'confirmed', 'reviewed', 'approved', 'resolved'])),
      })
      id++
    }
  }

  return alerts
}

function generateApprovals(status: string): Alert['approvals'] {
  const roles = [
    { step: 1, role: '项目经理', assignee: '张明' },
    { step: 2, role: '区域总监', assignee: '李强' },
    { step: 3, role: '集团总裁', assignee: '王建国' },
  ]
  const stepMap: Record<string, number> = { pending: 0, confirmed: 1, reviewed: 2, approved: 3, resolved: 3 }
  const currentStep = stepMap[status] ?? 0

  return roles.map((r, idx) => {
    if (idx < currentStep) {
      return { ...r, status: 'approved' as const, timestamp: `2026-06-${10 + idx}`, comment: '同意' }
    } else if (idx === currentStep && currentStep > 0) {
      return { ...r, status: 'pending' as const }
    }
    return { ...r, status: 'pending' as const }
  })
}

export function generateBuildings(communityId: string, count: number): Building[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${communityId}-b${i + 1}`,
    communityId,
    name: `${i + 1}号楼`,
    floors: randInt(6, 33),
    households: randInt(60, 264),
  }))
}

export function generateComplaints(communityId: string, buildings: Building[]): ComplaintRecord[] {
  const complaints: ComplaintRecord[] = []
  const now = new Date()
  for (let d = 6; d >= 0; d--) {
    const date = new Date(now)
    date.setDate(date.getDate() - d)
    const dateStr = date.toISOString().slice(0, 10)
    const count = randInt(1, 8)
    for (let i = 0; i < count; i++) {
      const building = pick(buildings)
      complaints.push({
        id: `${communityId}-comp-${d}-${i}`,
        communityId,
        buildingId: building.id,
        buildingName: building.name,
        type: pick(complaintTypes),
        description: `${building.name}${pick(complaintTypes)}问题投诉`,
        status: pick(['pending', 'processing', 'resolved']),
        createdAt: dateStr,
        resolvedAt: pick([undefined, dateStr]),
      })
    }
  }
  return complaints
}

export function generateEquipment(communityId: string, buildings: Building[]): EquipmentRecord[] {
  const records: EquipmentRecord[] = []
  const now = new Date()

  for (const building of buildings) {
    const eqCount = randInt(3, 8)
    for (let i = 0; i < eqCount; i++) {
      const eqType = pick(equipmentTypes)
      const isFault = Math.random() < 0.15
      const faultDate = isFault ? new Date(now.getTime() - randInt(1, 14) * 86400000).toISOString().slice(0, 10) : undefined
      const isRepairing = isFault && Math.random() < 0.6
      const repairDate = isRepairing ? new Date(now.getTime() - randInt(0, 3) * 86400000).toISOString().slice(0, 10) : undefined
      const isCompleted = isRepairing && Math.random() < 0.5
      const completedDate = isCompleted ? new Date(now.getTime() - randInt(0, 1) * 86400000).toISOString().slice(0, 10) : undefined

      records.push({
        id: `${communityId}-eq-${building.id}-${i}`,
        communityId,
        buildingId: building.id,
        buildingName: building.name,
        type: eqType,
        name: `${building.name}${eqType}设备${i + 1}`,
        status: isCompleted ? 'normal' : isRepairing ? 'repairing' : isFault ? 'fault' : 'normal',
        faultDate,
        repairDate,
        completedDate,
      })
    }
  }
  return records
}

export function generateContractAnalysis(communityId: string): ContractAnalysis {
  const categories = ['安保巡逻频次', '保洁清洁频次', '绿化养护标准', '电梯维保周期', '投诉响应时效', '公共照明完好率', '消防设施完好率', '供水供电保障率', '车位管理规范', '访客登记规范']
  const units = ['次/天', '次/天', '次/月', '天/次', '小时', '%', '%', '%', '%', '%']

  return {
    id: `contract-${communityId}`,
    communityId,
    contractFile: '物业服务合同.pdf',
    budgetFile: '年度预算表.xlsx',
    standards: categories.map((cat, i) => ({
      category: cat,
      standard: `${cat}不低于${units[i] === '%' ? '95' : i < 4 ? '2' : '4'}${units[i]}`,
      target: units[i] === '%' ? 95 : i < 4 ? 2 : 4,
      unit: units[i],
    })),
    comparisons: categories.map((cat, i) => {
      const standardValue = units[i] === '%' ? 95 : i < 4 ? 2 : 4
      const actualValue = units[i] === '%' ? rand(70, 100) : rand(0.5, 5)
      const deviation = Math.round(Math.abs((actualValue - standardValue) / standardValue * 100) * 100) / 100
      return {
        category: cat,
        standardValue,
        actualValue: Math.round(actualValue * 100) / 100,
        deviation,
        isAbnormal: deviation > 15,
      }
    }),
  }
}

export function generateWeeklyReports(communities: Community[]): WeeklyReport[] {
  return communities.map((c) => ({
    id: `report-${c.id}`,
    communityId: c.id,
    communityName: c.name,
    weekStart: '2026-06-09',
    weekEnd: '2026-06-15',
    feeCollectionYoY: rand(-15, 15),
    feeCollectionMoM: rand(-8, 8),
    complaintTypeDistribution: Object.fromEntries(
      complaintTypes.slice(0, 6).map((t) => [t, randInt(2, 30)])
    ),
    avgMaintenanceResponseHours: rand(1, 48),
    suggestions: [
      '建议增加安保巡逻频次，夜间重点区域每小时至少1次',
      '投诉响应时效需改善，建议设置30分钟响应红线',
      '电梯维保周期建议从30天缩短至21天',
      '保洁人力配置建议增加15%，提升公共区域清洁质量',
    ].slice(0, randInt(2, 4)),
  }))
}

export function generateUsers(): User[] {
  return [
    { id: 'u1', name: '王建国', role: 'group_admin', region: undefined, communityIds: [] },
    { id: 'u2', name: '李强', role: 'regional_director', region: '华东区', communityIds: [] },
    { id: 'u3', name: '赵明', role: 'regional_director', region: '华南区', communityIds: [] },
    { id: 'u4', name: '张明', role: 'project_manager', region: undefined, communityIds: ['c001', 'c002'] },
    { id: 'u5', name: '刘芳', role: 'owner_committee', region: undefined, communityIds: ['c001'] },
  ]
}

export const communities = generateCommunities()
export const alerts = generateAlerts(communities)
export const users = generateUsers()
export const weeklyReports = generateWeeklyReports(communities)
