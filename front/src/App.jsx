import { Routes, Route, Navigate } from "react-router-dom"

import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import Layout from "./components/Layout"
import CreateAdmin from "./pages/CreateAdmin"
import Wallet from "./pages/Wallet"
import Settings from "./pages/Settings"
import Attendance from "./pages/Attendance"
import AttendanceExport from "./pages/AttendanceExport"
import Salary from "./pages/Salary"
import FailsSms from "./pages/FailsSms"
import PerformancePage from "./pages/PerformancePage"
import { AuthProvider } from "./contexts/AuthContext"
import ProtectedRoute from "./components/ProtectedRoute"

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* Protected routes wrapped in Layout */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin/create"
          element={
            <ProtectedRoute requireSuperAdmin={true}>
              <Layout>
                <CreateAdmin />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/wallet"
          element={
            <ProtectedRoute>
              <Layout>
                <Wallet />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/attendance"
          element={
            <ProtectedRoute>
              <Layout>
                <Attendance />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/attendance/export"
          element={
            <ProtectedRoute>
              <Layout>
                <AttendanceExport />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/salary"
          element={
            <ProtectedRoute>
              <Layout>
                <Salary />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/failedSms"
          element={
            <ProtectedRoute>
              <Layout>
                <FailsSms />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/performance"
          element={
            <ProtectedRoute>
              <Layout>
                <PerformancePage />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/settings"
          element={
            <ProtectedRoute requireSuperAdmin={true}>
              <Layout>
                <Settings />
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  )
}

export default App