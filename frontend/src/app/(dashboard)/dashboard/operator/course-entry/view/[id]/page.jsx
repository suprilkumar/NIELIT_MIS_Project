'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { 
  FaArrowLeft, FaEdit, FaTrash, FaLock, FaCheckCircle,
  FaBuilding, FaBook, FaCalendar, FaUser, FaClock,
  FaMale, FaFemale, FaWheelchair, FaInfoCircle,
  FaDownload, FaPrint, FaExclamationTriangle, FaChartLine,
  FaCheck, FaTimes, FaEye, FaHistory
} from 'react-icons/fa';
import { MdCategory, MdNumbers, MdPeople, MdVerified, MdPending } from 'react-icons/md';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function CourseEntryViewPage() {
  console.log("Component Loaded");
  
  const {id} = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  // Track mounted state to prevent memory leaks
  const isMounted = useRef(true);
  const abortControllerRef = useRef(null);
  const fetchInProgress = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    isMounted.current = true;
    
    return () => {
      isMounted.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Check authentication
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Memoize fetch function
  const fetchEntryDetails = useCallback(async (isRetry = false) => {
    // Prevent multiple simultaneous requests
    if (fetchInProgress.current) {
      console.log('Fetch already in progress, skipping...');
      return;
    }
    
    if (!user || !id || !isMounted.current) return;
    
    // Cancel previous request only if it exists and is different
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // Create new abort controller
    abortControllerRef.current = new AbortController();
    fetchInProgress.current = true;
    
    // Only set loading to true on initial load or manual retry
    if (!isRetry) {
      setLoading(true);
    }
    setError(null);
    
    try {
      const response = await api.get(`/course-entry/view/${id}/`, {
        signal: abortControllerRef.current.signal
      });
      
      // Only update state if component is still mounted and request wasn't aborted
      if (isMounted.current && !abortControllerRef.current.signal.aborted) {
        const entryData = response.data.data || response.data;
        setEntry(entryData);
        setError(null);
      }
      
    } catch (err) {
      // Ignore aborted requests and if component is unmounted
      if (!isMounted.current || err.name === 'CanceledError' || err.name === 'AbortError') {
        console.log('Request was cancelled or component unmounted');
        return;
      }
      
      console.error('Error fetching entry details:', err);
      
      // Only set error if component is still mounted
      if (isMounted.current) {
        if (err.response?.status === 404) {
          setError('NOT_FOUND');
        } else if (err.response?.status === 403) {
          setError('FORBIDDEN');
        } else if (err.code === 'ERR_NETWORK') {
          setError('NETWORK_ERROR');
        } else {
          setError('UNKNOWN_ERROR');
        }
      }
      
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
      fetchInProgress.current = false;
      if (abortControllerRef.current?.signal.aborted) {
        abortControllerRef.current = null;
      }
    }
  }, [user, id]);

  // Fetch data when ready
  useEffect(() => {
    if (user && id) {
      fetchEntryDetails();
    }
    
    return () => {
      if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      fetchInProgress.current = false;
    };
  }, [id, fetchEntryDetails, retryCount]);

  const handleRetry = () => {
    // Cancel any in-progress fetch
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    fetchInProgress.current = false;
    setRetryCount(prev => prev + 1);
    setError(null);
    setLoading(true);
    // Small delay to ensure cleanup
    setTimeout(() => {
      if (isMounted.current) {
        fetchEntryDetails(true);
      }
    }, 100);
  };

  const handleDelete = async () => {
    if (!entry || !isMounted.current) return;
    
    setDeleting(true);
    try {
      await api.delete(`/course-entry/entries/${entry.id}/`);
      
      if (isMounted.current) {
        toast.success('Entry deleted successfully');
        setTimeout(() => {
          if (isMounted.current) {
            router.push('/dashboard/operator/course-entry');
          }
        }, 2000);
      }
      
    } catch (err) {
      if (isMounted.current) {
        console.error('Error deleting entry:', err);
        toast.error(err.response?.data?.error || 'Failed to delete entry');
        setShowDeleteModal(false);
      }
    } finally {
      if (isMounted.current) {
        setDeleting(false);
      }
    }
  };

  const handleEdit = () => {
    if (entry?.id) {
      router.push(`/dashboard/operator/course-entry/edit/${entry.id}`);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!entry) return;
    
    try {
      const dataStr = JSON.stringify(entry, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const monthDisplay = entry.month_display || entry.month_year || 'entry';
      const sanitizedMonth = String(monthDisplay).replace(/[^a-zA-Z0-9]/g, '-');
      const exportFileDefaultName = `course-entry-${sanitizedMonth}-${entry.id}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch (err) {
      console.error('Error downloading:', err);
      toast.error('Failed to download entry');
    }
  };

  // Memoize helper functions
  const getStatusBadge = useCallback((status) => {
    const statusConfig = {
      'PENDING': { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', icon: MdPending },
      'PARTIAL': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', icon: FaClock },
      'COMPLETED': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: FaCheckCircle },
      'LOCKED': { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', icon: FaLock },
      'VERIFIED': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: MdVerified },
    };
    
    const config = statusConfig[status] || { 
      bg: 'bg-gray-50', 
      text: 'text-gray-700', 
      border: 'border-gray-200',
      icon: FaInfoCircle 
    };
    
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${config.bg} ${config.text} ${config.border} border`}>
        <Icon className="text-xs" />
        {status || 'N/A'}
      </span>
    );
  }, []);

  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  }, []);

  const getMonthDisplay = useCallback(() => {
    if (!entry) return 'N/A';
    if (entry?.month_display) return entry.month_display;
    if (entry?.month_year) {
      try {
        return new Date(entry.month_year).toLocaleString('default', { 
          month: 'long', 
          year: 'numeric' 
        });
      } catch {
        return 'Invalid Date';
      }
    }
    return 'N/A';
  }, [entry]);

  const canEdit = useCallback(() => {
    if (!entry) return false;
    return !['LOCKED', 'VERIFIED'].includes(entry.entry_status);
  }, [entry]);

  const isAdmin = user?.role === 'ADMIN';

  const getErrorMessage = (errorCode) => {
    switch(errorCode) {
      case 'NOT_FOUND':
        return 'Course entry not found';
      case 'FORBIDDEN':
        return 'You do not have permission to view this entry';
      case 'NETWORK_ERROR':
        return 'Network error. Please check your connection.';
      case 'UNKNOWN_ERROR':
      default:
        return 'Failed to load entry details';
    }
  };

  // Skeleton Loader Component
  const SkeletonLoader = () => (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb Skeleton */}
        <div className="mb-8">
          <div className="h-4 w-48 bg-gray-200 rounded animate-pulse mb-4"></div>
          
          {/* Header Skeleton */}
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div>
              <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="flex gap-3">
              <div className="h-10 w-20 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="h-10 w-20 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="h-10 w-20 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Info Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-4 w-24 bg-gray-300 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs Skeleton */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200 px-5 py-4 bg-gray-50">
            <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i}>
                  <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-6 w-20 bg-gray-300 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i}>
                  <div className="flex justify-between mb-1">
                    <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-3 w-8 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="h-2 w-full bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Loading state
  if (authLoading || loading) {
    return <SkeletonLoader />;
  }

  // Error state - only show if we have a specific error and no entry
  if (error && !entry) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <FaExclamationTriangle className="text-red-600 text-2xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Entry</h2>
          <p className="text-gray-600 mb-6">{getErrorMessage(error)}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleRetry}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:bg-blue-400"
            >
              {loading ? 'Loading...' : 'Try Again'}
            </button>
            <Link
              href="/dashboard/operator/course-entry"
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Back to List
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Not found state - only show if we have no entry and no error (initial state)
  if (!entry && !error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-300 border-t-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Entry</h2>
          <p className="text-gray-600">Please wait while we load the entry details...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header with breadcrumb and actions */}
          <div className="mb-8 print:hidden">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
              <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
                Dashboard
              </Link>
              <span>/</span>
              <Link href="/dashboard/operator/course-entry" className="hover:text-blue-600 transition-colors">
                Course Entries
              </Link>
              <span>/</span>
              <span className="text-gray-900 font-medium">View Entry</span>
            </div>
            
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Course Entry Details</h1>
                <p className="mt-2 text-gray-600">
                  {entry.centre_name || entry.centre?.centre_name} • {entry.course_name || entry.course?.course_name} • {getMonthDisplay()}
                </p>
              </div>
              
              <div className="flex flex-wrap gap-3">
                {/* Status Badge */}
                {getStatusBadge(entry.entry_status)}
                
                {/* Action Buttons */}
                {canEdit() && (
                  <button
                    onClick={handleEdit}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm hover:shadow"
                  >
                    <FaEdit />
                    Edit
                  </button>
                )}
                
                {(isAdmin || canEdit()) && (
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm hover:shadow"
                  >
                    <FaTrash />
                    Delete
                  </button>
                )}
                
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm hover:shadow"
                >
                  <FaPrint />
                  Print
                </button>
                
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm hover:shadow"
                >
                  <FaDownload />
                  Export
                </button>
                
                <Link
                  href="/dashboard/operator/course-entry"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm hover:shadow"
                >
                  <FaArrowLeft />
                  Back
                </Link>
              </div>
            </div>
          </div>

          {/* Entry Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 print:mb-4">
            {/* Centre Card */}
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 rounded-lg">
                  <FaBuilding className="text-blue-600 text-lg" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Centre</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {entry.centre_name || entry.centre?.centre_name || 'N/A'}
                  </p>
                  {entry.centre?.centre_code && (
                    <p className="text-xs text-gray-500 mt-0.5">Code: {entry.centre.centre_code}</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Course Card */}
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-green-50 rounded-lg">
                  <FaBook className="text-green-600 text-lg" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Course</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {entry.course_name || entry.course?.course_name || 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {entry.course_category || entry.course?.course_category_name || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Month Card */}
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-50 rounded-lg">
                  <FaCalendar className="text-purple-600 text-lg" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Month</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{getMonthDisplay()}</p>
                </div>
              </div>
            </div>
            
            {/* Status Card */}
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 rounded-lg">
                  <FaInfoCircle className="text-amber-600 text-lg" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status</p>
                  <div className="mt-1">
                    {getStatusBadge(entry.entry_status)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="border-b border-gray-200 mb-6 print:hidden">
            <nav className="flex gap-2">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'overview'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('gender')}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'gender'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Gender Breakdown
              </button>
              <button
                onClick={() => setActiveTab('category')}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'category'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Category Breakdown
              </button>
              <button
                onClick={() => setActiveTab('pwd')}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'pwd'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                PWD
              </button>
              <button
                onClick={() => setActiveTab('metadata')}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'metadata'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Metadata
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="border-b border-gray-200 px-6 py-4 bg-gradient-to-r from-gray-50 to-white">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <MdNumbers className="text-blue-600" />
                    Overall Numbers
                  </h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Total Enrolled</p>
                      <p className="text-3xl font-bold text-gray-900">{entry.total_enrolled || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Total Trained</p>
                      <p className="text-3xl font-bold text-gray-900">{entry.total_trained || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Total Certified</p>
                      <p className="text-3xl font-bold text-gray-900">{entry.total_certified || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Total Placed</p>
                      <p className="text-3xl font-bold text-gray-900">{entry.total_placed || 0}</p>
                    </div>
                  </div>
                  
                  {/* Progress indicators */}
                  <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Training Progress</span>
                        <span className="font-semibold text-gray-900">
                          {entry.total_enrolled ? Math.round((entry.total_trained / entry.total_enrolled) * 100) : 0}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
                          style={{ width: `${entry.total_enrolled ? (entry.total_trained / entry.total_enrolled) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Certification Progress</span>
                        <span className="font-semibold text-gray-900">
                          {entry.total_trained ? Math.round((entry.total_certified / entry.total_trained) * 100) : 0}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-green-600 h-2.5 rounded-full transition-all duration-500" 
                          style={{ width: `${entry.total_trained ? (entry.total_certified / entry.total_trained) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Placement Progress</span>
                        <span className="font-semibold text-gray-900">
                          {entry.total_certified ? Math.round((entry.total_placed / entry.total_certified) * 100) : 0}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-purple-600 h-2.5 rounded-full transition-all duration-500" 
                          style={{ width: `${entry.total_certified ? (entry.total_placed / entry.total_certified) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Gender Breakdown Tab */}
            {activeTab === 'gender' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="border-b border-gray-200 px-6 py-4 bg-gradient-to-r from-gray-50 to-white">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <MdPeople className="text-pink-600" />
                    Gender Breakdown
                  </h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Male */}
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-blue-600 mb-4 flex items-center gap-2">
                        <FaMale /> Male
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Enrolled</p>
                          <p className="text-2xl font-bold text-gray-900">{entry.male_enrolled || 0}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Trained</p>
                          <p className="text-2xl font-bold text-gray-900">{entry.male_trained || 0}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Certified</p>
                          <p className="text-2xl font-bold text-gray-900">{entry.male_certified || 0}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Placed</p>
                          <p className="text-2xl font-bold text-gray-900">{entry.male_placed || 0}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Female */}
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-pink-600 mb-4 flex items-center gap-2">
                        <FaFemale /> Female
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Enrolled</p>
                          <p className="text-2xl font-bold text-gray-900">{entry.female_enrolled || 0}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Trained</p>
                          <p className="text-2xl font-bold text-gray-900">{entry.female_trained || 0}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Certified</p>
                          <p className="text-2xl font-bold text-gray-900">{entry.female_certified || 0}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Placed</p>
                          <p className="text-2xl font-bold text-gray-900">{entry.female_placed || 0}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Category Breakdown Tab */}
            {activeTab === 'category' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="border-b border-gray-200 px-6 py-4 bg-gradient-to-r from-gray-50 to-white">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <MdCategory className="text-purple-600" />
                    Category Breakdown
                  </h2>
                </div>
                <div className="p-6 space-y-6">
                  {/* SC */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-purple-600 mb-4">SC</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Enrolled</p>
                        <p className="text-2xl font-bold text-gray-900">{entry.sc_enrolled || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Trained</p>
                        <p className="text-2xl font-bold text-gray-900">{entry.sc_trained || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Certified</p>
                        <p className="text-2xl font-bold text-gray-900">{entry.sc_certified || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Placed</p>
                        <p className="text-2xl font-bold text-gray-900">{entry.sc_placed || 0}</p>
                      </div>
                    </div>
                  </div>

                  {/* ST */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-indigo-600 mb-4">ST</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Enrolled</p>
                        <p className="text-2xl font-bold text-gray-900">{entry.st_enrolled || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Trained</p>
                        <p className="text-2xl font-bold text-gray-900">{entry.st_trained || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Certified</p>
                        <p className="text-2xl font-bold text-gray-900">{entry.st_certified || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Placed</p>
                        <p className="text-2xl font-bold text-gray-900">{entry.st_placed || 0}</p>
                      </div>
                    </div>
                  </div>

                  {/* OBC */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-orange-600 mb-4">OBC</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Enrolled</p>
                        <p className="text-2xl font-bold text-gray-900">{entry.obc_enrolled || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Trained</p>
                        <p className="text-2xl font-bold text-gray-900">{entry.obc_trained || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Certified</p>
                        <p className="text-2xl font-bold text-gray-900">{entry.obc_certified || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Placed</p>
                        <p className="text-2xl font-bold text-gray-900">{entry.obc_placed || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PWD Tab */}
            {activeTab === 'pwd' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="border-b border-gray-200 px-6 py-4 bg-gradient-to-r from-gray-50 to-white">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FaWheelchair className="text-amber-600" />
                    Persons with Disabilities (PWD)
                  </h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Enrolled</p>
                      <p className="text-3xl font-bold text-gray-900">{entry.pwd_enrolled || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Trained</p>
                      <p className="text-3xl font-bold text-gray-900">{entry.pwd_trained || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Certified</p>
                      <p className="text-3xl font-bold text-gray-900">{entry.pwd_certified || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Placed</p>
                      <p className="text-3xl font-bold text-gray-900">{entry.pwd_placed || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Metadata Tab */}
            {activeTab === 'metadata' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="border-b border-gray-200 px-6 py-4 bg-gradient-to-r from-gray-50 to-white">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FaInfoCircle className="text-blue-600" />
                    Entry Metadata
                  </h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Created By</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {entry.created_by_name || entry.created_by?.full_name || 'N/A'}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                          <FaCalendar className="text-gray-400" />
                          {formatDate(entry.created_at)}
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Last Updated By</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {entry.updated_by_name || entry.updated_by?.full_name || 'N/A'}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                          <FaClock className="text-gray-400" />
                          {formatDate(entry.updated_at)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {entry.verified_by && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Verified By</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {entry.verified_by_name || entry.verified_by?.full_name}
                          </p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                            <MdVerified className="text-green-500" />
                            {formatDate(entry.verified_at)}
                          </div>
                        </div>
                      )}
                      
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Entry ID</p>
                        <p className="text-sm font-mono font-semibold text-gray-900 break-all">{entry.id}</p>
                      </div>
                    </div>
                  </div>
                  
                  {entry.remarks && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Remarks</p>
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">
                        {entry.remarks}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <div className="p-2 bg-rose-100 rounded-full">
                <FaExclamationTriangle className="text-xl" />
              </div>
              <h3 className="text-lg font-semibold">Delete Course Entry</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this entry for{' '}
              <span className="font-semibold text-gray-900">
                {getMonthDisplay()}
              </span>? 
              This action cannot be undone.
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-medium transition-colors disabled:bg-rose-400 flex items-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Deleting...
                  </>
                ) : (
                  'Delete Entry'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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

      
    </>
  );
}