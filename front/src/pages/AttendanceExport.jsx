import { useState, useEffect } from "react"
import { 
  Download, 
  Filter, 
  Calendar, 
  FileSpreadsheet, 
  FileText, 
  Eye, 
  RefreshCw,
  Search,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react"

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const AttendanceExportPage = () => {
  const [attendanceData, setAttendanceData] = useState([])
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [filters, setFilters] = useState({
    date: '',
    status: 'all'
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  })
  const [selectedRecords, setSelectedRecords] = useState([])
  const [selectAll, setSelectAll] = useState(false)

  const statusOptions = [
    { value: 'all', label: 'All Status', color: 'gray' },
    { value: 'pending', label: 'Pending', color: 'yellow' },
    { value: 'completed', label: 'Completed', color: 'green' },
    { value: 'failed', label: 'Failed', color: 'red' }
  ]

  const fetchAttendanceData = async (page = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        type: 'attendance',
        ...filters
      })

      const response = await fetch(`${API_BASE_URL}/sms/attendance/data?${params}`, {
        credentials: 'include'
      })
      const result = await response.json()
      
      if (result.success) {
        setAttendanceData(result.data.records)
        setPagination({
          ...pagination,
          page: result.data.page,
          total: result.data.total,
          totalPages: result.data.totalPages
        })
      } else {
        console.error('Failed to fetch data:', result.message)
      }
    } catch (error) {
      console.error('Error fetching attendance data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const applyFilters = () => {
    setPagination(prev => ({ ...prev, page: 1 }))
    fetchAttendanceData(1)
  }

  const clearFilters = () => {
    setFilters({ date: '', status: 'all' })
    setPagination(prev => ({ ...prev, page: 1 }))
    setTimeout(() => fetchAttendanceData(1), 100)
  }

  const handlePageChange = (newPage) => {
    fetchAttendanceData(newPage)
  }

  const handleSelectRecord = (recordId) => {
    setSelectedRecords(prev => {
      if (prev.includes(recordId)) {
        return prev.filter(id => id !== recordId)
      } else {
        return [...prev, recordId]
      }
    })
  }

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRecords([])
    } else {
      setSelectedRecords(attendanceData.map(record => record._id))
    }
    setSelectAll(!selectAll)
  }

  const exportData = async (format) => {
    setExporting(true)
    try {
      const params = new URLSearchParams({
        format,
        type: 'attendance',
        ...filters
      })

      const response = await fetch(`${API_BASE_URL}/sms/attendance/export?${params}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `attendance_data_${Date.now()}.${format === 'excel' ? 'xlsx' : 'csv'}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        const errorData = await response.json()
        alert(errorData.message || 'Export failed')
      }
    } catch (error) {
      console.error('Export error:', error)
      alert('Network error during export')
    } finally {
      setExporting(false)
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = statusOptions.find(opt => opt.value === status) || statusOptions[0]
    const colors = {
      gray: 'bg-gray-100 text-gray-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      green: 'bg-green-100 text-green-800',
      red: 'bg-red-100 text-red-800'
    }
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${colors[statusConfig.color]}`}>
        {status === 'completed' && <CheckCircle className="w-3 h-3" />}
        {status === 'failed' && <XCircle className="w-3 h-3" />}
        {status === 'pending' && <Clock className="w-3 h-3" />}
        {statusConfig.label}
      </span>
    )
  }

  useEffect(() => {
    fetchAttendanceData()
  }, [])

  useEffect(() => {
    setSelectAll(selectedRecords.length === attendanceData.length && attendanceData.length > 0)
  }, [selectedRecords, attendanceData])

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
            <Download className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Export Attendance Data</h1>
            <p className="text-gray-600">Filter and export attendance records</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportData('excel')}
            disabled={exporting || attendanceData.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet className="w-4 h-4" />
            {exporting ? 'Exporting...' : 'Export Excel'}
          </button>
          <button
            onClick={() => exportData('csv')}
            disabled={exporting || attendanceData.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText className="w-4 h-4" />
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={filters.date}
              onChange={(e) => handleFilterChange('date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end gap-2">
            <button
              onClick={applyFilters}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Search className="w-4 h-4" />
              Apply
            </button>
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              <RefreshCw className="w-4 h-4" />
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Data Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{pagination.total}</div>
            <div className="text-sm text-gray-600">Total Records</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {attendanceData.filter(r => r.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {attendanceData.filter(r => r.status === 'pending').length}
            </div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {attendanceData.filter(r => r.status === 'failed').length}
            </div>
            <div className="text-sm text-gray-600">Failed</div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-900">Attendance Records</h2>
              <span className="text-sm text-gray-500">
                ({attendanceData.length} of {pagination.total} records)
              </span>
            </div>
            
            <button
              onClick={() => fetchAttendanceData(pagination.page)}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
            <p className="text-gray-500">Loading attendance data...</p>
          </div>
        ) : attendanceData.length === 0 ? (
          <div className="p-12 text-center">
            <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No attendance data found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Duration</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attendanceData.map((record) => (
                    <tr key={record._id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedRecords.includes(record._id)}
                          onChange={() => handleSelectRecord(record._id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{record.name}</div>
                        <div className="text-sm text-gray-500">{record.phone}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.employeeId}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.selectedDate}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{record.workDuration}</div>
                        <div className="text-sm text-gray-500">
                          {record.inTime} - {record.outTime}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {getStatusBadge(record.status)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => {
                            alert(`Template: ${record.messageTemplate}`)
                          }}
                          className="flex items-center gap-1 px-2 py-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                        >
                          <Eye className="w-4 h-4" />
                          Preview
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing page {pagination.page} of {pagination.totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, pagination.page - 2) + i
                      if (pageNum <= pagination.totalPages) {
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-3 py-2 text-sm rounded-lg ${
                              pageNum === pagination.page
                                ? 'bg-blue-600 text-white'
                                : 'border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        )
                      }
                      return null
                    })}
                    
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default AttendanceExportPage
