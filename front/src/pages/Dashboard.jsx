import { FileText, Clock, Target, TrendingUp, Download, Plus, Eye, Edit, MoreHorizontal, ChevronRight } from "lucide-react"
import WalletPage from "./Wallet"
import { Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

const Dashboard = () => {
  const { isSuperAdmin } = useAuth()

  return (
    <div className="space-y-8">
      {/* Wallet summary at top (no header) */}
      <WalletPage />


      {/* Regular Quick Links section */}
      <div className="">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Access</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link 
            to="/attendance" 
            className="group relative bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 hover:shadow-lg transition-all duration-300 border border-blue-200 hover:-translate-y-1 flex items-center justify-between overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="font-semibold text-gray-900 mb-1">Attendance</div>
              <div className="text-sm text-gray-600">Track & manage</div>
            </div>
            <ChevronRight className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
          
          <Link 
            to="/salary" 
            className="group relative bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl p-6 hover:shadow-lg transition-all duration-300 border border-emerald-200 hover:-translate-y-1 flex items-center justify-between overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="font-semibold text-gray-900 mb-1">Salary</div>
              <div className="text-sm text-gray-600">Payroll details</div>
            </div>
            <ChevronRight className="w-5 h-5 text-emerald-600 group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
          
          <Link 
            to="/failedSms" 
            className="group relative bg-gradient-to-r from-red-50 to-red-100 rounded-xl p-6 hover:shadow-lg transition-all duration-300 border border-red-200 hover:-translate-y-1 flex items-center justify-between overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-red-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="font-semibold text-gray-900 mb-1">Failed SMS</div>
              <div className="text-sm text-gray-600">View issues</div>
            </div>
            <ChevronRight className="w-5 h-5 text-red-600 group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
          
          <Link 
            to="/wallet" 
            className="group relative bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-6 hover:shadow-lg transition-all duration-300 border border-purple-200 hover:-translate-y-1 flex items-center justify-between overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="font-semibold text-gray-900 mb-1">Wallet</div>
              <div className="text-sm text-gray-600">SMS Credits</div>
            </div>
            <ChevronRight className="w-5 h-5 text-purple-600 group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
        </div>
      </div>

      {/* Admin Links Section - Separated Below */}
      {isSuperAdmin && (
        <div className="">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Admin Controls</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            <Link 
              to="/admin/create" 
              className="group relative bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-6 hover:shadow-lg transition-all duration-300 border border-purple-200 hover:-translate-y-1 flex items-center justify-between overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="font-semibold text-gray-900 mb-1">Create Admin</div>
                <div className="text-sm text-gray-600">Add new administrator</div>
              </div>
              <ChevronRight className="w-5 h-5 text-purple-600 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
            
            <Link 
              to="/settings" 
              className="group relative bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-6 hover:shadow-lg transition-all duration-300 border border-orange-200 hover:-translate-y-1 flex items-center justify-between overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-orange-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="font-semibold text-gray-900 mb-1">Settings</div>
                <div className="text-sm text-gray-600">System configuration</div>
              </div>
              <ChevronRight className="w-5 h-5 text-orange-600 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard