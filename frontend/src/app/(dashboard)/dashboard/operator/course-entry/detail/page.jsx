'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Head from 'next/head';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { 
  FaPlus, FaSearch, FaFilter, FaTimes, FaDownload, FaEdit, FaEye, FaTrash, FaChevronLeft, FaChevronRight,
  FaBuilding, FaBook, FaCalendarAlt, FaCheck, FaLock, FaExclamationTriangle, FaFileCsv, FaPrint,
  FaChartBar, FaSync, FaClock, FaChartLine, FaGraduationCap, FaUsers, FaCheckCircle, FaHourglassHalf,
  FaSort, FaSortUp, FaSortDown
} from 'react-icons/fa';
import { MdVerified, MdPending, MdCategory, MdPeople, MdOutlineCategory } from 'react-icons/md';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { CSVLink } from 'react-csv';
import { FaList } from "react-icons/fa6";

export default function CourseEntryDetailListPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  
  const [entries, setEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc'
  });
  
  // Dropdown data for filters
  const [centres, setCentres] = useState([]);
  const [courses, setCourses] = useState([]);
  const [courseCategories, setCourseCategories] = useState([]);
  
  // Filter states
  const [filters, setFilters] = useState({
    centre: '',
    course: '',
    category: '',
    status: '',
    month: '',
    year: new Date().getFullYear().toString(),
    fromDate: '',
    toDate: ''
  });
  
  // Search term
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Show/hide filter panel
  const [showFilters, setShowFilters] = useState(false);
  
  // Export loading state
  const [exporting, setExporting] = useState(false);
  
  // Summary stats
  const [summary, setSummary] = useState({
    totalEnrolled: 0,
    totalTrained: 0,
    totalCertified: 0,
    totalPlaced: 0,
    pendingCount: 0,
    verifiedCount: 0,
    totalEntries: 0
  });

  // Available years for filter
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [currentYear, currentYear - 1, currentYear - 2, currentYear - 3];
  }, []);

  // Months for filter
  const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  // Status options
  const statusOptions = [
    { value: 'PENDING', label: 'Pending', color: 'yellow', icon: MdPending },
    { value: 'PARTIAL', label: 'Partial', color: 'orange', icon: FaHourglassHalf },
    { value: 'COMPLETED', label: 'Completed', color: 'blue', icon: FaCheckCircle },
    { value: 'VERIFIED', label: 'Verified', color: 'green', icon: MdVerified },
    { value: 'LOCKED', label: 'Locked', color: 'gray', icon: FaLock }
  ];

  // Sorting function
  const sortData = (data, sortKey, direction) => {
    if (!sortKey) return data;
    
    return [...data].sort((a, b) => {
      let aValue = a[sortKey];
      let bValue = b[sortKey];
      
      // Handle special cases for different data types
      if (sortKey === 'month_year') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else if (sortKey === 'centre_name') {
        aValue = a.centre_name?.toLowerCase() || '';
        bValue = b.centre_name?.toLowerCase() || '';
      } else if (sortKey === 'course_name') {
        aValue = a.course_name?.toLowerCase() || '';
        bValue = b.course_name?.toLowerCase() || '';
      } else if (sortKey === 'course_category') {
        aValue = a.course_category?.toLowerCase() || '';
        bValue = b.course_category?.toLowerCase() || '';
      } else if (sortKey === 'entry_status') {
        const statusOrder = { 'PENDING': 1, 'PARTIAL': 2, 'COMPLETED': 3, 'VERIFIED': 4, 'LOCKED': 5 };
        aValue = statusOrder[a.entry_status] || 0;
        bValue = statusOrder[b.entry_status] || 0;
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      } else if (typeof aValue === 'number') {
        aValue = aValue || 0;
        bValue = bValue || 0;
      }
      
      if (aValue < bValue) {
        return direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  // Handle sort request
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Get sort icon
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <FaSort className="ml-1 text-gray-400 text-xs" />;
    }
    return sortConfig.direction === 'asc' 
      ? <FaSortUp className="ml-1 text-blue-600 text-xs" />
      : <FaSortDown className="ml-1 text-blue-600 text-xs" />;
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    const statusInfo = statusOptions.find(s => s.value === status) || { 
      label: status, 
      color: 'gray',
      icon: FaCheckCircle
    };
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

  // Load initial data
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchEntries();
      fetchDropdownData();
    }
  }, [user]);

  // Apply filters, search, and sorting
  useEffect(() => {
    let filtered = [...entries];

    // Apply search
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(entry => 
        entry.centre_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.course_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.course_category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.entry_status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.created_by_username?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply filters
    if (filters.centre) {
      filtered = filtered.filter(entry => entry.centre === filters.centre);
    }
    if (filters.course) {
      filtered = filtered.filter(entry => entry.course === filters.course);
    }
    if (filters.category) {
      filtered = filtered.filter(entry => entry.course_category === filters.category);
    }
    if (filters.status) {
      filtered = filtered.filter(entry => entry.entry_status === filters.status);
    }
    if (filters.month && filters.year) {
      filtered = filtered.filter(entry => {
        const date = new Date(entry.month_year);
        return date.getMonth() + 1 === parseInt(filters.month) && 
               date.getFullYear() === parseInt(filters.year);
      });
    }    
    if (filters.fromDate && filters.toDate) {
      filtered = filtered.filter(entry => {
        const entryDate = new Date(entry.month_year);
        return entryDate >= new Date(filters.fromDate) && 
               entryDate <= new Date(filters.toDate);
      });
    }

    // Apply sorting
    if (sortConfig.key) {
      filtered = sortData(filtered, sortConfig.key, sortConfig.direction);
    }

    setFilteredEntries(filtered);
    setCurrentPage(1);
    
    // Calculate summary stats
    calculateSummary(filtered);
  }, [entries, searchTerm, filters, sortConfig]);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const response = await api.get('/course-entry/entries/');
      setEntries(response.data);
      setFilteredEntries(response.data);
      calculateSummary(response.data);
    } catch (err) {
      console.error('Error fetching entries:', err);
      toast.error('Failed to load course entries');
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const [centresRes, coursesRes, categoriesRes] = await Promise.all([
        api.get('/dashboard/centres/'),
        api.get('/dashboard/courses/'),
        api.get('/dashboard/course-categories/')
      ]);
      
      setCentres(centresRes.data);
      setCourses(coursesRes.data);
      setCourseCategories(categoriesRes.data);
    } catch (err) {
      console.error('Error fetching dropdown data:', err);
    }
  };

  const calculateSummary = (data) => {
    const summary = {
      totalEnrolled: 0,
      totalTrained: 0,
      totalCertified: 0,
      totalPlaced: 0,
      pendingCount: 0,
      verifiedCount: 0,
      totalEntries: data.length
    };
    
    data.forEach(entry => {
      summary.totalEnrolled += entry.total_enrolled || 0;
      summary.totalTrained += entry.total_trained || 0;
      summary.totalCertified += entry.total_certified || 0;
      summary.totalPlaced += entry.total_placed || 0;
      
      if (entry.entry_status === 'PENDING' || entry.entry_status === 'PARTIAL') {
        summary.pendingCount++;
      } else if (entry.entry_status === 'VERIFIED') {
        summary.verifiedCount++;
      }
    });
    
    setSummary(summary);
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      centre: '',
      course: '',
      category: '',
      status: '',
      month: '',
      year: new Date().getFullYear().toString(),
      fromDate: '',
      toDate: ''
    });
    setSearchTerm('');
    setSortConfig({ key: null, direction: 'asc' }); // Reset sorting when clearing filters
  };

  const handleDelete = async (id, centreName, courseName) => {
    if (window.confirm(`Are you sure you want to delete the entry for ${centreName} - ${courseName}? This action cannot be undone.`)) {
      try {
        await api.delete(`/course-entry/entries/${id}/`);
        toast.success('Entry deleted successfully');
        fetchEntries();
      } catch (err) {
        console.error('Error deleting entry:', err);
        toast.error(err.response?.data?.error || 'Failed to delete entry');
      }
    }
  };

  // Pagination
  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredEntries.slice(start, start + itemsPerPage);
  }, [filteredEntries, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredEntries.length / itemsPerPage);

  // CSV headers and data
  const csvHeaders = [
    { label: 'S.No', key: 'serial' },
    { label: 'Centre', key: 'centre' },
    { label: 'Course', key: 'course' },
    { label: 'Category', key: 'category' },
    { label: 'Month', key: 'month' },
    { label: 'Status', key: 'status' },
    { label: 'Total Enrolled', key: 'total_enrolled' },
    { label: 'Total Trained', key: 'total_trained' },
    { label: 'Total Certified', key: 'total_certified' },
    { label: 'Total Placed', key: 'total_placed' },
    { label: 'Male Enrolled', key: 'male_enrolled' },
    { label: 'Male Trained', key: 'male_trained' },
    { label: 'Male Certified', key: 'male_certified' },
    { label: 'Male Placed', key: 'male_placed' },
    { label: 'Female Enrolled', key: 'female_enrolled' },
    { label: 'Female Trained', key: 'female_trained' },
    { label: 'Female Certified', key: 'female_certified' },
    { label: 'Female Placed', key: 'female_placed' },
    { label: 'SC Enrolled', key: 'sc_enrolled' },
    { label: 'SC Trained', key: 'sc_trained' },
    { label: 'SC Certified', key: 'sc_certified' },
    { label: 'SC Placed', key: 'sc_placed' },
    { label: 'ST Enrolled', key: 'st_enrolled' },
    { label: 'ST Trained', key: 'st_trained' },
    { label: 'ST Certified', key: 'st_certified' },
    { label: 'ST Placed', key: 'st_placed' },
    { label: 'OBC Enrolled', key: 'obc_enrolled' },
    { label: 'OBC Trained', key: 'obc_trained' },
    { label: 'OBC Certified', key: 'obc_certified' },
    { label: 'OBC Placed', key: 'obc_placed' },
    { label: 'PWD Enrolled', key: 'pwd_enrolled' },
    { label: 'PWD Trained', key: 'pwd_trained' },
    { label: 'PWD Certified', key: 'pwd_certified' },
    { label: 'PWD Placed', key: 'pwd_placed' },
    { label: 'Remarks', key: 'remarks' },
    { label: 'Created By', key: 'created_by' },
    { label: 'Created At', key: 'created_at' },
    { label: 'Verified By', key: 'verified_by' },
    { label: 'Verified At', key: 'verified_at' }
  ];

  const csvData = filteredEntries.map((entry, index) => ({
    serial: index + 1,
    centre: entry.centre_name || 'N/A',
    course: entry.course_name || 'N/A',
    category: entry.course_category || 'N/A',
    month: entry.month_year ? new Date(entry.month_year).toLocaleDateString('en-IN', { year: 'numeric', month: 'short' }) : 'N/A',
    status: entry.entry_status || 'N/A',
    total_enrolled: entry.total_enrolled || 0,
    total_trained: entry.total_trained || 0,
    total_certified: entry.total_certified || 0,
    total_placed: entry.total_placed || 0,
    male_enrolled: entry.male_enrolled || 0,
    male_trained: entry.male_trained || 0,
    male_certified: entry.male_certified || 0,
    male_placed: entry.male_placed || 0,
    female_enrolled: entry.female_enrolled || 0,
    female_trained: entry.female_trained || 0,
    female_certified: entry.female_certified || 0,
    female_placed: entry.female_placed || 0,
    sc_enrolled: entry.sc_enrolled || 0,
    sc_trained: entry.sc_trained || 0,
    sc_certified: entry.sc_certified || 0,
    sc_placed: entry.sc_placed || 0,
    st_enrolled: entry.st_enrolled || 0,
    st_trained: entry.st_trained || 0,
    st_certified: entry.st_certified || 0,
    st_placed: entry.st_placed || 0,
    obc_enrolled: entry.obc_enrolled || 0,
    obc_trained: entry.obc_trained || 0,
    obc_certified: entry.obc_certified || 0,
    obc_placed: entry.obc_placed || 0,
    pwd_enrolled: entry.pwd_enrolled || 0,
    pwd_trained: entry.pwd_trained || 0,
    pwd_certified: entry.pwd_certified || 0,
    pwd_placed: entry.pwd_placed || 0,
    remarks: entry.remarks || '',
    created_by: entry.created_by_username || 'N/A',
    created_at: entry.created_at ? new Date(entry.created_at).toLocaleString() : 'N/A',
    verified_by: entry.verified_by_username || 'N/A',
    verified_at: entry.verified_at ? new Date(entry.verified_at).toLocaleString() : 'N/A'
  }));

  const activeFilterCount = Object.values(filters).filter(v => v !== '' && v !== null).length;

  // Skeleton Loader Component
  const SkeletonLoader = () => (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="h-8 w-48 bg-gray-400 rounded-lg animate-pulse mb-2"></div>
          <div className="h-4 w-64 bg-gray-400 rounded-lg animate-pulse"></div>
        </div>

        {/* Summary Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-gray-400 rounded animate-pulse"></div>
                  <div className="h-8 w-16 bg-gray-400 rounded animate-pulse"></div>
                </div>
                <div className="w-12 h-12 bg-gray-400 rounded-lg animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Search and Actions Skeleton */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="w-full lg:w-96 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="flex gap-3">
              <div className="w-24 h-10 bg-gray-400 rounded-lg animate-pulse"></div>
              <div className="w-32 h-10 bg-gray-400 rounded-lg animate-pulse"></div>
              <div className="w-24 h-10 bg-gray-400 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-400 overflow-hidden">
          <div className="border-b border-gray-400 bg-gray-50 p-4">
            <div className="grid grid-cols-11 gap-4">
              {[...Array(11)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-400 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="border-b border-gray-200 p-4">
              <div className="grid grid-cols-11 gap-4">
                {[...Array(11)].map((_, j) => (
                  <div key={j} className="h-6 bg-gray-400 rounded animate-pulse"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (authLoading || loading) {
    return <SkeletonLoader />;
  }

  return (
    <>
      <Head>
        <title>Course Entries | Dashboard</title>
      </Head>
      
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Course Entries</h1>
                <p className="mt-2 text-gray-600">
                  Manage and monitor monthly course entries across all centres
                </p>
              </div>
              
              {/* Add Entry Button */}
              <Link
                href="/dashboard/operator/course-entry/create"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors shadow-sm hover:shadow"
              >
                <FaPlus />
                Add New Entry
              </Link>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Entries</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{summary.totalEntries}</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <FaGraduationCap className="text-blue-600 text-xl" />
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
                  <FaUsers className="text-green-600 text-xl" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Placed</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{summary.totalPlaced.toLocaleString()}</p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <FaChartLine className="text-purple-600 text-xl" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Entries Status</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{summary.pendingCount}</p>
                </div>
                <div className="bg-amber-50 p-3 rounded-lg">
                  <MdPending className="text-amber-600 text-xl" />
                </div>
              </div>
            </div>
          </div>

          {/* Search and Actions Bar */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              
              {/* Search Bar */}
              <div className="w-full lg:w-96 border border-black rounded-lg">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ">
                    <FaSearch className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                    placeholder="Search by centre, course, category..."
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

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 items-center">
                {/* Filter Toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border-2 ${
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

                {/* Export Dropdown */}
                <div className="relative group">
                  <button
                    className="inline-flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm hover:shadow"
                  >
                    <FaDownload />
                    Export
                  </button>
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                    {filteredEntries.length > 0 && (
                      <CSVLink
                        data={csvData} 
                        headers={csvHeaders}
                        filename={`course_entries_${new Date().toISOString().split('T')[0]}.csv`}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <FaFileCsv className="text-green-500" /> Export as CSV
                      </CSVLink>
                    )}
                    
                    <button
                      onClick={() => window.print()}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 last:rounded-b-lg" >
                      <FaPrint className="text-blue-500" /> Print
                    </button>
                  </div>
                </div>

                {/* Refresh Button */}
                <button
                  onClick={fetchEntries}
                  className="inline-flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm hover:shadow" >
                  <FaSync /> Refresh
                </button>

                <Link href="/dashboard/operator/course-entry/view/detail"
                  className="inline-flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm hover:shadow" >
                  <FaList /> Detailed View
                </Link>
              </div>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="mt-6 pt-6 border-t border-gray-200 bg-gray-400 px-4 rounded-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

                  {/* Course Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Course
                    </label>
                    <select
                      value={filters.course}
                      onChange={(e) => handleFilterChange('course', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">All Courses</option>
                      {courses.map(course => (
                        <option key={course.id} value={course.id}>
                          {course.course_name}
                        </option>
                      ))}
                    </select>
                  </div>

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

                  {/* Status Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Status
                    </label>
                    <select
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">All Status</option>
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Month Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Month
                    </label>
                    <select
                      value={filters.month}
                      onChange={(e) => handleFilterChange('month', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">All Months</option>
                      {months.map(month => (
                        <option key={month.value} value={month.value}>
                          {month.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Year Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Year
                    </label>
                    <select
                      value={filters.year}
                      onChange={(e) => handleFilterChange('year', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {years.map(year => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* From Date */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      From Date
                    </label>
                    <input
                      type="date"
                      value={filters.fromDate}
                      onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* To Date */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      To Date
                    </label>
                    <input
                      type="date"
                      value={filters.toDate}
                      onChange={(e) => handleFilterChange('toDate', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
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
                      {filters.centre && (
                        <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium border border-blue-200">
                          Centre: {centres.find(c => c.id === filters.centre)?.centre_name}
                        </span>
                      )}
                      {filters.course && (
                        <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium border border-blue-200">
                          Course: {courses.find(c => c.id === filters.course)?.course_name}
                        </span>
                      )}
                      {filters.status && (
                        <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium border border-blue-200">
                          Status: {filters.status}
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

          {/* Results Info */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">
              Showing <span className="font-medium">{paginatedEntries.length}</span> of{' '}
              <span className="font-medium">{filteredEntries.length}</span> entries
            </p>
            
            {/* Items per page */}
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-left text-sm font-semibold text-white">
                <thead className="bg-blue-800">
                  <tr>
                    <th className="px-3 py-2 cursor-pointer hover:bg-blue-700 transition-colors" onClick={() => handleSort('s_no')}>
                      <div className="flex items-center gap-1">
                        S.No
                        {getSortIcon('s_no')}
                      </div>
                    </th>
                    <th className="px-3 py-2 cursor-pointer hover:bg-blue-700 transition-colors" onClick={() => handleSort('centre_name')}>
                      <div className="flex items-center gap-1 text-nowrap">
                        Centre Location
                        {getSortIcon('centre_name')}
                      </div>
                    </th>
                    <th className="px-3 py-2 text-nowrap cursor-pointer hover:bg-blue-700 transition-colors" onClick={() => handleSort('course_name')}>
                      <div className="flex items-center gap-1">
                        Name of Course
                        {getSortIcon('course_name')}
                      </div>
                    </th>
                    <th className="px-3 py-2 text-nowrap cursor-pointer hover:bg-blue-700 transition-colors" onClick={() => handleSort('course_category')}>
                      <div className="flex items-center gap-1">
                        Course Category
                        {getSortIcon('course_category')}
                      </div>
                    </th>
                    <th className="px-3 py-2 cursor-pointer hover:bg-blue-700 transition-colors" onClick={() => handleSort('month_year')}>
                      <div className="flex items-center gap-1">
                        Month
                        {getSortIcon('month_year')}
                      </div>
                    </th>
                    <th className="px-3 py-2 cursor-pointer hover:bg-blue-700 transition-colors" onClick={() => handleSort('total_enrolled')}>
                      <div className="flex items-center gap-1">
                        Enrolled
                        {getSortIcon('total_enrolled')}
                      </div>
                    </th>
                    <th className="px-3 py-2 cursor-pointer hover:bg-blue-700 transition-colors" onClick={() => handleSort('total_trained')}>
                      <div className="flex items-center gap-1">
                        Trained
                        {getSortIcon('total_trained')}
                      </div>
                    </th>
                    <th className="px-3 py-2 cursor-pointer hover:bg-blue-700 transition-colors" onClick={() => handleSort('total_certified')}>
                      <div className="flex items-center gap-1">
                        Certified
                        {getSortIcon('total_certified')}
                      </div>
                    </th>
                    <th className="px-3 py-2 cursor-pointer hover:bg-blue-700 transition-colors" onClick={() => handleSort('total_placed')}>
                      <div className="flex items-center gap-1">
                        Placed
                        {getSortIcon('total_placed')}
                      </div>
                    </th>
                    <th className="px-3 py-2 cursor-pointer hover:bg-blue-700 transition-colors" onClick={() => handleSort('entry_status')}>
                      <div className="flex items-center gap-1">
                        Status
                        {getSortIcon('entry_status')}
                      </div>
                    </th>
                    <th className="px-3 py-2">Actions</th>
                    <th className="px-3 py-2 cursor-pointer hover:bg-blue-700 transition-colors" onClick={() => handleSort('male_enrolled')}>
                      <div className="flex items-center gap-1">
                        Male Enrolled
                        {getSortIcon('male_enrolled')}
                      </div>
                    </th>
                    <th className="px-3 py-2 cursor-pointer hover:bg-blue-700 transition-colors" onClick={() => handleSort('male_trained')}>
                      <div className="flex items-center gap-1">
                        Male Trained
                        {getSortIcon('male_trained')}
                      </div>
                    </th>
                    <th className="px-3 py-2 cursor-pointer hover:bg-blue-700 transition-colors" onClick={() => handleSort('male_certified')}>
                      <div className="flex items-center gap-1">
                        Male Certified
                        {getSortIcon('male_certified')}
                      </div>
                    </th>
                    <th className="px-3 py-2 cursor-pointer hover:bg-blue-700 transition-colors" onClick={() => handleSort('male_placed')}>
                      <div className="flex items-center gap-1">
                        Male Placed
                        {getSortIcon('male_placed')}
                      </div>
                    </th>
                    <th className="px-3 py-2 cursor-pointer hover:bg-blue-700 transition-colors" onClick={() => handleSort('female_enrolled')}>
                      <div className="flex items-center gap-1">
                        Female Enrolled
                        {getSortIcon('female_enrolled')}
                      </div>
                    </th>
                    <th className="px-3 py-2 cursor-pointer hover:bg-blue-700 transition-colors" onClick={() => handleSort('female_trained')}>
                      <div className="flex items-center gap-1">
                        Female Trained
                        {getSortIcon('female_trained')}
                      </div>
                    </th>
                    <th className="px-3 py-2 cursor-pointer hover:bg-blue-700 transition-colors" onClick={() => handleSort('female_certified')}>
                      <div className="flex items-center gap-1">
                        Female Certified
                        {getSortIcon('female_certified')}
                      </div>
                    </th>
                    <th className="px-3 py-2 cursor-pointer hover:bg-blue-700 transition-colors" onClick={() => handleSort('female_placed')}>
                      <div className="flex items-center gap-1">
                        Female Placed
                        {getSortIcon('female_placed')}
                      </div>
                    </th>
                    <th className="px-3 py-2 cursor-pointer hover:bg-blue-700 transition-colors" onClick={() => handleSort('sc_enrolled')}>
                      <div className="flex items-center gap-1">
                        SC Enrolled
                        {getSortIcon('sc_enrolled')}
                      </div>
                    </th>
                    <th className="px-3 py-2 cursor-pointer hover:bg-blue-700 transition-colors" onClick={() => handleSort('sc_trained')}>
                      <div className="flex items-center gap-1">
                        SC Trained
                        {getSortIcon('sc_trained')}
                      </div>
                    </th>
                    <th className="px-3 py-2 cursor-pointer hover:bg-blue-700 transition-colors" onClick={() => handleSort('sc_certified')}>
                      <div className="flex items-center gap-1">
                        SC Certified
                        {getSortIcon('sc_certified')}
                      </div>
                    </th>
                    <th className="px-3 py-2 cursor-pointer hover:bg-blue-700 transition-colors" onClick={() => handleSort('sc_placed')}>
                      <div className="flex items-center gap-1">
                        SC Placed
                        {getSortIcon('sc_placed')}
                      </div>
                    </th>
                    <th className="px-3 py-2 cursor-pointer hover:bg-blue-700 transition-colors" onClick={() => handleSort('st_enrolled')}>
                      <div className="flex items-center gap-1">
                        ST Enrolled
                        {getSortIcon('st_enrolled')}
                      </div>
                    </th>
                    <th className="px-3 py-2 cursor-pointer hover:bg-blue-700 transition-colors" onClick={() => handleSort('st_trained')}>
                      <div className="flex items-center gap-1">
                        ST Trained
                        {getSortIcon('st_trained')}
                      </div>
                    </th>
                    <th className="px-3 py-2 cursor-pointer hover:bg-blue-700 transition-colors" onClick={() => handleSort('st_certified')}>
                      <div className="flex items-center gap-1">
                        ST Certified
                        {getSortIcon('st_certified')}
                      </div>
                    </th>
                    <th className="px-3 py-2 cursor-pointer hover:bg-blue-700 transition-colors" onClick={() => handleSort('st_placed')}>
                      <div className="flex items-center gap-1">
                        ST Placed
                        {getSortIcon('st_placed')}
                      </div>
                    </th>
                    <th className="px-3 py-2 cursor-pointer hover:bg-blue-700 transition-colors" onClick={() => handleSort('obc_enrolled')}>
                      <div className="flex items-center gap-1">
                        OBC Enrolled
                        {getSortIcon('obc_enrolled')}
                      </div>
                    </th>
                    <th className="px-3 py-2 cursor-pointer hover:bg-blue-700 transition-colors" onClick={() => handleSort('obc_trained')}>
                      <div className="flex items-center gap-1">
                        OBC Trained
                        {getSortIcon('obc_trained')}
                      </div>
                    </th>
                    <th className="px-3 py-2 cursor-pointer hover:bg-blue-700 transition-colors" onClick={() => handleSort('obc_certified')}>
                      <div className="flex items-center gap-1">
                        OBC Certified
                        {getSortIcon('obc_certified')}
                      </div>
                    </th>
                    <th className="px-3 py-2 cursor-pointer hover:bg-blue-700 transition-colors" onClick={() => handleSort('obc_placed')}>
                      <div className="flex items-center gap-1">
                        OBC Placed
                        {getSortIcon('obc_placed')}
                      </div>
                    </th>
                    <th className="px-3 py-2 cursor-pointer hover:bg-blue-700 transition-colors" onClick={() => handleSort('pwd_enrolled')}>
                      <div className="flex items-center gap-1">
                        PWD Enrolled
                        {getSortIcon('pwd_enrolled')}
                      </div>
                    </th>
                    <th className="px-3 py-2 cursor-pointer hover:bg-blue-700 transition-colors" onClick={() => handleSort('pwd_trained')}>
                      <div className="flex items-center gap-1">
                        PWD Trained
                        {getSortIcon('pwd_trained')}
                      </div>
                    </th>
                    <th className="px-3 py-2 cursor-pointer hover:bg-blue-700 transition-colors" onClick={() => handleSort('pwd_certified')}>
                      <div className="flex items-center gap-1">
                        PWD Certified
                        {getSortIcon('pwd_certified')}
                      </div>
                    </th>
                    <th className="px-3 py-2 cursor-pointer hover:bg-blue-700 transition-colors" onClick={() => handleSort('pwd_placed')}>
                      <div className="flex items-center gap-1">
                        PWD Placed
                        {getSortIcon('pwd_placed')}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedEntries.length > 0 ? (
                    paginatedEntries.map((entry, index) => (
                      <tr key={entry.id} className="hover:bg-gray-50 transition-colors border-b border-gray-600">
                        <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                          {(currentPage - 1) * itemsPerPage + index + 1}
                        </td>
                        <td className="px-3 py-3 text-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-50 p-2 rounded-lg">
                              <FaBuilding className="text-blue-600 text-sm" />
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {entry.centre_name ? entry.centre_name.split(" ")[2] || entry.centre_name : 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-nowrap">
                          <div className="flex flex-col">
                            <span className="text-sm font-semi-bold text-gray-900">
                              {entry.course_name || 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-nowrap">
                          <div className="flex flex-col">
                            {entry.course_category && (
                              <span className="text-xs text-gray-500">{entry.course_category}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-nowrap">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <FaCalendarAlt className="text-gray-400" />
                            {entry.month_year ? new Date(entry.month_year).toLocaleDateString('en-IN', { 
                              year: 'numeric', 
                              month: 'short' 
                            }) : 'N/A'}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-sm font-medium text-gray-900">
                          {entry.total_enrolled || 0}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-600">
                          {entry.total_trained || 0}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-600">
                          {entry.total_certified || 0}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-600">
                          {entry.total_placed || 0}
                        </td>
                        <td className="px-3 py-3">
                          <StatusBadge status={entry.entry_status} />
                        </td>
                    
                        <td className="px-3 py-3">
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
                                  onClick={() => handleDelete(entry.id, entry.centre_name, entry.course_name)}
                                  className="text-rose-600 hover:text-rose-700 p-2 rounded-lg hover:bg-rose-50 transition-colors"
                                  title="Delete"
                                >
                                  <FaTrash />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-sm font-medium text-gray-900"> {entry.male_enrolled || 0} </td>
                        <td className="px-3 py-3 text-sm font-medium text-gray-900"> {entry.male_trained || 0} </td>
                        <td className="px-3 py-3 text-sm font-medium text-gray-900"> {entry.male_certified || 0} </td>
                        <td className="px-3 py-3 text-sm font-medium text-gray-900"> {entry.male_placed || 0} </td>
                        <td className="px-3 py-3 text-sm font-medium text-gray-900"> {entry.female_enrolled || 0} </td>
                        <td className="px-3 py-3 text-sm font-medium text-gray-900"> {entry.female_trained || 0} </td>
                        <td className="px-3 py-3 text-sm font-medium text-gray-900"> {entry.female_certified || 0} </td>
                        <td className="px-3 py-3 text-sm font-medium text-gray-900"> {entry.female_placed || 0} </td>
                        <td className="px-3 py-3 text-sm font-medium text-gray-900"> {entry.sc_enrolled || 0} </td>
                        <td className="px-3 py-3 text-sm font-medium text-gray-900"> {entry.sc_trained || 0} </td>
                        <td className="px-3 py-3 text-sm font-medium text-gray-900"> {entry.sc_certified || 0} </td>
                        <td className="px-3 py-3 text-sm font-medium text-gray-900"> {entry.sc_placed || 0} </td>
                        <td className="px-3 py-3 text-sm font-medium text-gray-900"> {entry.st_enrolled || 0} </td>
                        <td className="px-3 py-3 text-sm font-medium text-gray-900"> {entry.st_trained || 0} </td>
                        <td className="px-3 py-3 text-sm font-medium text-gray-900"> {entry.st_certified || 0} </td>
                        <td className="px-3 py-3 text-sm font-medium text-gray-900"> {entry.st_placed || 0} </td>
                        <td className="px-3 py-3 text-sm font-medium text-gray-900"> {entry.obc_enrolled || 0} </td>
                        <td className="px-3 py-3 text-sm font-medium text-gray-900"> {entry.obc_trained || 0}</td>
                        <td className="px-3 py-3 text-sm font-medium text-gray-900"> {entry.obc_certified || 0} </td>
                        <td className="px-3 py-3 text-sm font-medium text-gray-900"> {entry.obc_placed || 0} </td>
                        <td className="px-3 py-3 text-sm font-medium text-gray-900"> {entry.pwd_enrolled || 0} </td>
                        <td className="px-3 py-3 text-sm font-medium text-gray-900"> {entry.pwd_trained || 0} </td>
                        <td className="px-3 py-3 text-sm font-medium text-gray-900"> {entry.pwd_certified || 0} </td>
                        <td className="px-3 py-3 text-sm font-medium text-gray-900"> {entry.pwd_placed || 0} </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="35" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <FaExclamationTriangle className="text-4xl text-gray-300" />
                          <p className="text-sm text-gray-500">No course entries found</p>
                          {(searchTerm || activeFilterCount > 0) && (
                            <button
                              onClick={clearFilters}
                              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                              Clear filters
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
        </div>
      </div>

      <ToastContainer 
        position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop
        closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="light"
      />
    </>
  );
}