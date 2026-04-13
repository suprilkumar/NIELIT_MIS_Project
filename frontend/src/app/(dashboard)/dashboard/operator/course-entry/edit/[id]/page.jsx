'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Head from 'next/head';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { 
  FaSave, FaTimes, FaBuilding, FaBook, 
  FaMale, FaFemale, FaUsers, FaWheelchair,
  FaTag, FaInfoCircle, FaExclamationTriangle,
  FaArrowLeft, FaCheck, FaLock, FaEye,
  FaHistory, FaUserCheck, FaClock, FaChartLine,
  FaChevronDown, FaChevronUp
} from 'react-icons/fa';
import { MdCategory, MdSchedule, MdNumbers, MdPeople, MdVerified, MdPending } from 'react-icons/md';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function EditCourseEntry() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;
  const { user, isLoading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  // Dropdown data
  const [centres, setCentres] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loadingCentres, setLoadingCentres] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [courseCategories, setCourseCategories] = useState([]);
  
  // Original entry data
  const [originalEntry, setOriginalEntry] = useState(null);
  
  // Entry data
  const [formData, setFormData] = useState({
    centre: '',
    course: '',
    entry_status: '',
    total_enrolled: '',
    total_trained: '',
    total_certified: '',
    total_placed: '',
    male_enrolled: '',
    male_trained: '',
    male_certified: '',
    male_placed: '',
    female_enrolled: '',
    female_trained: '',
    female_certified: '',
    female_placed: '',
    sc_enrolled: '',
    sc_trained: '',
    sc_certified: '',
    sc_placed: '',
    st_enrolled: '',
    st_trained: '',
    st_certified: '',
    st_placed: '',
    obc_enrolled: '',
    obc_trained: '',
    obc_certified: '',
    obc_placed: '',
    pwd_enrolled: '',
    pwd_trained: '',
    pwd_certified: '',
    pwd_placed: '',
    remarks: ''
  });
  
  const [currentMonth, setCurrentMonth] = useState('');
  
  // Validation errors
  const [validationErrors, setValidationErrors] = useState({});
  
  // Active section for collapsible sections
  const [activeSections, setActiveSections] = useState({
    overview: true,
    gender: true,
    category: true,
    pwd: true,
    remarks: true,
    audit: true
  });
  
  // Edit mode state
  const [isEditable, setIsEditable] = useState(true);

  // Toggle section
  const toggleSection = (section) => {
    setActiveSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Status badge colors and icons
  const getStatusConfig = (status) => {
    const configs = {
      'VERIFIED': { 
        bg: 'bg-green-50', 
        text: 'text-green-700', 
        border: 'border-green-200',
        icon: MdVerified,
        label: 'Verified'
      },
      'LOCKED': { 
        bg: 'bg-gray-50', 
        text: 'text-gray-700', 
        border: 'border-gray-200',
        icon: FaLock,
        label: 'Locked'
      },
      'COMPLETED': { 
        bg: 'bg-blue-50', 
        text: 'text-blue-700', 
        border: 'border-blue-200',
        icon: FaCheck,
        label: 'Completed'
      },
      'PENDING': { 
        bg: 'bg-yellow-400', 
        text: 'text-black', 
        border: 'border-yellow-200',
        icon: MdPending,
        label: 'Pending'
      },
      'PARTIAL': { 
        bg: 'bg-orange-50', 
        text: 'text-orange-700', 
        border: 'border-orange-200',
        icon: FaSave,
        label: 'Partial'
      }
    };
    return configs[status] || { 
      bg: 'bg-gray-50', 
      text: 'text-gray-700', 
      border: 'border-gray-200',
      icon: FaClock,
      label: status || 'Unknown'
    };
  };

  // Set current month display
  useEffect(() => {
    const date = new Date();
    const monthName = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear();
    setCurrentMonth(`${monthName} ${year}`);
  }, []);

  // Check authentication
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Load dropdown data
  useEffect(() => {
    if (user) {
      loadCentres();
      loadCourses();
      fetchCourseCategories();
      loadEntryData();
    }
  }, [user]);

  const loadCentres = async () => {
    setLoadingCentres(true);
    try {
      const response = await api.get('/dashboard/centres/');
      setCentres(response.data);
    } catch (err) {
      console.error('Error loading centres:', err);
      toast.error('Failed to load centres');
    } finally {
      setLoadingCentres(false);
    }
  };

  const loadCourses = async () => {
    setLoadingCourses(true);
    try {
      const response = await api.get('/dashboard/courses/');
      setCourses(response.data);
    } catch (err) {
      console.error('Error loading courses:', err);
      toast.error('Failed to load courses');
    } finally {
      setLoadingCourses(false);
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

  const loadEntryData = async () => {
    setLoading(true);
    try {
      console.log('Loading entry data for ID:', id);
      const response = await api.get(`/course-entry/entries/${id}/`);
      const data = response.data;
      
      console.log('Entry data loaded:', data);
      setOriginalEntry(data);
      
      // Check if entry is locked or verified
      if (data.entry_status === 'LOCKED') {
        setIsEditable(false);
        toast.info('This entry is locked and cannot be edited');
      } else if (data.entry_status === 'VERIFIED') {
        setIsEditable(false);
        toast.info('This entry is verified and cannot be edited');
      } else {
        setIsEditable(true);
      }
      
      // Set form data with proper number conversion (empty strings for empty values)
      setFormData({
        centre: data.centre?.id || '',
        course: data.course?.id || '',
        entry_status: data.entry_status || 'PENDING',
        total_enrolled: data.total_enrolled ? Number(data.total_enrolled) : '',
        total_trained: data.total_trained ? Number(data.total_trained) : '',
        total_certified: data.total_certified ? Number(data.total_certified) : '',
        total_placed: data.total_placed ? Number(data.total_placed) : '',
        male_enrolled: data.male_enrolled ? Number(data.male_enrolled) : '',
        male_trained: data.male_trained ? Number(data.male_trained) : '',
        male_certified: data.male_certified ? Number(data.male_certified) : '',
        male_placed: data.male_placed ? Number(data.male_placed) : '',
        female_enrolled: data.female_enrolled ? Number(data.female_enrolled) : '',
        female_trained: data.female_trained ? Number(data.female_trained) : '',
        female_certified: data.female_certified ? Number(data.female_certified) : '',
        female_placed: data.female_placed ? Number(data.female_placed) : '',
        sc_enrolled: data.sc_enrolled ? Number(data.sc_enrolled) : '',
        sc_trained: data.sc_trained ? Number(data.sc_trained) : '',
        sc_certified: data.sc_certified ? Number(data.sc_certified) : '',
        sc_placed: data.sc_placed ? Number(data.sc_placed) : '',
        st_enrolled: data.st_enrolled ? Number(data.st_enrolled) : '',
        st_trained: data.st_trained ? Number(data.st_trained) : '',
        st_certified: data.st_certified ? Number(data.st_certified) : '',
        st_placed: data.st_placed ? Number(data.st_placed) : '',
        obc_enrolled: data.obc_enrolled ? Number(data.obc_enrolled) : '',
        obc_trained: data.obc_trained ? Number(data.obc_trained) : '',
        obc_certified: data.obc_certified ? Number(data.obc_certified) : '',
        obc_placed: data.obc_placed ? Number(data.obc_placed) : '',
        pwd_enrolled: data.pwd_enrolled ? Number(data.pwd_enrolled) : '',
        pwd_trained: data.pwd_trained ? Number(data.pwd_trained) : '',
        pwd_certified: data.pwd_certified ? Number(data.pwd_certified) : '',
        pwd_placed: data.pwd_placed ? Number(data.pwd_placed) : '',
        remarks: data.remarks || ''
      });
      
    } catch (err) {
      console.error('Error loading entry:', err);
      setError('Failed to load entry data');
      toast.error('Failed to load entry data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    if (!isEditable) return;
    
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? '' : Number(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    // Convert empty strings to 0 for validation
    const total_enrolled = Number(formData.total_enrolled) || 0;
    const total_trained = Number(formData.total_trained) || 0;
    const total_certified = Number(formData.total_certified) || 0;
    const total_placed = Number(formData.total_placed) || 0;
    const male_enrolled = Number(formData.male_enrolled) || 0;
    const female_enrolled = Number(formData.female_enrolled) || 0;
    const sc_enrolled = Number(formData.sc_enrolled) || 0;
    const st_enrolled = Number(formData.st_enrolled) || 0;
    const obc_enrolled = Number(formData.obc_enrolled) || 0;
    const pwd_enrolled = Number(formData.pwd_enrolled) || 0;
    
    // Pipeline validation
    if (total_trained > total_enrolled) {
      errors.total_trained = 'Trained cannot exceed enrolled';
    }
    if (total_certified > total_trained) {
      errors.total_certified = 'Certified cannot exceed trained';
    }
    if (total_placed > total_certified) {
      errors.total_placed = 'Placed cannot exceed certified';
    }
    
    // Gender validation
    if (male_enrolled + female_enrolled > total_enrolled) {
      errors.gender = 'Male + Female enrolled cannot exceed total enrolled';
    }
    
    // Category validation
    const categorySum = sc_enrolled + st_enrolled + obc_enrolled;
    if (categorySum > total_enrolled) {
      errors.category = 'SC + ST + OBC enrolled cannot exceed total enrolled';
    }
    
    // PWD validation
    if (pwd_enrolled > total_enrolled) {
      errors.pwd_enrolled = 'PWD enrolled cannot exceed total enrolled';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    if (!isEditable) {
      toast.error('This entry cannot be edited');
      return;
    }
    
    if (!validateForm()) {
      toast.error('Please fix the validation errors');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      // Convert empty strings to 0 for number fields before sending
      const dataToSend = {
        ...formData,
        total_enrolled: Number(formData.total_enrolled) || 0,
        total_trained: Number(formData.total_trained) || 0,
        total_certified: Number(formData.total_certified) || 0,
        total_placed: Number(formData.total_placed) || 0,
        male_enrolled: Number(formData.male_enrolled) || 0,
        male_trained: Number(formData.male_trained) || 0,
        male_certified: Number(formData.male_certified) || 0,
        male_placed: Number(formData.male_placed) || 0,
        female_enrolled: Number(formData.female_enrolled) || 0,
        female_trained: Number(formData.female_trained) || 0,
        female_certified: Number(formData.female_certified) || 0,
        female_placed: Number(formData.female_placed) || 0,
        sc_enrolled: Number(formData.sc_enrolled) || 0,
        sc_trained: Number(formData.sc_trained) || 0,
        sc_certified: Number(formData.sc_certified) || 0,
        sc_placed: Number(formData.sc_placed) || 0,
        st_enrolled: Number(formData.st_enrolled) || 0,
        st_trained: Number(formData.st_trained) || 0,
        st_certified: Number(formData.st_certified) || 0,
        st_placed: Number(formData.st_placed) || 0,
        obc_enrolled: Number(formData.obc_enrolled) || 0,
        obc_trained: Number(formData.obc_trained) || 0,
        obc_certified: Number(formData.obc_certified) || 0,
        obc_placed: Number(formData.obc_placed) || 0,
        pwd_enrolled: Number(formData.pwd_enrolled) || 0,
        pwd_trained: Number(formData.pwd_trained) || 0,
        pwd_certified: Number(formData.pwd_certified) || 0,
        pwd_placed: Number(formData.pwd_placed) || 0,
      };
      
      console.log('Updating entry with data:', dataToSend);
      const response = await api.put(`/course-entry/entries/${id}/`, dataToSend);
      console.log('Entry updated:', response.data);
      
      toast.success('Entry updated successfully');
      
      // Reload the data after update
      setTimeout(() => {
        loadEntryData();
      }, 1500);
      
    } catch (err) {
      console.error('Error updating entry:', err);
      if (err.response?.data) {
        const apiErrors = err.response.data;
        if (typeof apiErrors === 'object') {
          setValidationErrors(prev => ({ ...prev, ...apiErrors }));
        }
        toast.error(apiErrors.message || 'Failed to update entry');
      } else {
        toast.error('Failed to update entry. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitForVerification = async () => {
    if (!validateForm()) return;
    
    setSubmitting(true);
    try {
      await api.post(`/course-entry/entries/${id}/submit/`);
      toast.success('Entry submitted for verification');
      
      setTimeout(() => {
        loadEntryData();
      }, 1500);
    } catch (err) {
      console.error('Error submitting entry:', err);
      toast.error('Failed to submit entry');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async () => {
    setSubmitting(true);
    try {
      await api.post(`/course-entry/entries/${id}/verify/`);
      toast.success('Entry verified successfully');
      
      setTimeout(() => {
        loadEntryData();
      }, 1500);
    } catch (err) {
      console.error('Error verifying entry:', err);
      toast.error('Failed to verify entry');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLock = async () => {
    setSubmitting(true);
    try {
      await api.post(`/course-entry/entries/${id}/lock/`);
      toast.success('Entry locked successfully');
      
      setTimeout(() => {
        loadEntryData();
      }, 1500);
    } catch (err) {
      console.error('Error locking entry:', err);
      toast.error('Failed to lock entry');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper function to get category name by ID
  const getCategoryName = (categoryId) => {
    if (!categoryId) return 'N/A';
    const category = courseCategories.find(c => c.id === categoryId);
    return category?.course_category_name || 'N/A';
  };

  // Helper function to get centre name by ID
  const getCentreName = (centreId) => {
    if (!centreId) return 'N/A';
    const centre = centres.find(c => c.id === centreId);
    return centre?.centre_name || 'N/A';
  };

  // Helper function to format date
  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get selected course details
  const selectedCourse = useMemo(() => {
    if (!formData.course) return null;
    return courses.find(c => c.id === formData.course) || null;
  }, [formData.course, courses]);

  // Calculate completion percentage
  const calculateCompletion = () => {
    const totalFields = 32;
    let filledFields = 0;
    
    Object.entries(formData).forEach(([key, value]) => {
      if (key !== 'centre' && key !== 'course' && key !== 'remarks' && key !== 'entry_status') {
        const numValue = value === '' ? 0 : Number(value);
        if (numValue > 0) filledFields++;
      }
    });
    
    return Math.round((filledFields / totalFields) * 100);
  };

  // Status config
  const statusConfig = getStatusConfig(formData.entry_status);
  const StatusIcon = statusConfig.icon;

  // Skeleton Loader
  const SkeletonLoader = () => (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb Skeleton */}
        <div className="mb-8">
          <div className="h-4 w-48 bg-gray-400 rounded animate-pulse mb-4"></div>
          
          {/* Header Skeleton */}
          <div className="flex items-center justify-between">
            <div>
              <div className="h-8 w-64 bg-gray-400 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-96 bg-gray-400 rounded animate-pulse"></div>
            </div>
            <div className="h-10 w-32 bg-gray-400 rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Progress Bar Skeleton */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="h-4 w-32 bg-gray-400 rounded animate-pulse mb-2"></div>
          <div className="h-2 w-full bg-gray-400 rounded animate-pulse"></div>
        </div>

        {/* Form Cards Skeleton */}
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-400 mb-4 overflow-hidden">
            <div className="border-b border-gray-400 px-6 py-4 bg-gray-50">
              <div className="h-6 w-48 bg-gray-400 rounded animate-pulse"></div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, j) => (
                  <div key={j}>
                    <div className="h-3 w-20 bg-gray-400 rounded animate-pulse mb-2"></div>
                    <div className="h-8 w-full bg-gray-400 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Show loading state
  if (authLoading || loading) {
    return <SkeletonLoader />;
  }

  if (error && !originalEntry) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <FaExclamationTriangle className="text-red-600 text-2xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Entry</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => router.back()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Edit Course Entry | Dashboard</title>
      </Head>
      
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header with breadcrumb */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
              <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
                Dashboard
              </Link>
              <span>/</span>
              <Link href="/dashboard/operator/course-entry" className="hover:text-blue-600 transition-colors">
                Course Entries
              </Link>
              <span>/</span>
              <span className="text-gray-900 font-medium">Edit Entry</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Edit Course Entry</h1>
                <p className="mt-2 text-gray-600">
                  Month: <span className="font-semibold text-blue-600">
                    {originalEntry?.month_display || originalEntry?.month_year || currentMonth}
                  </span>
                </p>
              </div>
              
              {/* Status Badge */}
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border} border`}>
                <StatusIcon className="text-sm" />
                <span className="text-sm font-medium">{statusConfig.label}</span>
              </div>
            </div>
          </div>

          {/* Progress and Info Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              
              {/* Progress Bar */}
              <div className="w-full lg:w-96">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Form Completion</span>
                  <span className="text-sm font-semibold text-blue-600">{calculateCompletion()}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${calculateCompletion()}%` }}
                  ></div>
                </div>
              </div>

              {/* Audit Info */}
              {originalEntry && (
                <div className="flex flex-wrap gap-4 items-center">
                  {originalEntry.created_by_username && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FaUserCheck className="text-gray-400" />
                      <span>Created: {originalEntry.created_by_username}</span>
                    </div>
                  )}
                  {originalEntry.verified_by_username && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <MdVerified />
                      <span>Verified: {originalEntry.verified_by_username}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Back Button */}
              <Link
                href="/dashboard/operator/course-entry/view"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm hover:shadow"
              >
                <FaArrowLeft />
                Back to List
              </Link>
            </div>

            {/* Status Message for non-editable entries */}
            {!isEditable && (
              <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-center gap-3">
                  <FaLock className="text-amber-600" />
                  <p className="text-sm text-amber-700">
                    This entry is {formData.entry_status.toLowerCase()} and cannot be edited. 
                    {formData.entry_status === 'VERIFIED' && ' It has been verified and locked.'}
                    {formData.entry_status === 'LOCKED' && ' It has been locked by an administrator.'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Main Form */}
          <form onSubmit={handleUpdate} className="space-y-6">
            {/* Centre and Course Information - Readonly */}
            <div className="bg-white rounded-xl shadow-md shadow-gray-600 border border-gray-700 overflow-hidden">
              <div className="border-b border-gray-200 px-6 pt-4 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-50 p-1 rounded-lg">
                      <FaBuilding className="text-blue-600" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">Centre & Course Information</h2>
                  </div>
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <FaLock className="text-xs" /> Read-only
                  </span>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Centre Display */}
                  <div>
                    <label className="block text-sm md:text-base md:font-semibold font-medium text-gray-700 mb-2">
                      Centre
                    </label>
                    <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900">
                      <FaBuilding className="text-gray-400" />
                      <span className="text-sm">{originalEntry?.centre?.centre_name || getCentreName(formData.centre) || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Course Display */}
                  <div>
                    <label className="block text-sm md:text-base md:font-semibold font-medium text-gray-700 mb-2">
                      Course
                    </label>
                    <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900">
                      <FaBook className="text-gray-400" />
                      <span className="text-sm">{selectedCourse?.course_name || originalEntry?.course?.course_name || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Course Details */}
                {selectedCourse && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-3">
                      <FaInfoCircle className="text-blue-600 mt-1" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-800 mb-2">Course Details</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-blue-600">Category</p>
                            <p className="text-sm font-medium text-blue-900">
                              {selectedCourse.course_category_name || getCategoryName(selectedCourse.course_category) || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-blue-600">Mode</p>
                            <p className="text-sm font-medium text-blue-900">
                              {selectedCourse.course_mode || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-blue-600">Duration</p>
                            <p className="text-sm font-medium text-blue-900">
                              {selectedCourse.course_duration ? `${selectedCourse.course_duration} hours` : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-blue-600">Status</p>
                            <span className={`inline-block text-xs px-2 py-1 rounded-full mt-1 ${
                              selectedCourse.course_status === 'ACTIVE' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {selectedCourse.course_status || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Overall Numbers Card */}
            <div className="bg-white rounded-xl shadow-md shadow-gray-600 border border-gray-700 overflow-hidden">
              <div 
                className="border-b border-gray-200 px-6 pt-4 bg-gradient-to-r from-gray-50 to-white cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleSection('overview')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-50 p-2 rounded-lg">
                      <MdNumbers className="text-purple-600" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">Overall Numbers</h2>
                  </div>
                  <div className="flex items-center gap-4">
                    {validationErrors.total_trained && (
                      <span className="text-xs text-red-600">Error</span>
                    )}
                    {activeSections.overview ? <FaChevronUp /> : <FaChevronDown />}
                  </div>
                </div>
              </div>
              
              {activeSections.overview && (
                <div className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm md:text-base md:font-semibold font-medium text-gray-700 mb-2">
                        Total Enrolled
                      </label>
                      <input
                        type="number"
                        name="total_enrolled"
                        min="0"
                        value={formData.total_enrolled}
                        onChange={handleInputChange}
                        disabled={!isEditable}
                        placeholder="Enter number"
                        className={`w-full px-4 py-2.5 bg-gray-50 border ${
                          !isEditable ? 'bg-gray-100' : ''
                        } ${
                          validationErrors.total_enrolled 
                            ? 'border-red-300 focus:ring-red-500' 
                            : 'border-gray-300 focus:ring-blue-500'
                        } rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition duration-200`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm md:text-base md:font-semibold font-medium text-gray-700 mb-2">
                        Total Trained
                      </label>
                      <input
                        type="number"
                        name="total_trained"
                        min="0"
                        value={formData.total_trained}
                        onChange={handleInputChange}
                        disabled={!isEditable}
                        placeholder="Enter number"
                        className={`w-full px-4 py-2.5 bg-gray-50 border ${
                          !isEditable ? 'bg-gray-100' : ''
                        } ${
                          validationErrors.total_trained 
                            ? 'border-red-300 focus:ring-red-500' 
                            : 'border-gray-300 focus:ring-blue-500'
                        } rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition duration-200`}
                      />
                      {validationErrors.total_trained && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.total_trained}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm md:text-base md:font-semibold font-medium text-gray-700 mb-2">
                        Total Certified
                      </label>
                      <input
                        type="number"
                        name="total_certified"
                        min="0"
                        value={formData.total_certified}
                        onChange={handleInputChange}
                        disabled={!isEditable}
                        placeholder="Enter number"
                        className={`w-full px-4 py-2.5 bg-gray-50 border ${
                          !isEditable ? 'bg-gray-100' : ''
                        } ${
                          validationErrors.total_certified 
                            ? 'border-red-300 focus:ring-red-500' 
                            : 'border-gray-300 focus:ring-blue-500'
                        } rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition duration-200`}
                      />
                      {validationErrors.total_certified && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.total_certified}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm md:text-base md:font-semibold font-medium text-gray-700 mb-2">
                        Total Placed
                      </label>
                      <input
                        type="number"
                        name="total_placed"
                        min="0"
                        value={formData.total_placed}
                        onChange={handleInputChange}
                        disabled={!isEditable}
                        placeholder="Enter number"
                        className={`w-full px-4 py-2.5 bg-gray-50 border ${
                          !isEditable ? 'bg-gray-100' : ''
                        } ${
                          validationErrors.total_placed 
                            ? 'border-red-300 focus:ring-red-500' 
                            : 'border-gray-300 focus:ring-blue-500'
                        } rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition duration-200`}
                      />
                      {validationErrors.total_placed && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.total_placed}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Gender Breakdown Card */}
            <div className="bg-white rounded-xl shadow-md shadow-gray-600 border border-gray-700 overflow-hidden">
              <div 
                className="border-b border-gray-200 px-6 pt-4 bg-gradient-to-r from-gray-50 to-white cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleSection('gender')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-pink-50 p-2 rounded-lg">
                      <MdPeople className="text-pink-600" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">Gender Breakdown</h2>
                  </div>
                  <div className="flex items-center gap-4">
                    {validationErrors.gender && (
                      <span className="text-xs text-red-600">Error</span>
                    )}
                    {activeSections.gender ? <FaChevronUp /> : <FaChevronDown />}
                  </div>
                </div>
              </div>
              
              {activeSections.gender && (
                <div className="p-6">
                  {validationErrors.gender && (
                    <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-sm text-red-600">{validationErrors.gender}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Male */}
                    <div className="bg-gray-50 rounded-lg pt-2">
                      <h3 className="text-sm font-semibold text-blue-600 mb-4 flex items-center gap-2">
                        <FaMale /> Male
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs md:text-base md:font-semibold text-gray-500 mb-1">Enrolled</label>
                          <input
                            type="number"
                            name="male_enrolled"
                            min="0"
                            value={formData.male_enrolled}
                            onChange={handleInputChange}
                            disabled={!isEditable}
                            placeholder="Enter number"
                            className={`w-full px-3 py-2 bg-white border text-black ${
                              !isEditable ? 'bg-gray-100' : ''
                            } border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                          />
                        </div>
                        <div>
                          <label className="block text-xs md:text-base md:font-semibold text-gray-500 mb-1">Trained</label>
                          <input
                            type="number"
                            name="male_trained"
                            min="0"
                            value={formData.male_trained}
                            onChange={handleInputChange}
                            disabled={!isEditable}
                            placeholder="Enter number"
                            className={`w-full px-3 py-2 bg-white border text-black ${
                              !isEditable ? 'bg-gray-100' : ''
                            } border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                          />
                        </div>
                        <div>
                          <label className="block text-xs md:text-base md:font-semibold text-gray-500 mb-1">Certified</label>
                          <input
                            type="number"
                            name="male_certified"
                            min="0"
                            value={formData.male_certified}
                            onChange={handleInputChange}
                            disabled={!isEditable}
                            placeholder="Enter number"
                            className={`w-full px-3 py-2 bg-white border text-black ${
                              !isEditable ? 'bg-gray-100' : ''
                            } border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                          />
                        </div>
                        <div>
                          <label className="block text-xs md:text-base md:font-semibold text-gray-500 mb-1">Placed</label>
                          <input
                            type="number"
                            name="male_placed"
                            min="0"
                            value={formData.male_placed}
                            onChange={handleInputChange}
                            disabled={!isEditable}
                            placeholder="Enter number"
                            className={`w-full px-3 py-2 bg-white border text-black ${
                              !isEditable ? 'bg-gray-100' : ''
                            } border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Female */}
                    <div className="bg-gray-50 rounded-lg p-5">
                      <h3 className="text-sm font-semibold text-pink-600 mb-4 flex items-center gap-2">
                        <FaFemale /> Female
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs md:text-base md:font-semibold text-gray-500 mb-1">Enrolled</label>
                          <input
                            type="number"
                            name="female_enrolled"
                            min="0"
                            value={formData.female_enrolled}
                            onChange={handleInputChange}
                            disabled={!isEditable}
                            placeholder="Enter number"
                            className={`w-full px-3 py-2 bg-white border text-black ${
                              !isEditable ? 'bg-gray-100' : ''
                            } border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                          />
                        </div>
                        <div>
                          <label className="block text-xs md:text-base md:font-semibold text-gray-500 mb-1">Trained</label>
                          <input
                            type="number"
                            name="female_trained"
                            min="0"
                            value={formData.female_trained}
                            onChange={handleInputChange}
                            disabled={!isEditable}
                            placeholder="Enter number"
                            className={`w-full px-3 py-2 bg-white border text-black ${
                              !isEditable ? 'bg-gray-100' : ''
                            } border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                          />
                        </div>
                        <div>
                          <label className="block text-xs md:text-base md:font-semibold text-gray-500 mb-1">Certified</label>
                          <input
                            type="number"
                            name="female_certified"
                            min="0"
                            value={formData.female_certified}
                            onChange={handleInputChange}
                            disabled={!isEditable}
                            placeholder="Enter number"
                            className={`w-full px-3 py-2 bg-white border text-black  ${
                              !isEditable ? 'bg-gray-100' : ''
                            } border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                          />
                        </div>
                        <div>
                          <label className="block text-xs md:text-base md:font-semibold text-gray-500 mb-1">Placed</label>
                          <input
                            type="number"
                            name="female_placed"
                            min="0"
                            value={formData.female_placed}
                            onChange={handleInputChange}
                            disabled={!isEditable}
                            placeholder="Enter number"
                            className={`w-full px-3 py-2 bg-white border text-black ${
                              !isEditable ? 'bg-gray-100' : ''
                            } border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Category Breakdown Card */}
            <div className="bg-white rounded-xl shadow-md shadow-gray-600 border border-gray-700 overflow-hidden">
              <div 
                className="border-b border-gray-200 px-6 pt-4 bg-gradient-to-r from-gray-50 to-white cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleSection('category')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-50 p-2 rounded-lg">
                      <MdCategory className="text-green-600" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">Category Breakdown (SC/ST/OBC)</h2>
                  </div>
                  <div className="flex items-center gap-4">
                    {validationErrors.category && (
                      <span className="text-xs text-red-600">Error</span>
                    )}
                    {activeSections.category ? <FaChevronUp /> : <FaChevronDown />}
                  </div>
                </div>
              </div>
              
              {activeSections.category && (
                <div className="p-6">
                  {validationErrors.category && (
                    <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-sm text-red-600">{validationErrors.category}</p>
                    </div>
                  )}
                  
                  {/* SC */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-purple-600 mb-3">SC</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs md:text-base md:font-semibold text-gray-500 mb-1">Enrolled</label>
                        <input
                          type="number"
                          name="sc_enrolled"
                          min="0"
                          value={formData.sc_enrolled}
                          onChange={handleInputChange}
                          disabled={!isEditable}
                          placeholder="Enter number"
                          className={`w-full px-3 py-2 bg-gray-50 border text-black ${
                            !isEditable ? 'bg-gray-100' : ''
                          } border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs md:text-base md:font-semibold text-gray-500 mb-1">Trained</label>
                        <input
                          type="number"
                          name="sc_trained"
                          min="0"
                          value={formData.sc_trained}
                          onChange={handleInputChange}
                          disabled={!isEditable}
                          placeholder="Enter number"
                          className={`w-full px-3 py-2 bg-gray-50 border text-black ${
                            !isEditable ? 'bg-gray-100' : ''
                          } border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs md:text-base md:font-semibold text-gray-500 mb-1">Certified</label>
                        <input
                          type="number"
                          name="sc_certified"
                          min="0"
                          value={formData.sc_certified}
                          onChange={handleInputChange}
                          disabled={!isEditable}
                          placeholder="Enter number"
                          className={`w-full px-3 py-2 bg-gray-50 border text-black ${
                            !isEditable ? 'bg-gray-100' : ''
                          } border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs md:text-base md:font-semibold text-gray-500 mb-1">Placed</label>
                        <input
                          type="number"
                          name="sc_placed"
                          min="0"
                          value={formData.sc_placed}
                          onChange={handleInputChange}
                          disabled={!isEditable}
                          placeholder="Enter number"
                          className={`w-full px-3 py-2 bg-gray-50 border text-black ${
                            !isEditable ? 'bg-gray-100' : ''
                          } border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* ST */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-indigo-600 mb-3">ST</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Enrolled</label>
                        <input
                          type="number"
                          name="st_enrolled"
                          min="0"
                          value={formData.st_enrolled}
                          onChange={handleInputChange}
                          disabled={!isEditable}
                          placeholder="Enter number"
                          className={`w-full px-3 py-2 bg-gray-50 border text-black ${
                            !isEditable ? 'bg-gray-100' : ''
                          } border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs md:text-base md:font-semibold text-gray-500 mb-1">Trained</label>
                        <input
                          type="number"
                          name="st_trained"
                          min="0"
                          value={formData.st_trained}
                          onChange={handleInputChange}
                          disabled={!isEditable}
                          placeholder="Enter number"
                          className={`w-full px-3 py-2 bg-gray-50 border text-black ${
                            !isEditable ? 'bg-gray-100' : ''
                          } border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs md:text-base md:font-semibold text-gray-500 mb-1">Certified</label>
                        <input
                          type="number"
                          name="st_certified"
                          min="0"
                          value={formData.st_certified}
                          onChange={handleInputChange}
                          disabled={!isEditable}
                          placeholder="Enter number"
                          className={`w-full px-3 py-2 bg-gray-50 border text-black ${
                            !isEditable ? 'bg-gray-100' : ''
                          } border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs md:text-base md:font-semibold text-gray-500 mb-1">Placed</label>
                        <input
                          type="number"
                          name="st_placed"
                          min="0"
                          value={formData.st_placed}
                          onChange={handleInputChange}
                          disabled={!isEditable}
                          placeholder="Enter number"
                          className={`w-full px-3 py-2 bg-gray-50 border text-black ${
                            !isEditable ? 'bg-gray-100' : ''
                          } border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* OBC */}
                  <div>
                    <h3 className="text-sm font-semibold text-orange-600 mb-3">OBC</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs md:text-base md:font-semibold text-gray-500 mb-1">Enrolled</label>
                        <input
                          type="number"
                          name="obc_enrolled"
                          min="0"
                          value={formData.obc_enrolled}
                          onChange={handleInputChange}
                          disabled={!isEditable}
                          placeholder="Enter number"
                          className={`w-full px-3 py-2 bg-gray-50 border text-black ${
                            !isEditable ? 'bg-gray-100' : ''
                          } border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs md:text-base md:font-semibold text-gray-500 mb-1">Trained</label>
                        <input
                          type="number"
                          name="obc_trained"
                          min="0"
                          value={formData.obc_trained}
                          onChange={handleInputChange}
                          disabled={!isEditable}
                          placeholder="Enter number"
                          className={`w-full px-3 py-2 bg-gray-50 border text-black ${
                            !isEditable ? 'bg-gray-100' : ''
                          } border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs md:text-base md:font-semibold text-gray-500 mb-1">Certified</label>
                        <input
                          type="number"
                          name="obc_certified"
                          min="0"
                          value={formData.obc_certified}
                          onChange={handleInputChange}
                          disabled={!isEditable}
                          placeholder="Enter number"
                          className={`w-full px-3 py-2 bg-gray-50 border text-black ${
                            !isEditable ? 'bg-gray-100' : ''
                          } border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs md:text-base md:font-semibold text-gray-500 mb-1">Placed</label>
                        <input
                          type="number"
                          name="obc_placed"
                          min="0"
                          value={formData.obc_placed}
                          onChange={handleInputChange}
                          disabled={!isEditable}
                          placeholder="Enter number"
                          className={`w-full px-3 py-2 bg-gray-50 border text-black ${
                            !isEditable ? 'bg-gray-100' : ''
                          } border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* PWD Card */}
            <div className="bg-white rounded-xl shadow-md shadow-gray-600 border border-gray-700 overflow-hidden">
              <div 
                className="border-b border-gray-200 px-6 pt-4 bg-gradient-to-r from-gray-50 to-white cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleSection('pwd')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-amber-50 p-2 rounded-lg">
                      <FaWheelchair className="text-amber-600" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">PWD (Persons with Disabilities)</h2>
                  </div>
                  <div className="flex items-center gap-4">
                    {validationErrors.pwd_enrolled && (
                      <span className="text-xs text-red-600">Error</span>
                    )}
                    {activeSections.pwd ? <FaChevronUp /> : <FaChevronDown />}
                  </div>
                </div>
              </div>
              
              {activeSections.pwd && (
                <div className="p-6 pt-0">
                  <div className="bg-gray-50 rounded-lg pt-5">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm md:text-base md:font-semibold font-medium text-gray-700 mb-2">Enrolled</label>
                        <input
                          type="number"
                          name="pwd_enrolled"
                          min="0"
                          value={formData.pwd_enrolled}
                          onChange={handleInputChange}
                          disabled={!isEditable}
                          placeholder="Enter number"
                          className={`w-full px-4 py-2.5 bg-white border text-black ${
                            !isEditable ? 'bg-gray-100' : ''
                          } ${
                            validationErrors.pwd_enrolled 
                              ? 'border-red-300 focus:ring-red-500' 
                              : 'border-gray-300 focus:ring-blue-500'
                          } rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent`}
                        />
                        {validationErrors.pwd_enrolled && (
                          <p className="text-red-500 text-xs mt-1">{validationErrors.pwd_enrolled}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm md:text-base md:font-semibold font-medium text-gray-700 mb-2">Trained</label>
                        <input
                          type="number"
                          name="pwd_trained"
                          min="0"
                          value={formData.pwd_trained}
                          onChange={handleInputChange}
                          disabled={!isEditable}
                          placeholder="Enter number"
                          className={`w-full px-4 py-2.5 bg-white border text-black ${
                            !isEditable ? 'bg-gray-100' : ''
                          } border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                        />
                      </div>
                      <div>
                        <label className="block text-sm md:text-base md:font-semibold font-medium text-gray-700 mb-2">Certified</label>
                        <input
                          type="number"
                          name="pwd_certified"
                          min="0"
                          value={formData.pwd_certified}
                          onChange={handleInputChange}
                          disabled={!isEditable}
                          placeholder="Enter number"
                          className={`w-full px-4 py-2.5 bg-white border text-black ${
                            !isEditable ? 'bg-gray-100' : ''
                          } border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                        />
                      </div>
                      <div>
                        <label className="block text-sm md:text-base md:font-semibold font-medium text-gray-700 mb-2">Placed</label>
                        <input
                          type="number"
                          name="pwd_placed"
                          min="0"
                          value={formData.pwd_placed}
                          onChange={handleInputChange}
                          disabled={!isEditable}
                          placeholder="Enter number"
                          className={`w-full px-4 py-2.5 bg-white border text-black ${
                            !isEditable ? 'bg-gray-100' : ''
                          } border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Remarks Card */}
            <div className="bg-white rounded-xl shadow-md shadow-gray-600 border border-gray-700 overflow-hidden">
              <div 
                className="border-b border-gray-200 px-6 pt-4 bg-gradient-to-r from-gray-50 to-white cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleSection('remarks')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-gray-50 p-2 rounded-lg">
                      <FaInfoCircle className="text-gray-600" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">Remarks</h2>
                  </div>
                  {activeSections.remarks ? <FaChevronUp /> : <FaChevronDown />}
                </div>
              </div>
              
              {activeSections.remarks && (
                <div className="p-6 pt-0">
                  <textarea
                    name="remarks"
                    rows="4"
                    value={formData.remarks}
                    onChange={handleInputChange}
                    disabled={!isEditable}
                    placeholder="Any additional notes or comments about this entry..."
                    className={`w-full px-4 py-3 bg-gray-50 border ${
                      !isEditable ? 'bg-gray-100' : ''
                    } border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 resize-none`}
                  />
                </div>
              )}
            </div>

            {/* Audit Trail Card */}
            {originalEntry && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div 
                  className="border-b border-gray-200 px-6 py-4 bg-gradient-to-r from-gray-50 to-white cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleSection('audit')}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-gray-50 p-2 rounded-lg">
                        <FaHistory className="text-gray-600" />
                      </div>
                      <h2 className="text-lg font-semibold text-gray-900">Audit Trail</h2>
                    </div>
                    {activeSections.audit ? <FaChevronUp /> : <FaChevronDown />}
                  </div>
                </div>
                
                {activeSections.audit && (
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-full">
                            <FaUserCheck className="text-blue-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Created By</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {originalEntry.created_by_username || 'N/A'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDateTime(originalEntry.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {originalEntry.updated_by_username && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-100 rounded-full">
                              <FaSave className="text-amber-600" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Last Updated By</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {originalEntry.updated_by_username}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatDateTime(originalEntry.updated_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {originalEntry.verified_by_username && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-full">
                              <MdVerified className="text-green-600" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Verified By</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {originalEntry.verified_by_username}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatDateTime(originalEntry.verified_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
              >
                Cancel
              </button>
              
              {isEditable && (
                <>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-6 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FaSave />
                    {submitting ? 'Saving...' : 'Save Changes'}
                  </button>
                  
                  {formData.entry_status === 'PENDING' && (
                    <button
                      type="button"
                      onClick={handleSubmitForVerification}
                      disabled={submitting}
                      className="inline-flex items-center gap-2 px-6 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all duration-200 disabled:opacity-50"
                    >
                      <FaCheck />
                      Submit for Verification
                    </button>
                  )}
                </>
              )}
              
              {/* Admin actions */}
              {user?.role === 'ADMIN' && formData.entry_status === 'COMPLETED' && (
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-6 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 disabled:opacity-50"
                >
                  <MdVerified />
                  Verify Entry
                </button>
              )}
              
              {isEditable && formData.entry_status !== 'LOCKED' && formData.entry_status !== 'VERIFIED' && user?.role === 'ADMIN' && (
                <button
                  type="button"
                  onClick={handleLock}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-6 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 disabled:opacity-50"
                >
                  <FaLock />
                  Lock Entry
                </button>
              )}
            </div>
          </form>
        </div>
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
    </>
  );
}