'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import Link from 'next/link';
import { 
  FaEdit, FaSearch, FaBuilding, FaMapMarkerAlt, 
  FaPlus, FaDownload, FaFilter, FaList, FaThLarge,
  FaChevronLeft, FaChevronRight, FaTimes, FaEye
} from 'react-icons/fa';
import { MdDelete, MdLocationCity, MdOutlineFileDownload } from 'react-icons/md';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { CSVLink } from 'react-csv';

export default function CentreListPage() {
  const { user } = useAuth();
  const [centreData, setCentreData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9);
  const [selectedCentre, setSelectedCentre] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchCentresData();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredData(centreData);
    } else {
      const filtered = centreData.filter(centre => 
        centre.centre_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        centre.centre_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        centre.centre_state?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        centre.centre_code?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredData(filtered);
    }
    setCurrentPage(1);
  }, [searchTerm, centreData]);

  const fetchCentresData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/dashboard/centres/');
      setCentreData(response.data);
      setFilteredData(response.data);
    } catch (err) {
      setError('Failed to load centres data');
      console.error(err);
      toast.error('Failed to load centres data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
  };

  const handleDelete = async (id, centreName) => {
    if (window.confirm(`Are you sure you want to delete "${centreName}"? This action cannot be undone.`)) {
      try {
        await api.delete(`/dashboard/manage-centre/${id}/`);
        toast.success(`Centre "${centreName}" deleted successfully`);
        fetchCentresData();
      } catch (err) {
        console.error('Error deleting centre:', err);
        toast.error(err.response?.data?.error || 'Failed to delete centre');
      }
    }
  };

  const viewCentreDetails = (centre) => {
    setSelectedCentre(centre);
    setShowDetailsModal(true);
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Get state color - formal, consistent colors
  const getStateColor = (state) => {
    const stateColors = {
      'Delhi': 'bg-blue-50 text-blue-700 border border-blue-200',
      'Mumbai': 'bg-indigo-50 text-indigo-700 border border-indigo-200',
      'Bangalore': 'bg-green-50 text-green-700 border border-green-200',
      'Chennai': 'bg-amber-50 text-amber-700 border border-amber-200',
      'Kolkata': 'bg-rose-50 text-rose-700 border border-rose-200',
      'Pune': 'bg-purple-50 text-purple-700 border border-purple-200',
      'Hyderabad': 'bg-cyan-50 text-cyan-700 border border-cyan-200',
      'Ahmedabad': 'bg-orange-50 text-orange-700 border border-orange-200',
    };
    return stateColors[state] || 'bg-gray-50 text-gray-700 border border-gray-200';
  };

  // CSV headers and data
  const csvHeaders = [
    { label: 'S. No.', key: 'serial' },
    { label: 'Centre Name', key: 'centre_name' },
    { label: 'Centre Address', key: 'centre_address' },
    { label: 'Centre State', key: 'centre_state' },
    { label: 'Centre Code', key: 'centre_code' },
  ];

  const csvData = filteredData.map((centre, index) => ({
    serial: index + 1,
    centre_name: centre.centre_name || 'N/A',
    centre_address: centre.centre_address || 'N/A',
    centre_state: centre.centre_state || 'N/A',
    centre_code: centre.centre_code || 'N/A',
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading centres...</p>
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
            onClick={fetchCentresData}
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
          <h1 className="text-3xl font-bold text-gray-900">Centre Management</h1>
          <p className="mt-2 text-gray-600">Manage and monitor all examination centres</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Centres</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{centreData.length}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <FaBuilding className="text-blue-600 text-xl" />
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              <span className="text-green-600 font-medium">{filteredData.length}</span> currently visible
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unique States</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {new Set(centreData.map(c => c.centre_state)).size}
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <MdLocationCity className="text-green-600 text-xl" />
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              States covered across India
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">With Codes</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {centreData.filter(c => c.centre_code).length}
                </p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <FaEdit className="text-purple-600 text-xl" />
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              Centres with unique codes
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
                  placeholder="Search by name, address, state or code..."
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

            {/* Actions */}
            <div className="flex flex-wrap gap-3 items-center">
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

              {/* Add Centre Button */}
              <Link
                href="/dashboard/admin/centre/add-centre"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm hover:shadow"
              >
                <FaPlus />
                Add New Centre
              </Link>

              {/* Export CSV Button */}
              {filteredData.length > 0 && (
                <CSVLink
                  data={csvData}
                  headers={csvHeaders}
                  filename={`centres_list_${new Date().toISOString().split('T')[0]}.csv`}
                  className="inline-flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm hover:shadow"
                >
                  <MdOutlineFileDownload />
                  Export CSV
                </CSVLink>
              )}
            </div>
          </div>

          {/* Active Filters */}
          {searchTerm && (
            <div className="mt-4 flex items-center gap-2 text-sm bg-blue-50 p-3 rounded-lg">
              <FaFilter className="text-blue-600" />
              <span className="text-blue-700">Filtered by:</span>
              <span className="bg-white text-blue-700 px-3 py-1 rounded-full text-xs font-medium border border-blue-200">
                "{searchTerm}"
              </span>
              <button
                onClick={() => setSearchTerm('')}
                className="text-blue-600 hover:text-blue-800 text-xs font-medium ml-auto"
              >
                Clear filters
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
                  {currentItems.map((centre, index) => (
                    <div
                      key={centre.id}
                      className="bg-white rounded-xl shadow-sm border border-gray-800 hover:shadow-lg transition-all duration-200 overflow-hidden"
                    >
                      {/* Card Header */}
                      <div className="border-b border-gray-200 px-5 py-4 bg-gradient-to-r from-gray-50 to-white">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-50 p-2 rounded-lg">
                            <FaBuilding className="text-blue-600" />
                          </div>
                          <Link href={`/dashboard/admin/centre/view/${centre.id}/`} className="font-semibold text-gray-900 truncate flex-1 hover:underline underline-offset-4">
                            {centre.centre_name || 'Unnamed Centre'}
                          </Link>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-5 space-y-4">
                        {/* Address */}
                        <div className="flex items-start gap-3">
                          <FaMapMarkerAlt className="text-gray-400 mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Address</p>
                            <p className="text-sm text-gray-900 mt-1">
                              {centre.centre_address || 'No address provided'}
                            </p>
                          </div>
                        </div>

                        {/* State and Code */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">State</p>
                            <span className={`inline-block px-3 py-1.5 text-xs font-medium rounded-lg ${getStateColor(centre.centre_state)}`}>
                              {centre.centre_state || 'N/A'}
                            </span>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Centre Code</p>
                            <p className="text-sm font-mono font-medium text-gray-900 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                              {centre.centre_code || 'N/A'}
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-2  pt-4 border-t border-gray-200">
                          <button
                            onClick={() => viewCentreDetails(centre)}
                            className="flex-1 flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-700 hover:text-white text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors border border-gray-600"
                          >
                            <FaEye className="text-xs" />
                            View
                          </button>
                          <Link
                            href={`/dashboard/admin/centre/view/${centre.id}/`}
                            className="flex-1 flex items-center justify-center gap-2 bg-white border border-blue-600 hover:bg-blue-600 text-blue-600 hover:text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors border border-amber-200"
                          >
                            <FaEdit className="text-xs" />
                            Detail
                          </Link>
                          <Link
                            href={`/dashboard/admin/centre/edit-centre/${centre.id}/`}
                            className="flex-1 flex items-center justify-center gap-2 bg-amber-50 hover:bg-yellow-400 hover:text-black text-amber-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors border border-amber-600"
                          >
                            <FaEdit className="text-xs" />
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(centre.id, centre.centre_name)}
                            className="flex-1 flex items-center justify-center gap-2 bg-rose-50 hover:bg-red-500 hover:text-white text-rose-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors border border-rose-200"
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
                      of <span className="font-medium">{filteredData.length}</span> centres
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
                <FaBuilding className="text-6xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No centres found</h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm 
                    ? `No centres matching "${searchTerm}"` 
                    : 'Get started by adding your first centre'}
                </p>
                {!searchTerm && (
                  <Link
                    href="/dashboard/admin/centre/add-centre"
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    <FaPlus /> Add Your First Centre
                  </Link>
                )}
              </div>
            )}
          </>
        ) : (
          /* List View - Table */
          <div className="bg-white rounded-xl shadow-sm border border-gray-800 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-blue-600 text-white text-left text-sm font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-3 py-2 ">#</th>
                  <th className="px-3 py-2 ">Centre Name</th>
                  <th className="px-3 py-2 ">Address</th>
                  <th className="px-3 py-2 ">State</th>
                  <th className="px-3 py-2 ">Code</th>
                  <th className="px-3 py-2 ">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentItems.length > 0 ? (
                  currentItems.map((centre, index) => (
                    <tr key={centre.id} className="hover:bg-gray-50 transition-colors border-b border-black">
                      <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                        {indexOfFirstItem + index + 1}
                      </td>
                      <td className="px-6 py-4">
                        <Link href={`/dashboard/admin/centre/view/${centre.id}/`} className="flex items-center gap-3">
                          <div className="bg-blue-50 p-2 rounded-lg ">
                            <FaBuilding className="text-blue-600 text-sm" />
                          </div>
                          <span className="text-sm hover:underline underline-offset-4 font-semibold text-gray-900">
                            {centre.centre_name || 'N/A'}
                          </span>
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {centre.centre_address && centre.centre_address.length > 50 
                          ? centre.centre_address.slice(0, 50) + "..." 
                          : centre.centre_address || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1.5 text-xs font-medium rounded-lg ${getStateColor(centre.centre_state)}`}>
                          {centre.centre_state || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-mono font-medium text-gray-900">
                        {centre.centre_code || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => viewCentreDetails(centre)}
                            className="text-gray-600 hover:text-blue-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            title="View Details"
                          >
                            <FaEye />
                          </button>
                          <Link
                            href={`/dashboard/admin/centre/edit-centre/${centre.id}`}
                            className="text-amber-600 hover:text-amber-700 p-2 rounded-lg hover:bg-amber-50 transition-colors"
                            title="Edit"
                          >
                            <FaEdit />
                          </Link>
                          <button
                            onClick={() => handleDelete(centre.id, centre.centre_name)}
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
                      <FaBuilding className="text-4xl text-gray-300 mx-auto mb-3" />
                      {searchTerm ? 'No centres found matching your search' : 'No centres available'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination for List View */}
            {totalPages > 1 && (
              <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredData.length)} of {filteredData.length} centres
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
        {showDetailsModal && selectedCentre && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Centre Details</h2>
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
                      <FaBuilding className="text-blue-600 text-2xl" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Centre Name</p>
                      <p className="text-xl font-semibold text-gray-900">{selectedCentre.centre_name}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Centre Code</p>
                      <p className="text-lg font-mono font-semibold text-gray-900 bg-gray-50 px-4 py-3 rounded-lg border border-gray-200">
                        {selectedCentre.centre_code || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">State</p>
                      <div>
                        <span className={`inline-block px-4 py-2 text-sm font-medium rounded-lg ${getStateColor(selectedCentre.centre_state)}`}>
                          {selectedCentre.centre_state || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Full Address</p>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <p className="text-gray-900">{selectedCentre.centre_address || 'No address provided'}</p>
                    </div>
                  </div>

                  {selectedCentre.created_at && (
                    <div className="text-sm text-gray-500 border-t border-gray-200 pt-4">
                      Added on: {new Date(selectedCentre.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  )}
                </div>

                <div className="mt-8 flex gap-3">
                  <Link
                    href={`/dashboard/admin/centre/edit-centre/${selectedCentre.id}`}
                    className="flex-1 flex items-center justify-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-700 px-4 py-3 rounded-lg font-medium transition-colors border border-amber-200"
                    onClick={() => setShowDetailsModal(false)}
                  >
                    <FaEdit /> Edit Centre
                  </Link>
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleDelete(selectedCentre.id, selectedCentre.centre_name);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-700 px-4 py-3 rounded-lg font-medium transition-colors border border-rose-200"
                  >
                    <MdDelete /> Delete Centre
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