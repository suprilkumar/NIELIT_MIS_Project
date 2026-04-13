// app/(dashboard)/dashboard/admin/verification/page.jsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Head from 'next/head';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import {
  FaCheckCircle, FaTimesCircle, FaClock, FaEye,
  FaChevronDown, FaChevronUp, FaBuilding, FaBook,
  FaUsers, FaUserGraduate, FaCheck, FaFilter,
  FaSync, FaSearch, FaArrowLeft, FaExclamationTriangle,
  FaMale, FaFemale, FaChartBar, FaDownload
} from 'react-icons/fa';
import { MdVerified, MdPending, MdLock, MdOutlineVerified } from 'react-icons/md';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function VerificationPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  // State management
  const [loading, setLoading] = useState(true);
  const [centres, setCentres] = useState([]);
  const [selectedCentre, setSelectedCentre] = useState('all');
  const [pendingEntries, setPendingEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [statusCounts, setStatusCounts] = useState({});
  const [centreWiseCounts, setCentreWiseCounts] = useState([]);
  const [expandedEntry, setExpandedEntry] = useState(null);
  const [entryDetails, setEntryDetails] = useState({});
  const [verifyingId, setVerifyingId] = useState(null);
  const [rejectModal, setRejectModal] = useState({ show: false, entryId: null });
  const [rejectRemarks, setRejectRemarks] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('pending'); // pending, verified, stats

  // Load data on mount
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchCentres();
      fetchPendingEntries();
      fetchVerificationStats();
    }
  }, [user]);

  useEffect(() => {
    filterEntries();
  }, [searchTerm, pendingEntries, selectedCentre]);

  const fetchCentres = async () => {
    try {
      const response = await api.get('/dashboard/centres/');
      setCentres(response.data.centres || []);
    } catch (err) {
      console.error('Error fetching centres:', err);
    }
  };

  const fetchPendingEntries = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCentre && selectedCentre !== 'all') {
        params.append('centre_id', selectedCentre);
      }

      const response = await api.get(`/course-entry/verification/pending/?${params.toString()}`);
      setPendingEntries(response.data.pending_entries || []);
      setStatusCounts(response.data.status_counts || {});
      setCentreWiseCounts(response.data.centre_wise_counts || []);
    } catch (err) {
      console.error('Error fetching pending entries:', err);
      toast.error('Failed to load pending entries');
    } finally {
      setLoading(false);
    }
  };

  const fetchVerificationStats = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCentre && selectedCentre !== 'all') {
        params.append('centre_id', selectedCentre);
      }

      const response = await api.get(`/course-entry/verification/stats/?${params.toString()}`);
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchEntryDetails = async (entryId) => {
    try {
      const response = await api.get(`/course-entry/verification/entry/${entryId}/`);
      setEntryDetails(prev => ({ ...prev, [entryId]: response.data.entry }));
      return response.data;
    } catch (err) {
      console.error('Error fetching entry details:', err);
      toast.error('Failed to load entry details');
      return null;
    }
  };

  const handleExpandEntry = async (entryId) => {
    if (expandedEntry === entryId) {
      setExpandedEntry(null);
    } else {
      setExpandedEntry(entryId);
      if (!entryDetails[entryId]) {
        await fetchEntryDetails(entryId);
      }
    }
  };

  const handleVerify = async (entryId) => {
    setVerifyingId(entryId);
    try {
      const response = await api.post(`/course-entry/verification/entry/${entryId}/verify/`);
      toast.success('Entry verified successfully');

      // Refresh data
      await fetchPendingEntries();
      await fetchVerificationStats();
      setExpandedEntry(null);
    } catch (err) {
      console.error('Error verifying entry:', err);
      toast.error(err.response?.data?.error || 'Failed to verify entry');
    } finally {
      setVerifyingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal.entryId) return;

    setVerifyingId(rejectModal.entryId);
    try {
      const response = await api.post(`/course-entry/verification/entry/${rejectModal.entryId}/reject/`, {
        remarks: rejectRemarks
      });
      toast.success('Entry rejected and sent back for revision');

      // Refresh data
      await fetchPendingEntries();
      await fetchVerificationStats();
      setExpandedEntry(null);
      setRejectModal({ show: false, entryId: null });
      setRejectRemarks('');
    } catch (err) {
      console.error('Error rejecting entry:', err);
      toast.error(err.response?.data?.error || 'Failed to reject entry');
    } finally {
      setVerifyingId(null);
    }
  };

  const filterEntries = () => {
    let filtered = [...pendingEntries];

    // Apply centre filter
    if (selectedCentre && selectedCentre !== 'all') {
      filtered = filtered.filter(entry => entry.centre_id === selectedCentre);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(entry =>
        entry.course_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.centre_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.course_category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredEntries(filtered);
  };

  const handleCentreChange = (e) => {
    setSelectedCentre(e.target.value);
    fetchPendingEntries();
    fetchVerificationStats();
  };

  const formatNumber = (num) => {
    return num?.toLocaleString() || '0';
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'PENDING': { color: 'yellow', icon: MdPending, text: 'Pending', bg: 'bg-yellow-100', textColor: 'text-yellow-800' },
      'PARTIAL': { color: 'orange', icon: MdPending, text: 'Partial', bg: 'bg-orange-100', textColor: 'text-orange-800' },
      'COMPLETED': { color: 'blue', icon: FaCheckCircle, text: 'Completed', bg: 'bg-blue-100', textColor: 'text-blue-800' },
      'VERIFIED': { color: 'green', icon: MdVerified, text: 'Verified', bg: 'bg-green-100', textColor: 'text-green-800' },
      'LOCKED': { color: 'gray', icon: MdLock, text: 'Locked', bg: 'bg-gray-100', textColor: 'text-gray-800' }
    };

    const config = statusConfig[status] || statusConfig['PENDING'];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.textColor}`}>
        <Icon className="text-xs" />
        {config.text}
      </span>
    );
  };

  return (
    <>
      <Head>
        <title>Entry Verification | Admin Dashboard</title>
      </Head>

      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
              <Link href="/dashboard" className="hover:text-blue-600">
                Dashboard
              </Link>
              <span>/</span>
              <span className="text-gray-700">Entry Verification</span>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Entry Verification</h1>
                <p className="mt-2 text-gray-600">
                  Review and verify course entries submitted by operators
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    fetchPendingEntries();
                    fetchVerificationStats();
                  }}
                  className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <FaSync className={loading ? 'animate-spin' : ''} />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-yellow-400">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.overall?.pending || 0}</p>
                  </div>
                  <MdPending className="text-3xl text-yellow-500" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-orange-400">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Partial</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.overall?.partial || 0}</p>
                  </div>
                  <MdPending className="text-3xl text-orange-500" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-blue-400">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.overall?.completed || 0}</p>
                  </div>
                  <FaCheckCircle className="text-3xl text-blue-500" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-green-400">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Verified</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.overall?.verified || 0}</p>
                  </div>
                  <MdVerified className="text-3xl text-green-500" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-gray-400">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Locked</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.overall?.locked || 0}</p>
                  </div>
                  <MdLock className="text-3xl text-gray-500" />
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 mb-8">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${activeTab === 'pending'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                <MdPending />
                Pending Entries ({filteredEntries.length})
              </button>
              <button
                onClick={() => setActiveTab('verified')}
                className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${activeTab === 'verified'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                <MdVerified />
                Recently Verified
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${activeTab === 'stats'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                <FaChartBar />
                Statistics
              </button>
            </div>
          </div>

          {/* Pending Entries Tab */}
          {activeTab === 'pending' && (
            <>
              {/* Filters */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Centre Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Centre
                    </label>
                    <select
                      value={selectedCentre}
                      onChange={handleCentreChange}
                      className="w-full px-3 py-2 bg-gray-50 border text-black border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Centres</option>
                      {centres.map(centre => (
                        <option key={centre.id} value={centre.id}>
                          {centre.name} ({centre.pending_count} pending)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Search */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Search
                    </label>
                    <div className="relative">
                      <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search by course, centre, or category..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Pending Entries List */}
              <div className="space-y-4">
                {loading ? (
                  // Skeleton Loader
                  [...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-400 p-6">
                      <div className="animate-pulse">
                        <div className="h-6 bg-gray-400 rounded w-1/3 mb-4"></div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="h-4 bg-gray-400 rounded"></div>
                          <div className="h-4 bg-gray-400 rounded"></div>
                          <div className="h-4 bg-gray-400 rounded"></div>
                          <div className="h-4 bg-gray-400 rounded"></div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : filteredEntries.length > 0 ? (
                  filteredEntries.map((entry) => (
                    <div key={entry.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      {/* Entry Header - Clickable */}
                      <div
                        onClick={() => handleExpandEntry(entry.id)}
                        className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                              <FaBook className="text-white text-xl" />
                            </div>
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold text-gray-900">{entry.course_name}</h3>
                                {getStatusBadge(entry.entry_status)}
                              </div>
                              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  <FaBuilding className="text-gray-400" />
                                  {entry.centre_name}
                                </span>
                                <span>•</span>
                                <span>{entry.course_category}</span>
                                <span>•</span>
                                <span>{entry.month_display}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <p className="text-sm text-gray-600">Enrolled</p>
                              <p className="font-semibold text-gray-900">{formatNumber(entry.total_enrolled)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">Certified</p>
                              <p className="font-semibold text-gray-900">{formatNumber(entry.total_certified)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">Placed</p>
                              <p className="font-semibold text-gray-900">{formatNumber(entry.total_placed)}</p>
                            </div>
                            <button className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                              {expandedEntry === entry.id ? <FaChevronUp /> : <FaChevronDown />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {expandedEntry === entry.id && (
                        <div className="border-t border-gray-200 bg-gray-50 p-6 text-black">
                          {entryDetails[entry.id] ? (
                            <div className="space-y-6">
                              {/* Demographics Grid */}
                              <div className="grid grid-cols-5 gap-x-4 border border-gray-400 p-2 rounded-md gap-y-1 text-black text-sm font-semibold">
                                <h1 >Fields</h1>

                                <h1>Enrolled</h1>
                                <h1>Trained</h1>
                                <h1>Certified</h1>
                                <h1>Placed</h1>
                                <h4 className="font-medium text-gray-900 mb-1 flex items-center gap-2">
                                  <FaUsers className="text-blue-500" /> Gender Demographics
                                </h4>
                                <h1> </h1>
                                <h1></h1>
                                <h1></h1>
                                <h1></h1>

                                <div className="flex items-center gap-2"> <FaMale className="text-blue-600" /> Male </div>
                                <h1 className="font-medium">{formatNumber(entryDetails[entry.id].male_enrolled)}</h1>
                                <h1 className="font-medium">{formatNumber(entryDetails[entry.id].male_trained)}</h1>
                                <h1 className="font-medium">{formatNumber(entryDetails[entry.id].male_certified)}</h1>
                                <h1 className="font-medium">{formatNumber(entryDetails[entry.id].male_placed)}</h1>
                                <div className="flex items-center gap-2"> <FaFemale className="text-pink-600" /> Female </div>
                                <h1 className="font-medium">{formatNumber(entryDetails[entry.id].female_enrolled)}</h1>
                                <h1 className="font-medium">{formatNumber(entryDetails[entry.id].female_trained)}</h1>
                                <h1 className="font-medium">{formatNumber(entryDetails[entry.id].female_certified)}</h1>
                                <h1 className="font-medium">{formatNumber(entryDetails[entry.id].female_placed)}</h1>
                                    <h4 className="font-medium text-gray-900 mb-1 flex items-center gap-2">
                                  <FaUsers className="text-blue-500" /> Category Demographics
                                </h4>
                                <h1> </h1>
                                <h1> </h1>
                                <h1> </h1>
                                <h1> </h1>
                                <div className="flex items-center gap-2"> SC </div>
                                <h1 className="font-medium">{formatNumber(entryDetails[entry.id].sc_enrolled)}</h1>
                                <h1 className="font-medium">{formatNumber(entryDetails[entry.id].sc_trained)}</h1>
                                <h1 className="font-medium">{formatNumber(entryDetails[entry.id].sc_certified)}</h1>
                                <h1 className="font-medium">{formatNumber(entryDetails[entry.id].sc_placed)}</h1>
                                <div className="flex items-center gap-2"> ST </div>
                                <h1 className="font-medium">{formatNumber(entryDetails[entry.id].st_enrolled)}</h1>
                                <h1 className="font-medium">{formatNumber(entryDetails[entry.id].st_trained)}</h1>
                                <h1 className="font-medium">{formatNumber(entryDetails[entry.id].st_certified)}</h1>
                                <h1 className="font-medium">{formatNumber(entryDetails[entry.id].st_placed)}</h1>
                                <div className="flex items-center gap-2"> OBC </div>
                                <h1 className="font-medium">{formatNumber(entryDetails[entry.id].obc_enrolled)}</h1>
                                <h1 className="font-medium">{formatNumber(entryDetails[entry.id].obc_trained)}</h1>
                                <h1 className="font-medium">{formatNumber(entryDetails[entry.id].obc_certified)}</h1>
                                <h1 className="font-medium">{formatNumber(entryDetails[entry.id].obc_placed)}</h1>
                                <div className="flex items-center gap-2"> PWD </div>
                                <h1 className="font-medium">{formatNumber(entryDetails[entry.id].pwd_enrolled)}</h1>
                                <h1 className="font-medium">{formatNumber(entryDetails[entry.id].pwd_trained)}</h1>
                                <h1 className="font-medium">{formatNumber(entryDetails[entry.id].pwd_certified)}</h1>
                                <h1 className="font-medium">{formatNumber(entryDetails[entry.id].pwd_placed)}</h1>

                              </div>

                              {/* Remarks */}
                              {entryDetails[entry.id].remarks && (
                                <div className="bg-white rounded-lg p-4 border border-gray-200">
                                  <h4 className="font-medium text-gray-900 mb-2">Remarks</h4>
                                  <p className="text-gray-600">{entryDetails[entry.id].remarks}</p>
                                </div>
                              )}

                              {/* Audit Info */}
                              <div className="text-sm text-gray-500 bg-white rounded-lg p-4 border border-gray-200">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p>Created by: {entryDetails[entry.id].created_by_name || 'N/A'}</p>
                                    <p>Created at: {new Date(entryDetails[entry.id].created_at).toLocaleString()}</p>
                                  </div>
                                  <div>
                                    <p>Updated by: {entryDetails[entry.id].updated_by_name || 'N/A'}</p>
                                    <p>Updated at: {new Date(entryDetails[entry.id].updated_at).toLocaleString()}</p>
                                  </div>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex justify-end gap-3">
                                <button
                                  onClick={() => setRejectModal({ show: true, entryId: entry.id })}
                                  disabled={verifyingId === entry.id}
                                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:bg-red-300 flex items-center gap-2"
                                >
                                  <FaTimesCircle />
                                  Reject
                                </button>
                                <button
                                  onClick={() => handleVerify(entry.id)}
                                  disabled={verifyingId === entry.id}
                                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:bg-green-300 flex items-center gap-2"
                                >
                                  {verifyingId === entry.id ? (
                                    <FaSync className="animate-spin" />
                                  ) : (
                                    <MdOutlineVerified />
                                  )}
                                  {verifyingId === entry.id ? 'Verifying...' : 'Verify Entry'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-center py-8">
                              <FaSync className="animate-spin text-blue-600 text-2xl" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                    <FaCheckCircle className="mx-auto text-5xl text-green-400 mb-4" />
                    <h3 className="text-xl font-medium text-gray-900 mb-2">No Pending Entries</h3>
                    <p className="text-gray-600">All entries have been verified. Great job!</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Verified Tab */}
          {activeTab === 'verified' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recently Verified Entries</h2>
              <p className="text-gray-600 text-center py-8">This feature will show recently verified entries with filters for date range.</p>
            </div>
          )}

          {/* Statistics Tab */}
          {activeTab === 'stats' && stats && (
            <div className="space-y-6">
              {/* Centre-wise Pending */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Centre-wise Pending Entries</h2>
                <div className="space-y-4">
                  {centreWiseCounts.map((centre) => (
                    <div key={centre.centre__id} className="flex items-center">
                      <div className="w-48">
                        <span className="text-sm font-medium text-gray-700">{centre.centre__centre_name}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-yellow-400 rounded-full"
                              style={{ width: `${(centre.pending_count / (statusCounts.total_pending || 1)) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-700 w-16">{centre.pending_count}</span>
                          <span className="text-xs text-gray-500 w-20">{formatNumber(centre.total_enrolled)} enrolled</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              {stats.recent && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity (Last {stats.period.days} Days)</h2>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm text-blue-600 mb-1">New Entries</p>
                      <p className="text-3xl font-bold text-blue-900">{stats.recent.new_entries || 0}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <p className="text-sm text-green-600 mb-1">Verified Entries</p>
                      <p className="text-3xl font-bold text-green-900">{stats.recent.verified_entries || 0}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {rejectModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Reject Entry</h3>
              <p className="text-gray-600 mb-4">
                Please provide remarks explaining why this entry is being rejected. The operator will need to revise and resubmit.
              </p>

              <textarea
                value={rejectRemarks}
                onChange={(e) => setRejectRemarks(e.target.value)}
                placeholder="Enter rejection remarks..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
              />

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setRejectModal({ show: false, entryId: null });
                    setRejectRemarks('');
                  }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={verifyingId === rejectModal.entryId}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:bg-red-300 flex items-center gap-2"
                >
                  {verifyingId === rejectModal.entryId ? (
                    <FaSync className="animate-spin" />
                  ) : (
                    <FaTimesCircle />
                  )}
                  Confirm Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}