'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Activity,
  Calendar,
  Clock
} from 'lucide-react';

import {
  LineChart, Line, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart
} from 'recharts';
import {
  FaSchool, FaUsers, FaUserGraduate, FaBriefcase, FaChartLine,
  FaFilter, FaRedoAlt, FaUniversity, FaMale, FaFemale,
  FaCheckCircle, FaSpinner, FaExclamationTriangle,
  FaCalendarAlt, FaBookOpen, FaTrophy, FaHandHoldingUsd,
  FaPercentage, FaChartBar, FaChartPie, FaChartLine as FaTrendUp
} from 'react-icons/fa';
import { MdCategory, MdLocationCity } from 'react-icons/md';
import { GiTeacher } from 'react-icons/gi';
import { HiOutlineUserGroup } from 'react-icons/hi';
import { BiTrendingUp, BiTrendingDown } from 'react-icons/bi';

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];
const CATEGORY_COLORS = {
  'GEN': '#0088FE',
  'SC': '#00C49F',
  'ST': '#FFBB28',
  'OBC': '#FF8042'
};

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, color, trend, subtitle }) => (
  <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-800">{value?.toLocaleString() || 0}</p>
        {subtitle && (
          <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
        )}
        {trend && (
          <div className="flex items-center mt-2">
            {trend > 0 ? (
              <BiTrendingUp className="text-green-500 mr-1" />
            ) : (
              <BiTrendingDown className="text-red-500 mr-1" />
            )}
            <span className={`text-sm ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
              {Math.abs(trend)}% from last month
            </span>
          </div>
        )}
      </div>
      <div className={`p-4 rounded-full`} style={{ backgroundColor: `${color}20` }}>
        <Icon size={32} style={{ color: color }} />
      </div>
    </div>
  </div>
);

// Centre Card Component
const CentreCard = ({ centre, isExpanded, onToggle }) => {
  const completionRate = centre.total_enrolled > 0 
    ? (centre.total_certified / centre.total_enrolled * 100).toFixed(1) 
    : 0;
  const placementRate = centre.total_certified > 0 
    ? (centre.total_placed / centre.total_certified * 100).toFixed(1) 
    : 0;

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center mb-2">
              <FaUniversity className="text-blue-500 mr-2" size={20} />
              <h3 className="text-lg font-semibold text-gray-800">{centre.centre_name}</h3>
            </div>
            <p className="text-sm text-gray-500">Code: {centre.centre_code || 'N/A'}</p>
          </div>
          <button
            onClick={() => onToggle(centre.id)}
            className="text-blue-500 hover:text-blue-600 text-sm font-medium"
          >
            {isExpanded ? 'View Less' : 'View Details'}
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Courses</p>
            <p className="text-xl font-bold text-gray-800">{centre.total_courses || 0}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Enrolled</p>
            <p className="text-xl font-bold text-blue-600">{centre.total_enrolled?.toLocaleString() || 0}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Certified</p>
            <p className="text-xl font-bold text-green-600">{centre.total_certified?.toLocaleString() || 0}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Placed</p>
            <p className="text-xl font-bold text-purple-600">{centre.total_placed?.toLocaleString() || 0}</p>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Completion Rate</span>
                  <span className="font-semibold">{completionRate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Placement Rate</span>
                  <span className="font-semibold">{placementRate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${placementRate}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600">Active Courses</p>
                  <p className="text-lg font-bold text-blue-600">{centre.active_courses || 0}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600">Success Rate</p>
                  <p className="text-lg font-bold text-green-600">
                    {centre.total_enrolled > 0 
                      ? ((centre.total_placed / centre.total_enrolled * 100).toFixed(1))
                      : 0}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Custom Tooltip for Charts
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-800 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value?.toLocaleString() || 0}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  
  // Dashboard data states
  const [overviewData, setOverviewData] = useState(null);
  const [courseStats, setCourseStats] = useState([]);
  const [monthlyTrends, setMonthlyTrends] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [genderData, setGenderData] = useState([]);
  const [years, setYears] = useState([]);
  const [centres, setCentres] = useState([]);
  const [filters, setFilters] = useState({ year: '', centre: '' });
  const [selectedChart, setSelectedChart] = useState('line');
  const [expandedCentre, setExpandedCentre] = useState(null);

useEffect(() => {
  fetchYears();
  if (user?.role === 'admin') {
    fetchCentres();
  }
  fetchDashboardData();
}, []); // Only run once on mount

useEffect(() => {
  if (filters.year || filters.centre) {
    fetchDashboardData();
  }
}, [filters, user]); // Add user as dependency

 const fetchYears = async () => {
  try {
    const response = await api.get('/dashboard/dashboard/years/');
    setYears(response.data.years || []);
  } catch (err) {
    console.error('Error fetching years:', err);
    // Set default years if API fails
    const currentYear = new Date().getFullYear();
    setYears([currentYear, currentYear - 1, currentYear - 2]);
  }
};

const fetchCentres = async () => {
  try {
    // Only fetch centres if user is admin
    if (user?.role === 'admin') {
      const response = await api.get('/dashboard/centres/');
      setCentres(response.data || []);
    }
  } catch (err) {
    console.error('Error fetching centres:', err);
    setCentres([]);
  }
};

 const fetchDashboardData = async () => {
  try {
    setLoading(true);
    setError('');
    
    const params = new URLSearchParams();
    if (filters.year) params.append('year', filters.year);
    if (filters.centre) params.append('centre_id', filters.centre);
    
    // Determine endpoint based on user role
    let endpoint = '/dashboard/dashboard/overview/';
    if (user?.role === 'admin') {
      endpoint = '/dashboard/dashboard/overview/'; // Use the same endpoint, backend handles permissions
    } else if (user?.role === 'operator') {
      endpoint = `/dashboard/overview/?centre_id=${user?.centre_id || ''}`;
    }
    
    // Fetch all dashboard data in parallel - REMOVE the duplicate 'dashboard' prefix
    const [
      overviewRes, 
      trendsRes, 
      categoryRes, 
      genderRes, 
      courseRes
    ] = await Promise.all([
      api.get(`${endpoint}?${params}`),
      api.get(`/dashboard/dashboard/monthly-trends/?${params}`),  // Fixed: removed extra /dashboard/
      api.get(`/dashboard/dashboard/category-breakdown/?${params}`), // Fixed: removed extra /dashboard/
      api.get(`/dashboard/dashboard/gender-breakdown/?${params}`), // Fixed: removed extra /dashboard/
      api.get(`/dashboard/dashboard/course-stats/?${params}`) // Fixed: removed extra /dashboard/
    ]);
    
    setOverviewData(overviewRes.data);
    setCourseStats(courseRes.data || []);
    
    // Format monthly trends
    const formattedTrends = (trendsRes.data || []).map(item => ({
      month: new Date(item.month).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      }),
      enrolled: item.enrolled || 0,
      certified: item.certified || 0,
      placed: item.placed || 0,
      fullDate: item.month
    }));
    setMonthlyTrends(formattedTrends);
    
    // Format category data
    const formattedCategory = (categoryRes.data || []).map(item => ({
      name: item.category,
      enrolled: item.enrolled || 0,
      certified: item.certified || 0,
      placed: item.placed || 0,
      value: item.enrolled || 0
    }));
    setCategoryData(formattedCategory);
    
    // Format gender data
    const formattedGender = (genderRes.data || []).map(item => ({
      name: item.gender,
      enrolled: item.enrolled || 0,
      certified: item.certified || 0,
      placed: item.placed || 0,
      value: item.enrolled || 0
    }));
    setGenderData(formattedGender);
    
  } catch (err) {
    console.error('Error fetching dashboard data:', err);
    setError('Failed to load dashboard data. Please try again.');
  } finally {
    setLoading(false);
  }
};

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({ year: '', centre: '' });
  };

  const toggleCentreExpand = (centreId) => {
    setExpandedCentre(expandedCentre === centreId ? null : centreId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-blue-500 mx-auto mb-4" size={48} />
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg">
          <FaExclamationTriangle className="text-red-500 mx-auto mb-4" size={48} />
          <p className="text-red-600 mb-2">{error}</p>
          <button 
            onClick={fetchDashboardData}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
        <div className="container mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold flex items-center">
            <FaChartLine className="mr-3" />
            Analytics Dashboard
          </h1>
          <p className="mt-2 text-blue-100">
            Welcome back, {user?.name || user?.email}!
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Filters Section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex items-center mb-4">
            <FaFilter className="text-gray-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaCalendarAlt className="inline mr-2" />
                Year
              </label>
              <select
                value={filters.year}
                onChange={(e) => handleFilterChange('year', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Years</option>
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            
            {user?.role === 'admin' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MdLocationCity className="inline mr-2" />
                  Centre
                </label>
                <select
                  value={filters.centre}
                  onChange={(e) => handleFilterChange('centre', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Centres</option>
                  {centres.map(centre => (
                    <option key={centre.id} value={centre.id}>{centre.centre_name}</option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="flex items-end">
              <button
                onClick={handleResetFilters}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <FaRedoAlt className="mr-2" />
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {overviewData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <StatCard
              title="Total Centres"
              value={overviewData.total_centres || 0}
              icon={FaSchool}
              color="#3B82F6"
            />
            <StatCard
              title="Total Courses"
              value={overviewData.total_courses || 0}
              icon={FaBookOpen}
              color="#10B981"
            />
            <StatCard
              title="Students Enrolled"
              value={overviewData.total_enrolled || 0}
              icon={HiOutlineUserGroup}
              color="#F59E0B"
              subtitle={`Completion: ${overviewData.overall_completion_rate || 0}%`}
            />
            <StatCard
              title="Students Certified"
              value={overviewData.total_certified || 0}
              icon={FaTrophy}
              color="#8B5CF6"
            />
            <StatCard
              title="Students Placed"
              value={overviewData.total_placed || 0}
              icon={FaBriefcase}
              color="#EF4444"
              subtitle={`Placement: ${overviewData.overall_placement_rate || 0}%`}
            />
          </div>
        )}

        {/* User Stats Section (for operator view) */}
        {stats && user?.role !== 'admin' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="My Courses"
              value={stats.my_courses || 0}
              icon={FaBookOpen}
              color="#10B981"
            />
            <StatCard
              title="Total Enrolled"
              value={stats.total_enrolled || 0}
              icon={HiOutlineUserGroup}
              color="#F59E0B"
            />
            <StatCard
              title="Total Certified"
              value={stats.total_certified || 0}
              icon={FaTrophy}
              color="#8B5CF6"
            />
            <StatCard
              title="Total Placed"
              value={stats.total_placed || 0}
              icon={FaBriefcase}
              color="#EF4444"
            />
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Monthly Trends Chart */}
          <div className="bg-white rounded-xl shadow-md p-6 lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <FaTrendUp className="mr-2 text-blue-500" />
                Monthly Trends
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedChart('line')}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    selectedChart === 'line' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Line
                </button>
                <button
                  onClick={() => setSelectedChart('area')}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    selectedChart === 'area' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Area
                </button>
                <button
                  onClick={() => setSelectedChart('bar')}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    selectedChart === 'bar' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Bar
                </button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              {selectedChart === 'line' && (
                <LineChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line type="monotone" dataKey="enrolled" stroke="#3B82F6" strokeWidth={2} name="Enrolled" />
                  <Line type="monotone" dataKey="certified" stroke="#10B981" strokeWidth={2} name="Certified" />
                  <Line type="monotone" dataKey="placed" stroke="#F59E0B" strokeWidth={2} name="Placed" />
                </LineChart>
              )}
              {selectedChart === 'area' && (
                <ComposedChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area type="monotone" dataKey="enrolled" fill="#3B82F6" fillOpacity={0.3} stroke="#3B82F6" name="Enrolled" />
                  <Area type="monotone" dataKey="certified" fill="#10B981" fillOpacity={0.3} stroke="#10B981" name="Certified" />
                  <Area type="monotone" dataKey="placed" fill="#F59E0B" fillOpacity={0.3} stroke="#F59E0B" name="Placed" />
                </ComposedChart>
              )}
              {selectedChart === 'bar' && (
                <BarChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="enrolled" fill="#3B82F6" name="Enrolled" />
                  <Bar dataKey="certified" fill="#10B981" name="Certified" />
                  <Bar dataKey="placed" fill="#F59E0B" name="Placed" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Category Distribution */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
              <MdCategory className="mr-2 text-purple-500" />
              Enrollment by Category
            </h2>
            {categoryData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  {categoryData.map(cat => (
                    <div key={cat.name} className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm font-medium text-gray-600">{cat.name}</p>
                      <p className="text-lg font-bold" style={{ color: CATEGORY_COLORS[cat.name] }}>
                        {cat.enrolled?.toLocaleString() || 0}
                      </p>
                      <p className="text-xs text-gray-500">
                        Certified: {cat.certified?.toLocaleString() || 0}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-500">
                No category data available
              </div>
            )}
          </div>

          {/* Gender Distribution */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
              <FaUsers className="mr-2 text-green-500" />
              Enrollment by Gender
            </h2>
            {genderData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={genderData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {genderData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.name === 'Male' ? '#3B82F6' : '#EC4899'} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  {genderData.map(gender => (
                    <div key={gender.name} className="bg-gray-50 rounded-lg p-3 text-center">
                      {gender.name === 'Male' ? (
                        <FaMale className="mx-auto text-blue-500 mb-2" size={24} />
                      ) : (
                        <FaFemale className="mx-auto text-pink-500 mb-2" size={24} />
                      )}
                      <p className="text-lg font-bold">{gender.enrolled?.toLocaleString() || 0}</p>
                      <p className="text-xs text-gray-500">Enrolled</p>
                      <p className="text-xs text-green-600 mt-1">
                        Certified: {gender.certified?.toLocaleString() || 0}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-500">
                No gender data available
              </div>
            )}
          </div>
        </div>

        {/* Course-wise Statistics Table */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
            <GiTeacher className="mr-2 text-orange-500" />
            Course-wise Performance
          </h2>
          {courseStats.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrolled</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Certified</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Placed</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Placement Rate</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {courseStats.map((course, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{course.course_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{course.total_enrolled?.toLocaleString() || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{course.total_certified?.toLocaleString() || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{course.total_placed?.toLocaleString() || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-1 mr-2">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full"
                                style={{ width: `${course.completion_rate || 0}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-sm text-gray-600">{course.completion_rate || 0}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-1 mr-2">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-purple-500 h-2 rounded-full"
                                style={{ width: `${course.placement_rate || 0}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-sm text-gray-600">{course.placement_rate || 0}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No course data available
            </div>
          )}
        </div>

        {/* Centre-wise Performance Cards */}
        {user?.role === 'admin' && overviewData?.centres_data && overviewData.centres_data.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
              <FaUniversity className="mr-2 text-blue-500" />
              Centre-wise Performance
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {overviewData.centres_data.map((centre) => (
                <CentreCard 
                  key={centre.id} 
                  centre={centre}
                  isExpanded={expandedCentre === centre.id}
                  onToggle={toggleCentreExpand}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}