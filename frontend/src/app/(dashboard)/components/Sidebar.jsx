'use client';

import React from 'react';
import Link from 'next/link';
import { useState } from "react";
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  FaChevronDown, FaChevronUp, FaTachometerAlt, FaBuilding, 
  FaFolder, FaBook, FaClipboardList, FaClipboardCheck, 
  FaCalendarAlt, FaFileAlt, FaSearch, FaUsers, FaPlus,
  FaList, FaCheck, FaTimes, FaEye, FaChartBar
} from "react-icons/fa";
import { MdOutlineDashboardCustomize, MdAccountBox } from "react-icons/md";
import Image from 'next/image';

const Sidebar = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const { user } = useAuth();

  // State for dropdowns
  const [openMenus, setOpenMenus] = useState({
    centre: false,
    category: false,
    course: false,
    courseEntry: false,
    adminCourseEntry: false
  });

  // Toggle dropdown
  const toggleMenu = (menu) => {
    setOpenMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
  };

  // Handle navigation and close sidebar on mobile
  const handleNavigation = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      onClose();
    }
  };

  // Function to set active styles
  const linkClasses = (path) =>
    `block px-4 py-1.5 rounded-lg text-black text-sm  font-semibold transition-all duration-200 flex gap-2 items-center ${
      pathname === path
        ? "bg-gradient-to-r from-lime-200 via-lime-400 to-lime-500 shadow-md"
        : "bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-cyan-300"
    }`;

  const buttonClasses = "w-full flex justify-between items-center bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-cyan-300 px-4 py-1.5 rounded-lg text-black font-semibold text-sm transition-all duration-200";

  const subMenuClasses = "ml-2 mt-2 space-y-1 border-l-2 border-cyan-400 pl-3";

  // Menu items configuration
  const menuItems = [
    {
      type: 'link',
      path: '/dashboard',
      icon: <MdOutlineDashboardCustomize className="text-xl" />,
      label: 'Dashboard'
    },
    {
      type: 'dropdown',
      key: 'centre',
      icon: <MdAccountBox className="text-xl" />,
      label: 'Centre Details',
      items: [
        { path: '/dashboard/admin/centre/add-centre', icon: <FaPlus />, label: 'Add Centre' },
        { path: '/dashboard/admin/centre', icon: <FaBuilding />, label: 'Centre Details' }
      ]
    },
    {
      type: 'dropdown',
      key: 'category',
      icon: <FaFolder className="text-xl" />,
      label: 'Course Category',
      items: [
        { path: '/dashboard/admin/course-category/add-course-category', icon: <FaPlus />, label: 'Add Course Category' },
        { path: '/dashboard/admin/course-category', icon: <FaList />, label: 'Manage Course Categories' }
      ]
    },
    {
      type: 'dropdown',
      key: 'course',
      icon: <FaBook className="text-xl" />,
      label: 'Course',
      items: [
        { path: '/dashboard/operator/course', icon: <FaList />, label: 'Manage Courses' },
        { path: '/dashboard/operator/course/add-course', icon: <FaPlus />, label: 'Add Course' },
        { path: '/dashboard/operator/course/active', icon: <FaCheck />, label: 'Active Courses' },
        { path: '/dashboard/operator/course/inactive', icon: <FaTimes />, label: 'Inactive Courses' }
      ]
    },
    {
      type: 'dropdown',
      key: 'adminCourseEntry',
      icon: <FaClipboardCheck className="text-xl" />,
      label: 'Admin Course Entry',
      items: [
        { path: '/dashboard/admin/course-entry/create', icon: <FaPlus />, label: 'Create Course Entry' },
        { path: '/dashboard/admin/course-entry/list', icon: <FaList />, label: 'List Course Entries' },
        { path: '/dashboard/admin/course-entry/verify', icon: <FaList />, label: 'Verify Course Entries' }
      ]
    },
    {
      type: 'dropdown',
      key: 'courseEntry',
      icon: <FaClipboardList className="text-xl" />,
      label: 'Course Entries Data',
      items: [
        { path: '/dashboard/operator/course-entry/create', icon: <FaPlus />, label: 'Create New Entry' },
        { path: '/dashboard/operator/course-entry/view', icon: <FaEye />, label: 'View Entries Data' },
        { path: '/dashboard/operator/course-entry/detail', icon: <FaChartBar />, label: 'Detailed Entries Data' }
      ]
    },
    {
      type: 'link',
      path: '/dashboard/admin/report',
      icon: <FaFileAlt className="text-xl" />,
      label: 'Generate Report'
    },
    {
      type: 'link',
      path: '/dashboard/operator/mis-file/upload',
      icon: <FaFileAlt className="text-xl" />,
      label: 'Upload MIS CSV'
    },
    {
      type: 'link',
      path: '/dashboard/operator/month-year-course-entry',
      icon: <FaCalendarAlt className="text-xl" />,
      label: 'Get Entries by Month Year'
    },
    {
      type: 'link',
      path: '/dashboard/nl-sql/chat',
      icon: <FaCalendarAlt className="text-xl" />,
      label: 'AI - Chat with DB '
    },
    {
      type: 'link',
      path: '/admin/search-course',
      icon: <FaSearch className="text-xl" />,
      label: 'Search Course'
    },
    {
      type: 'link',
      path: '/admin/users',
      icon: <FaUsers className="text-xl" />,
      label: 'Manage Users'
    }
  ];

  // Render menu item based on type
  const renderMenuItem = (item) => {
    if (item.type === 'link') {
      return (
        <li key={item.path}>
          <Link
            href={item.path}
            className={linkClasses(item.path)}
            onClick={handleNavigation}
          >
            <span className="text-2xl">{item.icon}</span>
            {item.label}
          </Link>
        </li>
      );
    }

    if (item.type === 'dropdown') {
      return (
        <li key={item.key}>
          <button
            onClick={() => toggleMenu(item.key)}
            className={buttonClasses}
          >
            <div className="flex gap-2 items-center">
              <span className="text-2xl">{item.icon}</span>
              <span>{item.label}</span>
            </div>
            {openMenus[item.key] ? <FaChevronUp size={14} /> : <FaChevronDown size={14} />}
          </button>
          {openMenus[item.key] && (
            <ul className={subMenuClasses}>
              {item.items.map((subItem) => (
                <li key={subItem.path}>
                  <Link
                    href={subItem.path}
                    className={linkClasses(subItem.path)}
                    onClick={handleNavigation}
                  >
                    <span className="text-sm">{subItem.icon}</span>
                    {subItem.label}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </li>
      );
    }
  };

  return (
    <>
      <aside
        className={`fixed lg:static left-0 top-0 z-40 h-screen pt-16
        transition-transform duration-300 ease-in-out overflow-y-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 w-64 bg-blue-950 border-r border-gray-200`}
      >
        {/* Header */}
        <div className="p-4 border-b border-cyan-500 flex justify-center">
          <div className="flex flex-col items-center">
            <Image
              src="/assets/testimg.jpg"
              alt="Admin"
              width={200}
              height={200}
              loading="eager"
              className="h-32 w-32 mb-1 rounded-full border-2 border-white object-cover"
              priority={false}
            />
            <h1 className="text-lg font-bold text-white">
              {user?.name || 'Supril Kumar'}
            </h1>
            <h1 className="text-sm text-gray-300">
              {user?.role || 'Admin'}
            </h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4">
          <ul className="space-y-4">
            {menuItems.map(item => renderMenuItem(item))}
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;