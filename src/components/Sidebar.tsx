import { NavLink, useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import {
  LayoutDashboard,
  AlertTriangle,
  FileText,
  BarChart3,
  Shield,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Building2,
} from 'lucide-react'

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: '全国看板' },
  { path: '/alerts', icon: AlertTriangle, label: '预警中心' },
  { path: '/contracts', icon: FileText, label: '合同分析' },
  { path: '/reports', icon: BarChart3, label: '运营报告' },
  { path: '/admin', icon: Shield, label: '权限管理' },
]

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, currentUser, logout } = useAppStore()
  const navigate = useNavigate()

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-navy-900 border-r border-navy-600 flex flex-col transition-all duration-300 z-50 ${
        sidebarCollapsed ? 'w-[68px]' : 'w-[220px]'
      }`}
    >
      <div className="flex items-center gap-3 px-4 h-16 border-b border-navy-600">
        <div className="w-8 h-8 rounded-lg bg-cyber-500/20 flex items-center justify-center flex-shrink-0">
          <Building2 className="w-5 h-5 text-cyber-400" />
        </div>
        {!sidebarCollapsed && (
          <div className="overflow-hidden">
            <h1 className="text-sm font-bold text-white whitespace-nowrap">智慧运营平台</h1>
            <p className="text-[10px] text-gray-500 whitespace-nowrap">Community Analytics</p>
          </div>
        )}
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => (isActive ? 'sidebar-item-active' : 'sidebar-item')}
          >
            <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
            {!sidebarCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-navy-600 p-3">
        {!sidebarCollapsed && currentUser && (
          <div className="flex items-center gap-2 mb-3 px-2">
            <div className="w-8 h-8 rounded-full bg-navy-600 flex items-center justify-center text-xs font-bold text-cyber-400">
              {currentUser.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{currentUser.name}</p>
              <p className="text-[10px] text-gray-500 truncate">
                {{ group_admin: '集团管理员', regional_director: '区域总监', project_manager: '项目经理', owner_committee: '业主委员会' }[currentUser.role]}
              </p>
            </div>
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={toggleSidebar} className="flex-1 flex items-center justify-center py-2 rounded-lg hover:bg-navy-700 text-gray-500 hover:text-gray-300 transition-colors">
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          {!sidebarCollapsed && (
            <button
              onClick={() => {
                logout()
                navigate('/login')
              }}
              className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg hover:bg-navy-700 text-gray-500 hover:text-alert-red transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}
