import { useState, useEffect } from "react"
import { Settings, Save, RotateCcw, FileSpreadsheet, MessageSquare, DollarSign, Database, Trash2, AlertTriangle, BarChart3 } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"

const SettingsPage = () => {
  const { isSuperAdmin } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })
  
  // System reset states
  const [systemStats, setSystemStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [resetType, setResetType] = useState('sms_data')
  
  const [settings, setSettings] = useState({
    attendance: {
      nameColumn: 'F',
      phoneColumn: 'B',
      employeeIdColumn: 'D',
      inTimeColumn: 'I',
      outTimeColumn: 'J',
      workDurationColumn: 'M'
    },
    salary: {
      nameColumn: 'A',
      phoneColumn: 'B',
      amountColumn: 'C'
    },
    templateNames: {
      attendanceTempletName: 'attedence',
      salaryTempletName: 'salary'
    }
  })

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

  // Redirect if not super admin
  if (!isSuperAdmin) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-600">You need super admin privileges to access settings.</p>
        </div>
      </div>
    )
  }

  // Fetch settings
  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/settings`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      if (data.success) {
        setSettings(data.data)
      } else {
        console.log(data.message)
        setMessage({ type: "error", text: data.message || "Failed to fetch settings" })
      }
    } catch (error) {
      console.error('Fetch settings error:', error)
      setMessage({ type: "error", text: "Network error while fetching settings" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(()=>{
    console.log(settings)
  }, [settings])

  // Save settings
  const saveSettings = async () => {
    try {
      setSaving(true)
      setMessage({ type: "", text: "" })

      const response = await fetch(`${API_BASE_URL}/settings`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings)
      })

      const data = await response.json()
      if (data.success) {
        setMessage({ type: "success", text: "Settings updated successfully!" })
        setTimeout(() => setMessage({ type: "", text: "" }), 3000)
      } else {
        setMessage({ type: "error", text: data.message || "Failed to update settings" })
      }
    } catch (error) {
      console.error('Save settings error:', error)
      setMessage({ type: "error", text: "Network error while saving settings" })
    } finally {
      setSaving(false)
    }
  }

  // Reset to defaults
  const resetToDefaults = () => {
    setSettings({
      attendance: {
        nameColumn: 'F',
        phoneColumn: 'B',
        employeeIdColumn: 'D',
        inTimeColumn: 'I',
        outTimeColumn: 'J',
        workDurationColumn: 'M'
      },
      salary: {
        nameColumn: 'A',
        phoneColumn: 'B',
        amountColumn: 'C'
      },
      templateNames: {
        attendanceTempletName: 'attedence',
        salaryTempletName: 'salary'
      }
    })
    setMessage({ type: "info", text: "Settings reset to defaults" })
  }

  // Fetch system statistics
  const fetchSystemStats = async () => {
    setStatsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/sms/system/stats`, {
        credentials: 'include'
      })
      const result = await response.json()
      
      if (result.success) {
        setSystemStats(result.data)
      } else {
        console.error('Failed to fetch system stats:', result.message)
      }
    } catch (error) {
      console.error('Error fetching system stats:', error)
    } finally {
      setStatsLoading(false)
    }
  }

  // Reset system data
  const performSystemReset = async () => {
    setResetLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/sms/system/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          confirmReset: true,
          resetType: resetType
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setMessage({ 
          type: "success", 
          text: `System reset completed! ${result.data.clearedItems.join(', ')}` 
        })
        setShowResetConfirm(false)
        // Refresh stats after reset
        await fetchSystemStats()
      } else {
        setMessage({ type: "error", text: result.message || "Failed to reset system" })
      }
    } catch (error) {
      console.error('System reset error:', error)
      setMessage({ type: "error", text: "Network error while resetting system" })
    } finally {
      setResetLoading(false)
    }
  }

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString()
  }

  useEffect(() => {
    fetchSettings()
    fetchSystemStats()
  }, [])

  const handleInputChange = (category, field, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }))
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-4 text-gray-600">Loading settings...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">General Settings</h1>
            <p className="text-gray-600">Configure Excel column mappings and default values</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={resetToDefaults}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Defaults
          </button>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>

      {/* Message Display */}
      {message.text && (
        <div className={`p-4 rounded-lg ${
          message.type === "success" 
            ? "bg-green-50 text-green-700 border border-green-200" 
            : message.type === "error"
            ? "bg-red-50 text-red-700 border border-red-200"
            : "bg-blue-50 text-blue-700 border border-blue-200"
        }`}>
          {message.text}
        </div>
      )}

      {/* Attendance Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900">Enhanced Attendance Excel Mapping</h2>
          </div>
          <p className="text-gray-600 mt-1">Configure which Excel columns contain detailed attendance data</p>
          
          {/* Information about new format */}
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-800 mb-2">Simplified Enhanced Attendance Format</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p><strong>SMS Template:</strong> "प्रिय {'{'}name-employeeId{'}'} आज आपने {'{'}inTime-outTime{'}'} कार्य किया आपने कुल {'{'}workDuration{'}'}घंटे"</p>
              <p><strong>Example:</strong> "प्रिय anish-Amc001 आज आपने 09:00-06:00 कार्य किया आपने कुल 08:00-घंटे"</p>
              <p><strong>Required Columns:</strong> Name (F), Phone (B), Employee ID (D), In Time (I), Out Time (J), Work Duration (M)</p>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employee Name Column
              </label>
              <input
                type="text"
                value={settings.attendance.nameColumn}
                onChange={(e) => handleInputChange('attendance', 'nameColumn', e.target.value.toUpperCase())}
                placeholder="F"
                maxLength="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Employee Name (F)</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number Column
              </label>
              <input
                type="text"
                value={settings.attendance.phoneColumn}
                onChange={(e) => handleInputChange('attendance', 'phoneColumn', e.target.value.toUpperCase())}
                placeholder="B"
                maxLength="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Phone Number (B)</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employee ID Column
              </label>
              <input
                type="text"
                value={settings.attendance.employeeIdColumn}
                onChange={(e) => handleInputChange('attendance', 'employeeIdColumn', e.target.value.toUpperCase())}
                placeholder="D"
                maxLength="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Employee ID (D)</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                In Time Column
              </label>
              <input
                type="text"
                value={settings.attendance.inTimeColumn}
                onChange={(e) => handleInputChange('attendance', 'inTimeColumn', e.target.value.toUpperCase())}
                placeholder="I"
                maxLength="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">In Time (I)</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Out Time Column
              </label>
              <input
                type="text"
                value={settings.attendance.outTimeColumn}
                onChange={(e) => handleInputChange('attendance', 'outTimeColumn', e.target.value.toUpperCase())}
                placeholder="J"
                maxLength="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Out Time (J)</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Work Duration Column
              </label>
              <input
                type="text"
                value={settings.attendance.workDurationColumn}
                onChange={(e) => handleInputChange('attendance', 'workDurationColumn', e.target.value.toUpperCase())}
                placeholder="M"
                maxLength="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Work Duration (M)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Salary Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Salary Excel Mapping</h2>
          </div>
          <p className="text-gray-600 mt-1">Configure which Excel columns contain salary data</p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employee Name Column
              </label>
              <input
                type="text"
                value={settings.salary.nameColumn}
                onChange={(e) => handleInputChange('salary', 'nameColumn', e.target.value.toUpperCase())}
                placeholder="A"
                maxLength="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Example: A, B, C...</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number Column
              </label>
              <input
                type="text"
                value={settings.salary.phoneColumn}
                onChange={(e) => handleInputChange('salary', 'phoneColumn', e.target.value.toUpperCase())}
                placeholder="B"
                maxLength="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Example: A, B, C...</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Salary Amount Column
              </label>
              <input
                type="text"
                value={settings.salary.amountColumn}
                onChange={(e) => handleInputChange('salary', 'amountColumn', e.target.value.toUpperCase())}
                placeholder="C"
                maxLength="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Salary amount</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900">Template Mapping</h2>
          </div>
          <p className="text-gray-600 mt-1">Configure which template used to send sms</p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attendance Template Name
              </label>
              <input
                type="text"
                value={settings?.templateNames?.attendanceTempletName}
                onChange={(e) => handleInputChange('attendance', 'attendanceTempletName' , e.target.value)}
                placeholder="Enter the attendance template name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Salary Template Name
              </label>
              <input
                type="text"
                value={settings?.templateNames?.salaryTempletName}
                onChange={(e) => handleInputChange('salary', 'salaryTempletName', e.target.value)}
                placeholder="Enter the salary template name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* System Reset Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-red-600" />
            <h2 className="text-xl font-semibold text-gray-900">System Data Management</h2>
          </div>
          <p className="text-gray-600 mt-1">Manage system data and perform maintenance operations</p>
        </div>
        
        <div className="p-6">
          {/* System Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">SMS Queue Records</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {statsLoading ? '...' : systemStats?.smsQueue?.count || 0}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    {systemStats?.smsQueue?.oldest ? `Since: ${formatDate(systemStats.smsQueue.oldest)}` : 'No data'}
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">Failed SMS Records</p>
                  <p className="text-2xl font-bold text-red-900">
                    {statsLoading ? '...' : systemStats?.failedSMS?.count || 0}
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    {systemStats?.failedSMS?.oldest ? `Since: ${formatDate(systemStats.failedSMS.oldest)}` : 'No data'}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Log Files</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {statsLoading ? '...' : systemStats?.logs?.filesCount || 0}
                  </p>
                  <p className="text-xs text-purple-600 mt-1">
                    {systemStats?.logs?.sizeFormatted || '0 Bytes'}
                  </p>
                </div>
                <FileSpreadsheet className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Reset Options */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Reset Options</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div 
                className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                  resetType === 'sms_data' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setResetType('sms_data')}
              >
                <div className="flex items-center gap-2 mb-2">
                  {/* <input 
                    type="radio" 
                    checked={resetType === 'sms_data'} 
                    onChange={() => setResetType('sms_data')}
                    className="text-blue-600"
                  /> */}
                  <h4 className="font-medium text-gray-900">SMS Data Only</h4>
                </div>
                <p className="text-sm text-gray-600">Clear SMS queue and failed SMS records only</p>
                <p className="text-xs text-gray-500 mt-1">
                  Recommended for monthly cleanup
                </p>
              </div>

              <div 
                className={`border-2 rounded-lg p-4 cursor-pointer transition-colors bg-gray-100 ${
                  resetType === 'logs' 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                // onClick={() => setResetType('logs')}
              >
                <div className="flex items-center gap-2 mb-2">
                  {/* <input 
                    type="radio" 
                    checked={resetType === 'logs'} 
                    // onChange={() => setResetType('logs')}
                    className="text-purple-600"
                  /> */}
                  <h4 className="font-medium text-gray-500">Log Files Only [Restricted]</h4>
                </div>
                <p className="text-sm text-gray-400">Clear performance and error log files</p>
                <p className="text-xs text-gray-400 mt-1">
                  Keep SMS data, clear logs only
                </p>
              </div>

              <div 
                className={`border-2 rounded-lg p-4 cursor-pointer transition-colors bg-gray-100 ${
                  resetType === 'all' 
                    ? 'border-red-500 bg-red-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                // onClick={() => setResetType('all')}
              >
                <div className="flex items-center gap-2 mb-2">
                  {/* <input 
                    type="radio" 
                    checked={resetType === 'all'} 
                    // onChange={() => setResetType('all')}
                    className="text-red-600"
                  /> */}
                  <h4 className="font-medium text-gray-500">Complete Reset [Restricted]</h4>
                </div>
                <p className="text-sm text-gray-300">Clear all SMS data and log files</p>
                <p className="text-xs text-red-300 mt-1">
                  Use with caution - clears everything
                </p>
              </div>
            </div>

            {/* Reset Button */}
            <div className="flex items-center justify-between">
              <button
                onClick={fetchSystemStats}
                disabled={statsLoading}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-2"
              >
                <RotateCcw className={`h-4 w-4 ${statsLoading ? 'animate-spin' : ''}`} />
                Refresh Stats
              </button>

              <button
                onClick={() => setShowResetConfirm(true)}
                disabled={resetLoading || (systemStats?.total || 0) === 0}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Reset System Data
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">Confirm System Reset</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                You are about to permanently delete:
              </p>
              
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                {resetType === 'sms_data' || resetType === 'all' ? (
                  <>
                    <div className="flex justify-between">
                      <span>SMS Queue Records:</span>
                      <span className="font-medium">{systemStats?.smsQueue?.count || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Failed SMS Records:</span>
                      <span className="font-medium">{systemStats?.failedSMS?.count || 0}</span>
                    </div>
                  </>
                ) : null}
                
                {resetType === 'logs' || resetType === 'all' ? (
                  <div className="flex justify-between">
                    <span>Log Files:</span>
                    <span className="font-medium">
                      {systemStats?.logs?.filesCount || 0} files ({systemStats?.logs?.sizeFormatted || '0 Bytes'})
                    </span>
                  </div>
                ) : null}
              </div>
              
              <p className="text-red-600 text-sm mt-4 font-medium">
                ⚠️ This action cannot be undone!
              </p>
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowResetConfirm(false)}
                disabled={resetLoading}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={performSystemReset}
                disabled={resetLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
              >
                {resetLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Resetting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Confirm Reset
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SettingsPage
