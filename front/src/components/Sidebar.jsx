"use client"

import { useEffect, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  FileText,
  ChevronDown,
  ChevronRight,
  Plus,
  Eye,
  Settings,
  MessageCircle,
  MessageSquareText,
  MessageSquare,
  ShieldX,
  Wallet,
  User,
  BarChart3
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

const Sidebar = () => {
  const location = useLocation()
  const [expandedMenus, setExpandedMenus] = useState({})
  const { isSuperAdmin } = useAuth()

  const toggleMenu = (menuKey) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuKey]: !prev[menuKey],
    }))
  }

  const isActive = (path) => location.pathname === path

  const menuItems = [
    {
      key: "dashboard",
      title: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard",
      isVisible: true,
    },
    {
      key: "Attendance",
      title: "Attendance",
      icon: MessageSquareText,
      path: "/attendance",
      isVisible: true,
    },
    {
      key: "salary",
      title: "Salary",
      icon: MessageSquare,
      path: "/salary",
      isVisible: true,
    },
    {
      key: "failedSms",
      title: "Failed SMS",
      icon: ShieldX,
      path: "/failedSms",
      isVisible: true,
    },
    {
      key: "performance",
      title: "Performance",
      icon: BarChart3,
      path: "/performance",
      isVisible: false,
    },
    {
      key: "admin",
      title: "Create Admin",
      icon: User,
      path: "/admin/create",
      isVisible: isSuperAdmin,
    },
    {
      key: "settings",
      title: "Settings",
      icon: Settings,
      path: "/settings",
      isVisible: isSuperAdmin,
    },
  ]

  useEffect(() => {
    if (isSuperAdmin) {
      menuItems.push({
        key: "admin",
        title: "Create Admin",
        icon: User,
        path: "/admin/create",
      })
    }
  }, [])

  return (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="px-6 py-4.5 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">SUKHMAA SONS</h1>
            <p className="text-sm text-gray-500">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {menuItems.filter(item => item.isVisible).map((item) => (
          <div key={item.key}>
            {item.hasSubmenu ? (
              <div>
                <button
                  onClick={() => toggleMenu(item.key)}
                  className="w-full flex items-center justify-between px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.title}</span>
                  </div>
                  {expandedMenus[item.key] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>

                {expandedMenus[item.key] && (
                  <div className="ml-6 mt-2 space-y-1">
                    {item.subItems.map((subItem) => (
                      <Link
                        key={subItem.path}
                        to={subItem.path}
                        className={`flex items-center space-x-3 px-3 py-2 text-sm rounded-lg transition-colors duration-200 ${isActive(subItem.path)
                            ? "bg-blue-50 text-blue-700 border-l-4 border-blue-600"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                          }`}
                      >
                        <subItem.icon className="w-4 h-4" />
                        <span>{subItem.title}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                to={item.path}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors duration-200 ${isActive(item.path)
                    ? "bg-blue-50 text-blue-700 border-l-4 border-blue-600"
                    : "text-gray-700 hover:bg-gray-100"
                  }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.title}</span>
              </Link>
            )}
          </div>
        ))}
      </nav>
    </div>
  )
}

export default Sidebar
