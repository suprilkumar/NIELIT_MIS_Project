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
  Building2,
  MapPin,
  Code2,
  Phone,
  Mail,
  Globe,
  FileText,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { FaBuilding, FaMapMarkerAlt, FaCode, FaCity, FaPhone, FaEnvelope, FaGlobe, FaFileAlt } from 'react-icons/fa';

export default function EditCentrePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('basic'); // 'basic' or 'additional'
  
  const [formData, setFormData] = useState({
    centre_name: '',
    centre_address: '',
    centre_state: '',
    centre_code: '',
    centre_phone: '',
    centre_email: '',
    centre_website: '',
    centre_description: '',
    is_active: true
  });

  useEffect(() => {
    if (id) {
      fetchCentreDetails();
    }
  }, [id]);

  const fetchCentreDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/dashboard/manage-centre/${id}/`);
      const centreData = response.data;
      
      setFormData({
        centre_name: centreData.centre_name || '',
        centre_address: centreData.centre_address || '',
        centre_state: centreData.centre_state || '',
        centre_code: centreData.centre_code || '',
        centre_phone: centreData.centre_phone || '',
        centre_email: centreData.centre_email || '',
        centre_website: centreData.centre_website || '',
        centre_description: centreData.centre_description || '',
        is_active: centreData.is_active !== undefined ? centreData.is_active : true
      });
      
    } catch (err) {
      console.error('Error fetching centre details:', err);
      setError('Failed to load centre details');
      toast.error('Failed to load centre details');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.centre_name.trim()) {
      toast.error('Centre name is required');
      return;
    }

    try {
      setSubmitting(true);
      
      const response = await api.put(`/dashboard/manage-centre/${id}/`, formData);
      
      toast.success(response.data.message || 'Centre updated successfully');
      
      setTimeout(() => {
        router.push('/dashboard/admin/centre');
        router.refresh();
      }, 1500);
      
    } catch (err) {
      console.error('Error updating centre:', err);
      
      if (err.response?.data?.details) {
        const errors = err.response.data.details;
        Object.keys(errors).forEach(key => {
          toast.error(`${key}: ${errors[key]}`);
        });
      } else {
        toast.error(err.response?.data?.error || 'Failed to update centre');
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
          <p className="mt-4 text-gray-600">Loading centre details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="text-red-500 w-16 h-16 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Centre</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link 
            href="/dashboard/admin/centre" 
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Centres
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <Link
              href="/dashboard/admin/centre"
              className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Centre</h1>
              <p className="mt-2 text-gray-600">
                Update the information for <span className="font-semibold text-gray-900">{formData.centre_name}</span>
              </p>
            </div>
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
                onClick={() => setActiveTab('additional')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'additional'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Additional Details
              </button>
            </div>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-6">
            {activeTab === 'basic' ? (
              <div className="space-y-6">
                {/* Centre Name */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Centre Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building2 className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="centre_name"
                      value={formData.centre_name}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-900"
                      placeholder="Enter centre name"
                      required
                    />
                  </div>
                </div>

                {/* Centre Code */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Centre Code
                  </label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Code2 className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="centre_code"
                      value={formData.centre_code}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-900"
                      placeholder="e.g., MUM001"
                    />
                  </div>
                  <p className="text-xs text-gray-500">Unique identifier for the centre</p>
                </div>

                {/* Centre Address */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Centre Address
                  </label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute top-3 left-3 pointer-events-none">
                      <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <textarea
                      name="centre_address"
                      value={formData.centre_address}
                      onChange={handleChange}
                      rows="3"
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-900"
                      placeholder="Enter complete address"
                    />
                  </div>
                </div>

                {/* State */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    State
                  </label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaCity className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="centre_state"
                      value={formData.centre_state}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-900"
                      placeholder="Enter state"
                    />
                  </div>
                </div>

                {/* Active Status */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={formData.is_active}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div className={`w-10 h-6 rounded-full transition-colors duration-200 ease-in-out ${
                        formData.is_active ? 'bg-green-500' : 'bg-gray-300'
                      }`}>
                        <div className={`absolute w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-200 ease-in-out ${
                          formData.is_active ? 'translate-x-5' : 'translate-x-1'
                        }`} style={{ top: '4px' }}></div>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-900">Centre is active</span>
                      <p className="text-xs text-gray-500 mt-1">
                        Active centres are visible and available for exam allocations
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Phone */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Phone Number
                  </label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      name="centre_phone"
                      value={formData.centre_phone}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-900"
                      placeholder="e.g., +91 1234567890"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Email Address
                  </label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      name="centre_email"
                      value={formData.centre_email}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-900"
                      placeholder="e.g., centre@example.com"
                    />
                  </div>
                </div>

                {/* Website */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Website
                  </label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Globe className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="url"
                      name="centre_website"
                      value={formData.centre_website}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-900"
                      placeholder="e.g., https://www.centre.com"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Description
                  </label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute top-3 left-3 pointer-events-none">
                      <FileText className="h-5 w-5 text-gray-400" />
                    </div>
                    <textarea
                      name="centre_description"
                      value={formData.centre_description}
                      onChange={handleChange}
                      rows="4"
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-900"
                      placeholder="Enter centre description, facilities, or any additional information"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-4 pt-6 mt-6 border-t border-gray-200">
              <Link
                href="/dashboard/admin/centre"
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
                    Update Centre
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Help Card */}
        <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-start gap-3">
            <CheckCircle className="text-blue-600 w-5 h-5 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-blue-800 mb-1">Editing Tips</h3>
              <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li>Fields marked with <span className="text-red-500">*</span> are mandatory</li>
                <li>Centre code should be unique across all centres</li>
                <li>Toggle the active status to control centre availability</li>
                <li>Add detailed description to help identify the centre's facilities</li>
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