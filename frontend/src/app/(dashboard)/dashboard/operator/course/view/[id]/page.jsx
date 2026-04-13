// dashboard/operator/course/view/[id]/page.jsx

'use client';

import { useState, useEffect, use, React } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Head from 'next/head';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { 
  FaBook, FaBuilding, FaCalendarAlt, FaClock, FaTag, 
  FaCheck, FaTimes, FaArrowLeft, FaEye, FaEdit, 
  FaDownload, FaSync, FaExclamationTriangle, FaInfoCircle,
  FaMale, FaFemale, FaUsers, FaUserGraduate, FaBriefcase,
  FaChartBar, FaList, FaChevronLeft, FaChevronRight
} from 'react-icons/fa';
import { MdVerified, MdPending, MdLock } from 'react-icons/md';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function CourseDetailPage({ params }) {
  const { id } = use(params);
  
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [courseData, setCourseData] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview, demographics, breakdown
  
  // Rest of your component code remains exactly the same...
  // (all the useState, useEffect, and function definitions)
  
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && id) {
      fetchCourseDetails();
    }
  }, [user, id]);

  const fetchCourseDetails = async () => {
    setLoading(true);
    try {
      const response = await api.get(`dashboard/course-detail/${id}/`);
      console.log('Course Details:', response.data);
      
      setCourseData(response.data);
      
      // Set default selected year to current year or first available year
      if (response.data.years) {
        const years = Object.keys(response.data.years).sort((a, b) => b - a);
        if (years.length > 0) {
          setSelectedYear(years[0]);
        }
      }
      
    } catch (err) {
      console.error('Error fetching course details:', err);
      toast.error(err.response?.data?.error || 'Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthEntry = async (year, month) => {
    try {
      const response = await api.get(`dashboard/course-entry/${id}/${year}/${month}/`);
      
      if (response.data.exists) {
        setSelectedEntry(response.data.entry);
      } else {
        setSelectedEntry(null);
      }
      
    } catch (err) {
      console.error('Error fetching month entry:', err);
      toast.error('Failed to load month entry');
      setSelectedEntry(null);
    }
  };

  const handleYearChange = (year) => {
    setSelectedYear(year);
    setSelectedMonth(null);
    setSelectedEntry(null);
  };

  const handleMonthClick = (month) => {
    setSelectedMonth(month);
    fetchMonthEntry(selectedYear, month);
  };

  const formatNumber = (num) => {
    return num?.toLocaleString() || '0';
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'PENDING': { color: 'yellow', icon: MdPending, text: 'Pending' },
      'PARTIAL': { color: 'orange', icon: MdPending, text: 'Partial' },
      'COMPLETED': { color: 'blue', icon: FaCheck, text: 'Completed' },
      'VERIFIED': { color: 'green', icon: MdVerified, text: 'Verified' },
      'LOCKED': { color: 'gray', icon: MdLock, text: 'Locked' }
    };
    
    const config = statusConfig[status] || statusConfig['PENDING'];
    const Icon = config.icon;
    
    const colors = {
      yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      orange: 'bg-orange-50 text-orange-700 border-orange-200',
      blue: 'bg-blue-50 text-blue-700 border-blue-200',
      green: 'bg-green-50 text-green-700 border-green-200',
      gray: 'bg-gray-50 text-gray-700 border-gray-200'
    };
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${colors[config.color]}`}>
        <Icon className="text-sm" />
        {config.text}
      </span>
    );
  };

  // Skeleton Loader
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Skeleton */}
          <div className="mb-8 animate-pulse">
            <div className="h-4 w-48 bg-gray-400 rounded mb-4"></div>
            <div className="h-8 w-64 bg-gray-400 rounded mb-2"></div>
            <div className="h-4 w-96 bg-gray-400 rounded"></div>
          </div>
          
          {/* Course Info Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 ">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-6">
                <div className="h-4 w-24 bg-gray-400 rounded mb-2 animate-pulse"></div>
                <div className="h-6 w-32 bg-gray-400 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
          
          {/* Year Tabs Skeleton */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <div className="flex gap-2 mb-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 w-20 bg-gray-400 rounded animate-pulse"></div>
              ))}
            </div>
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2 animate-pulse">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-400 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!courseData) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center py-12">
          <FaExclamationTriangle className="mx-auto text-4xl text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Course Not Found</h2>
          <p className="text-gray-600 mb-6">The course you're looking for doesn't exist or you don't have access.</p>
          <Link
            href="/dashboard/operator/course-entry"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
          >
            <FaArrowLeft /> Back to Course List
          </Link>
        </div>
      </div>
    );
  }

  const course = courseData.course;
  const summary = courseData.summary;
  const years = courseData.years ? Object.keys(courseData.years).sort((a, b) => b - a) : [];
  const currentYearData = selectedYear ? courseData.years[selectedYear] : null;

  return (
    <>
      <Head>
        <title>{course.course_name} | Course Details</title>
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
              <Link href="/dashboard/operator/course-entry" className="hover:text-blue-600">
                Course Entries
              </Link>
              <span>/</span>
              <span className="text-gray-700">Course Details</span>
            </div>
            
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4">
                <Link
                  href="/dashboard/operator/course-entry/view"
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FaArrowLeft className="text-gray-600" />
                </Link>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">{course.course_name}</h1>
                    {getStatusBadge(courseData.latest_entry_status)}
                  </div>
                  <p className="text-gray-600 flex items-center gap-2">
                    <FaBuilding className="text-gray-400" />
                    {course.course_centre_display}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={fetchCourseDetails}
                  className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <FaSync className={loading ? 'animate-spin' : ''} />
                  Refresh
                </button>
                <Link
                  href={`/dashboard/operator/course-entry/edit/${id}`}
                  className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <FaEdit />
                  Edit Course
                </Link>
              </div>
            </div>
          </div>

          {/* Course Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Course Category</p>
                  <p className="text-lg font-semibold text-gray-900">{course.course_category_display}</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <FaTag className="text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Course Mode</p>
                  <p className="text-lg font-semibold text-gray-900">{course.course_mode || 'N/A'}</p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <FaBook className="text-purple-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Duration</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {course.course_duration ? `${course.course_duration} hours` : 'N/A'}
                  </p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <FaClock className="text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Status</p>
                  <p className="text-lg font-semibold text-gray-900">{course.course_status || 'N/A'}</p>
                </div>
                <div className="bg-amber-50 p-3 rounded-lg">
                  <FaInfoCircle className="text-amber-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
              <p className="text-sm text-blue-600 mb-1">Total Entries</p>
              <p className="text-3xl font-bold text-blue-900">{summary.total_entries}</p>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
              <p className="text-sm text-green-600 mb-1">Total Enrolled</p>
              <p className="text-3xl font-bold text-green-900">{formatNumber(summary.total_enrolled)}</p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
              <p className="text-sm text-purple-600 mb-1">Total Certified</p>
              <p className="text-3xl font-bold text-purple-900">{formatNumber(summary.total_certified)}</p>
            </div>
            
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-6">
              <p className="text-sm text-amber-600 mb-1">Total Placed</p>
              <p className="text-3xl font-bold text-amber-900">{formatNumber(summary.total_placed)}</p>
            </div>
          </div>

          {/* Year Selection */}
          {years.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Year</h2>
              <div className="flex flex-wrap gap-2">
                {years.map(year => (
                  <button
                    key={year}
                    onClick={() => handleYearChange(year)}
                    className={`px-6 py-3 rounded-lg font-medium transition-all ${
                      selectedYear === year
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Months Grid */}
          {selectedYear && currentYearData && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 text-black p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  {selectedYear} - Monthly Entries
                </h2>
                <p className="text-sm text-gray-800 bg-yellow-200 px-4 py-2 rounded-full">
                  Total Entries: <span className="font-semibold md:text-base">{currentYearData.total_entries}</span>
                </p>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {currentYearData.months.map((monthData) => (
                  <button
                    key={monthData.month}
                    onClick={() => handleMonthClick(monthData.month)}
                    disabled={!monthData.has_entry}
                    className={`
                      p-4 rounded-lg border-2 transition-all text-center
                      ${monthData.has_entry 
                        ? selectedMonth === monthData.month
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-green-200 bg-green-50 hover:border-green-300 cursor-pointer'
                        : 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                      }
                    `}
                  >
                    <div className="text-sm font-semibold mb-1 ">
                      {monthData.month_name.substring(0, 3)}
                    </div>
                    {monthData.has_entry ? (
                      <div className="text-xs text-green-600 font-medium">Entry Available</div>
                    ) : (
                      <div className="text-xs text-gray-500">No Entry</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Entry Details */}
          {selectedMonth && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Entry Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                      {new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long' })} {selectedYear} Entry
                    </h2>
                    {selectedEntry && (
                      <div className="flex items-center gap-3">
                        {getStatusBadge(selectedEntry.entry_status)}
                        <span className="text-blue-100 text-sm">
                          Last updated: {new Date(selectedEntry.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {selectedEntry && (
                    <div className="flex gap-2">
                      <Link
                        href={`/dashboard/operator/course-entry/view/${selectedEntry.id}`}
                        className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                      >
                        <FaEye /> View Full Details
                      </Link>
                      {selectedEntry.entry_status !== 'VERIFIED' && selectedEntry.entry_status !== 'LOCKED' && (
                        <Link
                          href={`/dashboard/operator/course-entry/edit/${selectedEntry.id}`}
                          className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                        >
                          <FaEdit /> Edit Entry
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Entry Content */}
              <div className="p-8">
                {selectedEntry ? (
                  <>
                    {/* Tabs */}
                    <div className="flex gap-4 border-b border-gray-200 mb-8">
                      <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                          activeTab === 'overview'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Overview
                      </button>
                      <button
                        onClick={() => setActiveTab('demographics')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                          activeTab === 'demographics'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Gender Demographics
                      </button>
                      <button
                        onClick={() => setActiveTab('breakdown')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                          activeTab === 'breakdown'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Category Breakdown
                      </button>
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'overview' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-gray-50 rounded-xl p-6">
                          <div className="flex items-center gap-3 mb-2">
                            <FaUsers className="text-blue-600 text-xl" />
                            <p className="text-sm text-gray-600">Total Enrolled</p>
                          </div>
                          <p className="text-3xl font-bold text-gray-900">{formatNumber(selectedEntry.total_enrolled)}</p>
                        </div>
                        
                        <div className="bg-gray-50 rounded-xl p-6">
                          <div className="flex items-center gap-3 mb-2">
                            <FaUserGraduate className="text-green-600 text-xl" />
                            <p className="text-sm text-gray-600">Total Trained</p>
                          </div>
                          <p className="text-3xl font-bold text-gray-900">{formatNumber(selectedEntry.total_trained)}</p>
                        </div>
                        
                        <div className="bg-gray-50 rounded-xl p-6">
                          <div className="flex items-center gap-3 mb-2">
                            <FaCheck className="text-purple-600 text-xl" />
                            <p className="text-sm text-gray-600">Total Certified</p>
                          </div>
                          <p className="text-3xl font-bold text-gray-900">{formatNumber(selectedEntry.total_certified)}</p>
                        </div>
                        
                        <div className="bg-gray-50 rounded-xl p-6">
                          <div className="flex items-center gap-3 mb-2">
                            <FaBriefcase className="text-amber-600 text-xl" />
                            <p className="text-sm text-gray-600">Total Placed</p>
                          </div>
                          <p className="text-3xl font-bold text-gray-900">{formatNumber(selectedEntry.total_placed)}</p>
                        </div>
                      </div>
                    )}

                    {activeTab === 'demographics' && (
                      <div className="space-y-8">
                        {/* Gender Overview */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Male Stats */}
                          <div className="bg-blue-50 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                              <FaMale className="text-blue-600" /> Male
                            </h3>
                            <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                <span className="text-blue-700">Enrolled</span>
                                <span className="font-semibold text-blue-900">{formatNumber(selectedEntry.male_enrolled)}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-blue-700">Trained</span>
                                <span className="font-semibold text-blue-900">{formatNumber(selectedEntry.male_trained)}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-blue-700">Certified</span>
                                <span className="font-semibold text-blue-900">{formatNumber(selectedEntry.male_certified)}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-blue-700">Placed</span>
                                <span className="font-semibold text-blue-900">{formatNumber(selectedEntry.male_placed)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Female Stats */}
                          <div className="bg-pink-50 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-pink-900 mb-4 flex items-center gap-2">
                              <FaFemale className="text-pink-600" /> Female
                            </h3>
                            <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                <span className="text-pink-700">Enrolled</span>
                                <span className="font-semibold text-pink-900">{formatNumber(selectedEntry.female_enrolled)}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-pink-700">Trained</span>
                                <span className="font-semibold text-pink-900">{formatNumber(selectedEntry.female_trained)}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-pink-700">Certified</span>
                                <span className="font-semibold text-pink-900">{formatNumber(selectedEntry.female_certified)}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-pink-700">Placed</span>
                                <span className="font-semibold text-pink-900">{formatNumber(selectedEntry.female_placed)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* PWD Stats */}
                        <div className="bg-purple-50 rounded-xl p-6">
                          <h3 className="text-lg font-semibold text-purple-900 mb-4">Persons with Disabilities (PWD)</h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-sm text-purple-700">Enrolled</p>
                              <p className="text-xl font-bold text-purple-900">{formatNumber(selectedEntry.pwd_enrolled)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-purple-700">Trained</p>
                              <p className="text-xl font-bold text-purple-900">{formatNumber(selectedEntry.pwd_trained)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-purple-700">Certified</p>
                              <p className="text-xl font-bold text-purple-900">{formatNumber(selectedEntry.pwd_certified)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-purple-700">Placed</p>
                              <p className="text-xl font-bold text-purple-900">{formatNumber(selectedEntry.pwd_placed)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'breakdown' && (
                      <div className="space-y-8">
                        {/* SC Category */}
                        <div className="bg-indigo-50 rounded-xl p-6">
                          <h3 className="text-lg font-semibold text-indigo-900 mb-4">Scheduled Caste (SC)</h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-sm text-indigo-700">Enrolled</p>
                              <p className="text-xl font-bold text-indigo-900">{formatNumber(selectedEntry.sc_enrolled)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-indigo-700">Trained</p>
                              <p className="text-xl font-bold text-indigo-900">{formatNumber(selectedEntry.sc_trained)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-indigo-700">Certified</p>
                              <p className="text-xl font-bold text-indigo-900">{formatNumber(selectedEntry.sc_certified)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-indigo-700">Placed</p>
                              <p className="text-xl font-bold text-indigo-900">{formatNumber(selectedEntry.sc_placed)}</p>
                            </div>
                          </div>
                        </div>

                        {/* ST Category */}
                        <div className="bg-teal-50 rounded-xl p-6">
                          <h3 className="text-lg font-semibold text-teal-900 mb-4">Scheduled Tribe (ST)</h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-sm text-teal-700">Enrolled</p>
                              <p className="text-xl font-bold text-teal-900">{formatNumber(selectedEntry.st_enrolled)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-teal-700">Trained</p>
                              <p className="text-xl font-bold text-teal-900">{formatNumber(selectedEntry.st_trained)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-teal-700">Certified</p>
                              <p className="text-xl font-bold text-teal-900">{formatNumber(selectedEntry.st_certified)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-teal-700">Placed</p>
                              <p className="text-xl font-bold text-teal-900">{formatNumber(selectedEntry.st_placed)}</p>
                            </div>
                          </div>
                        </div>

                        {/* OBC Category */}
                        <div className="bg-amber-50 rounded-xl p-6">
                          <h3 className="text-lg font-semibold text-amber-900 mb-4">Other Backward Class (OBC)</h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-sm text-amber-700">Enrolled</p>
                              <p className="text-xl font-bold text-amber-900">{formatNumber(selectedEntry.obc_enrolled)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-amber-700">Trained</p>
                              <p className="text-xl font-bold text-amber-900">{formatNumber(selectedEntry.obc_trained)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-amber-700">Certified</p>
                              <p className="text-xl font-bold text-amber-900">{formatNumber(selectedEntry.obc_certified)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-amber-700">Placed</p>
                              <p className="text-xl font-bold text-amber-900">{formatNumber(selectedEntry.obc_placed)}</p>
                            </div>
                          </div>
                        </div>

                        {/* General Category (calculated) */}
                        <div className="bg-gray-50 rounded-xl p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">General Category</h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">Enrolled</p>
                              <p className="text-xl font-bold text-gray-900">
                                {formatNumber(
                                  selectedEntry.total_enrolled - 
                                  (selectedEntry.sc_enrolled + selectedEntry.st_enrolled + selectedEntry.obc_enrolled)
                                )}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Trained</p>
                              <p className="text-xl font-bold text-gray-900">
                                {formatNumber(
                                  selectedEntry.total_trained - 
                                  (selectedEntry.sc_trained + selectedEntry.st_trained + selectedEntry.obc_trained)
                                )}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Certified</p>
                              <p className="text-xl font-bold text-gray-900">
                                {formatNumber(
                                  selectedEntry.total_certified - 
                                  (selectedEntry.sc_certified + selectedEntry.st_certified + selectedEntry.obc_certified)
                                )}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Placed</p>
                              <p className="text-xl font-bold text-gray-900">
                                {formatNumber(
                                  selectedEntry.total_placed - 
                                  (selectedEntry.sc_placed + selectedEntry.st_placed + selectedEntry.obc_placed)
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Remarks Section */}
                    {selectedEntry.remarks && (
                      <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Remarks</h3>
                        <p className="text-gray-600">{selectedEntry.remarks}</p>
                      </div>
                    )}

                    {/* Audit Info */}
                    <div className="mt-6 text-sm text-gray-500 border-t border-gray-200 pt-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p>Created by: {selectedEntry.created_by?.full_name || 'N/A'}</p>
                          <p>Created at: {new Date(selectedEntry.created_at).toLocaleString()}</p>
                        </div>
                        <div>
                          <p>Updated by: {selectedEntry.updated_by?.full_name || 'N/A'}</p>
                          <p>Updated at: {new Date(selectedEntry.updated_at).toLocaleString()}</p>
                        </div>
                      </div>
                      {selectedEntry.verified_by && (
                        <div className="mt-2">
                          <p>Verified by: {selectedEntry.verified_by.full_name} at {new Date(selectedEntry.verified_at).toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <FaExclamationTriangle className="mx-auto text-4xl text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Entry Found</h3>
                    <p className="text-gray-600">
                      No course entry exists for {new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long' })} {selectedYear}
                    </p>
                    <Link
                      href={`/dashboard/operator/course-entry/create?course=${id}&month=${selectedMonth}&year=${selectedYear}`}
                      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg mt-6"
                    >
                      Create New Entry
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}