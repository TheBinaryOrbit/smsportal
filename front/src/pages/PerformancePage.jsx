import { useState, useEffect } from "react"
import { BarChart3, Clock, Activity, AlertCircle, CheckCircle, Settings, RefreshCw } from "lucide-react"

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.smsportal.yaytech.in/api';

const PerformancePage = () => {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [demoMode, setDemoMode] = useState(false)
  const [toggleLoading, setToggleLoading] = useState(false)

  const fetchDailySummary = async (date = null) => {
    setLoading(true)
    try {
      const dateParam = date || selectedDate
      const response = await fetch(`${API_BASE_URL}/sms/logs/daily-summary?date=${dateParam}`, {
        credentials: 'include'
      })
      const result = await response.json()
      
      if (result.success) {
        setSummary(result.data)
      } else {
        console.error('Failed to fetch daily summary:', result.message)
      }
    } catch (error) {
      console.error('Error fetching daily summary:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleDemoMode = async () => {
    setToggleLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/sms/demo/toggle`, {
        method: 'POST',
        credentials: 'include'
      })
      const result = await response.json()
      
      if (result.success) {
        setDemoMode(result.data.demoMode)
        alert(result.data.message)
      } else {
        alert('Failed to toggle demo mode')
      }
    } catch (error) {
      console.error('Error toggling demo mode:', error)
      alert('Error toggling demo mode')
    } finally {
      setToggleLoading(false)
    }
  }

  useEffect(() => {
    fetchDailySummary()
    
    // Check if we're in demo mode by checking environment
    const urlParams = new URLSearchParams(window.location.search)
    setDemoMode(urlParams.get('demo') === 'true')
  }, [selectedDate])

  const formatTime = (ms) => {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`
    return `${(ms / 60000).toFixed(2)}m`
  }

  const getSuccessRate = () => {
    if (!summary || summary.totalOperations === 0) return 0
    return ((summary.successfulSMS / summary.totalOperations) * 100).toFixed(1)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Performance Monitor</h1>
              <p className="text-gray-600">SMS system performance metrics and logging</p>
            </div>
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-gray-500" />
                <button
                  onClick={toggleDemoMode}
                  disabled={toggleLoading}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    demoMode 
                      ? 'bg-orange-100 text-orange-700 border border-orange-300' 
                      : 'bg-gray-100 text-gray-700 border border-gray-300'
                  } hover:bg-opacity-80 disabled:opacity-50`}
                >
                  {toggleLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    `Demo Mode: ${demoMode ? 'ON' : 'OFF'}`
                  )}
                </button>
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              />
              <button
                onClick={() => fetchDailySummary()}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading performance data...</p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Operations</p>
                    <p className="text-3xl font-bold text-gray-900">{summary?.totalOperations || 0}</p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Success Rate</p>
                    <p className="text-3xl font-bold text-green-600">{getSuccessRate()}%</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Failed SMS</p>
                    <p className="text-3xl font-bold text-red-600">{summary?.failedSMS || 0}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Processing Time</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {summary?.avgProcessingTime ? formatTime(summary.avgProcessingTime) : '0ms'}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </div>

            {/* Batch Processing Summary */}
            {summary?.batchSummary?.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Batch Processing Summary
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Batch ID</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Operation</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Records</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Processing Time</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Avg/SMS</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Mode</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.batchSummary.map((batch, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-mono text-xs">{batch.batchId}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              batch.operation === 'attendance_upload' 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {batch.operation.replace('_', ' ').toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-4">{batch.processedRows}</td>
                          <td className="py-3 px-4">{formatTime(batch.batchProcessingTime)}</td>
                          <td className="py-3 px-4">{formatTime(batch.avgProcessingTimePerSMS)}</td>
                          <td className="py-3 px-4">
                            {batch.isDemoMode ? (
                              <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                                DEMO
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                                LIVE
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Error Summary */}
            {summary?.errors?.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  Error Summary
                </h3>
                <div className="space-y-3">
                  {summary.errors.slice(0, 10).map((error, index) => (
                    <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-red-800">{error.operation}</p>
                          <p className="text-sm text-red-600 mt-1">{error.error}</p>
                          {error.phone && (
                            <p className="text-xs text-red-500 mt-1">Phone: {error.phone}</p>
                          )}
                        </div>
                        <span className="text-xs text-red-500">
                          {new Date(error.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                  {summary.errors.length > 10 && (
                    <p className="text-sm text-gray-600 text-center">
                      ... and {summary.errors.length - 10} more errors
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* No Data Message */}
            {(!summary || summary.totalOperations === 0) && (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
                <p className="text-gray-600">
                  No SMS operations found for {selectedDate}. Try selecting a different date or upload some test data.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default PerformancePage
