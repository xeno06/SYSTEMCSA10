import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Analytics from './pages/Analytics'
import Evaluation from './pages/Evaluation'
import Settings from './pages/Settings'
import Auth from './pages/Auth'
import Landing from './pages/Landing'
import UserProfile from './pages/UserProfile'

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={<Auth />} />

      {/* Protected Routes*/}
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/evaluation" element={<Evaluation />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile" element={<UserProfile />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App