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

export default function Admin() {
  const { communities, currentUser, getFilteredCommunities } = useAppStore()
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set())
  const [expandedGroup, setExpandedGroup] = useState(true)

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
    return Object.keys(REGIONS).map((region) => ({
      region,
      communities: regionCommMap.get(region) ?? [],
    }))
  }, [filteredCommunities])

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

  return (
    <div className="min-h-screen bg-navy-900 p-6 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Shield size={22} className="text-cyber-400" />
        <h2 className="text-lg font-bold text-white">权限管理</h2>
      </div>

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
    </div>
  )
}
