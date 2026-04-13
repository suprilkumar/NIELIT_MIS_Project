'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  ArrowLeft, 
  Save, 
  Loader2,
  Tag,
  Type,
  FileText,
  Layers,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';
import { FaLayerGroup, FaTag, FaAlignLeft, FaChevronRight } from 'react-icons/fa';

export default function EditCourseCategoryPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        course_category_name: '',
        course_category_type: '',
        course_category_desc: '',
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
        if (id) {
            fetchCourseCategoryDetails();
        }
    }, [id]);

    const fetchCourseCategoryDetails = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/dashboard/course-category/manage/${id}/`);
            const courseCategoryData = response.data;

            setFormData({
                course_category_name: courseCategoryData.course_category_name || '',
                course_category_type: courseCategoryData.course_category_type || '',
                course_category_desc: courseCategoryData.course_category_desc || '',
            });

        } catch (err) {
            console.error('Error fetching course category details:', err);
            setError('Failed to load course category details');
            toast.error('Failed to load course category details');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.course_category_name.trim()) {
            toast.error('Course category name is required');
            return;
        }

        if (!formData.course_category_type) {
            toast.error('Please select a category type');
            return;
        }

        try {
            setSubmitting(true);

            const response = await api.put(`/dashboard/course-category/manage/${id}/`, formData);

            toast.success(response.data.message || 'Course category updated successfully');

            setTimeout(() => {
                router.push('/dashboard/admin/course-category');
                router.refresh();
            }, 1500);

        } catch (err) {
            console.error('Error updating course category details:', err);

            if (err.response?.data?.details) {
                const errors = err.response.data.details;
                Object.keys(errors).forEach(key => {
                    toast.error(`${key}: ${errors[key]}`);
                });
            } else {
                toast.error(err.response?.data?.error || 'Failed to update course category');
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading course category details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
                    <AlertCircle className="text-red-500 w-16 h-16 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Category</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <Link
                        href="/dashboard/admin/course-category"
                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Categories
                    </Link>
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
                        <span className="text-gray-900 font-medium">Edit Category</span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <Link
                            href="/dashboard/admin/course-category"
                            className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Edit Course Category</h1>
                            <p className="mt-2 text-gray-600">
                                Update the information for <span className="font-semibold text-gray-900">{formData.course_category_name}</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Main Form Card */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    {/* Form Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2 rounded-lg">
                                <Layers className="text-white text-xl" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-white">Category Information</h2>
                                <p className="text-blue-100 text-sm mt-1">Edit the details of your course category</p>
                            </div>
                        </div>
                    </div>

                    {/* Form Body */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Course Category Name */}
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">
                                Category Name <span className="text-red-500">*</span>
                            </label>
                            <div className="relative rounded-lg shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Tag className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    name="course_category_name"
                                    value={formData.course_category_name}
                                    onChange={handleChange}
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-900"
                                    placeholder="Enter category name"
                                    required
                                />
                            </div>
                            <p className="text-xs text-gray-500">Choose a descriptive name that reflects the category's purpose</p>
                        </div>

                        {/* Course Category Type */}
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">
                                Category Type <span className="text-red-500">*</span>
                            </label>
                            <div className="relative rounded-lg shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Type className="h-5 w-5 text-gray-400" />
                                </div>
                                <select
                                    name="course_category_type"
                                    value={formData.course_category_type}
                                    onChange={handleChange}
                                    className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-900 bg-white appearance-none"
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
                            <label className="block text-sm font-semibold text-gray-700">
                                Category Description
                            </label>
                            <div className="relative rounded-lg shadow-sm">
                                <div className="absolute top-3 left-3 pointer-events-none">
                                    <FileText className="h-5 w-5 text-gray-400" />
                                </div>
                                <textarea
                                    name="course_category_desc"
                                    rows="5"
                                    value={formData.course_category_desc}
                                    onChange={handleChange}
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-900 placeholder-gray-400 resize-none"
                                    placeholder="Provide a detailed description of this category. Include information about:
• What types of courses belong here
• Target audience
• Prerequisites (if any)
• Key learning outcomes"
                                />
                            </div>
                            <p className="text-xs text-gray-500">Comprehensive description helps users understand the category better</p>
                            {formData.course_category_desc && (
                                <p className="text-xs text-gray-400 text-right">
                                    {formData.course_category_desc.length} characters
                                </p>
                            )}
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
                                className="inline-flex items-center gap-2 px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        Update Category
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Tips Card */}
                <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-start gap-3">
                        <CheckCircle className="text-blue-600 w-5 h-5 mt-0.5" />
                        <div>
                            <h3 className="text-sm font-semibold text-blue-800 mb-1">Editing Tips</h3>
                            <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                                <li>Fields marked with <span className="text-red-500">*</span> are mandatory</li>
                                <li>Category type determines how courses are organized</li>
                                <li>A detailed description helps users understand the category's purpose</li>
                                <li>Changes will be reflected immediately across all associated courses</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Preview Card (Optional) */}
                {formData.course_category_name && (
                    <div className="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <FaLayerGroup className="text-gray-500" />
                            Preview
                        </h3>
                        <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                            <div className="bg-blue-100 p-2 rounded-lg">
                                <FaLayerGroup className="text-blue-600" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">{formData.course_category_name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    {formData.course_category_type && (
                                        <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                                            Type {formData.course_category_type}
                                        </span>
                                    )}
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