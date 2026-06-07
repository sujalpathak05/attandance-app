import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Layout from './components/Layout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminEmployees from './pages/admin/Employees';
import AdminLocations from './pages/admin/Locations';
import AdminAttendance from './pages/admin/AttendanceManager';
import AdminSalary from './pages/admin/Salary';
import AdminLeaves from './pages/admin/Leaves';
import EmployeeDashboard from './pages/employee/Dashboard';
import LeaveApply from './pages/employee/LeaveApply';
import CreateAdmin from './pages/admin/CreateAdmin';
import EmployeeCalendar from './pages/admin/EmployeeCalendar';

function PrivateRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />

      <Route path="/admin" element={
        <PrivateRoute role="admin"><Layout role="admin" /></PrivateRoute>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="employees" element={<AdminEmployees />} />
        <Route path="locations" element={<AdminLocations />} />
        <Route path="attendance" element={<AdminAttendance />} />
        <Route path="salary" element={<AdminSalary />} />
        <Route path="leaves" element={<AdminLeaves />} />
        <Route path="create-admin" element={<CreateAdmin />} />
        <Route path="employees/:id/calendar" element={<EmployeeCalendar />} />
      </Route>

      <Route path="/employee" element={
        <PrivateRoute role="employee"><Layout role="employee" /></PrivateRoute>
      }>
        <Route index element={<EmployeeDashboard />} />
        <Route path="leaves" element={<LeaveApply />} />
      </Route>

      <Route path="/" element={
        user
          ? user.role === 'admin'
            ? <Navigate to="/admin" replace />
            : <Navigate to="/employee" replace />
          : <Navigate to="/login" replace />
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
