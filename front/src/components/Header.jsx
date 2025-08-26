
import { useState, useEffect } from "react"
import { Settings, LogOut, User, Wallet, MessageSquare } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

const Header = () => {
  const navigate = useNavigate()
  const { admin, logout, isSuperAdmin } = useAuth()
  const [loading, setLoading] = useState(false)
  const [walletData, setWalletData] = useState({ balance: 0, smsCount: 0 })


  const handleLogout = async () => {
    setLoading(true)
    try {
      await logout()
      navigate("/login")
    } catch (error) {
      console.error("Logout failed:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SMS Portal</h1>
          <p className="text-sm text-gray-500">Comprehensive business management platform</p>
        </div>

        <div className="flex items-center space-x-4">
          {/* Admin Info */}
          <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg">
            <User className="w-4 h-4 text-gray-600" />
            <div className="text-sm">
              <span className="font-medium text-gray-900">{admin?.username}</span>
              <span className="text-gray-500 ml-2">
                ({isSuperAdmin ? "Super Admin" : "Admin"})
              </span>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            disabled={loading}
            className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <LogOut className="w-4 h-4" />
            )}
            <span>{loading ? "Logging out..." : "Logout"}</span>
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
