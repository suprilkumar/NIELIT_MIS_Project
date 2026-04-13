'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast, ToastContainer } from 'react-toastify';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import Link from 'next/link';
import { 
  FaArrowLeft, FaSave, FaBook, FaBuilding, 
  FaLayerGroup, FaClock, FaTag, FaCalendarAlt,
  FaAlignLeft, FaInfoCircle, FaCheckCircle,
  FaExclamationTriangle, FaChevronDown, FaChevronUp
} from 'react-icons/fa';
import { MdCategory, MdSchedule } from 'react-icons/md';
import 'react-toastify/dist/ReactToastify.css';

export default function EditCourseDetailPage() {
    const router = useRouter();
    const params = useParams();
    const { user } = useAuth();
    const courseId = params.id;

    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [courseCategories, setCourseCategories] = useState([]);
    const [centres, setCentres] = useState([]);
    const [originalData, setOriginalData] = useState(null);
    const [activeSections, setActiveSections] = useState({
        basic: true,
        details: true,
        schedule: true,
        description: true
    });

    const [formData, setFormData] = useState({
        course_name: "",
        course_category: "",
        course_centre: "",
        course_desc: "",
        course_mode: "",
        course_duration: "",
        course_scheme: "",
        course_status: "",
        course_start_date: "",
        course_end_date: "",
    });

    // Toggle section
    const toggleSection = (section) => {
        setActiveSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    // Get status badge color
    const getStatusBadgeClass = (status) => {
        switch(status) {
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

    // Fetch course details, categories, and centres
    useEffect(() => {
        if (user && courseId) {
            const fetchData = async () => {
                setLoading(true);
                try {
                    // Fetch all data in parallel
                    const [courseResponse, categoriesResponse, centresResponse] = await Promise.all([
                        api.get(`/dashboard/course/manage/${courseId}/`),
                        api.get('/dashboard/course-categories/'),
                        api.get('/dashboard/centres/')
                    ]);

                    // Set course categories and centres
                    setCourseCategories(categoriesResponse.data);
                    setCentres(centresResponse.data);

                    // Set course data
                    const courseData = courseResponse.data;
                    setOriginalData(courseData);
                    
                    // Format dates for input fields (YYYY-MM-DD)
                    const formatDateForInput = (dateString) => {
                        if (!dateString) return '';
                        const date = new Date(dateString);
                        return date.toISOString().split('T')[0];
                    };

                    setFormData({
                        course_name: courseData.course_name || "",
                        course_category: courseData.course_category || "",
                        course_centre: courseData.course_centre || "",
                        course_desc: courseData.course_desc || "",
                        course_mode: courseData.course_mode || "",
                        course_duration: courseData.course_duration || "",
                        course_scheme: courseData.course_scheme || "",
                        course_status: courseData.course_status || "",
                        course_start_date: formatDateForInput(courseData.course_start_date),
                        course_end_date: formatDateForInput(courseData.course_end_date),
                    });

                } catch (err) {
                    console.error('Error fetching data:', err);
                    setFetchError('Failed to load course details');
                    toast.error('Failed to load course details');
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        }
    }, [user, courseId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        const toastId = toast.loading("Updating course details...");

        try {
            console.log("Submitting form data:", formData);

            const formDataToSend = new FormData();
            Object.keys(formData).forEach(key => {
                if (formData[key] !== null && formData[key] !== undefined && formData[key] !== '') {
                    formDataToSend.append(key, formData[key]);
                }
            });

            console.log("FormData entries:");
            for (let pair of formDataToSend.entries()) {
                console.log(pair[0] + ': ' + pair[1]);
            }

            const response = await api.put(`/dashboard/course/manage/${courseId}/`, formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.status === 200) {
                toast.update(toastId, {
                    render: response.data.message || "Course details updated successfully!",
                    type: "success",
                    isLoading: false,
                    autoClose: 3000
                });

                setTimeout(() => {
                    router.push('/dashboard/operator/course');
                }, 2000);
            }
        } catch (error) {
            console.error("Error updating course:", error);
            console.error("Error response:", error.response?.data);

            let errorMessage = "Error connecting to server";

            if (error.response) {
                if (error.response.status === 401) {
                    errorMessage = "Unauthorized access. Please login again.";
                } else if (error.response.status === 403) {
                    errorMessage = "You don't have permission to perform this action.";
                } else if (error.response.status === 404) {
                    errorMessage = "Course not found.";
                } else if (error.response.status === 400 && error.response.data) {
                    if (typeof error.response.data === 'object') {
                        const fieldErrors = Object.entries(error.response.data)
                            .map(([field, errors]) => {
                                if (field === 'course_category' || field === 'course_centre') {
                                    return `${field}: Invalid ID selected`;
                                }
                                return `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`;
                            })
                            .join(', ');
                        errorMessage = fieldErrors || error.response.data.message || errorMessage;
                    } else {
                        errorMessage = error.response.data.message || errorMessage;
                    }
                }
            }

            toast.update(toastId, {
                render: errorMessage,
                type: "error",
                isLoading: false,
                autoClose: 4000
            });
        } finally {
            setSubmitting(false);
        }
    };

    // Check if form data has changed
    const hasChanges = () => {
        if (!originalData) return false;
        
        const formatDateForComparison = (dateString) => {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toISOString().split('T')[0];
        };

        return (
            formData.course_name !== (originalData.course_name || "") ||
            formData.course_category !== (originalData.course_category || "") ||
            formData.course_centre !== (originalData.course_centre || "") ||
            formData.course_desc !== (originalData.course_desc || "") ||
            formData.course_mode !== (originalData.course_mode || "") ||
            formData.course_duration !== (originalData.course_duration || "") ||
            formData.course_scheme !== (originalData.course_scheme || "") ||
            formData.course_status !== (originalData.course_status || "") ||
            formData.course_start_date !== formatDateForComparison(originalData.course_start_date) ||
            formData.course_end_date !== formatDateForComparison(originalData.course_end_date)
        );
    };

    // Skeleton Loader
    const SkeletonLoader = () => (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header Skeleton */}
                <div className="mb-8">
                    <div className="h-8 w-64 bg-gray-200 rounded-lg animate-pulse mb-2"></div>
                    <div className="h-4 w-96 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>

                {/* Form Cards Skeleton */}
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
                        <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
                            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[...Array(2)].map((_, j) => (
                                    <div key={j}>
                                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
                                        <div className="h-10 w-full bg-gray-100 rounded-lg animate-pulse"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    if (loading) {
        return <SkeletonLoader />;
    }

    if (fetchError) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                        <FaExclamationTriangle className="text-red-600 text-2xl" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Course</h2>
                    <p className="text-gray-600 mb-6">{fetchError}</p>
                    <Link
                        href="/dashboard/operator/course"
                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors"
                    >
                        <FaArrowLeft /> Back to Courses
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    {/* Header with breadcrumb */}
                    <div className="mb-8">
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                            <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
                                Dashboard
                            </Link>
                            <span>/</span>
                            <Link href="/dashboard/operator/course" className="hover:text-blue-600 transition-colors">
                                Courses
                            </Link>
                            <span>/</span>
                            <span className="text-gray-900 font-medium">Edit Course</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Edit Course Details</h1>
                                <p className="mt-2 text-gray-600">
                                    Update the information for <span className="font-semibold text-blue-600">{formData.course_name}</span>
                                </p>
                            </div>
                            
                            {/* Status Badge */}
                            {formData.course_status && (
                                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${getStatusBadgeClass(formData.course_status)}`}>
                                    {formData.course_status}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Main Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Information Card */}
                        <div className="bg-white rounded-xl shadow-md shadow-gray-600 border border-gray-700 overflow-hidden">
                            <div 
                                className="border-b border-gray-200 px-6 pt-4 bg-gradient-to-r from-gray-50 to-white cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() => toggleSection('basic')}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-blue-50 p-2 rounded-lg">
                                            <FaBook className="text-blue-600" />
                                        </div>
                                        <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
                                    </div>
                                    {activeSections.basic ? <FaChevronUp className="text-gray-400" /> : <FaChevronDown className="text-gray-400" />}
                                </div>
                            </div>
                            
                            {activeSections.basic && (
                                <div className="p-6">
                                    {/* Course Name */}
                                    <div className="mb-6">
                                        <label htmlFor="course_name" className="block text-sm font-medium text-gray-700 mb-2">
                                            Course Name <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative rounded-lg shadow-sm">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <FaBook className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="text"
                                                id="course_name"
                                                name="course_name"
                                                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-900 placeholder-gray-400"
                                                value={formData.course_name}
                                                onChange={handleChange}
                                                placeholder="e.g., Advanced Python Programming"
                                                required
                                                disabled={submitting}
                                            />
                                        </div>
                                    </div>

                                    {/* Course Category and Centre */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label htmlFor="course_category" className="block text-sm font-medium text-gray-700 mb-2">
                                                Course Category <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative rounded-lg shadow-sm">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <MdCategory className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <select
                                                    name="course_category"
                                                    id="course_category"
                                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-900 bg-white appearance-none"
                                                    onChange={handleChange}
                                                    value={formData.course_category}
                                                    disabled={submitting}
                                                    required
                                                >
                                                    <option value="">Select Category</option>
                                                    {courseCategories.map((category) => (
                                                        <option key={category.id} value={category.id}>
                                                            {category.course_category_name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label htmlFor="course_centre" className="block text-sm font-medium text-gray-700 mb-2">
                                                Offering Centre <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative rounded-lg shadow-sm">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <FaBuilding className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <select
                                                    name="course_centre"
                                                    id="course_centre"
                                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-900 bg-white appearance-none"
                                                    onChange={handleChange}
                                                    value={formData.course_centre}
                                                    disabled={submitting}
                                                    required
                                                >
                                                    <option value="">Select Centre</option>
                                                    {centres.map((centre) => (
                                                        <option key={centre.id} value={centre.id}>
                                                            {centre.centre_name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Course Details Card */}
                        <div className="bg-white rounded-xl shadow-md shadow-gray-600 border border-gray-700 overflow-hidden">
                            <div 
                                className="border-b border-gray-200 px-6 pt-4 bg-gradient-to-r from-gray-50 to-white cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() => toggleSection('details')}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-purple-50 p-2 rounded-lg">
                                            <FaLayerGroup className="text-purple-600" />
                                        </div>
                                        <h2 className="text-lg font-semibold text-gray-900">Course Details</h2>
                                    </div>
                                    {activeSections.details ? <FaChevronUp className="text-gray-400" /> : <FaChevronDown className="text-gray-400" />}
                                </div>
                            </div>
                            
                            {activeSections.details && (
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Course Mode */}
                                        <div>
                                            <label htmlFor="course_mode" className="block text-sm font-medium text-gray-700 mb-2">
                                                Course Mode <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative rounded-lg shadow-sm">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <FaLayerGroup className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <select
                                                    name="course_mode"
                                                    id="course_mode"
                                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-900 bg-white appearance-none"
                                                    onChange={handleChange}
                                                    value={formData.course_mode}
                                                    disabled={submitting}
                                                    required
                                                >
                                                    <option value="">Select Mode</option>
                                                    <option value="Online">Online</option>
                                                    <option value="Offline">Offline</option>
                                                    <option value="Hybrid">Hybrid</option>
                                                    <option value="OnCampus">On Campus</option>
                                                    <option value="OffCampus">Off Campus</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </div>
                                            </div>
                                            {formData.course_mode && (
                                                <div className="mt-2">
                                                    <span className={`inline-block text-xs px-3 py-1.5 rounded-full font-medium ${getModeBadgeClass(formData.course_mode)}`}>
                                                        {formData.course_mode}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Course Duration */}
                                        <div>
                                            <label htmlFor="course_duration" className="block text-sm font-medium text-gray-700 mb-2">
                                                Duration (Hours) <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative rounded-lg shadow-sm">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <FaClock className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input
                                                    type="number"
                                                    id="course_duration"
                                                    name="course_duration"
                                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-900 placeholder-gray-400"
                                                    value={formData.course_duration}
                                                    onChange={handleChange}
                                                    placeholder="e.g., 40"
                                                    min="1"
                                                    required
                                                    disabled={submitting}
                                                />
                                            </div>
                                        </div>

                                        {/* Course Scheme */}
                                        <div>
                                            <label htmlFor="course_scheme" className="block text-sm font-medium text-gray-700 mb-2">
                                                Course Scheme
                                            </label>
                                            <div className="relative rounded-lg shadow-sm">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <FaTag className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input
                                                    type="text"
                                                    id="course_scheme"
                                                    name="course_scheme"
                                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-900 placeholder-gray-400"
                                                    value={formData.course_scheme}
                                                    onChange={handleChange}
                                                    placeholder="e.g., Semester, Trimester, etc."
                                                    disabled={submitting}
                                                />
                                            </div>
                                        </div>

                                        {/* Course Status */}
                                        <div>
                                            <label htmlFor="course_status" className="block text-sm font-medium text-gray-700 mb-2">
                                                Course Status <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative rounded-lg shadow-sm">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <FaInfoCircle className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <select
                                                    name="course_status"
                                                    id="course_status"
                                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-900 bg-white appearance-none"
                                                    onChange={handleChange}
                                                    value={formData.course_status}
                                                    disabled={submitting}
                                                    required
                                                >
                                                    <option value="">Select Status</option>
                                                    <option value="ACTIVE">Active</option>
                                                    <option value="UPCOMING">Upcoming</option>
                                                    <option value="COMPLETED">Completed</option>
                                                    <option value="HOLD">On Hold</option>
                                                    <option value="CANCELLED">Cancelled</option>
                                                    <option value="INACTIVE">Inactive</option>
                                                </select>
                                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Schedule Card */}
                        <div className="bg-white rounded-xl shadow-md shadow-gray-600 border border-gray-700 overflow-hidden">
                            <div 
                                className="border-b border-gray-200 px-6 pt-4 bg-gradient-to-r from-gray-50 to-white cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() => toggleSection('schedule')}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-amber-50 p-2 rounded-lg">
                                            <FaCalendarAlt className="text-amber-600" />
                                        </div>
                                        <h2 className="text-lg font-semibold text-gray-900">Schedule</h2>
                                    </div>
                                    {activeSections.schedule ? <FaChevronUp className="text-gray-400" /> : <FaChevronDown className="text-gray-400" />}
                                </div>
                            </div>
                            
                            {activeSections.schedule && (
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Start Date */}
                                        <div>
                                            <label htmlFor="course_start_date" className="block text-sm font-medium text-gray-700 mb-2">
                                                Start Date
                                            </label>
                                            <div className="relative rounded-lg shadow-sm">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <FaCalendarAlt className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input
                                                    type="date"
                                                    id="course_start_date"
                                                    name="course_start_date"
                                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-900"
                                                    value={formData.course_start_date}
                                                    onChange={handleChange}
                                                    disabled={submitting}
                                                />
                                            </div>
                                        </div>

                                        {/* End Date */}
                                        <div>
                                            <label htmlFor="course_end_date" className="block text-sm font-medium text-gray-700 mb-2">
                                                End Date
                                            </label>
                                            <div className="relative rounded-lg shadow-sm">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <MdSchedule className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input
                                                    type="date"
                                                    id="course_end_date"
                                                    name="course_end_date"
                                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-900"
                                                    value={formData.course_end_date}
                                                    onChange={handleChange}
                                                    disabled={submitting}
                                                    min={formData.course_start_date}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Date Validation Message */}
                                    {formData.course_start_date && formData.course_end_date && 
                                     new Date(formData.course_end_date) < new Date(formData.course_start_date) && (
                                        <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-center gap-2">
                                            <FaExclamationTriangle className="text-amber-600" />
                                            <p className="text-sm text-amber-700">
                                                End date cannot be before start date
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Description Card */}
                        <div className="bg-white rounded-xl shadow-md shadow-gray-600 border border-gray-700 overflow-hidden">
                            <div 
                                className="border-b border-gray-200 px-6 pt-4 bg-gradient-to-r from-gray-50 to-white cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() => toggleSection('description')}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-gray-50 p-2 rounded-lg">
                                            <FaAlignLeft className="text-gray-600" />
                                        </div>
                                        <h2 className="text-lg font-semibold text-gray-900">Description</h2>
                                    </div>
                                    {activeSections.description ? <FaChevronUp className="text-gray-400" /> : <FaChevronDown className="text-gray-400" />}
                                </div>
                            </div>
                            
                            {activeSections.description && (
                                <div className="p-6">
                                    <label htmlFor="course_desc" className="block text-sm font-medium text-gray-700 mb-2">
                                        Course Description <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative rounded-lg shadow-sm">
                                        <div className="absolute top-3 left-3 pointer-events-none">
                                            <FaAlignLeft className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <textarea
                                            name="course_desc"
                                            id="course_desc"
                                            rows="3"
                                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-900 placeholder-gray-400 resize-none"
                                            onChange={handleChange}
                                            value={formData.course_desc}
                                            placeholder="Provide a detailed description of the course including learning objectives, prerequisites, target audience, etc."
                                            disabled={submitting}
                                        />
                                    </div>
                                    {formData.course_desc && (
                                        <p className="text-xs text-gray-500 text-right mt-2">
                                            {formData.course_desc.length} characters
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Preview Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                <FaCheckCircle className="text-green-500" />
                                Course Preview
                            </h3>
                            <div className="flex items-start gap-4">
                                <div className="bg-blue-100 p-3 rounded-lg">
                                    <FaBook className="text-blue-600 text-xl" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-lg font-semibold text-gray-900">{formData.course_name || 'Course Name'}</h4>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {formData.course_mode && (
                                            <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${getModeBadgeClass(formData.course_mode)}`}>
                                                {formData.course_mode}
                                            </span>
                                        )}
                                        {formData.course_status && (
                                            <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${getStatusBadgeClass(formData.course_status)}`}>
                                                {formData.course_status}
                                            </span>
                                        )}
                                        {formData.course_duration && (
                                            <span className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full border border-gray-200">
                                                {formData.course_duration} hours
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="flex gap-4 pt-4">
                            <button
                                type="submit"
                                disabled={submitting || !hasChanges()}
                                className={`flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 
                                    ${(submitting || !hasChanges()) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {submitting ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <FaSave />
                                        Update Course
                                    </>
                                )}
                            </button>
                            
                            <Link
                                href="/dashboard/operator/course"
                                className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                            >
                                Cancel
                            </Link>
                        </div>
                    </form>

                    {/* Help Card */}
                    <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <div className="flex items-start gap-3">
                            <FaInfoCircle className="text-blue-600 w-5 h-5 mt-0.5" />
                            <div>
                                <h3 className="text-sm font-semibold text-blue-800 mb-1">Editing Tips</h3>
                                <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                                    <li>Fields marked with <span className="text-red-500">*</span> are mandatory</li>
                                    <li>Course duration should be specified in hours</li>
                                    <li>Status changes will affect course visibility</li>
                                    <li>End date must be after start date if both are provided</li>
                                </ul>
                            </div>
                        </div>
                    </div>
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