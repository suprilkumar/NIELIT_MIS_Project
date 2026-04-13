// app/(dashboard)/dashboard/reports/page.jsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { CSVLink } from 'react-csv';
import { 
  FaDownload, FaSync, FaFilter, FaTimes, 
  FaCalendarAlt, FaBuilding, FaBook, FaTag
} from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function ReportsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  
  // State for filters
  const [filters, setFilters] = useState({
    report_type: 'monthly',
    centre_id: 'all',
    category_id: '',
    course_id: '',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    quarter: 1,
    start_date: '',
    end_date: ''
  });
  
  // State for filter options
  const [filterOptions, setFilterOptions] = useState({
    report_types: [],
    centres: [],
    categories: [],
    years: [],
    quarters: [],
    months: []
  });
  
  // State for report data
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [showFilters, setShowFilters] = useState(true);
  
  // Load filter options on mount
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);
  
  useEffect(() => {
    if (user) {
      fetchFilterOptions();
    }
  }, [user]);
  
  const fetchFilterOptions = async () => {
    try {
      const response = await api.get('/report/reports/filters/');
      setFilterOptions(response.data);
    } catch (err) {
      console.error('Error fetching filter options:', err);
      toast.error('Failed to load filter options');
    }
  };
  
  const fetchReportData = async () => {
    setLoading(true);
    try {
      // Build query params
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });
      
      const response = await api.get(`/report/reports/data/?${params.toString()}`);
      setReportData(response.data);
      console.log(reportData)
      toast.success(`Report generated with ${response.data.metadata.total_records} records`);
    } catch (err) {
      console.error('Error fetching report data:', err);
      toast.error(err.response?.data?.error || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const resetFilters = () => {
    setFilters({
      report_type: 'monthly',
      centre_id: 'all',
      category_id: '',
      course_id: '',
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      quarter: 1,
      start_date: '',
      end_date: ''
    });
  };
  
  // Prepare CSV data
  const getCSVData = () => {
    if (!reportData?.data) return [];
    
    // Headers
    const headers = [
      'S.No',
      'Centre',
      'Month',
      'Course Category',
      'Type',
      'Course Name',
      'Duration Hrs',
      'Mode',
      'Total Enrolled',
      'Total Trained',
      'Total Certified',
      'Total Placed',
      'Male Enrolled',
      'Male Trained',
      'Male Certified',
      'Male Placed',
      'Female Enrolled',
      'Female Trained',
      'Female Certified',
      'Female Placed',
      'SC Enrolled',
      'SC Trained',
      'SC Certified',
      'SC Placed',
      'ST Enrolled',
      'ST Trained',
      'ST Certified',
      'ST Placed',
      'OBC Enrolled',
      'OBC Trained',
      'OBC Certified',
      'OBC Placed',
      'PWD Enrolled',
      'PWD Trained',
      'PWD Certified',
      'PWD Placed',
      'Remarks'
    ];
    
    // Data rows
    const rows = reportData.data.map((entry, index) => [
      index + 1,
      entry.centre_name,
      entry.month_display,
      entry.course_category,
      entry.course_category_type,
      entry.course_name,
      entry.course_duration,
      entry.course_mode,
      entry.total_enrolled,
      entry.total_trained,
      entry.total_certified,
      entry.total_placed,
      entry.male_enrolled,
      entry.male_trained,
      entry.male_certified,
      entry.male_placed,
      entry.female_enrolled,
      entry.female_trained,
      entry.female_certified,
      entry.female_placed,
      entry.sc_enrolled,
      entry.sc_trained,
      entry.sc_certified,
      entry.sc_placed,
      entry.st_enrolled,
      entry.st_trained,
      entry.st_certified,
      entry.st_placed,
      entry.obc_enrolled,
      entry.obc_trained,
      entry.obc_certified,
      entry.obc_placed,
      entry.pwd_enrolled,
      entry.pwd_trained,
      entry.pwd_certified,
      entry.pwd_placed,

      entry.remarks || ''
    ]);
    
    return [headers, ...rows];
  };
  
  // Format number
  const formatNumber = (num) => {
    return num?.toLocaleString() || '0';
  };
  
  // Get status badge
  const getStatusBadge = (status) => {
    const colors = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'PARTIAL': 'bg-orange-100 text-orange-800',
      'COMPLETED': 'bg-blue-100 text-blue-800',
      'VERIFIED': 'bg-green-100 text-green-800',
      'LOCKED': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };
  
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Generate Report </h1>
          <p className="mt-2 text-gray-600">
            Generate and export reports for courses and centres
          </p>
        </div>
        
        {/* Filters Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-600 mb-8">
          <div 
            className="p-4 flex items-center justify-between cursor-pointer border-b border-gray-800"
            onClick={() => setShowFilters(!showFilters)}
          >
            <div className="flex items-center gap-2">
              <FaFilter className="text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900">Report Filters</h2>
            </div>
            <button className="text-gray-500 hover:text-gray-700">
              {showFilters ? 'Hide' : 'Show'}
            </button>
          </div>
          
          {showFilters && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Report Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Report Type
                  </label>
                  <select
                    name="report_type" value={filters.report_type} onChange={handleFilterChange}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  >
                    {filterOptions.report_types?.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Centre */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Centre
                  </label>
                  <select
                    name="centre_id" value={filters.centre_id} onChange={handleFilterChange}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  >
                    {filterOptions.centres?.map(centre => (
                      <option key={centre.id} value={centre.id} >
                        {centre.centre_name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2"> Course Category </label>
                  <select name="category_id" value={filters.category_id} onChange={handleFilterChange}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" >
                    <option value="">All Categories</option>
                    {filterOptions.categories?.map(cat => (
                      <option key={cat.id} value={cat.id}> {cat.course_category_name} </option>
                    ))}
                  </select>
                </div>
                
                {/* Dynamic filters based on report type */}
                {filters.report_type === 'monthly' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2"> Year </label>
                      <select name="year" value={filters.year} onChange={handleFilterChange}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" >
                        {filterOptions.years?.map(year => (<option key={year} value={year}>{year}</option> ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2"> Month </label>
                      <select name="month" value={filters.month} onChange={handleFilterChange}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" >
                        {filterOptions.months?.map(month => ( <option key={month.value} value={month.value}> {month.label} </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
                
                {filters.report_type === 'quarterly' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Year
                      </label>
                      <select name="year" value={filters.year} onChange={handleFilterChange}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black">
                        {filterOptions.years?.map(year => ( <option key={year} value={year}>{year}</option> ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2"> Quarter </label>
                      <select name="quarter" value={filters.quarter} onChange={handleFilterChange}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" >
                        {filterOptions.quarters?.map(q => ( <option key={q.value} value={q.value}>{q.label}</option> ))}
                      </select>
                    </div>
                  </>
                )}
                
                {filters.report_type === 'yearly' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2"> Year </label>
                    <select name="year" value={filters.year} onChange={handleFilterChange}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" >
                      {filterOptions.years?.map(year => ( <option key={year} value={year}>{year}</option> ))}
                    </select>
                  </div>
                )}
                
                {filters.report_type === 'custom' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2"> Start Date </label>
                      <input type="date" name="start_date" value={filters.start_date} onChange={handleFilterChange}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2"> End Date </label>
                      <input type="date" name="end_date" value={filters.end_date} onChange={handleFilterChange}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" />
                    </div>
                  </>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={resetFilters}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors flex items-center gap-2" >
                  <FaTimes /> Reset </button>
                <button onClick={fetchReportData} disabled={loading}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:bg-blue-300" >
                  {loading ? <FaSync className="animate-spin" /> : <FaFilter />}
                  {loading ? 'Generating...' : 'Generate Report'}
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Report Results */}
        {reportData && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Report Header */}
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Report Results</h2>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <span>Type: {reportData.metadata.report_type}</span>
                    <span>•</span>
                    <span>
                      Period: {new Date(reportData.metadata.date_range.start).toLocaleDateString()} 
                      {' to '} 
                      {new Date(reportData.metadata.date_range.end).toLocaleDateString()}
                    </span>
                    <span>•</span>
                    <span>Records: {reportData.metadata.total_records}</span>
                  </div>
                </div>
                
                {/* Export Buttons */}
                <div className="flex gap-3">
                  {reportData.data.length > 0 && (
                    <CSVLink
                      data={getCSVData()}
                      filename={`report_${reportData.metadata.report_type}_${new Date().toISOString().slice(0,10)}.csv`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      <FaDownload /> Export CSV
                    </CSVLink>
                  )}
                  <button
                    onClick={fetchReportData}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    <FaSync /> Refresh
                  </button>
                </div>
              </div>
              
              {/* Summary Cards */}
              {reportData.summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500">Total Enrolled</p>
                    <p className="text-lg font-bold text-gray-900">{formatNumber(reportData.summary.total_enrolled)}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500">Total Certified</p>
                    <p className="text-lg font-bold text-gray-900">{formatNumber(reportData.summary.total_certified)}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500">Certification Rate</p>
                    <p className="text-lg font-bold text-green-600">{reportData.summary.certification_rate}%</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500">Placement Rate</p>
                    <p className="text-lg font-bold text-blue-600">{reportData.summary.placement_rate}%</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Data Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-800 text-balance">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">#</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Centre</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Month</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">STATUS</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider text-nowrap">Course Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider text-nowrap">Course Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Duration Hrs</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Mode</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">Total Enrolled</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">Total Trained</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">Total Certified</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">Total Placed</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">Male Enrolled</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">Male Trained</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">Male Certified</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">Male Placed</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">Female Enrolled</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">Female Trained</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">Female Certified</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">Female Placed</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">SC Enrolled</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">SC Trained</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">SC Certified</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">SC Placed</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">ST Enrolled</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">ST Trained</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">ST Certified</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">ST Placed</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">OBC Enrolled</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">OBC Trained</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">OBC Certified</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">OBC Placed</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">PWD Enrolled</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">PWD Trained</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">PWD Certified</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">PWD Placed</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.data.length > 0 ? (
                    reportData.data.map((entry, index) => (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600">{index + 1}</td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{entry.centre_name}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{entry.month_display}</td>
                           <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(entry.entry_status)}`}>
                            {entry.status_display}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{entry.course_category}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{entry.course_category_type}</td>
                        <td className="px-4 py-3"> <p className="text-sm text-gray-900">{entry.course_name}</p> </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{entry.course_duration}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{entry.course_mode}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">{formatNumber(entry.total_enrolled)}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-600">{formatNumber(entry.total_trained)}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-600">{formatNumber(entry.total_certified)}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-600">{formatNumber(entry.total_placed)}</td>
                     
                        <td className="px-4 py-3 text-sm text-right text-gray-600">{formatNumber(entry.male_enrolled)}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-600">{formatNumber(entry.male_trained)}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-600">{formatNumber(entry.male_certified)}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-600">{formatNumber(entry.male_placed)}</td>
                     
                        <td className="px-4 py-3 text-sm text-right text-gray-600">{formatNumber(entry.female_enrolled)}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-600">{formatNumber(entry.female_trained)}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-600">{formatNumber(entry.female_certified)}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-600">{formatNumber(entry.female_placed)}</td>
                     
                        <td className="px-4 py-3 text-sm text-right text-gray-600">{formatNumber(entry.sc_enrolled)}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-600">{formatNumber(entry.sc_trained)}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-600">{formatNumber(entry.sc_certified)}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-600">{formatNumber(entry.sc_placed)}</td>
                     
                        <td className="px-4 py-3 text-sm text-right text-gray-600">{formatNumber(entry.st_enrolled)}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-600">{formatNumber(entry.st_trained)}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-600">{formatNumber(entry.st_certified)}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-600">{formatNumber(entry.st_placed)}</td>
                     
                        <td className="px-4 py-3 text-sm text-right text-gray-600">{formatNumber(entry.obc_enrolled)}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-600">{formatNumber(entry.obc_trained)}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-600">{formatNumber(entry.obc_certified)}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-600">{formatNumber(entry.obc_placed)}</td>

                        <td className="px-4 py-3 text-sm text-right text-gray-600">{formatNumber(entry.pwd_enrolled)}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-600">{formatNumber(entry.pwd_trained)}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-600">{formatNumber(entry.pwd_certified)}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-600">{formatNumber(entry.pwd_placed)}</td>
                     
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="10" className="px-4 py-8 text-center text-gray-500">
                        No data found for the selected filters
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}