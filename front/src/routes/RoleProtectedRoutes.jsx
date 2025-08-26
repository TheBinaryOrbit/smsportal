// src/components/RoleProtectedRoute.jsx
import { Navigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

const RoleProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}

export default RoleProtectedRoute
