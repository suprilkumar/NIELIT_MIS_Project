'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LogIn, Mail, Phone, Lock, Loader2, Shield, AlertCircle } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email_or_contact: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(formData);
      router.push('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const [role, setRole] = useState("admin");

  const isAdmin = role === "admin";

  return (

    <>

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 px-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-6 border-t-4 
        border-t-blue-900">

          {/* ================= HEADER ================= */}
          <h2 className="text-2xl font-semibold text-center text-gray-800"> Login </h2>
          <p className={`text-sm text-center mt-1 font-medium ${isAdmin ? "text-blue-900" : "text-teal-700"}`}>
            {isAdmin ? "Administrator Access" : "Operator Access"}
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* ================= ROLE SWITCH ================= */}
          <div className="flex mt-6 rounded-lg p-1 bg-gray-100">
            <button onClick={() => setRole("admin")} className={`w-1/2 py-2 rounded-md text-sm font-semibold transition
              ${isAdmin
                ? "bg-blue-900 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-200"
              }`}> Admin </button>

            <button onClick={() => setRole("operator")} className={`w-1/2 py-2 rounded-md text-sm font-semibold transition
              ${!isAdmin
                ? "bg-teal-600 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-200"
              }`} > Operator </button>
          </div>

          {/* ================= LOGIN FORM ================= */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-black">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email or Phone
              </label>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                {formData.email_or_contact.includes('@') ? (
                  <Mail className="h-5 w-5 text-gray-400" />
                ) : (
                  <Phone className="h-5 w-5 text-gray-400" />
                )}
              </div>
              <input
                id="email_or_contact"
                name="email_or_contact"
                type="text"
                required
                value={formData.email_or_contact}
                onChange={handleChange}
                placeholder="Enter email or phone number"
                className={`mt-1 w-full px-3 py-2 border rounded-md focus:outline-none
                focus:ring-2 ${isAdmin
                    ? "focus:ring-blue-900"
                    : "focus:ring-teal-600"
                  }`}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                placeholder="Enter password"
                id="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                className={`mt-1 w-full px-3 py-2 border rounded-md focus:outline-none
                focus:ring-2 ${isAdmin
                    ? "focus:ring-blue-900"
                    : "focus:ring-teal-600"
                  }`}
              />
            </div>

            {/* Role Indicator */}
            <div
              className={`text-xs px-3 py-1 rounded-md font-medium w-fit
              ${isAdmin
                  ? "bg-blue-100 text-blue-900"
                  : "bg-teal-100 text-teal-700"
                }`}
            >
              Logging in as {isAdmin ? "Admin" : "Operator"}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-2 rounded-md text-white font-semibold transition flex items-center justify-center gap-2
              ${isLoading ? "opacity-80 cursor-not-allowed" : ""}
              ${isAdmin
                  ? "bg-blue-900 hover:bg-blue-800"
                  : "bg-teal-600 hover:bg-teal-500"
                }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  <span>Login as {isAdmin ? "Admin" : "Operator"}</span>
                </>
              )}
            </button>

          </form>

          {/* ================= FOOTER ================= */}
          <p className="text-xs text-center text-gray-400 mt-5">
            © {new Date().getFullYear()} Your Organization
          </p>
        </div>
      </div>
    </>
  );
}