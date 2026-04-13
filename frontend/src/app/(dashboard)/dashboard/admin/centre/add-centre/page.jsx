"use client"

import { useState } from "react"
import { toast, ToastContainer } from "react-toastify";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import Link from "next/link";
import { FaArrowLeft, FaMapMarkerAlt, FaCode, FaCity, FaBuilding } from 'react-icons/fa';
import "react-toastify/dist/ReactToastify.css";

export default function AddCentrePage() {
    const { user } = useAuth();
    
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        centre_name: "",
        centre_address: "",
        centre_code: "",
        centre_state: "",
    });

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
        
        const toastId = toast.loading("Adding centre...");
        
        try {
            const formDataToSend = new FormData();
            Object.keys(formData).forEach(key => {
                formDataToSend.append(key, formData[key]);
            });

            const response = await api.post("/dashboard/centre/add-centre/", formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            
            if (response.status === 201 || response.status === 200) {
                toast.update(toastId, {
                    render: response.data.message || "Centre added successfully!",
                    type: "success",
                    isLoading: false,
                    autoClose: 3000
                });
                
                setFormData({
                    centre_name: "",
                    centre_address: "",
                    centre_code: "",
                    centre_state: "",
                });
            }
        } catch (error) {
            console.error("Error adding center:", error);
            
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
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                {/* Header Section */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <Link 
                            href="/dashboard/admin/centre" 
                            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200 mb-2"
                        >
                            <FaArrowLeft className="mr-2 text-sm" />
                            Back to Centres
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-900">Add New Centre</h1>
                        <p className="mt-2 text-gray-600">Fill in the details below to register a new examination centre.</p>
                    </div>
                    <Link 
                        href="/dashboard/admin/centre" 
                        className="inline-flex items-center px-6 py-3 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                    >
                        <FaBuilding className="mr-2" />
                        View All Centres
                    </Link>
                </div>

                {/* Main Form Card */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    {/* Form Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                        <h2 className="text-xl font-semibold text-white">Centre Information</h2>
                        <p className="text-blue-100 text-sm mt-1">Please provide accurate details for the new centre</p>
                    </div>

                    {/* Form Body */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Centre Name */}
                        <div className="space-y-2">
                            <label htmlFor="centre_name" className="block text-sm font-semibold text-gray-700">
                                Centre Name <span className="text-red-500">*</span>
                            </label>
                            <div className="relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FaBuilding className="h-5 w-5 text-gray-400" />
                                </div>
                                <input 
                                    type="text" 
                                    id="centre_name"
                                    name="centre_name" 
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-900 placeholder-gray-400"  
                                    value={formData.centre_name} 
                                    onChange={handleChange} 
                                    required 
                                    disabled={submitting}
                                    placeholder="e.g., Mumbai Central Examination Centre"
                                />
                            </div>
                        </div>

                        {/* Centre Address */}
                        <div className="space-y-2">
                            <label htmlFor="centre_address" className="block text-sm font-semibold text-gray-700">
                                Centre Address <span className="text-red-500">*</span>
                            </label>
                            <div className="relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FaMapMarkerAlt className="h-5 w-5 text-gray-400" />
                                </div>
                                <input 
                                    type="text" 
                                    id="centre_address"
                                    name="centre_address" 
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-900 placeholder-gray-400"  
                                    value={formData.centre_address} 
                                    onChange={handleChange} 
                                    required 
                                    disabled={submitting}
                                    placeholder="e.g., 123 Main Street, Andheri East"
                                />
                            </div>
                        </div>

                        {/* Two Column Layout for Code and State */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Centre Code */}
                            <div className="space-y-2">
                                <label htmlFor="centre_code" className="block text-sm font-semibold text-gray-700">
                                    Centre Code <span className="text-red-500">*</span>
                                </label>
                                <div className="relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FaCode className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input 
                                        type="text" 
                                        id="centre_code"
                                        name="centre_code" 
                                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-900 placeholder-gray-400"  
                                        value={formData.centre_code} 
                                        onChange={handleChange} 
                                        required 
                                        disabled={submitting}
                                        placeholder="e.g., MUM001"
                                    />
                                </div>
                                <p className="text-xs text-gray-500">Unique identifier for the centre</p>
                            </div>

                            {/* Centre State */}
                            <div className="space-y-2">
                                <label htmlFor="centre_state" className="block text-sm font-semibold text-gray-700">
                                    Centre State <span className="text-red-500">*</span>
                                </label>
                                <div className="relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FaCity className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input 
                                        type="text" 
                                        id="centre_state"
                                        name="centre_state" 
                                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-900 placeholder-gray-400"  
                                        value={formData.centre_state} 
                                        onChange={handleChange} 
                                        required 
                                        disabled={submitting}
                                        placeholder="e.g., Maharashtra"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Form Footer with Submit Button */}
                        <div className="pt-6 border-t border-gray-200">
                            <div className="flex items-center justify-end space-x-4">
                                <Link
                                    href="/dashboard/admin/centre"
                                    className="px-6 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                                >
                                    Cancel
                                </Link>
                                <button 
                                    type="submit" 
                                    disabled={submitting}
                                    className={`px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 ${
                                        submitting ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                >
                                    {submitting ? (
                                        <span className="flex items-center">
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Adding Centre...
                                        </span>
                                    ) : 'Add Centre'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Help Card */}
                <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h3 className="text-sm font-semibold text-blue-800 mb-2">Important Information</h3>
                    <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                        <li>Centre code should be unique and follow the format: (STATE)(CITY)(NUMBER) - e.g., MUM001</li>
                        <li>All fields marked with <span className="text-red-500">*</span> are mandatory</li>
                        <li>Double-check the address for accuracy before submission</li>
                    </ul>
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