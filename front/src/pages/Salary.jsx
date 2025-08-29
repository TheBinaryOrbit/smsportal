import { useState } from "react"
import { Upload, DollarSign, CheckCircle, AlertCircle, Clock, BarChart3 } from "lucide-react"

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const SalaryPage = () => {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)
  const [queueStatus, setQueueStatus] = useState(null)
  const [failedSMS, setFailedSMS] = useState([])
  const [loadingStatus, setLoadingStatus] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1) // Default to current month
  
  // Hindi months mapping
  const hindiMonths = [
    { value: 1, label: 'जनवरी', name: 'January' },
    { value: 2, label: 'फ़रवरी', name: 'February' },
    { value: 3, label: 'मार्च', name: 'March' },
    { value: 4, label: 'अप्रैल', name: 'April' },
    { value: 5, label: 'मई', name: 'May' },
    { value: 6, label: 'जून', name: 'June' },
    { value: 7, label: 'जुलाई', name: 'July' },
    { value: 8, label: 'अगस्त', name: 'August' },
    { value: 9, label: 'सितंबर', name: 'September' },
    { value: 10, label: 'अक्टूबर', name: 'October' },
    { value: 11, label: 'नवंबर', name: 'November' },
    { value: 12, label: 'दिसंबर', name: 'December' }
  ]

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      const allowedExtensions = ['.xlsx', '.xls']
      const fileExtension = selectedFile.name.toLowerCase().slice(selectedFile.name.lastIndexOf('.'))
      
      if (allowedExtensions.includes(fileExtension)) {
        setFile(selectedFile)
        setUploadResult(null)
      } else {
        alert('Please select a valid Excel file (.xlsx or .xls)')
      }
    }
  }

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file first')
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('excel', file)
    formData.append('selectedMonth', selectedMonth.toString())

    try {
      const response = await fetch(`${API_BASE_URL}/sms/upload/salary`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      })

      const result = await response.json()
      
      if (result.success) {
        setUploadResult(result)
        setFile(null)
        // Reset file input
        document.getElementById('salary-file-input').value = ''
        // Refresh queue status
        fetchQueueStatus()
      } else {
        alert(result.message || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Network error during upload')
    } finally {
      setUploading(false)
    }
  }

  const fetchQueueStatus = async () => {
    setLoadingStatus(true)
    try {
      const response = await fetch(`${API_BASE_URL}/sms/queue/status?type=salary`, {
        credentials: 'include'
      })
      const result = await response.json()
      
      if (result.success) {
        setQueueStatus(result.data)
      }
    } catch (error) {
      console.error('Error fetching queue status:', error)
    } finally {
      setLoadingStatus(false)
    }
  }

  const fetchFailedSMS = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/sms/failed?type=salary`, {
        credentials: 'include'
      })
      const result = await response.json()
      
      if (result.success) {
        setFailedSMS(result.data.records)
      }
    } catch (error) {
      console.error('Error fetching failed SMS:', error)
    }
  }

  const retryFailedSMS = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/sms/retry/${id}`, {
        method: 'POST',
        credentials: 'include'
      })
      const result = await response.json()
      
      if (result.success) {
        alert('SMS retry initiated successfully')
        fetchFailedSMS()
        fetchQueueStatus()
      } else {
        alert(result.message || 'Retry failed')
      }
    } catch (error) {
      console.error('Error retrying SMS:', error)
      alert('Network error during retry')
    }
  }

  // Fetch data on component mount
  useState(() => {
    fetchQueueStatus()
    fetchFailedSMS()
  }, [])

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
          <DollarSign className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Salary SMS</h1>
          <p className="text-gray-600">Upload Excel file to send salary SMS notifications</p>
        </div>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Salary File</h2>
        
        <div className="space-y-4">
          {/* Month Selection */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Month (महीना चुनें)
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              {hindiMonths.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label} ({month.name})
                </option>
              ))}
            </select>
            <p className="text-xs text-blue-600 mt-1">
              This month will be used in salary SMS notifications: "{hindiMonths.find(m => m.value === selectedMonth)?.label}-[Days]-दिन"
            </p>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Select Excel file with enhanced salary data
              </p>
              {/* <p className="text-xs text-gray-500">
                Columns: Name (A), Phone (B), Employee ID (C), Gross Salary (D), PF (E), ESI (F), Net Pay (G), Days (H)
              </p> */}
              {/* <p className="text-xs text-emerald-600">
                📱 SMS will include: Name-ID, Selected Month with Days from Excel, Detailed salary breakdown
              </p> */}
            </div>
            
            <input
              id="salary-file-input"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="mt-4 block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-emerald-50 file:text-emerald-700
                hover:file:bg-emerald-100"
            />
          </div>

          {file && (
            <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg">
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-900">{file.name}</span>
              </div>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploading...' : 'Upload & Process'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Upload Result */}
      {uploadResult && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Results</h2>
          
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">{uploadResult.message}</span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{uploadResult.data.totalRows}</div>
                <div className="text-sm text-gray-600">Total Rows</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{uploadResult.data.processedRows}</div>
                <div className="text-sm text-gray-600">Processed</div>
              </div>
              <div className="text-center p-3 bg-emerald-50 rounded-lg">
                <div className="text-2xl font-bold text-emerald-600">{uploadResult.data.queuedForSMS}</div>
                <div className="text-sm text-gray-600">Queued for SMS</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{uploadResult.data.errors.length}</div>
                <div className="text-sm text-gray-600">Errors</div>
              </div>
            </div>

            {uploadResult.data.errors.length > 0 && (
              <div className="mt-4">
                <h3 className="font-medium text-red-900 mb-2">Errors:</h3>
                <ul className="text-sm text-red-700 space-y-1">
                  {uploadResult.data.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Queue Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">SMS Queue Status</h2>
          <button
            onClick={fetchQueueStatus}
            disabled={loadingStatus}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {queueStatus ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <Clock className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-yellow-700">{queueStatus.pending}</div>
              <div className="text-sm text-yellow-600">Pending</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-700">{queueStatus.completed}</div>
              <div className="text-sm text-green-600">Completed</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
              <AlertCircle className="w-6 h-6 text-red-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-red-700">{queueStatus.failed}</div>
              <div className="text-sm text-red-600">Failed</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
              <BarChart3 className="w-6 h-6 text-gray-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-700">{queueStatus.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            {loadingStatus ? 'Loading...' : 'No queue data available'}
          </div>
        )}
      </div>

      {/* Failed SMS */}
      {failedSMS.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Failed SMS Records</h2>
          
          <div className="space-y-3">
            {failedSMS.map((record) => (
              <div key={record._id} className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                <div>
                  <div className="font-medium text-gray-900">{record.name}</div>
                  <div className="text-sm text-gray-600">{record.phone}</div>
                  <div className="text-sm text-emerald-600">
                    Amount: ₹{record.data.amount}
                  </div>
                  <div className="text-xs text-gray-500">{record.error}</div>
                </div>
                <button
                  onClick={() => retryFailedSMS(record._id)}
                  className="px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
                >
                  Retry
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default SalaryPage
