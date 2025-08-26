import { useState, useEffect } from "react"
import { Wallet, MessageSquare, TrendingUp,Plus , RefreshCw } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"

const WalletPage = () => {
  const { admin, getWalletBalance } = useAuth()
  const [walletData, setWalletData] = useState({
    balance: 0,
    smsCount: 0,
    pricePerSms: 0.20,
    currency: 'USD',
    isMockData: false
  })
  const [transactionHistory, setTransactionHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [error, setError] = useState("")

  // Fetch wallet balance
  const fetchWalletBalance = async () => {
    try {
      setLoading(true)
      setError("")
      
      const result = await getWalletBalance()
      
      if (result.success) {
        setWalletData(result.data)
      } else {
        setError(result.message || "Failed to fetch wallet balance")
      }
    } catch (error) {
      console.error('Wallet balance error:', error)
      setError("Network error while fetching balance")
    } finally {
      setLoading(false)
    }
  }

  

  // Load data on component mount
  useEffect(() => {
    fetchWalletBalance()
  }, [])

  // Refresh data
  const handleRefresh = () => {
    fetchWalletBalance()
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-4 text-gray-600">Loading wallet...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SMS Count */}
        <div className="bg-white rounded-xl shadow-sm border-l-4 border-l-blue-500 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">SMS Credits</p>
              <p className="text-3xl font-bold text-gray-900 mb-1">{walletData.smsCount.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Messages available</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Price per SMS */}
        <div className="bg-white rounded-xl shadow-sm border-l-4 border-l-purple-500 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Price per SMS</p>
              <p className="text-3xl font-bold text-gray-900 mb-1">{walletData.currency} {walletData.pricePerSms.toFixed(2)}</p>
              <p className="text-sm text-gray-500">Per message cost</p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {/* <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-4">
          <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
            <Plus className="w-4 h-4" />
            Add Funds
          </button>
          <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <MessageSquare className="w-4 h-4" />
            Send SMS
          </button>
          <button className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
            <TrendingUp className="w-4 h-4" />
            View Reports
          </button>
        </div>
      </div> */}

    </div>
  )
}

export default WalletPage
