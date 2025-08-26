"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, UserCog, Shield, Eye, EyeOff, Trash2, Plus, Users, Crown } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"

export default function CreateAdmin() {
  const navigate = useNavigate()
  const { addAdmin, getAllAdmins, deleteAdmin, isSuperAdmin, admin } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(true);
  const [adminList, setAdminList] = useState([])
  const [loadingAdmins, setLoadingAdmins] = useState(true)
  const [deletingAdminId, setDeletingAdminId] = useState(null)

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    role: "admin",
  })

  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState({ type: "", text: "" })

  // Redirect if not super admin
  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-4">You need super admin privileges to access this page.</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // Load admin list on component mount
  useEffect(() => {
    loadAdmins()
  }, [])

  const loadAdmins = async () => {
    setLoadingAdmins(true)
    try {
      const result = await getAllAdmins()
      if (result.success) {
        setAdminList(result.admins)
      } else {
        setMessage({ type: "error", text: result.message || "Failed to load admins" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to load admin list" })
    } finally {
      setLoadingAdmins(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }))
    }
    setMessage({ type: "", text: "" })
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.username.trim()) {
      newErrors.username = "Username is required"
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters"
    }

    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm password"
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setMessage({ type: "", text: "" })

    try {
      const result = await addAdmin(formData.username, formData.password, formData.role)

      if (result.success) {
        setMessage({ type: "success", text: "Admin created successfully!" })
        // Reset form
        setFormData({
          username: "",
          password: "",
          confirmPassword: "",
          role: "admin",
        })
        
        // Reload admin list
        await loadAdmins()
        
        // Hide form and show success message
        setShowCreateForm(true)
        
        // Clear message after delay
        setTimeout(() => {
          setMessage({ type: "", text: "" })
        }, 3000)
      } else {
        setMessage({ type: "error", text: result.message || "Failed to create admin" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Something went wrong. Please try again." })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteAdmin = async (adminId) => {
    if (!confirm("Are you sure you want to delete this admin?")) {
      return
    }

    setDeletingAdminId(adminId)
    try {
      const result = await deleteAdmin(adminId)
      if (result.success) {
        setMessage({ type: "success", text: "Admin deleted successfully!" })
        await loadAdmins()
        setTimeout(() => {
          setMessage({ type: "", text: "" })
        }, 3000)
      } else {
        setMessage({ type: "error", text: result.message || "Failed to delete admin" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to delete admin" })
    } finally {
      setDeletingAdminId(null)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Message Display */}
      {message.text && (
        <div className={`p-4 rounded-lg ${
          message.type === "success" 
            ? "bg-green-50 text-green-700 border border-green-200" 
            : "bg-red-50 text-red-700 border border-red-200"
        }`}>
          {message.text}
        </div>
      )}

      {/* Create Admin Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-gray-900">Create New Admin</h2>
            </div>
            
          </div>
        </div>
        
        {showCreateForm && (
          <div className="p-6">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username *
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Enter username"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.username ? "border-red-300 bg-red-50" : "border-gray-300"
                  }`}
                />
                {errors.username && (
                  <p className="mt-1 text-sm text-red-600">{errors.username}</p>
                )}
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role *
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="admin">Admin</option>
                  <option value="super-admin">Super Admin</option>
                </select>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter password"
                    className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.password ? "border-red-300 bg-red-50" : "border-gray-300"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm password"
                    className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.confirmPassword ? "border-red-300 bg-red-50" : "border-gray-300"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Submit Button - Spans full width on small screens, fits in grid on larger */}
              <div className="md:col-span-2 lg:col-span-4 mt-8 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full md:w-auto bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <UserCog className="w-4 h-4" />
                      Create Admin
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Admin List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-600" />
              <h2 className="text-xl font-semibold text-gray-900">Admin List</h2>
            </div>
            <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
              {adminList.length} total
            </span>
          </div>
        </div>
        
        <div className="p-6">
          {loadingAdmins ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading admins...</span>
            </div>
          ) : adminList.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No admins found</h3>
              <p className="text-gray-600">Create your first admin to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Admin</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Role</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Last Login</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adminList.map((adminUser) => (
                    <tr key={adminUser._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            adminUser.role === 'super-admin' 
                              ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                              : 'bg-gradient-to-r from-blue-500 to-cyan-500'
                          }`}>
                            {adminUser.role === 'super-admin' ? (
                              <Crown className="w-4 h-4 text-white" />
                            ) : (
                              <UserCog className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 flex items-center gap-2">
                              {adminUser.username}
                              {adminUser._id === admin?.id && (
                                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                                  You
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          adminUser.role === 'super-admin' 
                            ? 'bg-purple-100 text-purple-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {adminUser.role === 'super-admin' ? (
                            <>
                              <Crown className="w-3 h-3" />
                              Super Admin
                            </>
                          ) : (
                            <>
                              <Shield className="w-3 h-3" />
                              Admin
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          adminUser.isActive 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-red-100 text-red-600'
                        }`}>
                          {adminUser.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {adminUser.lastLogin 
                          ? new Date(adminUser.lastLogin).toLocaleDateString()
                          : 'Never'
                        }
                      </td>
                      <td className="py-4 px-4">
                        {adminUser._id !== admin?.id ? (
                          <button
                            onClick={() => handleDeleteAdmin(adminUser._id)}
                            disabled={deletingAdminId === adminUser._id}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete admin"
                          >
                            {deletingAdminId === adminUser._id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">Current User</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
