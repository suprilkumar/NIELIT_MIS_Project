'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import Link from 'next/link';
import { 
  FaEdit, FaSearch, FaBook, FaBuilding, 
  FaPlus, FaDownload, FaFilter, FaList, FaThLarge,
  FaSort, FaSortUp, FaSortDown, FaCalendarAlt,
  FaClock, FaTag, FaMapMarkerAlt, FaInfoCircle,
  FaChevronLeft, FaChevronRight, FaTimes, FaEye,
  FaCheckCircle, FaChartLine
} from 'react-icons/fa';
import { MdDelete, MdCategory, MdSchedule, MdOutlineCategory } from 'react-icons/md';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { CSVLink } from 'react-csv';

export default function InActiveCoursesPage() {
  const { user } = useAuth();
  const [courseData, setCourseData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [courseCategories, setCourseCategories] = useState([]);
  const [centres, setCentres] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    category: '',
    centre: '',
    mode: '',
  });
  
  // Sort state
  const [sortConfig, setSortConfig] = useState({
    key: 'course_name',
    direction: 'asc'
  });

  // Show/hide filter panel
  const [showFilters, setShowFilters] = useState(false);

  // Get unique values for filter dropdowns
  const uniqueModes = useMemo(() => {
    const modes = new Set(courseData.map(c => c.course_mode).filter(Boolean));
    return Array.from(modes);
  }, [courseData]);

  useEffect(() => {
    fetchCourseData();
    fetchCourseCategories();
    fetchCentres();
  }, []);

  // Apply filters and search
  useEffect(() => {
    let filtered = [...courseData];

    // Apply search
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(course => 
        course.course_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.course_category_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.course_centre_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.course_mode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.course_scheme?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (filters.category) {
      filtered = filtered.filter(course => 
        course.course_category === filters.category || 
        course.course_category_name === filters.category
      );
    }

    // Apply centre filter
    if (filters.centre) {
      filtered = filtered.filter(course => 
        course.course_centre === filters.centre || 
        course.course_centre_name === filters.centre
      );
    }

    // Apply mode filter
    if (filters.mode) {
      filtered = filtered.filter(course => course.course_mode === filters.mode);
    }

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        // Handle nested fields
        if (sortConfig.key === 'category') {
          aVal = a.course_category_name || getCategoryName(a.course_category);
          bVal = b.course_category_name || getCategoryName(b.course_category);
        } else if (sortConfig.key === 'centre') {
          aVal = a.course_centre_name || getCentreName(a.course_centre);
          bVal = b.course_centre_name || getCentreName(b.course_centre);
        } else if (sortConfig.key === 'start_date' || sortConfig.key === 'end_date') {
          aVal = a[`course_${sortConfig.key}`] ? new Date(a[`course_${sortConfig.key}`]) : null;
          bVal = b[`course_${sortConfig.key}`] ? new Date(b[`course_${sortConfig.key}`]) : null;
        } else {
          aVal = a[sortConfig.key] || '';
          bVal = b[sortConfig.key] || '';
        }

        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;

        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    setFilteredData(filtered);
    setCurrentPage(1);
  }, [searchTerm, courseData, filters, sortConfig]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/dashboard/course-inactive/');
      setCourseData(response.data);
      setFilteredData(response.data);
    } catch (err) {
      setError('Failed to load course data');
      console.error(err);
      toast.error('Failed to load course data');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseCategories = async () => {
    try {
      const response = await api.get('/dashboard/course-categories/');
      setCourseCategories(response.data);
    } catch (err) {
      console.error('Error fetching course categories:', err);
    }
  };

  const fetchCentres = async () => {
    try {
      const response = await api.get('/dashboard/centres/');
      setCentres(response.data);
    } catch (err) {
      console.error('Error fetching centres:', err);
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      centre: '',
      mode: '',
    });
    setSearchTerm('');
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className="text-gray-400" />;
    return sortConfig.direction === 'asc' ? 
      <FaSortUp className="text-blue-600" /> : 
      <FaSortDown className="text-blue-600" />;
  };

  const handleDelete = async (id, courseName) => {
    if (window.confirm(`Are you sure you want to delete "${courseName}"? This action cannot be undone.`)) {
      try {
        await api.delete(`/dashboard/course/manage/${id}/`);
        toast.success(`Course "${courseName}" deleted successfully`);
        fetchCourseData();
      } catch (err) {
        console.error('Error deleting course:', err);
        toast.error(err.response?.data?.error || 'Failed to delete course');
      }
    }
  };

  const viewCourseDetails = (course) => {
    setSelectedCourse(course);
    setShowDetailsModal(true);
  };

  // Helper function to get category name by ID
  const getCategoryName = (categoryId) => {
    const category = courseCategories.find(c => c.id === categoryId);
    return category?.course_category_name || 'N/A';
  };

  // Helper function to get centre name by ID
  const getCentreName = (centreId) => {
    const centre = centres.find(c => c.id === centreId);
    return centre?.centre_name || 'N/A';
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get status badge color
  const getStatusBadgeClass = (status) => {
    switch(status?.toUpperCase()) {
      case 'ACTIVE':
        return 'bg-green-50 text-green-700 border border-green-200';
      case 'INACTIVE':
        return 'bg-gray-50 text-gray-700 border border-gray-200';
      case 'UPCOMING':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'COMPLETED':
        return 'bg-purple-50 text-purple-700 border border-purple-200';
      case 'CANCELLED':
        return 'bg-red-50 text-red-700 border border-red-200';
      case 'HOLD':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      default:
        return 'bg-gray-50 text-gray-700 border border-gray-200';
    }
  };

  // Get mode badge color
  const getModeBadgeClass = (mode) => {
    switch(mode) {
      case 'Online':
        return 'bg-cyan-50 text-cyan-700 border border-cyan-200';
      case 'Offline':
        return 'bg-indigo-50 text-indigo-700 border border-indigo-200';
      case 'Hybrid':
        return 'bg-purple-50 text-purple-700 border border-purple-200';
      case 'OnCampus':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'OffCampus':
        return 'bg-orange-50 text-orange-700 border border-orange-200';
      default:
        return 'bg-gray-50 text-gray-700 border border-gray-200';
    }
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // CSV headers and data
  const csvHeaders = [
    { label: 'S. No.', key: 'serial' },
    { label: 'Course Name', key: 'course_name' },
    { label: 'Category', key: 'category' },
    { label: 'Centre', key: 'centre' },
    { label: 'Mode', key: 'mode' },
    { label: 'Duration (Hours)', key: 'duration' },
    { label: 'Scheme', key: 'scheme' },
    { label: 'Status', key: 'status' },
    { label: 'Start Date', key: 'start_date' },
    { label: 'End Date', key: 'end_date' },
    { label: 'Description', key: 'description' },
  ];

  const csvData = filteredData.map((course, index) => ({
    serial: index + 1,
    course_name: course.course_name || 'N/A',
    category: course.course_category_name || getCategoryName(course.course_category) || 'N/A',
    centre: course.course_centre_name || getCentreName(course.course_centre) || 'N/A',
    mode: course.course_mode || 'N/A',
    duration: course.course_duration || 'N/A',
    scheme: course.course_scheme || 'N/A',
    status: course.course_status || 'N/A',
    start_date: formatDate(course.course_start_date),
    end_date: formatDate(course.course_end_date),
    description: course.course_desc || 'N/A',
  }));

  const activeFilterCount = Object.values(filters).filter(v => v !== '').length;

  // Skeleton Loader Component
  const SkeletonLoader = () => (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse mb-2"></div>
          <div className="h-4 w-64 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-8 w-16 bg-gray-300 rounded animate-pulse"></div>
                </div>
                <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Search and Actions Skeleton */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="w-full lg:w-96 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="flex gap-3">
              <div className="w-24 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="w-32 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="w-32 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Grid View Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Card Header Skeleton */}
              <div className="border-b border-gray-200 px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                    <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="w-16 h-6 bg-gray-200 rounded-full animate-pulse"></div>
                </div>
              </div>

              {/* Card Body Skeleton */}
              <div className="p-5 space-y-4">
                {/* Category and Centre */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-24 bg-gray-300 rounded animate-pulse"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-12 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-28 bg-gray-300 rounded animate-pulse"></div>
                  </div>
                </div>

                {/* Mode and Duration */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="h-3 w-10 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-14 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-20 bg-gray-300 rounded animate-pulse"></div>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-24 bg-gray-300 rounded animate-pulse"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-14 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-24 bg-gray-300 rounded animate-pulse"></div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <div className="flex-1 h-9 bg-gray-200 rounded-lg animate-pulse"></div>
                  <div className="flex-1 h-9 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Table View Skeleton
  const TableSkeletonLoader = () => (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse mb-2"></div>
          <div className="h-4 w-64 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-8 w-16 bg-gray-300 rounded animate-pulse"></div>
                </div>
                <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Search and Actions Skeleton */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="w-full lg:w-96 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="flex gap-3">
              <div className="w-24 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="w-32 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="w-32 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200 bg-gray-50 p-4">
            <div className="grid grid-cols-8 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="border-b border-gray-200 p-4">
              <div className="grid grid-cols-8 gap-4">
                {[...Array(8)].map((_, j) => (
                  <div key={j} className="h-6 bg-gray-100 rounded animate-pulse"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return viewMode === 'grid' ? <SkeletonLoader /> : <TableSkeletonLoader />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={fetchCourseData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Active Courses</h1>
          <p className="mt-2 text-gray-600">View and manage all currently active courses</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Active Courses</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{courseData.length}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <FaCheckCircle className="text-green-600 text-xl" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Categories</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{courseCategories.length}</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <MdOutlineCategory className="text-purple-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Centres</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{centres.length}</p>
              </div>
              <div className="bg-amber-50 p-3 rounded-lg">
                <FaMapMarkerAlt className="text-amber-600 text-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Top Section with Search and Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            
            {/* Search Bar */}
            <div className="w-full lg:w-96">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                  placeholder="Search courses by name, category, centre, mode..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
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

            {/* Actions */}
            <div className="flex flex-wrap gap-3 items-center">
              {/* Filter Toggle Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border ${
                  showFilters || activeFilterCount > 0
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <FaFilter className="text-sm" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-1 bg-blue-600 text-white px-2 py-0.5 rounded-full text-xs">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* View Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                    viewMode === 'grid' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <FaThLarge /> Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                    viewMode === 'list' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <FaList /> List
                </button>
              </div>

              {/* Total Count */}
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
                <span className="text-sm text-gray-600">Total:</span>
                <span className="text-sm font-semibold text-gray-900">{filteredData.length}</span>
              </div>

              {/* Add Course Button */}
              <Link
                href="/dashboard/operator/course/add-course"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm hover:shadow"
              >
                <FaPlus />
                Add Course
              </Link>

              {/* Export CSV Button */}
              {filteredData.length > 0 && (
                <CSVLink
                  data={csvData}
                  headers={csvHeaders}
                  filename={`active_courses_${new Date().toISOString().split('T')[0]}.csv`}
                  className="inline-flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm hover:shadow"
                >
                  <FaDownload />
                  Export CSV
                </CSVLink>
              )}
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Category Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Category
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Categories</option>
                    {courseCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.course_category_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Centre Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Centre
                  </label>
                  <select
                    value={filters.centre}
                    onChange={(e) => handleFilterChange('centre', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Centres</option>
                    {centres.map(centre => (
                      <option key={centre.id} value={centre.id}>
                        {centre.centre_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Mode Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Mode
                  </label>
                  <select
                    value={filters.mode}
                    onChange={(e) => handleFilterChange('mode', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Modes</option>
                    {uniqueModes.map(mode => (
                      <option key={mode} value={mode}>{mode}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Active Filters and Clear Button */}
              {(searchTerm || activeFilterCount > 0) && (
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <FaFilter className="text-blue-600" />
                    <span className="text-blue-700">Active filters:</span>
                    {searchTerm && (
                      <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium border border-blue-200">
                        Search: "{searchTerm}"
                      </span>
                    )}
                    {filters.category && (
                      <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium border border-blue-200">
                        Category: {courseCategories.find(c => c.id === filters.category)?.course_category_name}
                      </span>
                    )}
                    {filters.centre && (
                      <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium border border-blue-200">
                        Centre: {centres.find(c => c.id === filters.centre)?.centre_name}
                      </span>
                    )}
                    {filters.mode && (
                      <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium border border-blue-200">
                        Mode: {filters.mode}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={clearFilters}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cards Grid View */}
        {viewMode === 'grid' ? (
          <>
            {currentItems.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {currentItems.map((course) => (
                    <div
                      key={course.id}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200 overflow-hidden"
                    >
                      {/* Card Header */}
                      <div className="border-b border-gray-200 px-5 py-4 bg-gradient-to-r from-gray-50 to-white">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="bg-blue-50 p-2 rounded-lg">
                              <FaBook className="text-blue-600 text-base" />
                            </div>
                            <h3 className="font-semibold text-gray-900 text-lg truncate" title={course.course_name}>
                              {course.course_name || 'Unnamed Course'}
                            </h3>
                          </div>
                          <span className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium ${getStatusBadgeClass(course.course_status)}`}>
                            {course.course_status || 'N/A'}
                          </span>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-5 space-y-4">
                        {/* Category and Centre */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Category</p>
                            <div className="flex items-center gap-2">
                              <MdCategory className="text-gray-400" />
                              <span className="text-sm font-medium text-gray-900 truncate" title={course.course_category_name || getCategoryName(course.course_category)}>
                                {course.course_category_name || getCategoryName(course.course_category)}
                              </span>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Centre</p>
                            <div className="flex items-center gap-2">
                              <FaBuilding className="text-gray-400" />
                              <span className="text-sm font-medium text-gray-900 truncate" title={course.course_centre_name || getCentreName(course.course_centre)}>
                                {course.course_centre_name || getCentreName(course.course_centre)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Mode and Duration */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Mode</p>
                            <span className={`inline-block text-xs px-3 py-1.5 rounded-full font-medium ${getModeBadgeClass(course.course_mode)}`}>
                              {course.course_mode || 'N/A'}
                            </span>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Duration</p>
                            <div className="flex items-center gap-2">
                              <FaClock className="text-gray-400" />
                              <span className="text-sm font-medium text-gray-900">
                                {course.course_duration ? `${course.course_duration} hours` : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Scheme (if available) */}
                        {course.course_scheme && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Scheme</p>
                            <div className="flex items-center gap-2">
                              <FaTag className="text-gray-400" />
                              <span className="text-sm text-gray-700 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                                {course.course_scheme}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Start Date</p>
                            <div className="flex items-center gap-2">
                              <FaCalendarAlt className="text-gray-400" />
                              <span className="text-sm text-gray-900">
                                {formatDate(course.course_start_date)}
                              </span>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">End Date</p>
                            <div className="flex items-center gap-2">
                              <MdSchedule className="text-gray-400" />
                              <span className="text-sm text-gray-900">
                                {formatDate(course.course_end_date)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Description (truncated) */}
                        {course.course_desc && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Description</p>
                            <div className="flex items-start gap-2">
                              <FaInfoCircle className="text-gray-400 mt-1 flex-shrink-0" />
                              <p className="text-sm text-gray-600 line-clamp-2" title={course.course_desc}>
                                {course.course_desc}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4 border-t border-gray-200">
                          <button
                            onClick={() => viewCourseDetails(course)}
                            className="flex-1 flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border border-gray-200"
                          >
                            <FaEye className="text-sm" />
                            View
                          </button>
                          <Link
                            href={`/dashboard/operator/course/edit-course/${course.id}`}
                            className="flex-1 flex items-center justify-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-700 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border border-amber-200"
                          >
                            <FaEdit className="text-sm" />
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(course.id, course.course_name)}
                            className="flex-1 flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-700 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border border-rose-200"
                          >
                            <MdDelete className="text-sm" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-4">
                    <div className="text-sm text-gray-600">
                      Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(indexOfLastItem, filteredData.length)}
                      </span>{' '}
                      of <span className="font-medium">{filteredData.length}</span> courses
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`p-2 rounded-lg border ${
                          currentPage === 1
                            ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                            : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <FaChevronLeft className="text-sm" />
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                        <button
                          key={number}
                          onClick={() => paginate(number)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === number
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-600 hover:bg-gray-50 border border-gray-300'
                          }`}
                        >
                          {number}
                        </button>
                      ))}
                      <button
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`p-2 rounded-lg border ${
                          currentPage === totalPages
                            ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                            : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <FaChevronRight className="text-sm" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
                <FaBook className="text-6xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No active courses found</h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm || activeFilterCount > 0 
                    ? 'Try adjusting your filters or search term' 
                    : 'Get started by adding your first course'}
                </p>
                {!searchTerm && activeFilterCount === 0 && (
                  <Link
                    href="/dashboard/operator/course/add-course"
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    <FaPlus /> Add Your First Course
                  </Link>
                )}
              </div>
            )}
          </>
        ) : (
          /* List View - Table */
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button onClick={() => handleSort('course_name')} className="flex items-center gap-1 hover:text-gray-700">
                      Course Name {getSortIcon('course_name')}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button onClick={() => handleSort('category')} className="flex items-center gap-1 hover:text-gray-700">
                      Category {getSortIcon('category')}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button onClick={() => handleSort('centre')} className="flex items-center gap-1 hover:text-gray-700">
                      Centre {getSortIcon('centre')}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button onClick={() => handleSort('course_mode')} className="flex items-center gap-1 hover:text-gray-700">
                      Mode {getSortIcon('course_mode')}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button onClick={() => handleSort('course_duration')} className="flex items-center gap-1 hover:text-gray-700">
                      Duration {getSortIcon('course_duration')}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button onClick={() => handleSort('course_status')} className="flex items-center gap-1 hover:text-gray-700">
                      Status {getSortIcon('course_status')}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button onClick={() => handleSort('start_date')} className="flex items-center gap-1 hover:text-gray-700">
                      Start Date {getSortIcon('start_date')}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentItems.length > 0 ? (
                  currentItems.map((course) => (
                    <tr key={course.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-50 p-2 rounded-lg">
                            <FaBook className="text-blue-600 text-sm" />
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {course.course_name || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {course.course_category_name || getCategoryName(course.course_category)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {course.course_centre_name || getCentreName(course.course_centre)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${getModeBadgeClass(course.course_mode)}`}>
                          {course.course_mode || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {course.course_duration ? `${course.course_duration} Hrs` : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${getStatusBadgeClass(course.course_status)}`}>
                          {course.course_status || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(course.course_start_date)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => viewCourseDetails(course)}
                            className="text-gray-600 hover:text-blue-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            title="View Details"
                          >
                            <FaEye />
                          </button>
                          <Link
                            href={`/dashboard/operator/course/edit-course/${course.id}`}
                            className="text-amber-600 hover:text-amber-700 p-2 rounded-lg hover:bg-amber-50 transition-colors"
                            title="Edit"
                          >
                            <FaEdit />
                          </Link>
                          <button
                            onClick={() => handleDelete(course.id, course.course_name)}
                            className="text-rose-600 hover:text-rose-700 p-2 rounded-lg hover:bg-rose-50 transition-colors"
                            title="Delete"
                          >
                            <MdDelete />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-sm text-gray-500">
                      <FaBook className="text-4xl text-gray-300 mx-auto mb-3" />
                      No active courses found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination for List View */}
            {totalPages > 1 && (
              <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredData.length)} of {filteredData.length} courses
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-lg border ${
                      currentPage === 1
                        ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <FaChevronLeft className="text-sm" />
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-lg border ${
                      currentPage === totalPages
                        ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <FaChevronRight className="text-sm" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Details Modal */}
        {showDetailsModal && selectedCourse && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Course Details</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FaTimes size={20} />
                </button>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
                    <div className="bg-blue-100 p-4 rounded-full">
                      <FaBook className="text-blue-600 text-2xl" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Course Name</p>
                      <p className="text-xl font-semibold text-gray-900">{selectedCourse.course_name}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Category</p>
                      <div className="flex items-center gap-2">
                        <MdCategory className="text-gray-400" />
                        <p className="text-gray-900">{selectedCourse.course_category_name || getCategoryName(selectedCourse.course_category)}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Centre</p>
                      <div className="flex items-center gap-2">
                        <FaBuilding className="text-gray-400" />
                        <p className="text-gray-900">{selectedCourse.course_centre_name || getCentreName(selectedCourse.course_centre)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Mode</p>
                      <span className={`inline-block text-sm px-3 py-1.5 rounded-lg ${getModeBadgeClass(selectedCourse.course_mode)}`}>
                        {selectedCourse.course_mode || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Duration</p>
                      <p className="text-gray-900">{selectedCourse.course_duration ? `${selectedCourse.course_duration} hours` : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Status</p>
                      <span className={`inline-block text-sm px-3 py-1.5 rounded-lg ${getStatusBadgeClass(selectedCourse.course_status)}`}>
                        {selectedCourse.course_status || 'N/A'}
                      </span>
                    </div>
                  </div>

                  {selectedCourse.course_scheme && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Scheme</p>
                      <p className="text-gray-900 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
                        {selectedCourse.course_scheme}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Start Date</p>
                      <div className="flex items-center gap-2">
                        <FaCalendarAlt className="text-gray-400" />
                        <p className="text-gray-900">{formatDate(selectedCourse.course_start_date)}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">End Date</p>
                      <div className="flex items-center gap-2">
                        <MdSchedule className="text-gray-400" />
                        <p className="text-gray-900">{formatDate(selectedCourse.course_end_date)}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Description</p>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <p className="text-gray-900 whitespace-pre-wrap">
                        {selectedCourse.course_desc || 'No description provided'}
                      </p>
                    </div>
                  </div>

                  {selectedCourse.created_datetime && (
                    <div className="text-sm text-gray-500 border-t border-gray-200 pt-4">
                      Added on: {new Date(selectedCourse.created_datetime).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  )}
                </div>

                <div className="mt-8 flex gap-3">
                  <Link
                    href={`/dashboard/operator/course/edit-course/${selectedCourse.id}`}
                    className="flex-1 flex items-center justify-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-700 px-4 py-3 rounded-lg font-medium transition-colors border border-amber-200"
                    onClick={() => setShowDetailsModal(false)}
                  >
                    <FaEdit /> Edit Course
                  </Link>
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleDelete(selectedCourse.id, selectedCourse.course_name);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-700 px-4 py-3 rounded-lg font-medium transition-colors border border-rose-200"
                  >
                    <MdDelete /> Delete Course
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
}