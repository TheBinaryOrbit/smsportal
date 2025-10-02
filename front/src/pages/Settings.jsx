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
      nameColumn: 'E',
      phoneColumn: 'L',
      employeeIdColumn: 'C',
      inTimeColumn: 'G',
      outTimeColumn: 'H',
      workColumn: 'K',
      statusColumn: 'M'
    },
    salary: {
      nameColumn: 'A',
      phoneColumn: 'B',
      employeeIdColumn: 'C',
      grossSalaryColumn: 'D',
      pfColumn: 'E',
      esiColumn: 'F',
      netPayColumn: 'G',
      daysColumn: 'H'
    },
    templateNames: {
      attendanceTempletName: 'attedence',
      salaryTempletName: 'salary'
    }
  })

  const API_BASE_URL = "https://api.smsportal.yaytech.in/api"
  // const API_BASE_URL = "https://api.smsportal.yaytech.in/api"

  // Clear message after 3 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: "", text: "" })
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [message])

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
        setMessage({ type: "error", text: data.message || "Failed to fetch settings" })
      }

    } catch (error) {
      console.error('Fetch settings error:', error)
      setMessage({ type: "error", text: "Network error occurred" })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage({ type: "", text: "" })
    try {
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
        setMessage({ type: "success", text: "Settings saved successfully!" })
      } else {
        setMessage({ type: "error", text: data.message || "Failed to save settings" })
      }

    } catch (error) {
      console.error('Save settings error:', error)
      setMessage({ type: "error", text: "Network error occurred" })
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setSettings({
      attendance: {
        nameColumn: 'E',
        phoneColumn: 'L',
        employeeIdColumn: 'C',
        inTimeColumn: 'G',
        outTimeColumn: 'H',
        workColumn: 'K',
        statusColumn: 'M'
      },
      salary: {
        nameColumn: 'A',
        phoneColumn: 'B',
        employeeIdColumn: 'C',
        grossSalaryColumn: 'D',
        pfColumn: 'E',
        esiColumn: 'F',
        netPayColumn: 'G',
        daysColumn: 'H'
      },
      templateNames: {
        attendanceTempletName: 'attedence',
        salaryTempletName: 'salary'
      }
    })
    setMessage({ type: "info", text: "Settings reset to defaults" })
  }

  // Load settings on mount
  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSystemStats = async () => {
    setStatsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/admin/system-stats`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (data.success) {
        setSystemStats(data.data)
      } else {
        setMessage({ type: "error", text: data.message || "Failed to fetch system stats" })
      }

    } catch (error) {
      console.error('Fetch system stats error:', error)
      setMessage({ type: "error", text: "Network error occurred" })
    } finally {
      setStatsLoading(false)
    }
  }

  const handleSystemReset = async () => {
    setResetLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/admin/reset-system`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resetType })
      })

      const data = await response.json()

      if (data.success) {
        setMessage({ type: "success", text: `${resetType === 'sms_data' ? 'SMS data' : 'All data'} cleared successfully!` })
        setSystemStats(null) // Reset stats to force refresh
      } else {
        setMessage({ type: "error", text: data.message || "Failed to reset system" })
      }

    } catch (error) {
      console.error('System reset error:', error)
      setMessage({ type: "error", text: "Network error occurred" })
    } finally {
      setResetLoading(false)
      setShowResetConfirm(false)
    }
  }

  // Auto-fetch system stats when the system reset section is visible
  useEffect(() => {
    if (isSuperAdmin && !systemStats) {
      fetchSystemStats()
    }
  }, [isSuperAdmin])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Settings className="h-8 w-8 text-blue-600" />
            System Settings
          </h1>
          <p className="mt-2 text-gray-600">
            Configure column mappings and system parameters
          </p>
        </div>

        {/* Status Messages */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
              message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
                'bg-blue-50 text-blue-700 border border-blue-200'
            }`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Attendance Settings Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                Attendance Column Mapping
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Configure Excel column mappings for attendance data (Simplified - 7 columns)
              </p>
            </div>

            <div className="p-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-blue-900 mb-2">📋 Attendance Structure (7 Columns)</h3>
                <div className="text-sm text-blue-800 space-y-1">
                  <div>✅ <strong>Name:</strong> Employee name</div>
                  <div>✅ <strong>Phone:</strong> Phone number</div>
                  <div>✅ <strong>Employee ID:</strong> Unique identifier</div>
                  <div>✅ <strong>In Time:</strong> Clock in time (Format 1)</div>
                  <div>✅ <strong>Out Time:</strong> Clock out time (Format 1)</div>
                  <div>✅ <strong>Work Duration:</strong> Total work time (Format 1)</div>
                  <div>✅ <strong>Attendance Status:</strong> Present/Absent status (Format 2)</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name Column
                  </label>
                  <input
                    type="text"
                    value={settings.attendance.nameColumn}
                    onChange={(e) => handleInputChange('attendance', 'nameColumn', e.target.value.toUpperCase())}
                    placeholder="F"
                    maxLength="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Employee Name</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Column
                  </label>
                  <input
                    type="text"
                    value={settings.attendance.phoneColumn}
                    onChange={(e) => handleInputChange('attendance', 'phoneColumn', e.target.value.toUpperCase())}
                    placeholder="B"
                    maxLength="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Phone Number</p>
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
                  <p className="text-xs text-gray-500 mt-1">Employee ID</p>
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
                  <p className="text-xs text-gray-500 mt-1">In Tim</p>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Out Time Column
                  </label>
                  <input
                    type="text"
                    value={settings.attendance.outTimeColumn}
                    onChange={(e) => handleInputChange('attendance', 'outTimeColumn', e.target.value.toUpperCase())}
                    placeholder="H"
                    maxLength="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Out Time</p>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Work Duration Column
                  </label>
                  <input
                    type="text"
                    value={settings.attendance.workColumn}
                    onChange={(e) => handleInputChange('attendance', 'workColumn', e.target.value.toUpperCase())}
                    placeholder="K"
                    maxLength="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Work Duration (for Format 1)</p>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Attendance Status Column
                  </label>
                  <input
                    type="text"
                    value={settings.attendance.statusColumn}
                    onChange={(e) => handleInputChange('attendance', 'statusColumn', e.target.value.toUpperCase())}
                    placeholder="M"
                    maxLength="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Attendance Status (for Format 2)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Salary Settings Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Salary Column Mapping
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Configure Excel column mappings for salary data with PF/ESI breakdown (8 columns)
              </p>
            </div>

            <div className="p-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-green-900 mb-2">💰 Salary Structure (8 Columns)</h3>
                <div className="text-sm text-green-800 space-y-1">
                  <div>✅ <strong>Name:</strong> Employee name</div>
                  <div>✅ <strong>Phone:</strong> Phone number</div>
                  <div>✅ <strong>Employee ID:</strong> Unique identifier</div>
                  <div>✅ <strong>Gross Salary:</strong> Total salary amount</div>
                  <div>✅ <strong>PF Deduction:</strong> Provident Fund amount</div>
                  <div>✅ <strong>ESI Deduction:</strong> Employee State Insurance</div>
                  <div>✅ <strong>Net Pay:</strong> Final amount after deductions</div>
                  <div>✅ <strong>Days:</strong> Working days (e.g., 31)</div>
                  <div className="mt-2 text-green-700">
                    <strong>📱 SMS Features:</strong> Hindi month names, month selection, detailed breakdown
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name Column
                  </label>
                  <input
                    type="text"
                    value={settings.salary.nameColumn}
                    onChange={(e) => handleInputChange('salary', 'nameColumn', e.target.value.toUpperCase())}
                    placeholder="A"
                    maxLength="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Employee Name</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Column
                  </label>
                  <input
                    type="text"
                    value={settings.salary.phoneColumn}
                    onChange={(e) => handleInputChange('salary', 'phoneColumn', e.target.value.toUpperCase())}
                    placeholder="B"
                    maxLength="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Phone Number</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employee ID Column
                  </label>
                  <input
                    type="text"
                    value={settings.salary.employeeIdColumn}
                    onChange={(e) => handleInputChange('salary', 'employeeIdColumn', e.target.value.toUpperCase())}
                    placeholder="C"
                    maxLength="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Employee ID</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gross Salary Column
                  </label>
                  <input
                    type="text"
                    value={settings.salary.grossSalaryColumn}
                    onChange={(e) => handleInputChange('salary', 'grossSalaryColumn', e.target.value.toUpperCase())}
                    placeholder="D"
                    maxLength="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Gross Salary</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PF Column
                  </label>
                  <input
                    type="text"
                    value={settings.salary.pfColumn}
                    onChange={(e) => handleInputChange('salary', 'pfColumn', e.target.value.toUpperCase())}
                    placeholder="E"
                    maxLength="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">PF Deduction</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ESI Column
                  </label>
                  <input
                    type="text"
                    value={settings.salary.esiColumn}
                    onChange={(e) => handleInputChange('salary', 'esiColumn', e.target.value.toUpperCase())}
                    placeholder="F"
                    maxLength="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">ESI Deduction</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Net Pay Column
                  </label>
                  <input
                    type="text"
                    value={settings.salary.netPayColumn}
                    onChange={(e) => handleInputChange('salary', 'netPayColumn', e.target.value.toUpperCase())}
                    placeholder="G"
                    maxLength="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Net Pay</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Days Column
                  </label>
                  <input
                    type="text"
                    value={settings.salary.daysColumn}
                    onChange={(e) => handleInputChange('salary', 'daysColumn', e.target.value.toUpperCase())}
                    placeholder="H"
                    maxLength="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Days Worked</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Template Names Section */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-purple-600" />
              SMS Template Configuration
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Configure SMS template names for different message types
            </p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attendance Template Name
                </label>
                <input
                  type="text"
                  value={settings.templateNames.attendanceTempletName}
                  onChange={(e) => handleInputChange('templateNames', 'attendanceTempletName', e.target.value)}
                  placeholder="attedence"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Template name for attendance SMS</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Salary Template Name
                </label>
                <input
                  type="text"
                  value={settings.templateNames.salaryTempletName}
                  onChange={(e) => handleInputChange('templateNames', 'salaryTempletName', e.target.value)}
                  placeholder="salary"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Template name for salary SMS (Enhanced with Hindi months)</p>
              </div>
            </div>
          </div>
        </div>

        {/* System Reset Section - Super Admin Only */}
        {isSuperAdmin && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-red-200">
            <div className="bg-gradient-to-r from-red-50 to-orange-50 px-6 py-4 border-b border-red-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Database className="h-5 w-5 text-red-600" />
                System Management
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                View system statistics and manage data cleanup (Super Admin Only)
              </p>
            </div>

            <div className="p-6">
              {/* System Statistics */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    System Statistics
                  </h3>
                  <button
                    onClick={fetchSystemStats}
                    disabled={statsLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {statsLoading ? 'Loading...' : 'Refresh Stats'}
                  </button>
                </div>

                {systemStats ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="text-2xl font-bold text-blue-600">{systemStats.totalSMSRecords}</div>
                      <div className="text-sm text-blue-800">Total SMS Records</div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="text-2xl font-bold text-green-600">{systemStats.totalQueueEntries}</div>
                      <div className="text-sm text-green-800">Queue Entries</div>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="text-2xl font-bold text-orange-600">{systemStats.totalUsers}</div>
                      <div className="text-sm text-orange-800">System Users</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    {statsLoading ? 'Loading statistics...' : 'Click "Refresh Stats" to view system statistics'}
                  </div>
                )}
              </div>

              {/* System Reset */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2 mb-4">
                  <Trash2 className="h-5 w-5 text-red-600" />
                  System Reset
                </h3>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reset Type
                  </label>
                  <select
                    value={resetType}
                    onChange={(e) => setResetType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="sms_data">SMS Data Only (Keep Users & Settings)</option>
                    <option
                      value="all_data"
                      disabled
                      className="bg-gray-200 text-gray-500 cursor-not-allowed"
                    >
                      All Data (Complete System Reset) (RESTRICTED)
                    </option>

                  </select>
                </div>

                {!showResetConfirm ? (
                  <button
                    onClick={() => setShowResetConfirm(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    {resetType === 'sms_data' ? 'Clear SMS Data' : 'Reset All Data'}
                  </button>
                ) : (
                  <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                    <p className="text-red-800 mb-4">
                      <strong>⚠️ Warning:</strong> This action will permanently delete {
                        resetType === 'sms_data'
                          ? 'all SMS records and queue entries'
                          : 'ALL system data including users, settings, and SMS records'
                      }. This cannot be undone.
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={handleSystemReset}
                        disabled={resetLoading}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {resetLoading ? 'Resetting...' : 'Confirm Reset'}
                      </button>
                      <button
                        onClick={() => setShowResetConfirm(false)}
                        disabled={resetLoading}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <Save className="h-5 w-5" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>

          <button
            onClick={handleReset}
            disabled={saving}
            className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw className="h-5 w-5" />
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
