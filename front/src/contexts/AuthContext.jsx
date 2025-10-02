// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react"

const AuthContext = createContext(null)

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.smsportal.yaytech.in/api'

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)

  // Check session validity on app load
  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/session`, {
        method: 'GET',
        credentials: 'include', // Include cookies
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.valid) {
          setAdmin(data.admin)
        } else {
          setAdmin(null)
        }
      } else {
        setAdmin(null)
      }
    } catch (error) {
      console.error('Session check failed:', error)
      setAdmin(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (username, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/login`, {
        method: 'POST',
        credentials: 'include', // Include cookies
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setAdmin(data.admin)
        return { success: true, message: data.message }
      } else {
        return { success: false, message: data.message || 'Login failed' }
      }
    } catch (error) {
      console.error('Login failed:', error)
      return { success: false, message: 'Network error. Please try again.' }
    }
  }

  const logout = async () => {
    try {
      await fetch(`${API_BASE_URL}/admin/logout`, {
        method: 'POST',
        credentials: 'include', // Include cookies
        headers: {
          'Content-Type': 'application/json',
        },
      })
    } catch (error) {
      console.error('Logout API failed:', error)
    } finally {
      // Always clear admin state
      setAdmin(null)
    }
  }

  const addAdmin = async (username, password, role = 'admin') => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/add`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, role }),
      })

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Add admin failed:', error)
      return { success: false, message: 'Network error. Please try again.' }
    }
  }

  const deleteAdmin = async (adminId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/delete/${adminId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Delete admin failed:', error)
      return { success: false, message: 'Network error. Please try again.' }
    }
  }

  const updatePassword = async (oldPassword, newPassword) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/update-password`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      })

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Update password failed:', error)
      return { success: false, message: 'Network error. Please try again.' }
    }
  }

  const getAllAdmins = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/all`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Get all admins failed:', error)
      return { success: false, message: 'Network error. Please try again.' }
    }
  }

  // Wallet functions
  const getWalletBalance = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/wallet/balance`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Get wallet balance failed:', error)
      return { success: false, message: 'Network error. Please try again.' }
    }
  }



  const value = {
    admin,
    loading,
    login,
    logout,
    addAdmin,
    deleteAdmin,
    updatePassword,
    getAllAdmins,
    getWalletBalance,
    checkSession,
    isAuthenticated: !!admin,
    isSuperAdmin: admin?.role === 'super-admin'
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
