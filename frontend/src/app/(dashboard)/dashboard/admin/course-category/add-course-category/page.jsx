"use client"

import { useState, useEffect } from "react"
import { toast, ToastContainer } from "react-toastify";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import Link from "next/link";
import { 
  FaArrowLeft, 
  FaLayerGroup, 
  FaTag, 
  FaAlignLeft, 
  FaList, 
  FaPlus,
  FaChevronRight
} from 'react-icons/fa';
import "react-toastify/dist/ReactToastify.css";

export default function AddCourseCategoryPage() {
    const { user } = useAuth();

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        course_category_name: "",
        course_category_type: "",
        course_category_desc: "",
    });

    // Course type options
    const courseTypeOptions = [
        { value: "", label: "Select Course Category Type", disabled: true },
        { value: "A", label: "Type A - Foundation Courses" },
        { value: "B", label: "Type B - Professional Courses" },
        { value: "C", label: "Type C - Technical Courses" },
        { value: "D", label: "Type D - Management Courses" },
        { value: "E", label: "Type E - Language Courses" },
        { value: "F", label: "Type F - Skill Development" },
        { value: "G", label: "Type G - Certification Programs" },
        { value: "H", label: "Type H - Diploma Programs" },
        { value: "I", label: "Type I - Advanced Studies" },
    ];

    useEffect(() => {
        if (user) {
            fetchDashboardData();
        }
    }, [user]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            let endpoint = '/dashboard/user/';

            if (user?.role === 'admin') {
                endpoint = '/dashboard/admin/';
            } else if (user?.role === 'operator') {
                endpoint = '/dashboard/operator/';
            }

            // You can optionally fetch data from this endpoint if needed
            // const response = await api.get(endpoint);
            
        } catch (err) {
            console.error('Failed to load dashboard data', err);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

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

        const toastId = toast.loading("Adding course category...");

        try {
            const formDataToSend = new FormData();
            Object.keys(formData).forEach(key => {
                formDataToSend.append(key, formData[key]);
            });

            const response = await api.post("/dashboard/course-category/add/", formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.status === 201 || response.status === 200) {
                toast.update(toastId, {
                    render: response.data.message || "Course category added successfully!",
                    type: "success",
                    isLoading: false,
                    autoClose: 3000
                });

                // Reset form
                setFormData({
                    course_category_name: "",
                    course_category_type: "",
                    course_category_desc: "",
                });
            }
        } catch (error) {
            console.error("Error adding course category:", error);

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

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                {/* Header with Breadcrumb */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
                            Dashboard
                        </Link>
                        <FaChevronRight className="text-xs" />
                        <Link href="/dashboard/admin/course-category" className="hover:text-blue-600 transition-colors">
                            Course Categories
                        </Link>
                        <FaChevronRight className="text-xs" />
                        <span className="text-gray-900 font-medium">Add New</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Add Course Category</h1>
                            <p className="mt-2 text-gray-600">Create a new category to organize your courses effectively.</p>
                        </div>
                        <Link 
                            href="/dashboard/admin/course-category" 
                            className="inline-flex items-center px-6 py-3 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                        >
                            <FaList className="mr-2" />
                            View All Categories
                        </Link>
                    </div>
                </div>

                {/* Main Form Card */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    {/* Form Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2 rounded-lg">
                                <FaLayerGroup className="text-white text-xl" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-white">Category Information</h2>
                                <p className="text-blue-100 text-sm mt-1">Fill in the details below to create a new course category</p>
                            </div>
                        </div>
                    </div>

                    {/* Form Body */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Course Category Name */}
                        <div className="space-y-2">
                            <label htmlFor="course_category_name" className="block text-sm font-semibold text-gray-700">
                                Category Name <span className="text-red-500">*</span>
                            </label>
                            <div className="relative rounded-lg shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FaTag className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    id="course_category_name"
                                    name="course_category_name"
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-900 placeholder-gray-400"
                                    value={formData.course_category_name}
                                    onChange={handleChange}
                                    required
                                    disabled={submitting}
                                    placeholder="e.g., Professional Development, Technical Training, etc."
                                />
                            </div>
                            <p className="text-xs text-gray-500">Choose a descriptive name that reflects the category's purpose</p>
                        </div>

                        {/* Course Category Type */}
                        <div className="space-y-2">
                            <label htmlFor="course_category_type" className="block text-sm font-semibold text-gray-700">
                                Category Type <span className="text-red-500">*</span>
                            </label>
                            <div className="relative rounded-lg shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FaLayerGroup className="h-5 w-5 text-gray-400" />
                                </div>
                                <select
                                    name="course_category_type"
                                    id="course_category_type"
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-900 bg-white appearance-none"
                                    onChange={handleChange}
                                    value={formData.course_category_type}
                                    disabled={submitting}
                                    required
                                >
                                    {courseTypeOptions.map((option) => (
                                        <option 
                                            key={option.value} 
                                            value={option.value}
                                            disabled={option.disabled}
                                            className="py-2"
                                        >
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500">Select the type that best describes this category</p>
                        </div>

                        {/* Course Category Description */}
                        <div className="space-y-2">
                            <label htmlFor="course_category_desc" className="block text-sm font-semibold text-gray-700">
                                Category Description <span className="text-red-500">*</span>
                            </label>
                            <div className="relative rounded-lg shadow-sm">
                                <div className="absolute top-3 left-3 pointer-events-none">
                                    <FaAlignLeft className="h-5 w-5 text-gray-400" />
                                </div>
                                <textarea
                                    name="course_category_desc"
                                    id="course_category_desc"
                                    rows="5"
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-900 placeholder-gray-400 resize-none"
                                    onChange={handleChange}
                                    value={formData.course_category_desc}
                                    required
                                    disabled={submitting}
                                    placeholder="Provide a detailed description of this category. Include information about:
• What types of courses belong here
• Target audience
• Prerequisites (if any)
• Key learning outcomes"
                                />
                            </div>
                            <p className="text-xs text-gray-500">Comprehensive description helps users understand the category better</p>
                        </div>

                        {/* Form Actions */}
                        <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
                            <Link
                                href="/dashboard/admin/course-category"
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
                                        Adding Category...
                                    </>
                                ) : (
                                    <>
                                        <FaPlus className="text-sm" />
                                        Add Course Category
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Tips Card */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <h3 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
                            <span className="bg-blue-200 rounded-full w-5 h-5 flex items-center justify-center text-blue-800 text-xs">i</span>
                            Naming Tips
                        </h3>
                        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                            <li>Use clear, descriptive names</li>
                            <li>Keep it concise but meaningful</li>
                            <li>Avoid abbreviations unless common</li>
                            <li>Consider future category expansion</li>
                        </ul>
                    </div>

                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <h3 className="text-sm font-semibold text-green-800 mb-2 flex items-center gap-2">
                            <span className="bg-green-200 rounded-full w-5 h-5 flex items-center justify-center text-green-800 text-xs">✓</span>
                            Description Guidelines
                        </h3>
                        <ul className="text-sm text-green-700 space-y-1 list-disc list-inside">
                            <li>Be specific about course types</li>
                            <li>Mention target audience</li>
                            <li>Include any prerequisites</li>
                            <li>Highlight key benefits</li>
                        </ul>
                    </div>
                </div>

                {/* Character Counter (Optional) */}
                {formData.course_category_desc && (
                    <div className="mt-4 text-right text-xs text-gray-500">
                        Description: {formData.course_category_desc.length} characters
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