import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { FiFilter, FiEdit2, FiX, FiCalendar, FiClock } from 'react-icons/fi';

const STATUS_OPTIONS = ['present', 'half-day', 'absent', 'week-off', 'paid-leave', 'unpaid-leave'];
const STATUS_COLORS = {
  present: 'badge-present',
  'half-day': 'badge-half',
  absent: 'badge-absent',
  'week-off': 'badge-weekoff',
  'paid-leave': 'badge-leave',
  'unpaid-leave': 'badge-leave'
};

export default function AttendanceManager() {
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [filters, setFilters] = useState({ month: new Date().toISOString().slice(0, 7), employeeId: '' });
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ status: '', adminNote: '', punches: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/admin/employees').then(r => setEmployees(r.data));
  }, []);

  const fetchRecords = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.month) params.append('month', filters.month);
    if (filters.employeeId) params.append('employeeId', filters.employeeId);
    api.get(`/admin/attendance?${params}`)
      .then(r => setRecords(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRecords(); }, [filters]);

  const openEdit = (rec) => {
    setEditing(rec._id);
    setEditForm({
      status: rec.status,
      adminNote: rec.adminNote || '',
      punches: rec.punches.map(p => ({
        type: p.type,
        time: new Date(p.time).toISOString().slice(0, 16)
      }))
    });
  };

  const handleSave = async () => {
    try {
      await api.put(`/admin/attendance/${editing}`, editForm);
      toast.success('Attendance updated!');
      setEditing(null);
      fetchRecords();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  const formatTime = (t) => new Date(t).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Attendance Management</h1>
      </div>

      {/* Filters */}
      <div className="card mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
          <input type="month" className="input-field" value={filters.month}
            onChange={e => setFilters(f => ({ ...f, month: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
          <select className="input-field" value={filters.employeeId}
            onChange={e => setFilters(f => ({ ...f, employeeId: e.target.value }))}>
            <option value="">All Employees</option>
            {employees.map(emp => <option key={emp._id} value={emp._id}>{emp.name} ({emp.employeeId})</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <FiFilter size={14} />
          <span>{records.length} records</span>
        </div>
      </div>

      <div className="card overflow-x-auto">
        {loading ? (
          <div className="text-center py-10 text-gray-400">Loading...</div>
        ) : records.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <FiCalendar size={40} className="mx-auto mb-3 opacity-30" />
            <p>No attendance records found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Date</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Employee</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Punches</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Hours</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Note</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map(rec => (
                <tr key={rec._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <p className="font-medium text-gray-800">{formatDate(rec.date + 'T00:00:00')}</p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-medium text-gray-800">{rec.employee?.name}</p>
                    <p className="text-xs text-gray-400">{rec.employee?.employeeId}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className={STATUS_COLORS[rec.status] || 'badge-absent'}>{rec.status}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="space-y-1">
                      {rec.punches.map((p, i) => (
                        <div key={i} className={`text-xs flex items-center gap-1 ${p.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                          <FiClock size={11} />
                          {p.type.toUpperCase()}: {formatTime(p.time)}
                        </div>
                      ))}
                      {rec.punches.length === 0 && <span className="text-xs text-gray-400">No punches</span>}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{rec.totalHours > 0 ? `${rec.totalHours.toFixed(1)}h` : '-'}</td>
                  <td className="py-3 px-4 text-xs text-gray-500">{rec.adminNote || '-'}</td>
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => openEdit(rec)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg">
                      <FiEdit2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FiEdit2 /> Edit Attendance
              </h2>
              <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600"><FiX size={22} /></button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select className="input-field" value={editForm.status}
                  onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}>
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Punch Times</label>
                <div className="space-y-2">
                  {editForm.punches.map((p, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <select value={p.type} onChange={e => {
                        const punches = [...editForm.punches];
                        punches[i] = { ...p, type: e.target.value };
                        setEditForm(f => ({ ...f, punches }));
                      }} className="input-field w-24">
                        <option value="in">IN</option>
                        <option value="out">OUT</option>
                      </select>
                      <input type="datetime-local" value={p.time} onChange={e => {
                        const punches = [...editForm.punches];
                        punches[i] = { ...p, time: e.target.value };
                        setEditForm(f => ({ ...f, punches }));
                      }} className="input-field flex-1" />
                      <button onClick={() => setEditForm(f => ({ ...f, punches: f.punches.filter((_, j) => j !== i) }))}
                        className="text-red-500 hover:text-red-700">
                        <FiX size={16} />
                      </button>
                    </div>
                  ))}
                  <button onClick={() => setEditForm(f => ({
                    ...f, punches: [...f.punches, { type: 'in', time: new Date().toISOString().slice(0, 16) }]
                  }))} className="btn-secondary text-sm w-full">+ Add Punch</button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin Note</label>
                <textarea className="input-field" rows={2} value={editForm.adminNote}
                  onChange={e => setEditForm(f => ({ ...f, adminNote: e.target.value }))}
                  placeholder="Reason for edit..." />
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={handleSave} className="btn-primary flex-1">Save Changes</button>
                <button onClick={() => setEditing(null)} className="btn-secondary px-6">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
