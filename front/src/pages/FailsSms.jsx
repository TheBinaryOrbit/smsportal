import { useState, useEffect } from "react"
import { AlertTriangle, RefreshCw, Phone, Calendar, DollarSign, User, Filter } from "lucide-react"


const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';


const FailsSmsPage = () => {
  const [failedSMS, setFailedSMS] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)
  const [retrying, setRetrying] = useState({})

  const fetchFailedSMS = async (currentPage = 1, type = 'all') => {
    setLoading(true)
    try {
      const typeParam = type !== 'all' ? `&type=${type}` : ''
      const response = await fetch(`${API_BASE_URL}/sms/failed?page=${currentPage}&limit=10${typeParam}`, {
        credentials: 'include'
      })
      const result = await response.json()
      
      if (result.success) {
        setFailedSMS(result.data.records)
        setPagination(result.data.pagination)
      } else {
        console.error('Failed to fetch failed SMS:', result.message)
      }
    } catch (error) {
      console.error('Error fetching failed SMS:', error)
    } finally {
      setLoading(false)
    }
  }

  const retryFailedSMS = async (id) => {
    setRetrying(prev => ({ ...prev, [id]: true }))
    try {
      const response = await fetch(`${API_BASE_URL}/sms/retry/${id}`, {
        method: 'POST',
        credentials: 'include'
      })
      const result = await response.json()
      
      if (result.success) {
        // Remove the record from the list
        setFailedSMS(prev => prev.filter(record => record._id !== id))
        alert('SMS retry initiated successfully')
      } else {
        alert(result.message || 'Retry failed')
      }
    } catch (error) {
      console.error('Error retrying SMS:', error)
      alert('Network error during retry')
    } finally {
      setRetrying(prev => ({ ...prev, [id]: false }))
    }
  }

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter)
    setPage(1)
    fetchFailedSMS(1, newFilter)
  }

  const handlePageChange = (newPage) => {
    setPage(newPage)
    fetchFailedSMS(newPage, filter)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  useEffect(() => {
    fetchFailedSMS()
  }, [])

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Failed SMS</h1>
            <p className="text-gray-600">Manage and retry failed SMS notifications</p>
          </div>
        </div>
        
        <button
          onClick={() => fetchFailedSMS(page, filter)}
          disabled={loading}
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <span className="font-medium text-gray-900">Filter by type:</span>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => handleFilterChange('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all' 
                  ? 'bg-gray-900 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => handleFilterChange('attendance')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'attendance' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              Attendance
            </button>
            <button
              onClick={() => handleFilterChange('salary')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'salary' 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
              }`}
            >
              Salary
            </button>
          </div>
        </div>
      </div>

      {/* Failed SMS List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading failed SMS records...</p>
          </div>
        ) : failedSMS.length === 0 ? (
          <div className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No failed SMS records found</p>
            <p className="text-gray-500 text-sm mt-2">
              {filter !== 'all' ? `No failed ${filter} SMS records` : 'All SMS are working properly!'}
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Failed SMS Records ({pagination?.total || 0})
              </h2>
            </div>

            {/* Records */}
            <div className="p-6 space-y-4">
              {failedSMS.map((record) => (
                <div key={record._id} className="border border-red-200 rounded-lg p-4 bg-red-50 hover:bg-red-100 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Header with type badge */}
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          record.type === 'attendance' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {record.type.charAt(0).toUpperCase() + record.type.slice(1)}
                        </span>
                        <span className="text-xs text-gray-500">
                          Failed: {formatDate(record.finalFailureAt)}
                        </span>
                      </div>

                      {/* Contact Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-600" />
                          <span className="font-medium text-gray-900">{record.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-600" />
                          <span className="text-gray-700">{record.phone}</span>
                        </div>
                      </div>

                      {/* Type-specific data */}
                      {record.type === 'attendance' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-blue-600" />
                            <span className="text-sm text-gray-700">
                              Date: {record.data.date}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${
                              record.data.status?.toLowerCase() === 'present' ? 'bg-green-500' : 'bg-red-500'
                            }`}></div>
                            <span className="text-sm text-gray-700">
                              Status: {record.data.status}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="mb-3">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-emerald-600" />
                            <span className="text-sm text-gray-700">
                              Amount: ₹{record.data.amount}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Error message */}
                      <div className="bg-red-100 border border-red-200 rounded-lg p-3">
                        <p className="text-sm font-medium text-red-800 mb-1">Error Details:</p>
                        <p className="text-sm text-red-700">{record.error}</p>
                      </div>
                    </div>

                    {/* Retry button */}
                    <div className="ml-4">
                      <button
                        onClick={() => retryFailedSMS(record._id)}
                        disabled={retrying[record._id]}
                        className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <RefreshCw className={`w-4 h-4 ${retrying[record._id] ? 'animate-spin' : ''}`} />
                        {retrying[record._id] ? 'Retrying...' : 'Retry'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="p-6 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-700">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                  </p>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                      className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    <span className="px-3 py-2 text-sm bg-red-600 text-white rounded-lg">
                      {page} of {pagination.pages}
                    </span>
                    
                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page === pagination.pages}
                      className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
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

export default FailsSmsPage
