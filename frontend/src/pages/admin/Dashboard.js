import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { FiUsers, FiUserCheck, FiUserX, FiFileText, FiRefreshCw } from 'react-icons/fi';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = () => {
    setLoading(true);
    api.get('/admin/dashboard')
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchStats(); }, []);

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const cards = [
    { label: 'Total Employees', value: stats?.totalEmployees, icon: FiUsers, color: 'bg-blue-500', light: 'bg-blue-50', text: 'text-blue-600' },
    { label: 'Present Today', value: stats?.presentToday, icon: FiUserCheck, color: 'bg-green-500', light: 'bg-green-50', text: 'text-green-600' },
    { label: 'Half Day', value: stats?.halfDayToday, icon: FiUserCheck, color: 'bg-yellow-500', light: 'bg-yellow-50', text: 'text-yellow-600' },
    { label: 'Absent Today', value: stats?.absentToday, icon: FiUserX, color: 'bg-red-500', light: 'bg-red-50', text: 'text-red-600' },
    { label: 'Pending Leaves', value: stats?.pendingLeaves, icon: FiFileText, color: 'bg-purple-500', light: 'bg-purple-50', text: 'text-purple-600' },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">{today}</p>
        </div>
        <button onClick={fetchStats} className="flex items-center gap-2 btn-secondary text-sm">
          <FiRefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
              <div className="h-8 bg-gray-200 rounded w-12"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {cards.map(({ label, value, icon: Icon, color, light, text }) => (
            <div key={label} className="card">
              <div className={`${light} ${text} w-10 h-10 rounded-xl flex items-center justify-center mb-3`}>
                <Icon size={20} />
              </div>
              <p className="text-2xl font-bold text-gray-800">{value ?? 0}</p>
              <p className="text-sm text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 card">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Quick Summary</h2>
        <p className="text-gray-500 text-sm">
          Today <span className="font-medium text-green-600">{stats?.presentToday ?? 0} employees present</span>,{' '}
          <span className="font-medium text-yellow-600">{stats?.halfDayToday ?? 0} half day</span>,{' '}
          <span className="font-medium text-red-600">{stats?.absentToday ?? 0} absent</span> out of{' '}
          <span className="font-medium text-blue-600">{stats?.totalEmployees ?? 0} total employees</span>.
          {stats?.pendingLeaves > 0 && (
            <span className="ml-2 text-purple-600 font-medium">
              {stats.pendingLeaves} leave request{stats.pendingLeaves > 1 ? 's' : ''} pending approval.
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
