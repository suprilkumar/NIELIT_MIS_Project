'use client';

import React from 'react';
import { Menu, Bell, User, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

const DashboardNavbar = ({ toggleSidebar, isSidebarOpen }) => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <>
      {/* Desktop Navbar - Relative positioning */}
      <nav className="hidden lg:block bg-blue-900 border-b border-blue-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={toggleSidebar}
              className="p-2 mr-3 text-blue-200 rounded-lg cursor-pointer hover:bg-blue-800 hover:text-white transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-xl font-semibold text-white">
              Dashboard
            </span>
          </div>

          <div className="flex items-center space-x-3">

          <Link href="/" className="flex items-center space-x-3 bg-blue-800 rounded-lg px-3 py-1.5">
             Home
            </Link>


            <button className="p-2 text-blue-200 rounded-lg hover:bg-blue-800 hover:text-white transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            <div className="flex items-center space-x-3 bg-blue-800 rounded-lg px-3 py-1.5">
              <div className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-blue-200" />
              </div>
              <div className="block">
                <p className="text-sm font-medium text-white">
                  {user?.full_name || 'User'}
                </p>
                <p className="text-xs text-blue-300 capitalize">
                  {user?.role || 'Admin'}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 px-3 py-2 text-sm text-blue-200 hover:text-white hover:bg-blue-800 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Navbar - Fixed positioning */}
      <nav className="lg:hidden bg-blue-900 border-b border-blue-800 px-4 py-3 fixed top-0 left-0 right-0 z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={toggleSidebar}
              className="p-2 mr-3 text-blue-200 rounded-lg cursor-pointer hover:bg-blue-800 hover:text-white transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-xl font-semibold text-white">
              Dashboard
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button className="p-2 text-blue-200 rounded-lg hover:bg-blue-800 hover:text-white transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            <button
              onClick={handleLogout}
              className="p-2 text-blue-200 hover:text-white hover:bg-blue-800 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile content spacer */}
      <div className="lg:hidden h-16"></div>
    </>
  );
};

export default DashboardNavbar;