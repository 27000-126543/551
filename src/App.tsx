import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './pages/Layout'
import Dashboard from './pages/Dashboard'
import CommunityDetail from './pages/CommunityDetail'
import AlertCenter from './pages/AlertCenter'
import ContractAnalysis from './pages/ContractAnalysis'
import Reports from './pages/Reports'
import Admin from './pages/Admin'
import Login from './pages/Login'
import { useAppStore } from './store/useAppStore'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const currentUser = useAppStore((s) => s.currentUser)
  if (!currentUser) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="community/:id" element={<CommunityDetail />} />
          <Route path="alerts" element={<AlertCenter />} />
          <Route path="contracts" element={<ContractAnalysis />} />
          <Route path="reports" element={<Reports />} />
          <Route path="admin" element={<Admin />} />
        </Route>
      </Routes>
    </Router>
  )
}
