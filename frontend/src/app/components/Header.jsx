'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Building2,  User,  LogIn,  UserPlus,  LayoutDashboard, Menu, X, Shield} from 'lucide-react';
import Image from 'next/image';

const Header = () => {
  const { user, isLoading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-blue-950 shadow-elevation-2 sticky top-0 z-50 border-b border-gray-200">
      <div className="container-responsive">
      <div className="bg-white px-4 py-2">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row text-sm md:text-xl text-black font-bold items-center justify-between">
          {/* Left Image + Text */}
          <div className="flex items-center gap-2">
            <div className=''>
            <Image
              src="/assets/nielit_logo.jpg"
              alt="NIELIT Logo"
              width={120}
              height={120}
              />
            </div>
            <div className='flex flex-col '>
              <h1>National Institute of Electronics & Information Technology</h1>
              <h1>राष्ट्रीय इलेक्ट्रॉनिकी एवं सूचना प्रौद्योगिकी संस्थान</h1>
            </div>
          </div>

          {/* Right Image + Text */}
          <div className="flex items-center gap-2">
          <div className='flex flex-col '>
              <h1>Ministry of Electronics & Information Technology</h1>
              <h1 className='text-xs md:text-lg text-end'>Government of India</h1>
            </div>
            <Image
              src="/assets/nat_emblem.jpg"
              alt="Right Logo"
              width={40}
              height={40}
            />
          </div>
        </div>
      </div>
        <div className="flex justify-between items-center h-16 px-4">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-primary-800">HEAVY SYSTUMM</h1>
                <p className="text-xs text-gray-500">Secure Government Portal</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8 text-white font-semibold md:text-lg text-sm mx-4">
            <Link
              href="/"
              className="hover:underline underline-offset-4 transition-colors"
            >
              Home
            </Link>
            <Link
              href="/about"
              className="hover:underline underline-offset-4 transition-colors"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="hover:underline underline-offset-4 transition-colors"
            >
              Contact
            </Link>
            
            {isLoading ? (
              <div className="animate-pulse h-8 w-32 bg-gray-200 rounded"></div>
            ) : user ? (
              <div className="flex items-center space-x-4">
                <div className="hidden lg:flex items-center space-x-2 text-sm">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-primary-600" />
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-white">{user.full_name}</p>
                    <p className="text-xs text-gray-400 capitalize">{user.role}</p>
                  </div>
                </div>
                <Link
                  href="/dashboard"
                  className="btn-primary flex items-center space-x-2 px-4 py-2 text-sm md:text-xl"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/login"
                  className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 font-medium text-sm"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Sign In</span>
                </Link>
                <Link
                  href="/register"
                  className="btn-primary flex items-center space-x-2 px-4 py-2 text-sm"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Register</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6 text-gray-700" />
            ) : (
              <Menu className="h-6 w-6 text-gray-700" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 animate-fade-in">
            <div className="space-y-4">
              <Link
                href="/"
                className="block px-4 py-2 text-gray-700 hover:text-primary-600 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/about"
                className="block px-4 py-2 text-gray-700 hover:text-primary-600 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              <Link
                href="/contact"
                className="block px-4 py-2 text-gray-700 hover:text-primary-600 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </Link>
              
              {user ? (
                <div className="pt-4 border-t border-gray-200 space-y-3">
                  <div className="flex items-center space-x-3 px-4">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{user.full_name}</p>
                      <p className="text-sm text-gray-500 capitalize">{user.role}</p>
                    </div>
                  </div>
                  <Link
                    href="/dashboard"
                    className="block btn-primary text-center mx-4"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Go to Dashboard
                  </Link>
                </div>
              ) : (
                <div className="pt-4 border-t border-gray-200 space-y-3">
                  <Link
                    href="/login"
                    className="block text-center text-primary-600 hover:text-primary-700 font-medium px-4 py-3"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="block btn-primary text-center mx-4"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Register Account
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
export default Header;