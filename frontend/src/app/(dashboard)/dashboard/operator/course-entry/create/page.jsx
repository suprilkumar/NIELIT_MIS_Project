'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Head from 'next/head';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { 
  FaSave, FaTimes, FaBuilding, FaBook, 
  FaMale, FaFemale, FaUsers, FaWheelchair,
  FaTag, FaInfoCircle, FaExclamationTriangle,
  FaArrowLeft, FaCheck, FaLock, FaEye,
  FaChevronDown, FaChevronUp, FaChartLine
} from 'react-icons/fa';
import { MdCategory, MdSchedule, MdNumbers, MdPeople } from 'react-icons/md';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function CreateCourseEntry() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  // Dropdown data from working endpoints
  const [centres, setCentres] = useState([]);
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loadingCentres, setLoadingCentres] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [courseCategories, setCourseCategories] = useState([]);
  
  // Entry data - initialize with empty strings for numbers instead of 0
  const [formData, setFormData] = useState({
    centre: '',
    course: '',
    entry_status: 'PENDING',
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
  
  const [entryStatus, setEntryStatus] = useState(null);
  const [currentMonth, setCurrentMonth] = useState('');
  
  // Validation errors
  const [validationErrors, setValidationErrors] = useState({});

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

  // Load centres from working endpoint
  useEffect(() => {
    if (user) {
      loadCentres();
      loadCourses();
      fetchCourseCategories();
    }
  }, [user]);

  // Filter courses when centre changes
  useEffect(() => {
    if (formData.centre && courses.length > 0) {
      const filtered = courses.filter(course => {
        return course.centre === formData.centre || 
               course.course_centre === formData.centre ||
               course.centre_id === formData.centre ||
               course.course_centre_id === formData.centre;
      });
      console.log('Filtered courses:', filtered);
      setFilteredCourses(filtered);
    } else {
      setFilteredCourses([]);
    }
  }, [formData.centre, courses]);

  // Check status when centre and course are selected
  useEffect(() => {
    if (formData.centre && formData.course) {
      checkCurrentMonthStatus();
    }
  }, [formData.centre, formData.course]);

  const loadCentres = async () => {
    setLoadingCentres(true);
    setError(null);
    try {
      console.log('Loading centres from /api/dashboard/centres/');
      const response = await api.get('/dashboard/centres/');
      console.log('Centres loaded:', response.data);
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
      console.log('Loading courses from /api/dashboard/courses/');
      const response = await api.get('/dashboard/courses/');
      console.log('Courses loaded:', response.data);
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

  const checkCurrentMonthStatus = async () => {
    if (!formData.centre || !formData.course) return;
    
    try {
      console.log('Checking status for centre:', formData.centre, 'course:', formData.course);
      const response = await api.get(
        `/course-entry/entries/current-month-status/?centre=${formData.centre}&course=${formData.course}`
      );
      
      const data = response.data;
      console.log('Status check result:', data);
      setEntryStatus(data);
      
      if (data.exists && data.entry_id) {
        toast.info('An entry already exists for this month. Redirecting to edit...');
        setTimeout(() => {
          router.push(`/dashboard/operator/course-entry/view/${data.entry_id}`);
        }, 2000);
      }
    } catch (err) {
      console.error('Error checking status:', err);
      if (err.response?.status === 401) {
        router.push('/login');
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    
    // Handle different input types
    if (type === 'number') {
      // For number inputs, allow empty string or valid number
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? '' : Number(value)
      }));
    } else {
      // For text inputs and selects
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
    
    // Required fields
    if (!formData.centre) errors.centre = 'Centre is required';
    if (!formData.course) errors.course = 'Course is required';
    
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
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
      
      console.log('Creating new entry with data:', dataToSend);
      const response = await api.post('/course-entry/entries/', dataToSend);
      console.log('Entry created:', response.data);
      toast.success('Entry created successfully');
      
      setTimeout(() => {
        router.push(`/dashboard/operator/course-entry/view`);
      }, 2000);
      
    } catch (err) {
      console.error('Error saving entry:', err);
      if (err.response?.data) {
        const apiErrors = err.response.data;
        if (typeof apiErrors === 'object') {
          setValidationErrors(prev => ({ ...prev, ...apiErrors }));
        }
        toast.error(apiErrors.message || 'Failed to save entry');
      } else {
        toast.error('Failed to save entry. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveAsDraft = async () => {
    if (!formData.centre || !formData.course) {
      toast.error('Centre and Course are required to save');
      return;
    }
    
    setSubmitting(true);
    try {
      const dataToSend = {
        ...formData,
        entry_status: 'PARTIAL',
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
      
      console.log('Saving draft:', dataToSend);
      const response = await api.post('/course-entry/entries/', dataToSend);
      toast.success('Draft saved successfully');
      
      setTimeout(() => {
        router.push(`/dashboard/operator/course-entry/view`);
      }, 2000);
    } catch (err) {
      console.error('Error saving draft:', err);
      toast.error('Failed to save draft');
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

  // Get selected course details
  const selectedCourse = useMemo(() => {
    if (!formData.course) return null;
    return courses.find(c => c.id === formData.course) || null;
  }, [formData.course, courses]);

  // Calculate completion percentage
  const calculateCompletion = () => {
    const totalFields = 32; // Total number of fields (excluding centre, course, remarks, entry_status)
    let filledFields = 0;
    
    Object.entries(formData).forEach(([key, value]) => {
      if (key !== 'centre' && key !== 'course' && key !== 'remarks' && key !== 'entry_status') {
        const numValue = value === '' ? 0 : Number(value);
        if (numValue > 0) filledFields++;
      }
    });
    
    return Math.round((filledFields / totalFields) * 100);
  };


  // Show loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Create Course Entry | Dashboard</title>
      </Head>
      
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 text-black">
        <div className="max-w-7xl mx-auto">
          {/* Header with breadcrumb */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
                Dashboard
              </Link>
              <span>/</span>
              <Link href="/dashboard/operator/course-entry" className="hover:text-blue-600 transition-colors">
                Course Entries
              </Link>
              <span>/</span>
              <span className="text-gray-900 font-medium">Create New</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Create Course Entry</h1>
                <p className="mt-2 text-gray-600">
                  Month: <span className="font-semibold text-blue-600">{currentMonth}</span>
                </p>
              </div>
              <Link
                href="/dashboard/operator/course-entry/view"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-800 hover:text-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
              >
                <FaArrowLeft />
                Back to Entries
              </Link>
            </div>
          </div>

          {/* Progress Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <FaChartLine className="text-blue-600 text-xl" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Form Completion</p>
                  <p className="text-2xl font-bold text-gray-900">{calculateCompletion()}%</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                  entryStatus?.exists 
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-green-50 text-green-700 border border-green-200'
                }`}>
                  {entryStatus?.exists ? 'Entry Exists' : 'No Existing Entry'}
                </span>
              </div>
            </div>
            <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${calculateCompletion()}%` }}
              ></div>
            </div>
          </div>

          {/* Main Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Centre and Course Selection Card */}
            <div className="bg-white rounded-xl shadow-md shadow-gray-600 border border-gray-700 overflow-hidden">
              <div 
                className="border-b border-gray-200 px-6 pt-4 bg-gradient-to-r from-gray-50 to-white cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-50 p-2 rounded-lg">
                      <FaBuilding className="text-blue-600" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">Centre & Course Selection</h2>
                  </div>
                  <div className="flex items-center gap-4">
                    {(validationErrors.centre || validationErrors.course) && (
                      <span className="text-xs text-red-600 flex items-center gap-1">
                        <FaExclamationTriangle /> Required
                      </span>
                    )}
                    {formData.centre && formData.course && !validationErrors.centre && !validationErrors.course && (
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        <FaCheck /> Selected
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Centre Select */}
                    <div>
                      <label className="block text-sm md:font-semibold font-medium text-gray-700 mb-2">
                        Centre <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="centre"
                        value={formData.centre || ''}
                        onChange={handleInputChange}
                        disabled={loadingCentres}
                        className={`w-full px-4 py-2.5 bg-gray-50 border ${
                          validationErrors.centre 
                            ? 'border-red-300 focus:ring-red-500' 
                            : 'border-gray-300 focus:ring-blue-500'
                        } rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent transition duration-200`}
                      >
                        <option value="">Select Centre</option>
                        {centres && centres.length > 0 ? (
                          centres.map(centre => (
                            <option key={centre.id} value={centre.id}>
                              {centre.centre_name || centre.name || 'Unnamed Centre'}
                            </option>
                          ))
                        ) : (
                          <option value="" disabled>No centres available</option>
                        )}
                      </select>
                      {validationErrors.centre && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.centre}</p>
                      )}
                      {loadingCentres && (
                        <p className="text-xs text-gray-500 mt-1">Loading centres...</p>
                      )}
                    </div>

                    {/* Course Select */}
                    <div>
                      <label className="block text-sm font-medium md:font-semibold text-gray-700 mb-2">
                        Course <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="course"
                        value={formData.course || ''}
                        onChange={handleInputChange}
                        disabled={!formData.centre || loadingCourses}
                        className={`w-full px-4 py-2.5 bg-gray-50 border ${
                          validationErrors.course 
                            ? 'border-red-300 focus:ring-red-500' 
                            : 'border-gray-300 focus:ring-blue-500'
                        } rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent transition duration-200`}
                      >
                        <option value="">Select Course</option>
                        {filteredCourses && filteredCourses.length > 0 ? (
                          filteredCourses.map(course => (
                            <option key={course.id} value={course.id}>
                              {course.course_name || 'Unnamed Course'} 
                              {course.course_category_name && ` (${course.course_category_name})`}
                            </option>
                          ))
                        ) : (
                          formData.centre && <option value="" disabled>No courses available for this centre</option>
                        )}
                      </select>
                      {validationErrors.course && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.course}</p>
                      )}
                      {loadingCourses && (
                        <p className="text-xs text-gray-500 mt-1">Loading courses...</p>
                      )}
                    </div>
                  </div>

                  {/* Selected Course Details */}
                  {selectedCourse && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-start gap-3">
                        <FaInfoCircle className="text-blue-600 mt-1" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-800 mb-2">Selected Course Details</p>
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
                      <span className="text-xs text-red-600">Validation Error</span>
                    )}
                  </div>
                </div>
              </div>
              
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium md:font-semibold text-gray-700 mb-2">
                        Total Enrolled
                      </label>
                      <input
                        type="number"
                        name="total_enrolled"
                        min="0"
                        value={formData.total_enrolled}
                        onChange={handleInputChange}
                        placeholder="Enter number"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium md:font-semibold text-gray-700 mb-2">
                        Total Trained
                      </label>
                      <input
                        type="number"
                        name="total_trained"
                        min="0"
                        value={formData.total_trained}
                        onChange={handleInputChange}
                        placeholder="Enter number"
                        className={`w-full px-4 py-2.5 bg-gray-50 border ${
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
                      <label className="block text-sm font-medium md:font-semibold text-gray-700 mb-2">
                        Total Certified
                      </label>
                      <input
                        type="number"
                        name="total_certified"
                        min="0"
                        value={formData.total_certified}
                        onChange={handleInputChange}
                        placeholder="Enter number"
                        className={`w-full px-4 py-2.5 bg-gray-50 border ${
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
                      <label className="block text-sm font-medium md:font-semibold text-gray-700 mb-2">
                        Total Placed
                      </label>
                      <input
                        type="number"
                        name="total_placed"
                        min="0"
                        value={formData.total_placed}
                        onChange={handleInputChange}
                        placeholder="Enter number"
                        className={`w-full px-4 py-2.5 bg-gray-50 border ${
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
            </div>

            {/* Gender Breakdown Card */}
            <div className="bg-white rounded-xl shadow-md shadow-gray-600 border border-gray-700 overflow-hidden">
              <div 
                className="border-b border-gray-200 px-6 pt-4 bg-gradient-to-r from-gray-50 to-white cursor-pointer hover:bg-gray-50 transition-colors"
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
                      <span className="text-xs text-red-600 flex items-center gap-1">
                        <FaExclamationTriangle /> Error
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
                <div className="p-6 pt-0">
                  {validationErrors.gender && (
                    <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-sm text-red-600">{validationErrors.gender}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Male */}
                    <div className="bg-gray-50 rounded-lg p-5">
                      <h3 className="text-sm font-semibold text-blue-600 mb-4 flex items-center gap-2">
                        <FaMale /> Male
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 mb-1">Enrolled</label>
                          <input
                            type="number"
                            name="male_enrolled"
                            min="0"
                            value={formData.male_enrolled}
                            onChange={handleInputChange}
                            placeholder="Enter number"
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 mb-1">Trained</label>
                          <input
                            type="number"
                            name="male_trained"
                            min="0"
                            value={formData.male_trained}
                            onChange={handleInputChange}
                            placeholder="Enter number"
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 mb-1">Certified</label>
                          <input
                            type="number"
                            name="male_certified"
                            min="0"
                            value={formData.male_certified}
                            onChange={handleInputChange}
                            placeholder="Enter number"
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 mb-1">Placed</label>
                          <input
                            type="number"
                            name="male_placed"
                            min="0"
                            value={formData.male_placed}
                            onChange={handleInputChange}
                            placeholder="Enter number"
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                          <label className="block text-xs font-semibold text-gray-500 mb-1">Enrolled</label>
                          <input
                            type="number"
                            name="female_enrolled"
                            min="0"
                            value={formData.female_enrolled}
                            onChange={handleInputChange}
                            placeholder="Enter number"
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 mb-1">Trained</label>
                          <input
                            type="number"
                            name="female_trained"
                            min="0"
                            value={formData.female_trained}
                            onChange={handleInputChange}
                            placeholder="Enter number"
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 mb-1">Certified</label>
                          <input
                            type="number"
                            name="female_certified"
                            min="0"
                            value={formData.female_certified}
                            onChange={handleInputChange}
                            placeholder="Enter number"
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 mb-1">Placed</label>
                          <input
                            type="number"
                            name="female_placed"
                            min="0"
                            value={formData.female_placed}
                            onChange={handleInputChange}
                            placeholder="Enter number"
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

            </div>

            {/* Category Breakdown Card */}
            <div className="bg-white rounded-xl shadow-md shadow-gray-600 border border-gray-700 overflow-hidden">
              <div 
                className="border-b border-gray-200 px-6 pt-4 bg-gradient-to-r from-gray-50 to-white cursor-pointer hover:bg-gray-50 transition-colors"
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
                      <span className="text-xs text-red-600 flex items-center gap-1">
                        <FaExclamationTriangle /> Error
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
                <div className="p-6">
                  {validationErrors.category && (
                    <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-sm text-red-600">{validationErrors.category}</p>
                    </div>
                  )}
                  
                  {/* SC */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-purple-600 mb-3">SC</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Enrolled</label>
                        <input
                          type="number"
                          name="sc_enrolled"
                          min="0"
                          value={formData.sc_enrolled}
                          onChange={handleInputChange}
                          placeholder="Enter number"
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Trained</label>
                        <input
                          type="number"
                          name="sc_trained"
                          min="0"
                          value={formData.sc_trained}
                          onChange={handleInputChange}
                          placeholder="Enter number"
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Certified</label>
                        <input
                          type="number"
                          name="sc_certified"
                          min="0"
                          value={formData.sc_certified}
                          onChange={handleInputChange}
                          placeholder="Enter number"
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Placed</label>
                        <input
                          type="number"
                          name="sc_placed"
                          min="0"
                          value={formData.sc_placed}
                          onChange={handleInputChange}
                          placeholder="Enter number"
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* ST */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-indigo-600 mb-3">ST</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Enrolled</label>
                        <input
                          type="number"
                          name="st_enrolled"
                          min="0"
                          value={formData.st_enrolled}
                          onChange={handleInputChange}
                          placeholder="Enter number"
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Trained</label>
                        <input
                          type="number"
                          name="st_trained"
                          min="0"
                          value={formData.st_trained}
                          onChange={handleInputChange}
                          placeholder="Enter number"
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Certified</label>
                        <input
                          type="number"
                          name="st_certified"
                          min="0"
                          value={formData.st_certified}
                          onChange={handleInputChange}
                          placeholder="Enter number"
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Placed</label>
                        <input
                          type="number"
                          name="st_placed"
                          min="0"
                          value={formData.st_placed}
                          onChange={handleInputChange}
                          placeholder="Enter number"
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* OBC */}
                  <div>
                    <h3 className="text-sm font-semibold text-orange-600 mb-3">OBC</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Enrolled</label>
                        <input
                          type="number"
                          name="obc_enrolled"
                          min="0"
                          value={formData.obc_enrolled}
                          onChange={handleInputChange}
                          placeholder="Enter number"
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Trained</label>
                        <input
                          type="number"
                          name="obc_trained"
                          min="0"
                          value={formData.obc_trained}
                          onChange={handleInputChange}
                          placeholder="Enter number"
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Certified</label>
                        <input
                          type="number"
                          name="obc_certified"
                          min="0"
                          value={formData.obc_certified}
                          onChange={handleInputChange}
                          placeholder="Enter number"
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Placed</label>
                        <input
                          type="number"
                          name="obc_placed"
                          min="0"
                          value={formData.obc_placed}
                          onChange={handleInputChange}
                          placeholder="Enter number"
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>
            </div>

            {/* PWD Card */}
            <div className="bg-white rounded-xl shadow-md shadow-gray-600 border border-gray-700 overflow-hidden">
              <div 
                className="border-b border-gray-200 px-6 pt-4 bg-gradient-to-r from-gray-50 to-white cursor-pointer hover:bg-gray-50 transition-colors"
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
                      <span className="text-xs text-red-600 flex items-center gap-1">
                        <FaExclamationTriangle /> Error
                      </span>
                    )}
                  </div>
                </div>
              </div>
              

                <div className="p-6 pt-0">
                  <div className="bg-gray-50 rounded-lg p-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm md:font-semibold font-medium text-gray-700 mb-2">Enrolled</label>
                        <input
                          type="number"
                          name="pwd_enrolled"
                          min="0"
                          value={formData.pwd_enrolled}
                          onChange={handleInputChange}
                          placeholder="Enter number"
                          className={`w-full px-4 py-2.5 bg-white border ${
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
                        <label className="block text-sm md:font-semibold font-medium text-gray-700 mb-2">Trained</label>
                        <input
                          type="number"
                          name="pwd_trained"
                          min="0"
                          value={formData.pwd_trained}
                          onChange={handleInputChange}
                          placeholder="Enter number"
                          className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm md:font-semibold font-medium text-gray-700 mb-2">Certified</label>
                        <input
                          type="number"
                          name="pwd_certified"
                          min="0"
                          value={formData.pwd_certified}
                          onChange={handleInputChange}
                          placeholder="Enter number"
                          className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm md:font-semibold font-medium text-gray-700 mb-2">Placed</label>
                        <input
                          type="number"
                          name="pwd_placed"
                          min="0"
                          value={formData.pwd_placed}
                          onChange={handleInputChange}
                          placeholder="Enter number"
                          className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>
            </div>

            {/* Remarks Card */}
            <div className="bg-white rounded-xl shadow-md shadow-gray-600 border border-gray-700 overflow-hidden">
              <div 
                className="border-b border-gray-200 px-6 pt-4 bg-gradient-to-r from-gray-50 to-white cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-gray-50 p-2 rounded-lg">
                      <FaInfoCircle className="text-gray-600" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">Remarks</h2>
                  </div>
                </div>
              </div>
              
                <div className="p-6 pt-0" >
                  <textarea
                    name="remarks"
                    rows="3"
                    value={formData.remarks}
                    onChange={handleInputChange}
                    placeholder="Any additional notes or comments about this entry..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 resize-none"
                  />
                </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
              >
                Cancel
              </button>
              
              <button
                type="button"
                onClick={handleSaveAsDraft}
                disabled={submitting || entryStatus?.exists}
                className="inline-flex items-center gap-2 px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaSave />
                {submitting ? 'Saving...' : 'Save as Draft'}
              </button>
              
              <button
                type="submit"
                disabled={submitting || entryStatus?.exists}
                className="inline-flex items-center gap-2 px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaCheck />
                {submitting ? 'Creating...' : 'Create Entry'}
              </button>
            </div>
          </form>

          {/* Entry exists warning */}
          {entryStatus?.exists && (
            <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-center gap-3">
                <FaExclamationTriangle className="text-amber-600 text-lg" />
                <div>
                  <h3 className="text-sm font-medium text-amber-800">Entry Already Exists</h3>
                  <p className="text-sm text-amber-700 mt-1">
                    An entry already exists for this centre and course for the current month. 
                    Redirecting to edit page...
                  </p>
                </div>
              </div>
            </div>
          )}
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