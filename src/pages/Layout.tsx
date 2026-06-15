import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-navy-900">
      <Sidebar />
      <main className="flex-1 ml-[220px] min-h-screen">
        <Outlet />
      </main>
    </div>
  )
}
