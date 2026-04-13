"use client"

import { useState, useEffect } from "react"
import { toast, ToastContainer } from "react-toastify";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import Link from "next/link";
import { 
  FaBook, FaLayerGroup, FaBuilding, FaAlignLeft, 
  FaClock, FaTag, FaCalendarAlt, FaPlus, FaChevronRight,
  FaInfoCircle, FaCheckCircle, FaExclamationCircle
} from 'react-icons/fa';
import { MdCategory, MdSchedule } from 'react-icons/md';
import "react-toastify/dist/ReactToastify.css";

export default function AddCourseDetailPage() {
    const { user } = useAuth();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [courseCategories, setCourseCategories] = useState([]);
    const [centres, setCentres] = useState([]);
    const [activeTab, setActiveTab] = useState('basic'); // 'basic' or 'schedule'

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

    // Fetch course categories
    const fetchCourseCategories = async () => {
        try {
            const response = await api.get("/dashboard/course-categories/");
            setCourseCategories(response.data);
        } catch (err) {
            console.error('Error fetching course categories:', err);
            toast.error('Failed to load course categories');
        }
    };

    // Fetch centres
    const fetchCentres = async () => {
        try {
            const response = await api.get("/dashboard/centres/");
            setCentres(response.data);
        } catch (err) {
            console.error('Error fetching centres:', err);
            toast.error('Failed to load centres');
        }
    };

    useEffect(() => {
        if (user) {
            const fetchData = async () => {
                setLoading(true);
                await Promise.all([
                    fetchCourseCategories(),
                    fetchCentres()
                ]);
                setLoading(false);
            };
            fetchData();
        }
    }, [user]);

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

        const toastId = toast.loading("Adding course...");

        try {
            console.log("Submitting form data:", formData);

            const formDataToSend = new FormData();
            Object.keys(formData).forEach(key => {
                if (formData[key]) {
                    formDataToSend.append(key, formData[key]);
                }
            });

            console.log("FormData entries:");
            for (let pair of formDataToSend.entries()) {
                console.log(pair[0] + ': ' + pair[1]);
            }

            const response = await api.post("/dashboard/course/add/", formDataToSend,{
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.status === 201 || response.status === 200) {
                toast.update(toastId, {
                    render: response.data.message || "Course added successfully!",
                    type: "success",
                    isLoading: false,
                    autoClose: 3000
                });

                setFormData({
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
            }
        } catch (error) {
            console.error("Error adding course:", error);
            console.error("Error response:", error.response?.data);

            let errorMessage = "Error connecting to server";

            if (error.response) {
                if (error.response.status === 401) {
                    errorMessage = "Unauthorized access. Please login again.";
                } else if (error.response.status === 403) {
                    errorMessage = "You don't have permission to perform this action.";
                } else if (error.response.status === 415) {
                    errorMessage = "Unsupported media type. Please try again.";
                } else if (error.response.data) {
                    if (typeof error.response.data === 'object') {
                        const fieldErrors = Object.entries(error.response.data)
                            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
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

    // Get mode badge color for preview
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

    // Get status badge color for preview
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

    // Skeleton Loader Component - Add this before the return statement (around line 360)
const SkeletonLoader = () => (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
            {/* Header Skeleton */}
            <div className="mb-8">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                    <div className="h-4 w-16 bg-gray-400 rounded animate-pulse"></div>
                    <span>/</span>
                    <div className="h-4 w-16 bg-gray-400 rounded animate-pulse"></div>
                    <span>/</span>
                    <div className="h-4 w-20 bg-gray-400 rounded animate-pulse"></div>
                </div>
                
                <div className="flex items-center justify-between">
                    <div>
                        <div className="h-8 w-64 bg-gray-400 rounded-lg animate-pulse mb-2"></div>
                        <div className="h-4 w-96 bg-gray-400 rounded-lg animate-pulse"></div>
                    </div>
                    <div className="h-8 w-24 bg-gray-400 rounded-full animate-pulse"></div>
                </div>
            </div>

            {/* Form Cards Skeleton */}
            {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-md border border-gray-400 mb-6 overflow-hidden">
                    {/* Card Header Skeleton */}
                    <div className="border-b border-gray-400 px-6 py-4 bg-gray-400">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-400 rounded-lg animate-pulse"></div>
                                <div className="h-6 w-40 bg-gray-400 rounded animate-pulse"></div>
                            </div>
                            <div className="w-5 h-5 bg-gray-400 rounded animate-pulse"></div>
                        </div>
                    </div>
                    
                    {/* Card Body Skeleton */}
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[...Array(2)].map((_, j) => (
                                <div key={j}>
                                    <div className="h-4 w-24 bg-gray-400 rounded animate-pulse mb-2"></div>
                                    <div className="h-12 w-full bg-gray-400 rounded-lg animate-pulse"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ))}

            {/* Preview Card Skeleton */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-400 p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-5 h-5 bg-gray-400 rounded-full animate-pulse"></div>
                    <div className="h-5 w-32 bg-gray-400 rounded animate-pulse"></div>
                </div>
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gray-400 rounded-lg animate-pulse"></div>
                    <div className="flex-1">
                        <div className="h-6 w-48 bg-gray-400 rounded animate-pulse mb-2"></div>
                        <div className="flex gap-2">
                            <div className="h-6 w-16 bg-gray-400 rounded-full animate-pulse"></div>
                            <div className="h-6 w-16 bg-gray-400 rounded-full animate-pulse"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Form Actions Skeleton */}
            <div className="flex gap-4 pt-4">
                <div className="flex-1 h-12 bg-gray-400 rounded-lg animate-pulse"></div>
                <div className="w-24 h-12 bg-gray-400 rounded-lg animate-pulse"></div>
            </div>

            {/* Help Card Skeleton */}
            <div className="mt-6 bg-gray-100 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-gray-400 rounded-full animate-pulse"></div>
                    <div className="flex-1">
                        <div className="h-5 w-24 bg-gray-400 rounded animate-pulse mb-2"></div>
                        <div className="space-y-2">
                            <div className="h-4 w-full bg-gray-400 rounded animate-pulse"></div>
                            <div className="h-4 w-3/4 bg-gray-400 rounded animate-pulse"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);


    if (loading) {
        return <SkeletonLoader/>
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header with Breadcrumb */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
                            Dashboard
                        </Link>
                        <FaChevronRight className="text-xs" />
                        <Link href="/dashboard/operator/course" className="hover:text-blue-600 transition-colors">
                            Courses
                        </Link>
                        <FaChevronRight className="text-xs" />
                        <span className="text-gray-900 font-medium">Add New Course</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Add New Course</h1>
                            <p className="mt-2 text-gray-600">Create a new course with detailed information</p>
                        </div>
                        <Link
                            href="/dashboard/operator/course"
                            className="inline-flex items-center px-6 py-3 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                        >
                            <FaBook className="mr-2" />
                            View All Courses
                        </Link>
                    </div>
                </div>

                {/* Main Form Card */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    {/* Form Header with Tabs */}
                    <div className="border-b border-gray-200">
                        <div className="flex">
                            <button
                                onClick={() => setActiveTab('basic')}
                                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                                    activeTab === 'basic'
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Basic Information
                            </button>
                            <button
                                onClick={() => setActiveTab('schedule')}
                                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                                    activeTab === 'schedule'
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Schedule & Status
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="p-6">
                            {activeTab === 'basic' ? (
                                <div className="space-y-6">
                                    {/* Course Name */}
                                    <div className="space-y-2">
                                        <label htmlFor="course_name" className="block text-sm font-semibold text-gray-700">
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
                                        <div className="space-y-2">
                                            <label htmlFor="course_category" className="block text-sm font-semibold text-gray-700">
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

                                        <div className="space-y-2">
                                            <label htmlFor="course_centre" className="block text-sm font-semibold text-gray-700">
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

                                    {/* Course Mode and Duration */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label htmlFor="course_mode" className="block text-sm font-semibold text-gray-700">
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
                                        </div>

                                        <div className="space-y-2">
                                            <label htmlFor="course_duration" className="block text-sm font-semibold text-gray-700">
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
                                    </div>

                                    {/* Course Scheme */}
                                    <div className="space-y-2">
                                        <label htmlFor="course_scheme" className="block text-sm font-semibold text-gray-700">
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

                                    {/* Course Description */}
                                    <div className="space-y-2">
                                        <label htmlFor="course_desc" className="block text-sm font-semibold text-gray-700">
                                            Course Description
                                        </label>
                                        <div className="relative rounded-lg shadow-sm">
                                            <div className="absolute top-3 left-3 pointer-events-none">
                                                <FaAlignLeft className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <textarea
                                                name="course_desc"
                                                id="course_desc"
                                                rows="5"
                                                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-900 placeholder-gray-400 resize-none"
                                                onChange={handleChange}
                                                value={formData.course_desc}
                                                placeholder="Provide a detailed description of the course including learning objectives, prerequisites, target audience, etc."
                                                disabled={submitting}
                                            />
                                        </div>
                                        {formData.course_desc && (
                                            <p className="text-xs text-gray-500 text-right">
                                                {formData.course_desc.length} characters
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Course Status */}
                                    <div className="space-y-2">
                                        <label htmlFor="course_status" className="block text-sm font-semibold text-gray-700">
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

                                    {/* Start Date and End Date */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label htmlFor="course_start_date" className="block text-sm font-semibold text-gray-700">
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

                                        <div className="space-y-2">
                                            <label htmlFor="course_end_date" className="block text-sm font-semibold text-gray-700">
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
                                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2">
                                            <FaExclamationCircle className="text-amber-600" />
                                            <p className="text-sm text-amber-700">
                                                End date cannot be before start date
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Form Actions */}
                            <div className="flex items-center justify-end gap-4 pt-6 mt-6 border-t border-gray-200">
                                <Link
                                    href="/dashboard/operator/course"
                                    className="px-6 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                                >
                                    Cancel
                                </Link>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className={`inline-flex items-center gap-2 px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 ${
                                        submitting ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                >
                                    {submitting ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Adding Course...
                                        </>
                                    ) : (
                                        <>
                                            <FaPlus />
                                            Add Course
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Preview Card */}
                {formData.course_name && (
                    <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                            <FaCheckCircle className="text-green-500" />
                            Course Preview
                        </h3>
                        <div className="flex items-start gap-4">
                            <div className="bg-blue-100 p-3 rounded-lg">
                                <FaBook className="text-blue-600 text-xl" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-lg font-semibold text-gray-900">{formData.course_name}</h4>
                                <div className="flex flex-wrap gap-3 mt-2">
                                    {formData.course_mode && (
                                        <span className={`text-xs px-3 py-1.5 rounded-full ${getModeBadgeClass(formData.course_mode)}`}>
                                            {formData.course_mode}
                                        </span>
                                    )}
                                    {formData.course_status && (
                                        <span className={`text-xs px-3 py-1.5 rounded-full ${getStatusBadgeClass(formData.course_status)}`}>
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
                )}

                {/* Help Card */}
                <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-start gap-3">
                        <FaInfoCircle className="text-blue-600 w-5 h-5 mt-0.5" />
                        <div>
                            <h3 className="text-sm font-semibold text-blue-800 mb-1">Important Information</h3>
                            <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                                <li>Fields marked with <span className="text-red-500">*</span> are mandatory</li>
                                <li>Course duration should be specified in hours</li>
                                <li>Select appropriate status to control course visibility</li>
                                <li>End date must be after start date if both are provided</li>
                                <li>Add detailed description for better course understanding</li>
                            </ul>
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
        </div>
    );
}