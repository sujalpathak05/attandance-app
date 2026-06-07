import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiHome, FiUsers, FiMapPin, FiCalendar,
  FiDollarSign, FiFileText, FiLogOut, FiMenu, FiX, FiUser, FiUserPlus
} from 'react-icons/fi';

const adminNav = [
  { to: '/admin', label: 'Dashboard', icon: FiHome, end: true },
  { to: '/admin/employees', label: 'Employees', icon: FiUsers },
  { to: '/admin/locations', label: 'Locations', icon: FiMapPin },
  { to: '/admin/attendance', label: 'Attendance', icon: FiCalendar },
  { to: '/admin/salary', label: 'Salary', icon: FiDollarSign },
  { to: '/admin/leaves', label: 'Leaves', icon: FiFileText },
  { to: '/admin/create-admin', label: 'Create Admin', icon: FiUserPlus },
];

const employeeNav = [
  { to: '/employee', label: 'Dashboard', icon: FiHome, end: true },
  { to: '/employee/leaves', label: 'Apply Leave', icon: FiFileText },
];

export default function Layout({ role }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const navItems = role === 'admin' ? adminNav : employeeNav;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <aside className={`${open ? 'w-60' : 'w-16'} bg-slate-900 text-white flex flex-col transition-all duration-300 flex-shrink-0`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          {open && <span className="font-bold text-blue-400 text-lg tracking-wide">AttendancePro</span>}
          <button onClick={() => setOpen(!open)} className="text-slate-400 hover:text-white p-1 rounded">
            {open ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 space-y-1 px-2">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`
              }
            >
              <Icon size={18} className="flex-shrink-0" />
              {open && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700">
          {open && (
            <div className="mb-3 flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <FiUser size={14} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
              </div>
            </div>
          )}
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="flex items-center gap-2 text-slate-400 hover:text-red-400 text-sm w-full px-1 py-1 rounded transition-colors"
          >
            <FiLogOut size={18} />
            {open && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
