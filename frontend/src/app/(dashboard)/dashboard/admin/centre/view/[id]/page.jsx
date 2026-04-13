// app/(dashboard)/dashboard/operator/centre/view/[id]/page.jsx

'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Head from 'next/head';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import {
  FaBuilding, FaMapMarkerAlt, FaPhone, FaEnvelope, FaGlobe,
  FaBook, FaUsers, FaUserGraduate, FaCheck, FaBriefcase,
  FaCalendarAlt, FaChartLine, FaChartPie, FaChartBar,
  FaChevronDown, FaChevronUp, FaEye, FaEdit, FaDownload,
  FaArrowLeft, FaSync, FaExclamationTriangle, FaInfoCircle,
  FaFilter, FaSearch, FaTimes, FaFileExport, FaPrint
} from 'react-icons/fa';
import { MdVerified, MdPending, MdLock, MdDashboard } from 'react-icons/md';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function CentreDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  // State management
  const [loading, setLoading] = useState(true);
  const [centreData, setCentreData] = useState(null);
  const [expandedCourses, setExpandedCourses] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseDetailModal, setCourseDetailModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview, courses, analytics, reports

  // Load data on mount
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && id) {
      fetchCentreDetails();
    }
  }, [user, id]);

  const fetchCentreDetails = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/dashboard/centre-detail/${id}/`);
      console.log('Centre Details:', response.data);
      setCentreData(response.data);
    } catch (err) {
      console.error('Error fetching centre details:', err);
      toast.error(err.response?.data?.error || 'Failed to load centre details');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseDetails = async (courseId) => {
    try {
      const response = await api.get(`/dashboard/centre/${id}/course/${courseId}/`);
      setSelectedCourse(response.data);
      setCourseDetailModal(true);
    } catch (err) {
      console.error('Error fetching course details:', err);
      toast.error('Failed to load course details');
    }
  };

  // Toggle course expansion
  const toggleCourseExpand = (courseId) => {
    setExpandedCourses(prev => ({
      ...prev,
      [courseId]: !prev[courseId]
    }));
  };

  // Filter and sort courses
  const getFilteredCourses = () => {
    if (!centreData?.courses) return [];

    let filtered = [...centreData.courses];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.course_category?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(course =>
        course.course_category?.id === categoryFilter
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(course =>
        course.course_status === statusFilter
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.course_name.localeCompare(b.course_name);
        case 'enrolled':
          return (b.statistics?.total_enrolled || 0) - (a.statistics?.total_enrolled || 0);
        case 'entries':
          return (b.statistics?.total_entries || 0) - (a.statistics?.total_entries || 0);
        case 'recent':
          return new Date(b.updated_at || 0) - new Date(a.updated_at || 0);
        default:
          return 0;
      }
    });

    return filtered;
  };

  // Format number with commas
  const formatNumber = (num) => {
    return num?.toLocaleString() || '0';
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      'ACTIVE': { color: 'green', icon: FaCheck, text: 'Active' },
      'INACTIVE': { color: 'gray', icon: FaTimes, text: 'Inactive' },
      'COMPLETED': { color: 'blue', icon: FaCheck, text: 'Completed' },
      'UPCOMING': { color: 'yellow', icon: FaCalendarAlt, text: 'Upcoming' },
      'PENDING': { color: 'yellow', icon: MdPending, text: 'Pending' },
      'VERIFIED': { color: 'green', icon: MdVerified, text: 'Verified' },
      'LOCKED': { color: 'gray', icon: MdLock, text: 'Locked' }
    };
    
    const config = statusConfig[status] || { color: 'gray', icon: FaInfoCircle, text: status };
    const Icon = config.icon;
    
    const colors = {
      green: 'bg-green-50 text-green-700 border-green-200',
      blue: 'bg-blue-50 text-blue-700 border-blue-200',
      yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      gray: 'bg-gray-50 text-gray-700 border-gray-200',
      red: 'bg-red-50 text-red-700 border-red-200'
    };
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${colors[config.color]}`}>
        <Icon className="text-xs" />
        {config.text}
      </span>
    );
  };

  // Get unique categories for filter
  const getCategories = () => {
    if (!centreData?.courses) return [];
    const categories = {};
    centreData.courses.forEach(course => {
      if (course.course_category) {
        categories[course.course_category.id] = course.course_category.name;
      }
    });
    return Object.entries(categories).map(([id, name]) => ({ id, name }));
  };

  // Skeleton Loader
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-400 py-8 px-4 sm:px-6 lg:px-8 animate-pulse transition-all">
        <div className="max-w-7xl mx-auto">
          {/* Header Skeleton */}
          <div className="mb-8">
            <div className="h-4 w-48 bg-gray-400 rounded mb-4"></div>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-400 rounded-xl"></div>
              <div className="flex-1">
                <div className="h-8 w-64 bg-gray-400 rounded mb-2"></div>
                <div className="h-4 w-96 bg-gray-400 rounded"></div>
              </div>
            </div>
          </div>

          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-6">
                <div className="h-4 w-24 bg-gray-400 rounded mb-2"></div>
                <div className="h-8 w-32 bg-gray-400 rounded"></div>
              </div>
            ))}
          </div>

          {/* Tabs Skeleton */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-8">
            <div className="flex gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 w-24 bg-gray-400 rounded"></div>
              ))}
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-400 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!centreData) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center py-12">
          <FaExclamationTriangle className="mx-auto text-4xl text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Centre Not Found</h2>
          <p className="text-gray-600 mb-6">The centre you're looking for doesn't exist or you don't have access.</p>
          <Link
            href="/dashboard/admin/centre"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
          >
            <FaArrowLeft /> Back to Centres List
          </Link>
        </div>
      </div>
    );
  }

  const centre = centreData.centre;
  const stats = centreData.overall_statistics;
  const filteredCourses = getFilteredCourses();
  const categories = getCategories();

  return (
    <>
      <Head>
        <title>{centre.centre_name} | Centre Details</title>
      </Head>

      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header with breadcrumb */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
              <Link href="/dashboard" className="hover:text-blue-600">
                Dashboard
              </Link>
              <span>/</span>
              <Link href="/dashboard/admin/centre" className="hover:text-blue-600">
                Centres
              </Link>
              <span>/</span>
              <span className="text-gray-700">Centre Details</span>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4">
                <Link
                  href="/dashboard/admin/centre"
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FaArrowLeft className="text-gray-600" />
                </Link>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <FaBuilding className="text-white text-2xl" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h1 className="text-3xl font-bold text-gray-900">{centre.centre_name}</h1>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                        Code: {centre.centre_code}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-gray-600 text-xs">
                      <span className="flex items-center gap-1">
                        <FaMapMarkerAlt className="text-gray-400 text-lg" />
                        {centre.centre_address || 'Address not available'}
                      </span>
                      {centre.contact && (
                        <span className="flex items-center gap-1">
                          <FaPhone className="text-gray-400" />
                          {centre.contact}
                        </span>
                      )}
                      {centre.email && (
                        <span className="flex items-center gap-1">
                          <FaEnvelope className="text-gray-400" />
                          {centre.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={fetchCentreDetails}
                  className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <FaSync className={loading ? 'animate-spin' : ''} />
                  Refresh
                </button>
                <Link
                  href={`/dashboard/admin/centre/edit-centre/${id}`}
                  className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <FaEdit />
                  Edit Centre
                </Link>
                <button
                  onClick={() => {/* Export functionality */}}
                  className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <FaDownload />
                  Export
                </button>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Total Courses</p>
                <FaBook className="text-blue-500" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.total_courses}</p>
              <p className="text-sm text-green-600 mt-2">
                {centreData.active_courses || 0} active
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Total Enrolled</p>
                <FaUsers className="text-green-500" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{formatNumber(stats.total_enrolled)}</p>
              <p className="text-sm text-gray-500 mt-2">
                Across {stats.total_entries} entries
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Total Certified</p>
                <FaCheck className="text-purple-500" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{formatNumber(stats.total_certified)}</p>
              <p className="text-sm text-gray-500 mt-2">
                {((stats.total_certified / stats.total_enrolled) * 100).toFixed(1)}% certification rate
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Total Placed</p>
                <FaBriefcase className="text-amber-500" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{formatNumber(stats.total_placed)}</p>
              <p className="text-sm text-gray-500 mt-2">
                {((stats.total_placed / stats.total_certified) * 100).toFixed(1)}% placement rate
              </p>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 mb-8">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  activeTab === 'overview'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <MdDashboard />
                Overview
              </button>
              <button
                onClick={() => setActiveTab('courses')}
                className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  activeTab === 'courses'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <FaBook />
                Courses ({centreData.total_courses})
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  activeTab === 'analytics'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <FaChartLine />
                Analytics
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  activeTab === 'reports'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <FaFileExport />
                Reports
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Quick Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Courses with Entries</p>
                    <p className="text-2xl font-bold text-gray-900">{centreData.summary?.total_courses_with_entries || 0}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Categories</p>
                    <p className="text-2xl font-bold text-gray-900">{centreData.course_categories?.length || 0}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">First Entry</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {centreData.summary?.date_range?.first_entry 
                        ? new Date(centreData.summary.date_range.first_entry).toLocaleDateString('default', { month: 'short', year: 'numeric' })
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Last Entry</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {centreData.summary?.date_range?.last_entry
                        ? new Date(centreData.summary.date_range.last_entry).toLocaleDateString('default', { month: 'short', year: 'numeric' })
                        : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Category Distribution */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Categories</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {centreData.course_categories?.map((category) => (
                      <div key={category.category_id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">{category.category_name}</span>
                          <span className="text-sm text-gray-600">{category.course_count} courses</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 rounded-full h-2"
                            style={{ width: `${(category.course_count / centreData.total_courses) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Monthly Trend */}
                {centreData.monthly_trend && centreData.monthly_trend.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Monthly Trend</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Entries</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Enrolled</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Trained</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Certified</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Placed</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {centreData.monthly_trend.map((month) => (
                            <tr key={month.month}>
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">{month.month_display}</td>
                              <td className="px-4 py-3 text-sm text-right text-gray-600">{month.entries_count}</td>
                              <td className="px-4 py-3 text-sm text-right text-gray-600">{formatNumber(month.enrolled)}</td>
                              <td className="px-4 py-3 text-sm text-right text-gray-600">{formatNumber(month.trained)}</td>
                              <td className="px-4 py-3 text-sm text-right text-gray-600">{formatNumber(month.certified)}</td>
                              <td className="px-4 py-3 text-sm text-right text-gray-600">{formatNumber(month.placed)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Status Distribution */}
                {centreData.entries_by_status && centreData.entries_by_status.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Entries by Status</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      {centreData.entries_by_status.map((item) => (
                        <div key={item.status} className="bg-gray-50 rounded-lg p-4 text-center">
                          <div className="mb-2">{getStatusBadge(item.status)}</div>
                          <p className="text-2xl font-bold text-gray-900">{item.count}</p>
                          <p className="text-sm text-gray-600">{formatNumber(item.total_enrolled)} enrolled</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Courses Tab */}
            {activeTab === 'courses' && (
              <div>
                {/* Search and Filters */}
                <div className="mb-6">
                  <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                    <div className="w-full lg:w-96">
                      <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search courses..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 w-full lg:w-auto">
                      <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                      >
                        <FaFilter />
                        Filters
                        {showFilters ? <FaChevronUp /> : <FaChevronDown />}
                      </button>

                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-4 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="name">Sort by Name</option>
                        <option value="enrolled">Sort by Enrolled</option>
                        <option value="entries">Sort by Entries</option>
                        <option value="recent">Sort by Recent</option>
                      </select>
                    </div>
                  </div>

                  {/* Expandable Filters */}
                  {showFilters && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                        <select
                          value={categoryFilter}
                          onChange={(e) => setCategoryFilter(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="all">All Categories</option>
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="all">All Status</option>
                          <option value="ACTIVE">Active</option>
                          <option value="INACTIVE">Inactive</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="UPCOMING">Upcoming</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Results Count */}
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      Showing <span className="font-medium">{filteredCourses.length}</span> of{' '}
                      <span className="font-medium">{centreData.courses?.length || 0}</span> courses
                    </p>
                    {(searchTerm || categoryFilter !== 'all' || statusFilter !== 'all') && (
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setCategoryFilter('all');
                          setStatusFilter('all');
                        }}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                      >
                        <FaTimes /> Clear filters
                      </button>
                    )}
                  </div>
                </div>

                {/* Courses List */}
                <div className="space-y-4">
                  {filteredCourses.length > 0 ? (
                    filteredCourses.map((course) => (
                      <div key={course.id} className="border border-gray-200 rounded-lg overflow-hidden">
                        {/* Course Header */}
                        <div
                          className="bg-gray-50 p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => toggleCourseExpand(course.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg flex items-center justify-center">
                                <FaBook className="text-white" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                  <h3 className="font-semibold text-gray-900">{course.course_name}</h3>
                                  {getStatusBadge(course.course_status)}
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                  <span>{course.course_category?.name || 'N/A'}</span>
                                  <span>•</span>
                                  <span>{course.course_mode || 'N/A'}</span>
                                  {course.course_duration && (
                                    <>
                                      <span>•</span>
                                      <span>{course.course_duration} hours</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-6">
                                <div className="text-right">
                                  <p className="text-sm text-gray-600">Enrolled</p>
                                  <p className="font-semibold text-gray-900">{formatNumber(course.statistics?.total_enrolled)}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-gray-600">Certified</p>
                                  <p className="font-semibold text-gray-900">{formatNumber(course.statistics?.total_certified)}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-gray-600">Placed</p>
                                  <p className="font-semibold text-gray-900">{formatNumber(course.statistics?.total_placed)}</p>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    fetchCourseDetails(course.id);
                                  }}
                                  className="p-2 hover:bg-white rounded-lg transition-colors"
                                >
                                  <FaEye className="text-gray-400 hover:text-blue-600" />
                                </button>
                                {expandedCourses[course.id] ? <FaChevronUp /> : <FaChevronDown />}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Expanded Course Details */}
                        {expandedCourses[course.id] && (
                          <div className="p-4 bg-white border-t border-gray-200">
                            {/* Course Description */}
                            {course.course_desc && (
                              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-600">{course.course_desc}</p>
                              </div>
                            )}

                            {/* Course Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                              <div className="bg-blue-50 rounded-lg p-3">
                                <p className="text-xs text-blue-600 mb-1">Total Entries</p>
                                <p className="text-lg font-bold text-blue-900">{course.statistics?.total_entries || 0}</p>
                              </div>
                              <div className="bg-green-50 rounded-lg p-3">
                                <p className="text-xs text-green-600 mb-1">Latest Entry</p>
                                <p className="text-sm font-semibold text-green-900">{course.statistics?.latest_entry_month || 'N/A'}</p>
                              </div>
                              <div className="bg-purple-50 rounded-lg p-3">
                                <p className="text-xs text-purple-600 mb-1">Certification Rate</p>
                                <p className="text-lg font-bold text-purple-900">
                                  {course.statistics?.total_enrolled 
                                    ? ((course.statistics.total_certified / course.statistics.total_enrolled) * 100).toFixed(1)
                                    : 0}%
                                </p>
                              </div>
                              <div className="bg-amber-50 rounded-lg p-3">
                                <p className="text-xs text-amber-600 mb-1">Placement Rate</p>
                                <p className="text-lg font-bold text-amber-900">
                                  {course.statistics?.total_certified
                                    ? ((course.statistics.total_placed / course.statistics.total_certified) * 100).toFixed(1)
                                    : 0}%
                                </p>
                              </div>
                            </div>

                            {/* Recent Monthly Data */}
                            {course.recent_monthly_data && course.recent_monthly_data.length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Monthly Data</h4>
                                <div className="overflow-x-auto">
                                  <table className="min-w-full text-sm">
                                    <thead>
                                      <tr className="bg-gray-50">
                                        <th className="px-3 py-2 text-left">Month</th>
                                        <th className="px-3 py-2 text-right">Enrolled</th>
                                        <th className="px-3 py-2 text-right">Trained</th>
                                        <th className="px-3 py-2 text-right">Certified</th>
                                        <th className="px-3 py-2 text-right">Placed</th>
                                        <th className="px-3 py-2 text-center">Status</th>
                                        <th className="px-3 py-2 text-center">Actions</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                      {course.recent_monthly_data.map((month) => (
                                        <tr key={month.month}>
                                          <td className="px-3 py-2 font-medium">{month.month_display}</td>
                                          <td className="px-3 py-2 text-right">{formatNumber(month.total_enrolled)}</td>
                                          <td className="px-3 py-2 text-right">{formatNumber(month.total_trained)}</td>
                                          <td className="px-3 py-2 text-right">{formatNumber(month.total_certified)}</td>
                                          <td className="px-3 py-2 text-right">{formatNumber(month.total_placed)}</td>
                                          <td className="px-3 py-2 text-center">{getStatusBadge(month.entry_status)}</td>
                                          <td className="px-3 py-2 text-center">
                                            <Link
                                              href={`/dashboard/operator/course-entry/view/${month.entry_id}`}
                                              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                            >
                                              View
                                            </Link>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="mt-4 flex justify-end gap-3">
                              <Link
                                href={`/dashboard/operator/course/view/${course.id}`}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                              >
                                <FaEye /> View Full Course Details
                              </Link>
                              <Link
                                href={`/dashboard/operator/course-entry/create?course=${course.id}`}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                              >
                                + Add Monthly Entry
                              </Link>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <FaBook className="mx-auto text-4xl text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Courses Found</h3>
                      <p className="text-gray-600 mb-4">No courses match your current filters.</p>
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setCategoryFilter('all');
                          setStatusFilter('all');
                        }}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Clear filters
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Performance Chart Placeholder */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Performance</h3>
                    <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                      <p className="text-gray-500">Chart visualization would go here</p>
                    </div>
                  </div>

                  {/* Category Distribution Chart */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Distribution by Category</h3>
                    <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                      <p className="text-gray-500">Pie chart would go here</p>
                    </div>
                  </div>

                  {/* Top Performing Courses */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Courses</h3>
                    <div className="space-y-3">
                      {filteredCourses.slice(0, 5).map((course, index) => (
                        <div key={course.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                            <span className="font-medium text-gray-900">{course.course_name}</span>
                          </div>
                          <span className="text-sm text-gray-600">
                            {formatNumber(course.statistics?.total_enrolled)} enrolled
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Trends */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Metrics</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-gray-600">Enrollment Trend</span>
                          <span className="text-sm font-medium text-green-600">+12%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-green-600 rounded-full h-2" style={{ width: '75%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-gray-600">Certification Rate</span>
                          <span className="text-sm font-medium text-blue-600">85%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-600 rounded-full h-2" style={{ width: '85%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-gray-600">Placement Rate</span>
                          <span className="text-sm font-medium text-purple-600">45%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-purple-600 rounded-full h-2" style={{ width: '45%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Report Cards */}
                  <div className="bg-gray-50 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
                    <FaFileExport className="text-3xl text-blue-600 mb-4" />
                    <h3 className="font-semibold text-gray-900 mb-2">Monthly Summary Report</h3>
                    <p className="text-sm text-gray-600 mb-4">Generate a comprehensive monthly summary for all courses</p>
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      Generate →
                    </button>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
                    <FaChartBar className="text-3xl text-green-600 mb-4" />
                    <h3 className="font-semibold text-gray-900 mb-2">Course Performance Report</h3>
                    <p className="text-sm text-gray-600 mb-4">Detailed analysis of course-wise performance metrics</p>
                    <button className="text-green-600 hover:text-green-700 text-sm font-medium">
                      Generate →
                    </button>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
                    <FaUsers className="text-3xl text-purple-600 mb-4" />
                    <h3 className="font-semibold text-gray-900 mb-2">Demographics Report</h3>
                    <p className="text-sm text-gray-600 mb-4">Category and gender-wise distribution analysis</p>
                    <button className="text-purple-600 hover:text-purple-700 text-sm font-medium">
                      Generate →
                    </button>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
                    <FaCalendarAlt className="text-3xl text-amber-600 mb-4" />
                    <h3 className="font-semibold text-gray-900 mb-2">Yearly Trends Report</h3>
                    <p className="text-sm text-gray-600 mb-4">Year-over-year comparison and trend analysis</p>
                    <button className="text-amber-600 hover:text-amber-700 text-sm font-medium">
                      Generate →
                    </button>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
                    <FaCheck className="text-3xl text-indigo-600 mb-4" />
                    <h3 className="font-semibold text-gray-900 mb-2">Certification Report</h3>
                    <p className="text-sm text-gray-600 mb-4">Detailed certification and placement statistics</p>
                    <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                      Generate →
                    </button>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
                    <FaPrint className="text-3xl text-rose-600 mb-4" />
                    <h3 className="font-semibold text-gray-900 mb-2">Custom Report</h3>
                    <p className="text-sm text-gray-600 mb-4">Create a custom report with selected parameters</p>
                    <button className="text-rose-600 hover:text-rose-700 text-sm font-medium">
                      Configure →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Course Detail Modal */}
      {courseDetailModal && selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{selectedCourse.course?.course_name}</h2>
                <button
                  onClick={() => setCourseDetailModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FaTimes className="text-gray-600" />
                </button>
              </div>

              {/* Modal content - you can reuse the course detail structure here */}
              <pre className="bg-gray-50 p-4 rounded-lg overflow-auto">
                {JSON.stringify(selectedCourse, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}