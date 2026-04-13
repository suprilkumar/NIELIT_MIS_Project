'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import api from '@/lib/api';
import { Users, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export default function OperatorPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOperatorData();
  }, []);

  const fetchOperatorData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/dashboard/operator/');
      setTasks(response.data.tasks || []);
    } catch (err) {
      setError('Failed to load operator data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskAction = async (taskId, action) => {
    try {
      // In a real app, you would call an API endpoint
      setTasks(tasks.map(task => 
        task.id === taskId 
          ? { ...task, status: action === 'complete' ? 'completed' : 'in_progress' }
          : task
      ));
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredRole="operator">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Operator Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage daily operations and tasks</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Task Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-lg mr-4">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">24</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-lg mr-4">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">8</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-lg mr-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">16</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tasks List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Pending Tasks</h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <div key={task.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h3 className="text-sm font-medium text-gray-900">
                          {task.title}
                        </h3>
                        <span className={`ml-3 px-2 py-1 text-xs font-medium rounded-full ${
                          task.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : task.status === 'in_progress'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {task.status === 'completed' ? 'Completed' : 
                           task.status === 'in_progress' ? 'In Progress' : 'Pending'}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        Task ID: #{task.id} • Created: Today
                      </p>
                    </div>
                    
                    <div className="ml-4 flex space-x-2">
                      {task.status !== 'completed' && (
                        <button
                          onClick={() => handleTaskAction(task.id, 'complete')}
                          className="px-3 py-1 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700"
                        >
                          Mark Complete
                        </button>
                      )}
                      <button className="px-3 py-1 border border-gray-300 text-gray-700 text-sm font-medium rounded hover:bg-gray-50">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto" />
                <p className="mt-2 text-gray-500">No pending tasks</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
              <Users className="h-6 w-6 text-gray-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">View Users</span>
            </button>
            <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
              <FileText className="h-6 w-6 text-gray-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Create Report</span>
            </button>
            <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
              <CheckCircle className="h-6 w-6 text-gray-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Approve Requests</span>
            </button>
            <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
              <AlertCircle className="h-6 w-6 text-gray-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">View Alerts</span>
            </button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}