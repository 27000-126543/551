import { useState, useMemo } from 'react'
import { useAppStore } from '../store/useAppStore'
import { REGIONS } from '../types'
import { users } from '../data/mockData'
import {
  Shield,
  Users,
  Building2,
  ChevronRight,
  ChevronDown,
  Edit,
  Trash2,
  Plus,
  Search,
  Eye,
  FileClock,
} from 'lucide-react'

const roleLabels: Record<string, string> = {
  group_admin: '集团管理员',
  regional_director: '区域总监',
  project_manager: '项目经理',
  owner_committee: '业委会',
}

const roleDescriptions = [
  {
    role: 'group_admin',
    label: '集团管理员',
    icon: Shield,
    color: '#00D4AA',
    desc: '拥有全部数据访问权限，可查看全国所有区域和社区的数据，负责全局策略制定与预警终审。',
  },
  {
    role: 'regional_director',
    label: '区域总监',
    icon: Users,
    color: '#33DDBB',
    desc: '可查看所辖区域内所有社区数据，负责区域运营监督与预警复核，无法查看其他区域数据。',
  },
  {
    role: 'project_manager',
    label: '项目经理',
    icon: Building2,
    color: '#FAAD14',
    desc: '仅可查看所管辖社区的数据，负责日常运营管理、预警确认与处理方案提交。',
  },
  {
    role: 'owner_committee',
    label: '业委会',
    icon: Users,
    color: '#FF7A45',
    desc: '可查看所属社区的关键运营指标与周报摘要，参与服务标准评估与满意度反馈。',
  },
]

type TabKey = 'org' | 'audit' | 'trail'

const actionLabels: Record<string, string> = {
  view_community: '查看小区',
  export_report: '导出报告',
  approve_alert: '审批预警',
}

const actionColors: Record<string, string> = {
  view_community: '#22D3EE',
  export_report: '#FB923C',
  approve_alert: '#EF4444',
}

export default function Admin() {
  const { communities, currentUser, getFilteredCommunities, auditLogs } = useAppStore()
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set())
  const [expandedGroup, setExpandedGroup] = useState(true)
  const [activeTab, setActiveTab] = useState<TabKey>('org')

  const [fwdRole, setFwdRole] = useState<string>('all')
  const [fwdRegion, setFwdRegion] = useState<string>('all')
  const [fwdCommunitySearch, setFwdCommunitySearch] = useState('')

  const [revCommunityId, setRevCommunityId] = useState<string>('')

  const [trailAction, setTrailAction] = useState<string>('all')
  const [trailUser, setTrailUser] = useState<string>('all')
  const [trailRegion, setTrailRegion] = useState<string>('all')

  const filteredCommunities = useMemo(() => getFilteredCommunities(), [getFilteredCommunities, currentUser])

  const filteredUsers = useMemo(() => {
    if (!currentUser || currentUser.role === 'group_admin') return users
    const filteredCommunityIds = filteredCommunities.map((c) => c.id)
    return users.filter((user) => {
      if (user.role === 'group_admin') return false
      if (user.role === 'regional_director') {
        return currentUser.role === 'regional_director' && user.region === currentUser.region
      }
      return user.communityIds.some((id) => filteredCommunityIds.includes(id))
    })
  }, [currentUser, filteredCommunities])

  const treeData = useMemo(() => {
    const regionCommMap = new Map<string, typeof filteredCommunities>()
    for (const c of filteredCommunities) {
      const list = regionCommMap.get(c.region) ?? []
      list.push(c)
      regionCommMap.set(c.region, list)
    }
    return Object.keys(REGIONS)
      .map((region) => ({
        region,
        communities: regionCommMap.get(region) ?? [],
      }))
      .filter((item) => item.communities.length > 0)
  }, [filteredCommunities])

  const trailUserOptions = useMemo(() => {
    if (!currentUser || currentUser.role === 'group_admin') return users
    const filteredCommunityIds = filteredCommunities.map((c) => c.id)
    return users.filter((user) => {
      if (user.role === 'group_admin') return false
      if (user.role === 'regional_director') {
        return currentUser.role === 'regional_director' && user.region === currentUser.region
      }
      return user.communityIds.some((id) => filteredCommunityIds.includes(id))
    })
  }, [currentUser, filteredCommunities])

  const trailRegionOptions = useMemo(() => {
    if (!currentUser || currentUser.role === 'group_admin') {
      return Object.keys(REGIONS)
    }
    if (currentUser.role === 'regional_director' && currentUser.region) {
      return [currentUser.region]
    }
    const regions = filteredCommunities.map((c) => c.region)
    return [...new Set(regions)]
  }, [currentUser, filteredCommunities])

  const filteredAuditLogs = useMemo(() => {
    let logs = auditLogs

    if (currentUser) {
      const filteredCommunityIds = filteredCommunities.map((c) => c.id)
      const userRegionMap = new Map<string, string | undefined>()
      const userCommMap = new Map<string, string[]>()
      for (const u of users) {
        userRegionMap.set(u.id, u.region)
        userCommMap.set(u.id, u.communityIds)
      }

      if (currentUser.role === 'regional_director') {
        logs = logs.filter((log) => {
          if (log.region === currentUser.region) return true
          const logUserRegion = userRegionMap.get(log.userId)
          if (logUserRegion === currentUser.region) return true
          const logUserComms = userCommMap.get(log.userId) ?? []
          return logUserComms.some((id) => filteredCommunityIds.includes(id))
        })
      } else if (currentUser.role === 'project_manager' || currentUser.role === 'owner_committee') {
        logs = logs.filter((log) => {
          const logUserComms = userCommMap.get(log.userId) ?? []
          return logUserComms.some((id) => currentUser.communityIds.includes(id))
        })
      }
    }

    if (trailAction !== 'all') {
      logs = logs.filter((log) => log.action === trailAction)
    }
    if (trailUser !== 'all') {
      logs = logs.filter((log) => log.userId === trailUser)
    }
    if (trailRegion !== 'all') {
      logs = logs.filter((log) => log.region === trailRegion)
    }

    return logs
  }, [auditLogs, currentUser, filteredCommunities, trailAction, trailUser, trailRegion])

  const toggleRegion = (region: string) => {
    setExpandedRegions((prev) => {
      const next = new Set(prev)
      if (next.has(region)) next.delete(region)
      else next.add(region)
      return next
    })
  }

  const getUserScope = (user: (typeof users)[number]): string => {
    if (user.role === 'group_admin') return '全国'
    if (user.role === 'regional_director') return user.region ?? ''
    if (user.communityIds.length > 0) {
      let visibleCommunityIds = user.communityIds
      if (currentUser && currentUser.role !== 'group_admin') {
        if (currentUser.role === 'regional_director') {
          const regionCommunityIds = filteredCommunities.map((c) => c.id)
          visibleCommunityIds = user.communityIds.filter((id) => regionCommunityIds.includes(id))
        } else if (currentUser.role === 'project_manager' || currentUser.role === 'owner_committee') {
          visibleCommunityIds = user.communityIds.filter((id) => currentUser.communityIds.includes(id))
        }
      }
      const names = visibleCommunityIds
        .map((id) => communities.find((c) => c.id === id)?.name)
        .filter(Boolean)
      return names.join('、')
    }
    return '-'
  }

  const getAccessibleCommunities = (user: (typeof users)[number]): string[] => {
    if (user.role === 'group_admin') {
      return filteredCommunities.map((c) => c.name)
    }
    if (user.role === 'regional_director') {
      return filteredCommunities.filter((c) => c.region === user.region).map((c) => c.name)
    }
    return user.communityIds
      .map((id) => communities.find((c) => c.id === id)?.name)
      .filter((n): n is string => !!n)
  }

  const getUserRegion = (user: (typeof users)[number]): string => {
    if (user.role === 'group_admin') return '全国'
    if (user.role === 'regional_director') return user.region ?? '-'
    const regions = user.communityIds
      .map((id) => communities.find((c) => c.id === id)?.region)
      .filter((r): r is string => !!r)
    return [...new Set(regions)].join('、') || '-'
  }

  const auditVisibleUsers = useMemo(() => {
    if (!currentUser || currentUser.role === 'group_admin') return users
    const filteredCommunityIds = filteredCommunities.map((c) => c.id)
    return users.filter((user) => {
      if (user.role === 'group_admin') return currentUser.role === 'group_admin'
      if (user.role === 'regional_director') {
        if (currentUser.role === 'regional_director') return user.region === currentUser.region
        return false
      }
      return user.communityIds.some((id) => filteredCommunityIds.includes(id))
    })
  }, [currentUser, filteredCommunities])

  const forwardResults = useMemo(() => {
    let result = auditVisibleUsers
    if (fwdRole !== 'all') {
      result = result.filter((u) => u.role === fwdRole)
    }
    if (fwdRegion !== 'all') {
      result = result.filter((u) => {
        if (u.role === 'group_admin') return true
        if (u.role === 'regional_director') return u.region === fwdRegion
        return u.communityIds.some((id) => {
          const c = communities.find((comm) => comm.id === id)
          return c?.region === fwdRegion
        })
      })
    }
    if (fwdCommunitySearch.trim()) {
      const keyword = fwdCommunitySearch.trim().toLowerCase()
      result = result.filter((u) => {
        const accessible = getAccessibleCommunities(u)
        return accessible.some((name) => name.toLowerCase().includes(keyword))
      })
    }
    return result
  }, [auditVisibleUsers, fwdRole, fwdRegion, fwdCommunitySearch, communities])

  const reverseResults = useMemo(() => {
    if (!revCommunityId) return []
    const targetCommunity = communities.find((c) => c.id === revCommunityId)
    if (!targetCommunity) return []

    let candidateUsers = users
    if (currentUser && currentUser.role !== 'group_admin') {
      const filteredCommunityIds = filteredCommunities.map((c) => c.id)
      if (!filteredCommunityIds.includes(revCommunityId)) return []
      if (currentUser.role === 'regional_director') {
        candidateUsers = candidateUsers.filter(
          (u) =>
            u.role === 'group_admin' ||
            (u.role === 'regional_director' && u.region === currentUser.region) ||
            u.communityIds.some((id) => filteredCommunityIds.includes(id))
        )
      } else {
        candidateUsers = candidateUsers.filter(
          (u) =>
            u.role === 'group_admin' ||
            u.communityIds.some((id) => currentUser.communityIds.includes(id))
        )
      }
    }

    return candidateUsers
      .filter((u) => {
        if (u.role === 'group_admin') return true
        if (u.role === 'regional_director') return targetCommunity.region === u.region
        return u.communityIds.includes(revCommunityId)
      })
      .map((u) => {
        let accessReason = ''
        if (u.role === 'group_admin') {
          accessReason = '全国权限'
        } else if (u.role === 'regional_director') {
          accessReason = `${u.region}管辖`
        } else {
          accessReason = '直接管辖'
        }
        return { ...u, accessReason }
      })
  }, [revCommunityId, currentUser, filteredCommunities, communities])

  const regionOptions = useMemo(() => {
    if (!currentUser || currentUser.role === 'group_admin') {
      return Object.keys(REGIONS)
    }
    if (currentUser.role === 'regional_director' && currentUser.region) {
      return [currentUser.region]
    }
    const regions = filteredCommunities.map((c) => c.region)
    return [...new Set(regions)]
  }, [currentUser, filteredCommunities])

  const revCommunityOptions = useMemo(() => {
    return filteredCommunities
  }, [filteredCommunities])

  const tabs: { key: TabKey; label: string; icon: typeof Shield }[] = [
    { key: 'org', label: '组织与用户', icon: Users },
    { key: 'audit', label: '权限审计', icon: Eye },
    { key: 'trail', label: '审计留痕', icon: FileClock },
  ]

  return (
    <div className="min-h-screen bg-navy-900 p-6 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Shield size={22} className="text-cyber-400" />
        <h2 className="text-lg font-bold text-white">权限管理</h2>
      </div>

      <div className="flex gap-1 p-1 bg-navy-800 rounded-lg w-fit">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === key
                ? 'bg-cyber-500/20 text-cyber-400 shadow-sm'
                : 'text-gray-400 hover:text-gray-200 hover:bg-navy-700/50'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'org' && (
        <>
          <div className="grid grid-cols-12 gap-5">
            <div className="col-span-5 card">
              <h3 className="text-gray-200 font-medium text-sm mb-4 flex items-center gap-2">
                <Building2 size={16} className="text-cyber-400" />
                组织架构
              </h3>

              <div className="space-y-1">
                <button
                  onClick={() => setExpandedGroup(!expandedGroup)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-navy-700/50 transition-colors text-left"
                >
                  {expandedGroup ? (
                    <ChevronDown size={16} className="text-cyber-400" />
                  ) : (
                    <ChevronRight size={16} className="text-gray-500" />
                  )}
                  <Building2 size={16} className="text-cyber-400" />
                  <span className="text-sm font-medium text-white">集团</span>
                  <span className="text-xs text-gray-500 ml-auto">
                    {filteredCommunities.length}个社区
                  </span>
                </button>

                {expandedGroup && (
                  <div className="ml-4 space-y-0.5">
                    {treeData.map(({ region, communities: regionCommunities }) => {
                      const isExpanded = expandedRegions.has(region)
                      return (
                        <div key={region}>
                          <button
                            onClick={() => toggleRegion(region)}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-navy-700/50 transition-colors text-left"
                          >
                            {isExpanded ? (
                              <ChevronDown size={14} className="text-gray-400" />
                            ) : (
                              <ChevronRight size={14} className="text-gray-500" />
                            )}
                            <span className="text-sm text-gray-300">{region}</span>
                            <span className="text-xs text-gray-500 ml-auto">
                              {regionCommunities.length}个社区
                            </span>
                          </button>

                          {isExpanded && (
                            <div className="ml-5 space-y-0.5">
                              {regionCommunities.map((c) => (
                                <div
                                  key={c.id}
                                  className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-navy-700/30 transition-colors"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-cyber-500/50" />
                                  <span className="text-xs text-gray-400">{c.name}</span>
                                  <span className="text-[10px] text-gray-600 ml-auto">
                                    {c.province}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="col-span-7 card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-200 font-medium text-sm flex items-center gap-2">
                  <Users size={16} className="text-cyber-400" />
                  用户列表
                </h3>
                <button className="btn-primary flex items-center gap-1.5 text-xs px-3 py-1.5">
                  <Plus size={14} />
                  添加用户
                </button>
              </div>

              <table className="w-full">
                <thead>
                  <tr className="border-b border-navy-600">
                    <th className="text-left text-xs text-gray-500 font-medium pb-3">姓名</th>
                    <th className="text-left text-xs text-gray-500 font-medium pb-3">角色</th>
                    <th className="text-left text-xs text-gray-500 font-medium pb-3">管辖范围</th>
                    <th className="text-right text-xs text-gray-500 font-medium pb-3">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-navy-600/50 hover:bg-navy-700/20 transition-colors"
                    >
                      <td className="py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-navy-600 flex items-center justify-center text-xs font-bold text-cyber-400">
                            {user.name[0]}
                          </div>
                          <span className="text-sm text-gray-200">{user.name}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <span
                          className="badge-cyber"
                          style={{
                            background: `${
                              roleDescriptions.find((r) => r.role === user.role)?.color ?? '#666'
                            }15`,
                            color: roleDescriptions.find((r) => r.role === user.role)?.color ?? '#666',
                          }}
                        >
                          {roleLabels[user.role]}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="text-xs text-gray-400 max-w-[200px] truncate block">
                          {getUserScope(user)}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button className="p-1.5 rounded-md hover:bg-navy-600 text-gray-500 hover:text-cyber-400 transition-colors">
                            <Edit size={14} />
                          </button>
                          <button className="p-1.5 rounded-md hover:bg-navy-600 text-gray-500 hover:text-alert-red transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="text-gray-200 font-medium text-sm mb-4 flex items-center gap-2">
              <Shield size={16} className="text-cyber-400" />
              角色权限说明
            </h3>
            <div className="grid grid-cols-4 gap-4">
              {roleDescriptions.map(({ role, label, icon: Icon, color, desc }) => (
                <div
                  key={role}
                  className="card hover:border-cyber-500/20 transition-all duration-300"
                >
                  <div className="flex items-center gap-2.5 mb-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{ background: `${color}18` }}
                    >
                      <Icon size={18} style={{ color }} />
                    </div>
                    <span className="text-sm font-medium text-white">{label}</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {activeTab === 'audit' && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-gray-200 font-medium text-sm mb-4 flex items-center gap-2">
              <Search size={16} className="text-cyber-400" />
              正向查询 — 查谁有权看什么
            </h3>

            <div className="flex items-center gap-3 mb-4">
              <select
                value={fwdRole}
                onChange={(e) => setFwdRole(e.target.value)}
                className="bg-navy-700 border border-navy-600 text-gray-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-cyber-500/50"
              >
                <option value="all">全部角色</option>
                <option value="group_admin">集团管理员</option>
                <option value="regional_director">区域总监</option>
                <option value="project_manager">项目经理</option>
                <option value="owner_committee">业委会</option>
              </select>

              <select
                value={fwdRegion}
                onChange={(e) => setFwdRegion(e.target.value)}
                className="bg-navy-700 border border-navy-600 text-gray-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-cyber-500/50"
              >
                <option value="all">全部区域</option>
                {regionOptions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>

              <div className="relative flex-1 max-w-xs">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="搜索小区名称..."
                  value={fwdCommunitySearch}
                  onChange={(e) => setFwdCommunitySearch(e.target.value)}
                  className="w-full bg-navy-700 border border-navy-600 text-gray-200 text-xs rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-cyber-500/50 placeholder:text-gray-600"
                />
              </div>
            </div>

            <table className="w-full">
              <thead>
                <tr className="border-b border-navy-600">
                  <th className="text-left text-xs text-gray-500 font-medium pb-3">用户名</th>
                  <th className="text-left text-xs text-gray-500 font-medium pb-3">角色</th>
                  <th className="text-left text-xs text-gray-500 font-medium pb-3">区域</th>
                  <th className="text-left text-xs text-gray-500 font-medium pb-3">可访问小区</th>
                </tr>
              </thead>
              <tbody>
                {forwardResults.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500 text-xs">
                      暂无匹配结果
                    </td>
                  </tr>
                )}
                {forwardResults.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-navy-600/50 hover:bg-navy-700/20 transition-colors"
                  >
                    <td className="py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-navy-600 flex items-center justify-center text-xs font-bold text-cyber-400">
                          {user.name[0]}
                        </div>
                        <span className="text-sm text-gray-200">{user.name}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span
                        className="badge-cyber"
                        style={{
                          background: `${
                            roleDescriptions.find((r) => r.role === user.role)?.color ?? '#666'
                          }15`,
                          color: roleDescriptions.find((r) => r.role === user.role)?.color ?? '#666',
                        }}
                      >
                        {roleLabels[user.role]}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="text-xs text-gray-400">{getUserRegion(user)}</span>
                    </td>
                    <td className="py-3">
                      <span className="text-xs text-gray-400 max-w-[280px] block leading-relaxed">
                        {getAccessibleCommunities(user).join('、') || '-'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card">
            <h3 className="text-gray-200 font-medium text-sm mb-4 flex items-center gap-2">
              <Building2 size={16} className="text-cyber-400" />
              反向查询 — 查谁有权看某小区
            </h3>

            <div className="flex items-center gap-3 mb-4">
              <select
                value={revCommunityId}
                onChange={(e) => setRevCommunityId(e.target.value)}
                className="bg-navy-700 border border-navy-600 text-gray-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-cyber-500/50 min-w-[240px]"
              >
                <option value="">请选择小区...</option>
                {revCommunityOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}（{c.region}）
                  </option>
                ))}
              </select>
            </div>

            <table className="w-full">
              <thead>
                <tr className="border-b border-navy-600">
                  <th className="text-left text-xs text-gray-500 font-medium pb-3">用户名</th>
                  <th className="text-left text-xs text-gray-500 font-medium pb-3">角色</th>
                  <th className="text-left text-xs text-gray-500 font-medium pb-3">访问来源</th>
                </tr>
              </thead>
              <tbody>
                {!revCommunityId && (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-gray-500 text-xs">
                      请选择一个小区以查看有权访问的用户
                    </td>
                  </tr>
                )}
                {revCommunityId && reverseResults.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-gray-500 text-xs">
                      当前权限范围内无用户可访问该小区
                    </td>
                  </tr>
                )}
                {reverseResults.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-navy-600/50 hover:bg-navy-700/20 transition-colors"
                  >
                    <td className="py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-navy-600 flex items-center justify-center text-xs font-bold text-cyber-400">
                          {user.name[0]}
                        </div>
                        <span className="text-sm text-gray-200">{user.name}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span
                        className="badge-cyber"
                        style={{
                          background: `${
                            roleDescriptions.find((r) => r.role === user.role)?.color ?? '#666'
                          }15`,
                          color: roleDescriptions.find((r) => r.role === user.role)?.color ?? '#666',
                        }}
                      >
                        {roleLabels[user.role]}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="text-xs text-gray-400">{user.accessReason}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'trail' && (
        <div className="card">
          <h3 className="text-gray-200 font-medium text-sm mb-4 flex items-center gap-2">
            <FileClock size={16} className="text-cyber-400" />
            审计留痕 — 操作日志
          </h3>

          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <select
              value={trailAction}
              onChange={(e) => setTrailAction(e.target.value)}
              className="bg-navy-700 border border-navy-600 text-gray-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-cyber-500/50"
            >
              <option value="all">全部操作</option>
              <option value="view_community">查看小区</option>
              <option value="export_report">导出报告</option>
              <option value="approve_alert">审批预警</option>
            </select>

            <select
              value={trailUser}
              onChange={(e) => setTrailUser(e.target.value)}
              className="bg-navy-700 border border-navy-600 text-gray-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-cyber-500/50"
            >
              <option value="all">全部用户</option>
              {trailUserOptions.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>

            <select
              value={trailRegion}
              onChange={(e) => setTrailRegion(e.target.value)}
              className="bg-navy-700 border border-navy-600 text-gray-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-cyber-500/50"
            >
              <option value="all">全部区域</option>
              {trailRegionOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <table className="w-full">
            <thead>
              <tr className="border-b border-navy-600">
                <th className="text-left text-xs text-gray-500 font-medium pb-3">时间</th>
                <th className="text-left text-xs text-gray-500 font-medium pb-3">用户</th>
                <th className="text-left text-xs text-gray-500 font-medium pb-3">角色</th>
                <th className="text-left text-xs text-gray-500 font-medium pb-3">操作类型</th>
                <th className="text-left text-xs text-gray-500 font-medium pb-3">目标名称</th>
                <th className="text-left text-xs text-gray-500 font-medium pb-3">区域</th>
              </tr>
            </thead>
            <tbody>
              {filteredAuditLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500 text-xs">
                    暂无审计日志
                  </td>
                </tr>
              )}
              {filteredAuditLogs.map((log) => {
                const logUser = users.find((u) => u.id === log.userId)
                return (
                  <tr
                    key={log.id}
                    className="border-b border-navy-600/50 hover:bg-navy-700/20 transition-colors"
                  >
                    <td className="py-3">
                      <span className="text-xs text-gray-400">{log.timestamp}</span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-navy-600 flex items-center justify-center text-xs font-bold text-cyber-400">
                          {log.userName[0]}
                        </div>
                        <span className="text-sm text-gray-200">{log.userName}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      {logUser && (
                        <span
                          className="badge-cyber"
                          style={{
                            background: `${
                              roleDescriptions.find((r) => r.role === logUser.role)?.color ?? '#666'
                            }15`,
                            color:
                              roleDescriptions.find((r) => r.role === logUser.role)?.color ?? '#666',
                          }}
                        >
                          {roleLabels[logUser.role]}
                        </span>
                      )}
                    </td>
                    <td className="py-3">
                      <span
                        className="badge-cyber"
                        style={{
                          background: `${actionColors[log.action]}18`,
                          color: actionColors[log.action],
                        }}
                      >
                        {actionLabels[log.action]}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="text-xs text-gray-300">{log.targetName}</span>
                    </td>
                    <td className="py-3">
                      <span className="text-xs text-gray-500">{log.region || '-'}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
