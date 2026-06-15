import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { users } from '../data/mockData'
import { Lock, User, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const login = useAppStore((s) => s.login)
  const navigate = useNavigate()
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const user = users.find((u) => u.id === userId)
    if (!user) {
      setError('用户不存在，请检查账号')
      return
    }

    login(userId)
    navigate('/dashboard')
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-gradient-to-br from-navy-900 via-navy-900 to-navy-800 items-center justify-center">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(0,212,170,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,170,0.3) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <div className="absolute top-20 right-20 w-72 h-72 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #00D4AA 0%, transparent 70%)' }}
        />
        <div className="absolute bottom-32 left-16 w-48 h-48 rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(circle, #33DDBB 0%, transparent 70%)' }}
        />

        <div className="relative z-10 px-16 max-w-xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-cyber-500/20 flex items-center justify-center glow-cyber">
              <Lock size={24} className="text-cyber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-wide">
                智慧运营分析平台
              </h1>
              <p className="text-xs text-gray-500 mt-0.5 tracking-widest">
                COMMUNITY ANALYTICS PLATFORM
              </p>
            </div>
          </div>

          <p className="text-gray-400 text-sm leading-relaxed mb-10">
            一站式社区运营数据管理与分析，覆盖设备监控、费用收缴、投诉响应、满意度评估等核心指标，助力集团精细化管理决策。
          </p>

          <div className="space-y-4">
            {[
              { label: '实时监控', desc: '全国社区运营指标一览' },
              { label: '智能预警', desc: '多级审批预警流程' },
              { label: '数据洞察', desc: '合同分析与运营周报' },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 px-4 py-3 rounded-lg bg-navy-800/40 border border-navy-600/30"
              >
                <div className="w-2 h-2 rounded-full bg-cyber-500" />
                <span className="text-sm text-gray-300 font-medium">{item.label}</span>
                <span className="text-xs text-gray-500 ml-auto">{item.desc}</span>
              </div>
            ))}
          </div>

          <div className="mt-12 flex items-center gap-6 text-xs text-gray-600">
            <span>数据安全</span>
            <span className="w-1 h-1 rounded-full bg-gray-700" />
            <span>权限隔离</span>
            <span className="w-1 h-1 rounded-full bg-gray-700" />
            <span>实时同步</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-navy-800 px-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl bg-cyber-500/20 flex items-center justify-center">
              <Lock size={20} className="text-cyber-400" />
            </div>
            <h1 className="text-lg font-bold text-white">智慧运营分析平台</h1>
          </div>

          <h2 className="text-xl font-bold text-white mb-1">欢迎登录</h2>
          <p className="text-sm text-gray-500 mb-8">请输入您的账号信息</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">账号</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="请输入用户ID"
                  className="input-dark w-full pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">密码</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="input-dark w-full pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-navy-600 bg-navy-900 text-cyber-500 focus:ring-cyber-500/30 accent-[#00D4AA]"
                />
                <span className="text-xs text-gray-400">记住我</span>
              </label>
            </div>

            {error && (
              <div className="text-xs text-alert-red bg-alert-red/10 border border-alert-red/20 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary w-full py-3 text-sm font-medium rounded-lg"
            >
              登 录
            </button>
          </form>

          <div className="mt-8 p-4 rounded-lg bg-navy-900/60 border border-navy-600/40">
            <div className="text-xs text-gray-500 mb-2">演示账号</div>
            <div className="space-y-1.5">
              {[
                { id: 'u1', role: '集团管理员' },
                { id: 'u2', role: '区域总监' },
                { id: 'u4', role: '项目经理' },
              ].map((demo) => (
                <button
                  key={demo.id}
                  onClick={() => {
                    setUserId(demo.id)
                    setPassword('demo')
                  }}
                  className="flex items-center justify-between w-full px-3 py-1.5 rounded-md hover:bg-navy-700/50 transition-colors group"
                >
                  <span className="text-xs text-gray-400 group-hover:text-cyber-400 transition-colors font-mono">
                    {demo.id}
                  </span>
                  <span className="text-xs text-gray-500">{demo.role}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
