'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import Link from 'next/link';
import { 
  FaEdit, FaSearch, FaFolder, FaPlus, FaDownload, FaFilter, 
  FaList, FaThLarge, FaChevronLeft, FaChevronRight, FaTimes,
  FaEye, FaCalendarAlt, FaTag, FaAlignLeft
} from 'react-icons/fa';
import { MdDelete, MdCategory, MdOutlineCategory } from 'react-icons/md';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { CSVLink } from 'react-csv';

export default function CourseCategoryPage() {
  const { user } = useAuth();
  const [courseCategoryData, setCourseCategoryData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    fetchCourseCategoryData();
  }, []);

  useEffect(() => {
    // Filter categories based on search term and type filter
    let filtered = courseCategoryData;
    
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(category => 
        category.course_category_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.course_category_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.course_category_desc?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (typeFilter) {
      filtered = filtered.filter(category => 
        category.course_category_type === typeFilter
      );
    }
    
    setFilteredData(filtered);
    setCurrentPage(1);
  }, [searchTerm, typeFilter, courseCategoryData]);

  const fetchCourseCategoryData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/dashboard/course-categories/');
      setCourseCategoryData(response.data);
      setFilteredData(response.data);
    } catch (err) {
      setError('Failed to load course category data');
      console.error(err);
      toast.error('Failed to load course category data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
  };

  const handleDelete = async (id, categoryName) => {
    if (window.confirm(`Are you sure you want to delete "${categoryName}"? This action cannot be undone.`)) {
      try {
        await api.delete(`/dashboard/course-category/manage/${id}/`);
        toast.success(`Category "${categoryName}" deleted successfully`);
        fetchCourseCategoryData();
      } catch (err) {
        console.error('Error deleting course category:', err);
        toast.error(err.response?.data?.error || 'Failed to delete course category');
      }
    }
  };

  const viewCategoryDetails = (category) => {
    setSelectedCategory(category);
    setShowDetailsModal(true);
  };

  // Get unique types for filter dropdown
  const uniqueTypes = [...new Set(courseCategoryData.map(c => c.course_category_type).filter(Boolean))];

  // Get category type badge color
  const getTypeColor = (type) => {
    const typeColors = {
      'A': 'bg-blue-50 text-blue-700 border border-blue-200',
      'B': 'bg-green-50 text-green-700 border border-green-200',
      'C': 'bg-amber-50 text-amber-700 border border-amber-200',
      'D': 'bg-purple-50 text-purple-700 border border-purple-200',
      'E': 'bg-indigo-50 text-indigo-700 border border-indigo-200',
      'F': 'bg-pink-50 text-pink-700 border border-pink-200',
      'G': 'bg-cyan-50 text-cyan-700 border border-cyan-200',
      'H': 'bg-orange-50 text-orange-700 border border-orange-200',
      'I': 'bg-teal-50 text-teal-700 border border-teal-200',
    };
    return typeColors[type] || 'bg-gray-50 text-gray-700 border border-gray-200';
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // CSV headers and data
  const csvHeaders = [
    { label: 'S. No.', key: 'serial' },
    { label: 'Category Name', key: 'category_name' },
    { label: 'Category Type', key: 'category_type' },
    { label: 'Description', key: 'description' },
    { label: 'Date Added', key: 'date_added' },
  ];

  const csvData = filteredData.map((category, index) => ({
    serial: index + 1,
    category_name: category.course_category_name || 'N/A',
    category_type: category.course_category_type || 'N/A',
    description: category.course_category_desc || 'N/A',
    date_added: formatDate(category.created_datetime),
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading course categories...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={fetchCourseCategoryData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Course Categories</h1>
          <p className="mt-2 text-gray-600">Manage and organize your course categories effectively</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Categories</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{courseCategoryData.length}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <MdCategory className="text-blue-600 text-xl" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Category Types</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{uniqueTypes.length}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <FaTag className="text-green-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">With Descriptions</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {courseCategoryData.filter(c => c.course_category_desc).length}
                </p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <FaAlignLeft className="text-purple-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {courseCategoryData.filter(c => {
                    if (!c.created_datetime) return false;
                    const date = new Date(c.created_datetime);
                    const now = new Date();
                    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
              <div className="bg-amber-50 p-3 rounded-lg">
                <FaCalendarAlt className="text-amber-600 text-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Top Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            
            {/* Search Bar */}
            <div className="w-full lg:w-96">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                  placeholder="Search by name, type or description..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    <FaTimes />
                  </button>
                )}
              </div>
            </div>

            {/* Filters and Actions */}
            <div className="flex flex-wrap gap-3 items-center">
              {/* Type Filter */}
              {uniqueTypes.length > 0 && (
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Types</option>
                  {uniqueTypes.map(type => (
                    <option key={type} value={type}>Type {type}</option>
                  ))}
                </select>
              )}

              {/* View Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                    viewMode === 'grid' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <FaThLarge /> Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                    viewMode === 'list' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <FaList /> List
                </button>
              </div>

              {/* Add Category Button */}
              <Link
                href="/dashboard/admin/course-category/add-course-category"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm hover:shadow"
              >
                <FaPlus />
                Add Category
              </Link>

              {/* Export CSV Button */}
              {filteredData.length > 0 && (
                <CSVLink
                  data={csvData}
                  headers={csvHeaders}
                  filename={`course_categories_${new Date().toISOString().split('T')[0]}.csv`}
                  className="inline-flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm hover:shadow"
                >
                  <FaDownload />
                  Export CSV
                </CSVLink>
              )}
            </div>
          </div>

          {/* Active Filters */}
          {(searchTerm || typeFilter) && (
            <div className="mt-4 flex items-center gap-2 text-sm bg-blue-50 p-3 rounded-lg">
              <FaFilter className="text-blue-600" />
              <span className="text-blue-700">Active filters:</span>
              {searchTerm && (
                <span className="bg-white text-blue-700 px-3 py-1 rounded-full text-xs font-medium border border-blue-200">
                  Search: "{searchTerm}"
                </span>
              )}
              {typeFilter && (
                <span className="bg-white text-blue-700 px-3 py-1 rounded-full text-xs font-medium border border-blue-200">
                  Type: {typeFilter}
                </span>
              )}
              <button
                onClick={() => {
                  setSearchTerm('');
                  setTypeFilter('');
                }}
                className="text-blue-600 hover:text-blue-800 text-xs font-medium ml-auto"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Cards Grid View */}
        {viewMode === 'grid' ? (
          <>
            {currentItems.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {currentItems.map((category, index) => (
                    <div
                      key={category.id}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200 overflow-hidden"
                    >
                      {/* Card Header */}
                      <div className="border-b border-gray-200 px-5 py-4 bg-gradient-to-r from-gray-50 to-white">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-50 p-2 rounded-lg">
                            <MdOutlineCategory className="text-blue-600" />
                          </div>
                          <h3 className="font-semibold text-gray-900 truncate flex-1">
                            {category.course_category_name || 'Unnamed Category'}
                          </h3>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getTypeColor(category.course_category_type)}`}>
                            Type {category.course_category_type || 'N/A'}
                          </span>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-5 space-y-4">
                        {/* Description */}
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Description</p>
                          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">
                            {category.course_category_desc && category.course_category_desc.length > 120 
                              ? category.course_category_desc.slice(0, 120) + "..." 
                              : category.course_category_desc || 'No description provided'}
                          </p>
                        </div>

                        {/* Date Added */}
                        <div className="flex items-center gap-2 text-sm">
                          <FaCalendarAlt className="text-gray-400" />
                          <span className="text-gray-600">Added on:</span>
                          <span className="font-medium text-gray-900">
                            {formatDate(category.created_datetime)}
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-4 border-t border-gray-200">
                          <button
                            onClick={() => viewCategoryDetails(category)}
                            className="flex-1 flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors border border-gray-200"
                          >
                            <FaEye className="text-xs" />
                            View
                          </button>
                          <Link
                            href={`/dashboard/admin/course-category/edit-course-category/${category.id}`}
                            className="flex-1 flex items-center justify-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors border border-amber-200"
                          >
                            <FaEdit className="text-xs" />
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(category.id, category.course_category_name)}
                            className="flex-1 flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors border border-rose-200"
                          >
                            <MdDelete className="text-xs" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-4">
                    <div className="text-sm text-gray-600">
                      Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(indexOfLastItem, filteredData.length)}
                      </span>{' '}
                      of <span className="font-medium">{filteredData.length}</span> categories
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`p-2 rounded-lg border ${
                          currentPage === 1
                            ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                            : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <FaChevronLeft className="text-sm" />
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                        <button
                          key={number}
                          onClick={() => paginate(number)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === number
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-600 hover:bg-gray-50 border border-gray-300'
                          }`}
                        >
                          {number}
                        </button>
                      ))}
                      <button
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`p-2 rounded-lg border ${
                          currentPage === totalPages
                            ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                            : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <FaChevronRight className="text-sm" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
                <FaFolder className="text-6xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No categories found</h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm || typeFilter 
                    ? 'Try adjusting your filters or search term' 
                    : 'Get started by adding your first course category'}
                </p>
                {!searchTerm && !typeFilter && (
                  <Link
                    href="/dashboard/admin/course-category/add-course-category"
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    <FaPlus /> Add Your First Category
                  </Link>
                )}
              </div>
            )}
          </>
        ) : (
          /* List View - Table */
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category Name</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Added</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentItems.length > 0 ? (
                  currentItems.map((category, index) => (
                    <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                        {indexOfFirstItem + index + 1}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-50 p-2 rounded-lg">
                            <MdOutlineCategory className="text-blue-600 text-sm" />
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {category.course_category_name || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1.5 text-xs font-medium rounded-lg ${getTypeColor(category.course_category_type)}`}>
                          Type {category.course_category_type || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                        {category.course_category_desc && category.course_category_desc.length > 60 
                          ? category.course_category_desc.slice(0, 60) + "..." 
                          : category.course_category_desc || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <FaCalendarAlt className="text-gray-400 text-xs" />
                          {formatDate(category.created_datetime)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => viewCategoryDetails(category)}
                            className="text-gray-600 hover:text-blue-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            title="View Details"
                          >
                            <FaEye />
                          </button>
                          <Link
                            href={`/dashboard/admin/course-category/edit-course-category/${category.id}`}
                            className="text-amber-600 hover:text-amber-700 p-2 rounded-lg hover:bg-amber-50 transition-colors"
                            title="Edit"
                          >
                            <FaEdit />
                          </Link>
                          <button
                            onClick={() => handleDelete(category.id, category.course_category_name)}
                            className="text-rose-600 hover:text-rose-700 p-2 rounded-lg hover:bg-rose-50 transition-colors"
                            title="Delete"
                          >
                            <MdDelete />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-sm text-gray-500">
                      <FaFolder className="text-4xl text-gray-300 mx-auto mb-3" />
                      {searchTerm || typeFilter ? 'No categories found matching your criteria' : 'No categories available'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination for List View */}
            {totalPages > 1 && (
              <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredData.length)} of {filteredData.length} categories
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-lg border ${
                      currentPage === 1
                        ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <FaChevronLeft className="text-sm" />
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-lg border ${
                      currentPage === totalPages
                        ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <FaChevronRight className="text-sm" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Details Modal */}
        {showDetailsModal && selectedCategory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Category Details</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FaTimes size={20} />
                </button>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
                    <div className="bg-blue-100 p-4 rounded-full">
                      <MdCategory className="text-blue-600 text-2xl" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Category Name</p>
                      <p className="text-xl font-semibold text-gray-900">{selectedCategory.course_category_name}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">Category Type</p>
                      <span className={`inline-block px-4 py-2 text-sm font-medium rounded-lg ${getTypeColor(selectedCategory.course_category_type)}`}>
                        Type {selectedCategory.course_category_type || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">Date Added</p>
                      <div className="flex items-center gap-2 text-gray-900">
                        <FaCalendarAlt className="text-gray-400" />
                        <span>{formatDate(selectedCategory.created_datetime)}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Description</p>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <p className="text-gray-900 whitespace-pre-wrap">
                        {selectedCategory.course_category_desc || 'No description provided'}
                      </p>
                    </div>
                  </div>

                  {selectedCategory.updated_datetime && selectedCategory.updated_datetime !== selectedCategory.created_datetime && (
                    <div className="text-sm text-gray-500 border-t border-gray-200 pt-4">
                      Last updated: {formatDate(selectedCategory.updated_datetime)}
                    </div>
                  )}
                </div>

                <div className="mt-8 flex gap-3">
                  <Link
                    href={`/dashboard/admin/course-category/edit-course-category/${selectedCategory.id}`}
                    className="flex-1 flex items-center justify-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-700 px-4 py-3 rounded-lg font-medium transition-colors border border-amber-200"
                    onClick={() => setShowDetailsModal(false)}
                  >
                    <FaEdit /> Edit Category
                  </Link>
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleDelete(selectedCategory.id, selectedCategory.course_category_name);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-700 px-4 py-3 rounded-lg font-medium transition-colors border border-rose-200"
                  >
                    <MdDelete /> Delete Category
                  </button>
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