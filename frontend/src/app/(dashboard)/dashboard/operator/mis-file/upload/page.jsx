"use client"

import { useState } from "react"
import { toast, ToastContainer } from "react-toastify";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import Link from "next/link";
import {
    FaUpload, FaChevronRight, FaFileCsv, FaBuilding,
    FaSpinner, FaCheckCircle, FaEdit,
    FaSave, FaTrash, FaBookOpen, FaUsers,
    FaChartBar, FaDatabase, FaCheckDouble,
    FaCalendarAlt, FaVenusMars, FaChartLine,
    FaMoneyBillWave, FaHourglassHalf
} from 'react-icons/fa';
import "react-toastify/dist/ReactToastify.css";

export default function MISUploadPage() {
    const { user } = useAuth();
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [file, setFile] = useState(null);
    const [data, setData] = useState([]);
    const [summary, setSummary] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [editedCells, setEditedCells] = useState({});
    const [showSummary, setShowSummary] = useState(false);
    const [showDataPreview, setShowDataPreview] = useState(false);
    const [activeStatus, setActiveStatus] = useState('success'); // 'success' or 'pending'
    const [showZeroEnrollments, setShowZeroEnrollments] = useState(false);

    // Handle drag events
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    // Handle drop
    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            validateAndSetFile(droppedFile);
        }
    };

    // Validate file
    const validateAndSetFile = (file) => {
        const validTypes = [
            'text/csv',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];

        if (validTypes.includes(file.type) || file.name.endsWith('.csv') || file.name.endsWith('.xlsx')) {
            setFile(file);
            toast.success(`File selected: ${file.name}`);
        } else {
            toast.error("Please upload a CSV or Excel file");
        }
    };

    // Handle file change
    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            validateAndSetFile(selectedFile);
        }
    };

    // Upload file
    const handleUpload = async () => {
        if (!file) {
            toast.error("Please select a file");
            return;
        }

        setUploading(true);
        const toastId = toast.loading("Processing file...");

        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await api.post("/report/mis-file-upload/", formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });

            setSummary(res.data.summary);
            setData(res.data.data);
            setEditedCells({});
            setShowSummary(true);
            setShowDataPreview(true);

            toast.update(toastId, {
                render: "File processed successfully! Review the summary and data below.",
                type: "success", isLoading: false, autoClose: 4000
            });

        } catch (err) {
            console.error("Upload error:", err.response?.data);

            toast.update(toastId, {
                render: err.response?.data?.error || "File upload failed. Please check the file format.",
                type: "error", isLoading: false, autoClose: 5000
            });
        } finally {
            setUploading(false);
        }
    };

    // Update values for monthly data
    const updateValueMonthly = (centreIdx, courseIdx, month, type, category, field, value) => {
        const newData = [...data];
        const numValue = parseInt(value) || 0;
        const cellKey = `${centreIdx}-${courseIdx}-${month}-${type}-${category}-${field}`;
        
        const course = newData[centreIdx].courses[courseIdx];
        
        // Find or create monthly data
        let monthData = course.monthly_data?.find(m => m.month_year === month);
        if (!monthData) {
            if (!course.monthly_data) course.monthly_data = [];
            monthData = {
                month_year: month,
                counts: { category: {}, gender: {} }
            };
            course.monthly_data.push(monthData);
        }
        
        // Update the specific field
        if (!monthData.counts[type][category]) {
            monthData.counts[type][category] = { success: 0, pending: 0, total: 0 };
        }
        monthData.counts[type][category][field] = numValue;
        monthData.counts[type][category].total = 
            monthData.counts[type][category].success + monthData.counts[type][category].pending;
        
        // Update overall totals
        if (!course.counts) course.counts = { category: {}, gender: {} };
        if (!course.counts[type][category]) {
            course.counts[type][category] = { success: 0, pending: 0, total: 0 };
        }
        
        // Recalculate overall totals from all monthly data
        let totalSuccess = 0, totalPending = 0;
        course.monthly_data.forEach(md => {
            const data = md.counts[type]?.[category];
            if (data) {
                totalSuccess += data.success || 0;
                totalPending += data.pending || 0;
            }
        });
        
        course.counts[type][category].success = totalSuccess;
        course.counts[type][category].pending = totalPending;
        course.counts[type][category].total = totalSuccess + totalPending;
        
        setData(newData);
        
        // Track edited cells
        setEditedCells(prev => ({ ...prev, [cellKey]: true }));
        setTimeout(() => {
            setEditedCells(prev => {
                const newPrev = { ...prev };
                delete newPrev[cellKey];
                return newPrev;
            });
        }, 2000);
    };

    // Format month display
    const formatMonthDisplay = (monthStr) => {
        if (!monthStr) return '';
        try {
            const [year, month] = monthStr.split('-');
            const date = new Date(year, parseInt(month) - 1);
            return date.toLocaleString('default', { month: 'long', year: 'numeric' });
        } catch {
            return monthStr;
        }
    };

    // Submit final data
    const handleSubmit = async () => {
        if (!data.length) {
            toast.error("No data to submit");
            return;
        }

        setSubmitting(true);
        const toastId = toast.loading("Submitting data...");

        try {
            await api.post("/report/course-entry-bulk-create/", data, {
                headers: { 'Content-Type': 'application/json', }
            });

            toast.update(toastId, {
                render: "Data submitted successfully!",
                type: "success", isLoading: false, autoClose: 3000
            });

            setTimeout(() => {
                setData([]);
                setFile(null);
                setSummary(null);
                setEditedCells({});
                setShowSummary(false);
                setShowDataPreview(false);
            }, 3000);

        } catch (err) {
            console.error("Submit error:", err.response?.data);

            toast.update(toastId, {
                render: err.response?.data?.error || "Submission failed. Please try again.",
                type: "error", isLoading: false, autoClose: 5000
            });
        } finally {
            setSubmitting(false);
        }
    };

    // Reset all data
    const handleReset = () => {
        if (confirm("Are you sure you want to reset all data? This action cannot be undone.")) {
            setData([]);
            setFile(null);
            setSummary(null);
            setEditedCells({});
            setShowSummary(false);
            setShowDataPreview(false);
            toast.info("All data has been reset");
        }
    };

    // Calculate total enrollments for a course entry in a specific month and status
    const getCourseEntryTotal = (entry, status) => {
        const categoryCounts = entry.monthly_data.counts?.category || {};
        const genderCounts = entry.monthly_data.counts?.gender || {};
        
        const maleCount = genderCounts['M']?.[status] || 0;
        const femaleCount = genderCounts['F']?.[status] || 0;
        
        return maleCount + femaleCount;
    };

    // Group data by month-year and filter out entries with zero enrollments
    const groupDataByMonth = () => {
        const groupedData = {};
        
        data.forEach((centre, centreIdx) => {
            centre.courses.forEach((course, courseIdx) => {
                (course.monthly_data || []).forEach(monthData => {
                    const monthYear = monthData.month_year;
                    
                    // Create entry object
                    const entry = {
                        centre_name: centre.centre_name,
                        centre_id: centre.centre_id,
                        course_name: course.course_name,
                        course_id: course.course_id,
                        monthly_data: monthData,
                        centreIdx: centreIdx,
                        courseIdx: courseIdx
                    };
                    
                    // Calculate total for this entry based on active status
                    const totalEnrollments = getCourseEntryTotal(entry, activeStatus);
                    
                    // Only add entry if it has enrollments or if user wants to see zeros
                    if (showZeroEnrollments || totalEnrollments > 0) {
                        if (!groupedData[monthYear]) {
                            groupedData[monthYear] = [];
                        }
                        
                        groupedData[monthYear].push({
                            ...entry,
                            totalEnrollments
                        });
                    }
                });
            });
        });
        
        // Sort months chronologically
        const sortedMonths = Object.keys(groupedData).sort();
        const sortedGroupedData = {};
        sortedMonths.forEach(month => {
            // Sort entries within each month by total enrollments (descending) to show active ones first
            sortedGroupedData[month] = groupedData[month].sort((a, b) => b.totalEnrollments - a.totalEnrollments);
        });
        
        return sortedGroupedData;
    };

    // Calculate totals for a month
    const calculateMonthTotals = (monthEntries, status) => {
        let totals = {
            GEN: 0, SC: 0, ST: 0, OBC: 0,
            Male: 0, Female: 0,
            total: 0
        };
        
        monthEntries.forEach(entry => {
            const categoryCounts = entry.monthly_data.counts?.category || {};
            const genderCounts = entry.monthly_data.counts?.gender || {};
            
            // Category totals
            ['GEN', 'SC', 'ST', 'OBC'].forEach(cat => {
                totals[cat] += categoryCounts[cat]?.[status] || 0;
            });
            
            // Gender totals
            totals.Male += genderCounts['M']?.[status] || 0;
            totals.Female += genderCounts['F']?.[status] || 0;
            totals.total += (genderCounts['M']?.[status] || 0) + (genderCounts['F']?.[status] || 0);
        });
        
        return totals;
    };

    const groupedData = groupDataByMonth();
    const sortedMonths = Object.keys(groupedData).sort();

    // Calculate overall totals
    const calculateOverallTotals = () => {
        let totalSuccess = 0;
        let totalPending = 0;

        data.forEach(centre => {
            centre.courses.forEach(course => {
                Object.values(course.counts?.category || {}).forEach(count => {
                    totalSuccess += count.success || 0;
                    totalPending += count.pending || 0;
                });
            });
        });

        return { totalSuccess, totalPending, total: totalSuccess + totalPending };
    };

    const overallTotals = calculateOverallTotals();
    
    // Count total entries with enrollments
    const getActiveEntriesCount = () => {
        let count = 0;
        data.forEach(centre => {
            centre.courses.forEach(course => {
                (course.monthly_data || []).forEach(monthData => {
                    const genderCounts = monthData.counts?.gender || {};
                    const total = (genderCounts['M']?.[activeStatus] || 0) + (genderCounts['F']?.[activeStatus] || 0);
                    if (total > 0) count++;
                });
            });
        });
        return count;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <div className="max-w-7xl mx-auto py-8 px-4">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Link href="/dashboard" className="hover:text-blue-600 transition-colors"> Dashboard </Link>
                        <FaChevronRight className="text-xs" />
                        <span className="text-gray-900 font-medium">MIS Upload</span>
                    </div>

                    <div className="flex justify-between items-end">
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Upload MIS Data </h1>
                            <p className="text-gray-600 mt-2">
                                Upload student enrollment data with gender and monthly breakdown
                            </p>
                        </div>

                        {(data.length > 0 || summary) && (
                            <button onClick={handleReset}
                                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2" >
                                <FaTrash className="text-sm" /> Reset All
                            </button>
                        )}
                    </div>
                </div>

                {/* Upload Section */}
                <div className="bg-white rounded-2xl shadow-lg mb-8 overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                            <FaUpload className="text-blue-600" /> File Upload
                        </h2>
                        <p className="text-gray-600 text-sm mt-1">
                            Upload a CSV or Excel file containing student enrollment data with Gender and Application Date columns (DD/MM/YYYY format)
                        </p>
                    </div>

                    <div className="p-6">
                        <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${dragActive
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
                            }`}
                            onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} >
                            <FaFileCsv className="text-4xl text-gray-400 mx-auto mb-3" />

                            {file ? (
                                <div className="space-y-2">
                                    <FaCheckCircle className="text-green-500 text-2xl mx-auto" />
                                    <p className="text-gray-700 font-medium">{file.name}</p>
                                    <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                                    <button onClick={() => setFile(null)} className="text-red-500 text-sm hover:text-red-600">Remove file</button>
                                </div>
                            ) : (
                                <>
                                    <p className="text-gray-600 mb-2"> Drag and drop your file here, or </p>
                                    <label className="inline-block">
                                        <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} className="hidden" />
                                        <span className="bg-blue-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-700 transition-colors inline-flex items-center gap-2">
                                            <FaUpload className="text-sm" /> Browse Files
                                        </span>
                                    </label>
                                    <p className="text-xs text-gray-500 mt-3"> Supported formats: CSV, Excel (.xlsx, .xls) </p>
                                </>
                            )}
                        </div>

                        {file && (
                            <div className="mt-6 flex justify-center">
                                <button onClick={handleUpload} disabled={uploading}
                                    className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center gap-2">
                                    {uploading ? (<><FaSpinner className="animate-spin" /> Processing...</>) : (<><FaUpload /> Upload & Process File</>)}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Summary Section */}
                {showSummary && summary && (
                    <div className="bg-white rounded-2xl shadow-lg mb-8 overflow-hidden text-black">
                        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                                <FaChartBar className="text-green-600" /> File Summary
                            </h2>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
                                    <div className="flex items-center justify-between">
                                        <FaDatabase className="text-2xl opacity-75" />
                                        <span className="text-2xl font-bold">{summary.total_records}</span>
                                    </div>
                                    <p className="mt-2 text-sm opacity-90">Total Records</p>
                                </div>
                                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
                                    <div className="flex items-center justify-between">
                                        <FaBuilding className="text-2xl opacity-75" />
                                        <span className="text-2xl font-bold">{summary.total_centres}</span>
                                    </div>
                                    <p className="mt-2 text-sm opacity-90">Centres</p>
                                </div>
                                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
                                    <div className="flex items-center justify-between">
                                        <FaBookOpen className="text-2xl opacity-75" />
                                        <span className="text-2xl font-bold">{summary.total_courses}</span>
                                    </div>
                                    <p className="mt-2 text-sm opacity-90">Courses</p>
                                </div>
                                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white">
                                    <div className="flex items-center justify-between">
                                        <FaUsers className="text-2xl opacity-75" />
                                        <span className="text-2xl font-bold">{summary.success_payments + summary.pending_payments}</span>
                                    </div>
                                    <p className="mt-2 text-sm opacity-90">Total Students</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="border rounded-lg p-4">
                                    <h3 className="font-semibold mb-3">Payment Status</h3>
                                    <div className="flex justify-between"><span>Success:</span><span className="font-semibold text-green-600">{summary.success_payments}</span></div>
                                    <div className="flex justify-between mt-2"><span>Pending:</span><span className="font-semibold text-orange-600">{summary.pending_payments}</span></div>
                                </div>
                                <div className="border rounded-lg p-4">
                                    <h3 className="font-semibold mb-3">Category Breakdown</h3>
                                    {Object.entries(summary.category_breakdown || {}).map(([cat, count]) => (
                                        <div key={cat} className="flex justify-between"><span>{cat}:</span><span className="font-semibold">{count}</span></div>
                                    ))}
                                </div>
                                <div className="border rounded-lg p-4">
                                    <h3 className="font-semibold mb-3">Gender Breakdown</h3>
                                    {Object.entries(summary.gender_breakdown || {}).map(([gender, count]) => (
                                        <div key={gender} className="flex justify-between"><span>{gender === 'M' ? 'Male' : 'Female'}:</span><span className="font-semibold">{count}</span></div>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-4">
                                <h3 className="font-semibold mb-2">Months in File:</h3>
                                <div className="flex flex-wrap gap-2">
                                    {summary.months_range?.map((month, idx) => (
                                        <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-1">
                                            <FaCalendarAlt className="text-xs" /> {formatMonthDisplay(month)}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Data Display Section */}
                {showDataPreview && data.length > 0 && (
                    <div className="space-y-6">
                        {/* Status Tabs */}
                        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                                <div className="flex justify-between items-center flex-wrap gap-4">
                                    <div>
                                        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                                            <FaEdit className="text-green-600" /> Enrollment Data
                                        </h2>
                                    </div>
                                    <div className="flex gap-3 items-center flex-wrap">
                                        <div className="bg-blue-50 px-3 py-1 rounded-lg"><span className="text-sm text-blue-600">Total: {overallTotals.total}</span></div>
                                        <div className="bg-green-50 px-3 py-1 rounded-lg"><span className="text-sm text-green-600">Success: {overallTotals.totalSuccess}</span></div>
                                        <div className="bg-orange-50 px-3 py-1 rounded-lg"><span className="text-sm text-orange-600">Pending: {overallTotals.totalPending}</span></div>
                                        <div className="bg-purple-50 px-3 py-1 rounded-lg">
                                            <span className="text-sm text-purple-600">
                                                Active Entries: {getActiveEntriesCount()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Status Tabs */}
                                <div className="flex gap-2 mt-4 border-b">
                                    <button 
                                        onClick={() => setActiveStatus('success')} 
                                        className={`px-6 py-2 text-sm font-medium rounded-t-lg transition-all flex items-center gap-2 ${
                                            activeStatus === 'success' 
                                                ? 'bg-green-50 text-green-700 border-b-2 border-green-600' 
                                                : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                    >
                                        <FaMoneyBillWave /> Fees Paid (Success)
                                    </button>
                                    <button 
                                        onClick={() => setActiveStatus('pending')} 
                                        className={`px-6 py-2 text-sm font-medium rounded-t-lg transition-all flex items-center gap-2 ${
                                            activeStatus === 'pending' 
                                                ? 'bg-orange-50 text-orange-700 border-b-2 border-orange-600' 
                                                : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                    >
                                        <FaHourglassHalf /> Fees Pending
                                    </button>
                                    
                                    {/* Toggle for showing zero enrollments */}
                                    <div className="ml-auto flex items-center gap-2">
                                        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                                            <input 
                                                type="checkbox"
                                                checked={showZeroEnrollments}
                                                onChange={(e) => setShowZeroEnrollments(e.target.checked)}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span>Show zero enrollments</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Monthly Data Tables */}
                        {sortedMonths.length === 0 ? (
                            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                                <FaDatabase className="text-6xl text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">
                                    {!showZeroEnrollments 
                                        ? "No active enrollments found for the selected status. Toggle 'Show zero enrollments' to see all entries." 
                                        : "No monthly data available. Please upload a file with valid date information."}
                                </p>
                            </div>
                        ) : (
                            sortedMonths.map(month => {
                                const monthEntries = groupedData[month];
                                const monthTotals = calculateMonthTotals(monthEntries, activeStatus);
                                
                                return (
                                    <div key={month} className="bg-white rounded-2xl shadow-lg overflow-hidden text-black">
                                        {/* Month Header */}
                                        <div className={`px-6 py-4 ${
                                            activeStatus === 'success' 
                                                ? 'bg-gradient-to-r from-blue-800 via-blue-700 to-blue-900' 
                                                : 'bg-gradient-to-r from-orange-500 to-orange-600'
                                        }`}>
                                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                                <FaCalendarAlt /> {formatMonthDisplay(month)}
                                            </h3>
                                            <p className="text-white/80 text-sm mt-1">
                                                Total {activeStatus === 'success' ? 'Success' : 'Pending'} Enrollments: {monthTotals.total}
                                                {!showZeroEnrollments && monthEntries.length > 0 && (
                                                    <span className="ml-2 text-xs opacity-75">
                                                        • {monthEntries.length} active course{monthEntries.length !== 1 ? 's' : ''}
                                                    </span>
                                                )}
                                            </p>
                                        </div>

                                        {/* Data Table */}
                                        <div className="overflow-x-auto">
                                            <table className="w-full border-collapse">
                                                <thead className={`${
                                                    activeStatus === 'success' ? 'bg-green-50' : 'bg-orange-50'
                                                } border-b-2 border-gray-200`}>
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Centre Name</th>
                                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Course Detail</th>
                                                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Male</th>
                                                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Female</th>
                                                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">GEN</th>
                                                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">SC</th>
                                                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">ST</th>
                                                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">OBC</th>
                                                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 bg-gray-100">Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {monthEntries.map((entry, idx) => {
                                                        const categoryCounts = entry.monthly_data.counts?.category || {};
                                                        const genderCounts = entry.monthly_data.counts?.gender || {};
                                                        
                                                        const maleCount = genderCounts['M']?.[activeStatus] || 0;
                                                        const femaleCount = genderCounts['F']?.[activeStatus] || 0;
                                                        const genCount = categoryCounts['GEN']?.[activeStatus] || 0;
                                                        const scCount = categoryCounts['SC']?.[activeStatus] || 0;
                                                        const stCount = categoryCounts['ST']?.[activeStatus] || 0;
                                                        const obcCount = categoryCounts['OBC']?.[activeStatus] || 0;
                                                        const total = maleCount + femaleCount;
                                                        
                                                        // Skip rendering if total is 0 and we're not showing zero enrollments
                                                        if (total === 0 && !showZeroEnrollments) return null;
                                                        
                                                        return (
                                                            <tr key={idx} className={`border-b border-gray-200 hover:bg-gray-50 ${total === 0 ? 'opacity-60 bg-gray-50' : ''}`}>
                                                                <td className="px-4 py-3 text-sm text-gray-900">
                                                                    <div className="flex items-center gap-2">
                                                                        <FaBuilding className="text-blue-500 text-xs" />
                                                                        {entry.centre_name}
                                                                    </div>
                                                                 </td>
                                                                <td className="px-4 py-3 text-sm text-gray-900">
                                                                    <div className="flex items-center gap-2">
                                                                        <FaBookOpen className="text-purple-500 text-xs" />
                                                                        {entry.course_name}
                                                                    </div>
                                                                 </td>
                                                                <td className="px-4 py-3 text-center">
                                                                    <input 
                                                                        type="number" 
                                                                        min="0" 
                                                                        value={maleCount}
                                                                        onChange={(e) => updateValueMonthly(
                                                                            entry.centreIdx, entry.courseIdx, month, 
                                                                            'gender', 'M', activeStatus, e.target.value
                                                                        )}
                                                                        className={`w-20 border rounded px-2 py-1 text-center text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-200 ${
                                                                            editedCells[`${entry.centreIdx}-${entry.courseIdx}-${month}-gender-M-${activeStatus}`] 
                                                                                ? 'bg-yellow-50 border-yellow-400' 
                                                                                : ''
                                                                        }`}
                                                                        placeholder="0"
                                                                    />
                                                                 </td>
                                                                <td className="px-4 py-3 text-center">
                                                                    <input 
                                                                        type="number" 
                                                                        min="0" 
                                                                        value={femaleCount}
                                                                        onChange={(e) => updateValueMonthly(
                                                                            entry.centreIdx, entry.courseIdx, month, 
                                                                            'gender', 'F', activeStatus, e.target.value
                                                                        )}
                                                                        className={`w-20 border rounded px-2 py-1 text-center text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-200 ${
                                                                            editedCells[`${entry.centreIdx}-${entry.courseIdx}-${month}-gender-F-${activeStatus}`] 
                                                                                ? 'bg-yellow-50 border-yellow-400' 
                                                                                : ''
                                                                        }`}
                                                                        placeholder="0"
                                                                    />
                                                                 </td>
                                                                <td className="px-4 py-3 text-center">
                                                                    <input 
                                                                        type="number" 
                                                                        min="0" 
                                                                        value={genCount}
                                                                        onChange={(e) => updateValueMonthly(
                                                                            entry.centreIdx, entry.courseIdx, month, 
                                                                            'category', 'GEN', activeStatus, e.target.value
                                                                        )}
                                                                        className={`w-20 border rounded px-2 py-1 text-center text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-200 ${
                                                                            editedCells[`${entry.centreIdx}-${entry.courseIdx}-${month}-category-GEN-${activeStatus}`] 
                                                                                ? 'bg-yellow-50 border-yellow-400' 
                                                                                : ''
                                                                        }`}
                                                                        placeholder="0"
                                                                    />
                                                                 </td>
                                                                <td className="px-4 py-3 text-center">
                                                                    <input 
                                                                        type="number" 
                                                                        min="0" 
                                                                        value={scCount}
                                                                        onChange={(e) => updateValueMonthly(
                                                                            entry.centreIdx, entry.courseIdx, month, 
                                                                            'category', 'SC', activeStatus, e.target.value
                                                                        )}
                                                                        className={`w-20 border rounded px-2 py-1 text-center text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-200 ${
                                                                            editedCells[`${entry.centreIdx}-${entry.courseIdx}-${month}-category-SC-${activeStatus}`] 
                                                                                ? 'bg-yellow-50 border-yellow-400' 
                                                                                : ''
                                                                        }`}
                                                                        placeholder="0"
                                                                    />
                                                                 </td>
                                                                <td className="px-4 py-3 text-center">
                                                                    <input 
                                                                        type="number" 
                                                                        min="0" 
                                                                        value={stCount}
                                                                        onChange={(e) => updateValueMonthly(
                                                                            entry.centreIdx, entry.courseIdx, month, 
                                                                            'category', 'ST', activeStatus, e.target.value
                                                                        )}
                                                                        className={`w-20 border rounded px-2 py-1 text-center text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-200 ${
                                                                            editedCells[`${entry.centreIdx}-${entry.courseIdx}-${month}-category-ST-${activeStatus}`] 
                                                                                ? 'bg-yellow-50 border-yellow-400' 
                                                                                : ''
                                                                        }`}
                                                                        placeholder="0"
                                                                    />
                                                                 </td>
                                                                <td className="px-4 py-3 text-center">
                                                                    <input 
                                                                        type="number" 
                                                                        min="0" 
                                                                        value={obcCount}
                                                                        onChange={(e) => updateValueMonthly(
                                                                            entry.centreIdx, entry.courseIdx, month, 
                                                                            'category', 'OBC', activeStatus, e.target.value
                                                                        )}
                                                                        className={`w-20 border rounded px-2 py-1 text-center text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-200 ${
                                                                            editedCells[`${entry.centreIdx}-${entry.courseIdx}-${month}-category-OBC-${activeStatus}`] 
                                                                                ? 'bg-yellow-50 border-yellow-400' 
                                                                                : ''
                                                                        }`}
                                                                        placeholder="0"
                                                                    />
                                                                 </td>
                                                                <td className="px-4 py-3 text-center font-semibold bg-gray-50">
                                                                    {total}
                                                                 </td>
                                                            </tr>
                                                        );
                                                    })}
                                                    
                                                    {/* Month Total Row */}
                                                    {monthEntries.filter(entry => {
                                                        const total = getCourseEntryTotal(entry, activeStatus);
                                                        return showZeroEnrollments || total > 0;
                                                    }).length > 0 && (
                                                        <tr className={`${
                                                            activeStatus === 'success' ? 'bg-green-50' : 'bg-orange-50'
                                                        } border-t-2 border-gray-300 font-semibold text-black`}>
                                                            <td className="px-4 py-3 text-sm font-bold text-gray-900" colSpan="2">
                                                                Monthly Total ({activeStatus === 'success' ? 'Success' : 'Pending'})
                                                            </td>
                                                            <td className="px-4 py-3 text-center font-bold">{monthTotals.Male}</td>
                                                            <td className="px-4 py-3 text-center font-bold">{monthTotals.Female}</td>
                                                            <td className="px-4 py-3 text-center font-bold">{monthTotals.GEN}</td>
                                                            <td className="px-4 py-3 text-center font-bold">{monthTotals.SC}</td>
                                                            <td className="px-4 py-3 text-center font-bold">{monthTotals.ST}</td>
                                                            <td className="px-4 py-3 text-center font-bold">{monthTotals.OBC}</td>
                                                            <td className="px-4 py-3 text-center font-bold bg-gray-100">{monthTotals.total}</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                );
                            })
                        )}

                        {/* Submit Section */}
                        <div className="bg-white rounded-2xl shadow-lg p-6 sticky bottom-4">
                            <div className="flex justify-between items-center flex-wrap gap-4">
                                <div className="flex items-center gap-4 flex-wrap">
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <FaUsers className="text-lg" />
                                        <span className="text-sm">Total Records: {data.reduce((total, centre) => 
                                            total + centre.courses.reduce((courseTotal, course) => 
                                                courseTotal + (course.monthly_data?.length || 0), 0), 0)}
                                        </span>
                                    </div>
                                    <div className="h-8 w-px bg-gray-300" />
                                    <div className="flex items-center gap-2 text-green-600">
                                        <FaCheckDouble /> <span className="text-sm">Ready for submission</span>
                                    </div>
                                    {!showZeroEnrollments && getActiveEntriesCount() > 0 && (
                                        <div className="flex items-center gap-2 text-blue-600">
                                            <FaChartLine /> <span className="text-sm">Showing {getActiveEntriesCount()} active entries</span>
                                        </div>
                                    )}
                                </div>
                                <button onClick={handleSubmit} disabled={submitting}
                                    className="bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-3 rounded-xl hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center gap-2">
                                    {submitting ? (<><FaSpinner className="animate-spin" /> Submitting...</>) : (<><FaSave /> Submit All Data</>)}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} 
                closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="light" />
        </div>
    );
}