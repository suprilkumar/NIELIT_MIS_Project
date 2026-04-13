'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Head from 'next/head';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { 
  FaSearch, FaTimes, FaBuilding, FaBook, FaCalendarAlt, FaCheck, FaExclamationTriangle,
  FaArrowLeft, FaList, FaSync, FaEye, FaEdit, FaTrash, FaChevronLeft, FaChevronRight
} from 'react-icons/fa';
import { FaList as FaListIcon } from "react-icons/fa6";
import { MdVerified, MdPending } from 'react-icons/md';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function RetrieveCourseEntriesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [centres, setCentres] = useState([]);
  const [courses, setCourses] = useState([]);
  const [courseEntries, setCourseEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  
  // Selection states
  const [selectedCentre, setSelectedCentre] = useState('');
  const [selectedMonthYear, setSelectedMonthYear] = useState('');
  
  // Search term
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Summary stats
  const [summary, setSummary] = useState({
    totalCourses: 0,
    totalEnrolled: 0,
    totalTrained: 0,
    totalCertified: 0,
    totalPlaced: 0
  });

  // Months for filter
  const months = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  // Generate years (current year and 3 years back)
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [currentYear, currentYear - 1, currentYear - 2, currentYear - 3];
  }, []);

  // Status badge component
  const StatusBadge = ({ status }) => {
    const statusInfo = {
      'PENDING': { label: 'Pending', color: 'yellow', icon: MdPending },
      'PARTIAL': { label: 'Partial', color: 'orange', icon: MdPending },
      'COMPLETED': { label: 'Completed', color: 'blue', icon: FaCheck },
      'VERIFIED': { label: 'Verified', color: 'green', icon: MdVerified },
      'LOCKED': { label: 'Locked', color: 'gray', icon: FaCheck }
    }[status] || { label: status, color: 'gray', icon: FaCheck };
    
    const Icon = statusInfo.icon;
    
    const colors = {
      yellow: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
      orange: 'bg-orange-50 text-orange-700 border border-orange-200',
      blue: 'bg-blue-50 text-blue-700 border border-blue-200',
      green: 'bg-green-50 text-green-700 border border-green-200',
      gray: 'bg-gray-50 text-gray-700 border border-gray-200'
    };
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ${colors[statusInfo.color]}`}>
        <Icon className="text-xs" />
        {statusInfo.label}
      </span>
    );
  };

  // Check authentication
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Load centres on mount
  useEffect(() => {
    if (user) {
      loadCentres();
    }
  }, [user]);

  const loadCentres = async () => {
    try {
      const response = await api.get('/dashboard/centres/');
      setCentres(response.data);
    } catch (err) {
      console.error('Error loading centres:', err);
      toast.error('Failed to load centres');
    }
  };

  const handleCentreChange = (e) => {
    setSelectedCentre(e.target.value);
    // Reset courses and entries when centre changes
    setCourses([]);
    setCourseEntries([]);
    setFilteredEntries([]);
    setSummary({
      totalCourses: 0,
      totalEnrolled: 0,
      totalTrained: 0,
      totalCertified: 0,
      totalPlaced: 0
    });
  };

  const handleMonthYearChange = (e) => {
    setSelectedMonthYear(e.target.value);
  };
const fetchCoursesWithEntries = async () => {
  if (!selectedCentre || !selectedMonthYear) {
    toast.error('Please select both centre and month/year');
    return;
  }

  setLoading(true);
  try {
    console.log('Fetching courses with entries for:', selectedCentre, selectedMonthYear);
    
    const response = await api.get('/course-entry/by-centre-month-year/', {
      params: {
        centre_id: selectedCentre,
        month_year: selectedMonthYear
      }
    });

    console.log('Response:', response.data);
    
    if (response.data) {
      // Set courses data
      setCourses(response.data.courses || []);
      
      // Process entries data - flatten the nested structure for easier display
      if (response.data.entries && response.data.entries.length > 0) {
        const processedEntries = response.data.entries.map(entry => ({
          id: entry.id,
          // Flatten the course details from the nested course object
          course_name: entry.course?.course_name || 'N/A',
          course_category: entry.course?.course_category_name || entry.course?.course_category_display || 'N/A',
          // Enrollment numbers
          total_enrolled: entry.total_enrolled || 0,
          total_trained: entry.total_trained || 0,
          total_certified: entry.total_certified || 0,
          total_placed: entry.total_placed || 0,
          // Status
          entry_status: entry.entry_status || 'PENDING',
          // Include original data if needed
          original_entry: entry
        }));
        
        setCourseEntries(processedEntries);
        setFilteredEntries(processedEntries);
        calculateSummary(processedEntries);
      } else {
        setCourseEntries([]);
        setFilteredEntries([]);
        calculateSummary([]);
      }
      
      setSummary(prev => ({ 
        ...prev, 
        totalCourses: response.data.total_courses || 0
      }));
    }
    
  } catch (err) {
    console.error('Error fetching courses:', err);
    toast.error(err.response?.data?.error || 'Failed to fetch courses');
  } finally {
    setLoading(false);
  }
};

  const calculateSummary = (entries) => {
  const summary = {
    totalCourses: entries.length,
    totalEnrolled: 0,
    totalTrained: 0,
    totalCertified: 0,
    totalPlaced: 0
  };
  
  entries.forEach(entry => {
    summary.totalEnrolled += (entry.total_enrolled || 0);
    summary.totalTrained += (entry.total_trained || 0);
    summary.totalCertified += (entry.total_certified || 0);
    summary.totalPlaced += (entry.total_placed || 0);
  });
  
  setSummary(summary);
};

  // Apply search filter
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredEntries(courseEntries);
    } else {
      const filtered = courseEntries.filter(entry => 
        entry.course_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.course_category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.entry_status?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredEntries(filtered);
    }
    setCurrentPage(1);
  }, [searchTerm, courseEntries]);

  // Pagination
  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredEntries.slice(start, start + itemsPerPage);
  }, [filteredEntries, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredEntries.length / itemsPerPage);

  const handleDelete = async (id, courseName) => {
    if (window.confirm(`Are you sure you want to delete the entry for ${courseName}?`)) {
      try {
        await api.delete(`/course-entry/entries/${id}/`);
        toast.success('Entry deleted successfully');
        // Refresh the data
        fetchCourseEntries();
        fetchCoursesWithEntries();
      } catch (err) {
        console.error('Error deleting entry:', err);
        toast.error(err.response?.data?.error || 'Failed to delete entry');
      }
    }
  };

  const clearSelection = () => {
    setSelectedCentre('');
    setSelectedMonthYear('');
    setCourses([]);
    setCourseEntries([]);
    setFilteredEntries([]);
    setSearchTerm('');
    setSummary({
      totalCourses: 0, totalEnrolled: 0, totalTrained: 0, totalCertified: 0, totalPlaced: 0
    });
  };

  // Format month for display
  const formatMonthDisplay = (monthYear) => {
    if (!monthYear) return '';
    const [year, month] = monthYear.split('-');
    const monthName = months.find(m => m.value === month)?.label || month;
    return `${monthName} ${year}`;
  };

  // Skeleton Loader Component
  const SkeletonLoader = () => (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="h-8 w-64 bg-gray-300 rounded-lg animate-pulse mb-2"></div>
          <div className="h-4 w-96 bg-gray-300 rounded-lg animate-pulse"></div>
        </div>

        {/* Selection Cards Skeleton */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-24 bg-gray-300 rounded animate-pulse"></div>
                <div className="h-10 w-full bg-gray-300 rounded-lg animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-20 bg-gray-300 rounded animate-pulse"></div>
                  <div className="h-8 w-16 bg-gray-300 rounded animate-pulse"></div>
                </div>
                <div className="w-12 h-12 bg-gray-300 rounded-lg animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (authLoading) {
    return <SkeletonLoader />;
  }

  return (
    <>
      <Head>
        <title>Retrieve Course Entries | Dashboard</title>
      </Head>
      
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header with breadcrumb */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <Link href="/dashboard" className="hover:text-blue-600">
                Dashboard
              </Link>
              <span>/</span>
              <Link href="/dashboard/operator/course-entry" className="hover:text-blue-600">
                Course Entries
              </Link>
              <span>/</span>
              <span className="text-gray-700">Retrieve Entries</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Retrieve Course Entries</h1>
                <p className="mt-2 text-gray-600">
                  Select centre and month to view all course entries
                </p>
              </div>
              
              {/* Back Button */}
              <Link
                href="/dashboard/operator/course-entry"
                className="inline-flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                <FaArrowLeft />
                Back to List
              </Link>
            </div>
          </div>

          {/* Selection Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Centre Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Centre <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedCentre}
                  onChange={handleCentreChange}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Choose a centre</option>
                  {centres.map(centre => (
                    <option key={centre.id} value={centre.id}>
                      {centre.centre_name || centre.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Month/Year Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Month/Year <span className="text-red-500">*</span>
                </label>
                <input
                  type="month"
                  value={selectedMonthYear}
                  onChange={handleMonthYearChange}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-end gap-3">
                <button
                  onClick={fetchCoursesWithEntries}
                  disabled={!selectedCentre || !selectedMonthYear || loading}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed shadow-sm"
                >
                  {loading ? <FaSync className="animate-spin" /> : <FaSearch />}
                  {loading ? 'Searching...' : 'Retrieve Entries'}
                </button>
                
                {(selectedCentre || selectedMonthYear) && (
                  <button
                    onClick={clearSelection}
                    className="inline-flex items-center justify-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
                  >
                    <FaTimes />
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Selected Info */}
            {selectedCentre && selectedMonthYear && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <FaBuilding className="text-blue-500" />
                  <span className="font-medium">Centre:</span>
                  {centres.find(c => c.id === selectedCentre)?.centre_name}
                  <span className="mx-2">|</span>
                  <FaCalendarAlt className="text-blue-500" />
                  <span className="font-medium">Month:</span>
                  {formatMonthDisplay(selectedMonthYear)}
                </div>
              </div>
            )}
          </div>

          {/* Results Section - Only show if we have data */}
          {courses.length > 0 && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Courses</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{summary.totalCourses}</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <FaBook className="text-blue-600 text-xl" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Enrolled</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{summary.totalEnrolled.toLocaleString()}</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <FaListIcon className="text-green-600 text-xl" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Trained</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{summary.totalTrained.toLocaleString()}</p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <FaListIcon className="text-purple-600 text-xl" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Certified</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{summary.totalCertified.toLocaleString()}</p>
                    </div>
                    <div className="bg-amber-50 p-3 rounded-lg">
                      <FaCheck className="text-amber-600 text-xl" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Placed</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{summary.totalPlaced.toLocaleString()}</p>
                    </div>
                    <div className="bg-indigo-50 p-3 rounded-lg">
                      <FaListIcon className="text-indigo-600 text-xl" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Search Bar */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
                <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                  <div className="w-full lg:w-96">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaSearch className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Search by course name, category, status..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm('')}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        >
                          <FaTimes />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={fetchCoursesWithEntries}
                      className="inline-flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
                    >
                      <FaSync /> Refresh
                    </button>
                    
                    <Link
                      href="/dashboard/operator/course-entry"
                      className="inline-flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
                    >
                      <FaList /> Full List
                    </Link>
                  </div>
                </div>
              </div>

              {/* Results Info */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600">
                  Showing <span className="font-medium">{paginatedEntries.length}</span> of{' '}
                  <span className="font-medium">{filteredEntries.length}</span> entries
                </p>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Show:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-blue-800">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">S.No</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Course</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Category</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Enrolled</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Trained</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Certified</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Placed</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {paginatedEntries.length > 0 ? (
                        paginatedEntries.map((entry, index) => (
                          <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {(currentPage - 1) * itemsPerPage + index + 1}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="bg-blue-50 p-2 rounded-lg">
                                  <FaBook className="text-blue-600 text-sm" />
                                </div>
                                <span className="text-sm font-medium text-gray-900">
                                  {entry.course_name || 'N/A'}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {entry.course_category || 'N/A'}
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                              {entry.total_enrolled || 0}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {entry.total_trained || 0}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {entry.total_certified || 0}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {entry.total_placed || 0}
                            </td>
                            <td className="px-6 py-4">
                              <StatusBadge status={entry.entry_status} />
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <Link
                                  href={`/dashboard/operator/course-entry/view/${entry.id}`}
                                  className="text-gray-600 hover:text-blue-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                  title="View Details"
                                >
                                  <FaEye />
                                </Link>
                                {entry.entry_status !== 'VERIFIED' && entry.entry_status !== 'LOCKED' && (
                                  <>
                                    <Link
                                      href={`/dashboard/operator/course-entry/edit/${entry.id}`}
                                      className="text-amber-600 hover:text-amber-700 p-2 rounded-lg hover:bg-amber-50 transition-colors"
                                      title="Edit"
                                    >
                                      <FaEdit />
                                    </Link>
                                    <button
                                      onClick={() => handleDelete(entry.id, entry.course_name)}
                                      className="text-rose-600 hover:text-rose-700 p-2 rounded-lg hover:bg-rose-50 transition-colors"
                                      title="Delete"
                                    >
                                      <FaTrash />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="9" className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center gap-3">
                              <FaExclamationTriangle className="text-4xl text-gray-300" />
                              <p className="text-sm text-gray-500">No entries found for this centre and month</p>
                              {searchTerm && (
                                <button
                                  onClick={() => setSearchTerm('')}
                                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                >
                                  Clear search
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Page <span className="font-medium">{currentPage}</span> of{' '}
                    <span className="font-medium">{totalPages}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <FaChevronLeft className="text-sm" />
                    </button>
                    
                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={i}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <FaChevronRight className="text-sm" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}