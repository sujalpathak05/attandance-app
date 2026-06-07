import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiUser, FiCalendar } from 'react-icons/fi';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const emptyForm = {
  name: '', email: '', password: '', phone: '',
  salary: '', shiftStart: '09:00', shiftEnd: '18:00',
  weekOff: [0], assignedLocation: ''
};

export default function Employees() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [locations, setLocations] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  const fetchAll = async () => {
    const [empRes, locRes] = await Promise.all([
      api.get('/admin/employees'),
      api.get('/admin/locations')
    ]);
    setEmployees(empRes.data);
    setLocations(locRes.data);
  };

  useEffect(() => { fetchAll(); }, []);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (emp) => {
    setEditing(emp._id);
    setForm({
      name: emp.name, email: emp.email, password: '',
      phone: emp.phone || '', salary: emp.salary || '',
      shiftStart: emp.shiftStart || '09:00', shiftEnd: emp.shiftEnd || '18:00',
      weekOff: emp.weekOff || [0],
      assignedLocation: emp.assignedLocation?._id || ''
    });
    setShowModal(true);
  };

  const toggleDay = (day) => {
    setForm(f => ({
      ...f,
      weekOff: f.weekOff.includes(day) ? f.weekOff.filter(d => d !== day) : [...f.weekOff, day]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, salary: Number(form.salary) };
      if (editing) {
        if (!payload.password) delete payload.password;
        await api.put(`/admin/employees/${editing}`, payload);
        toast.success('Employee updated!');
      } else {
        await api.post('/admin/employees', payload);
        toast.success('Employee added!');
      }
      setShowModal(false);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this employee?')) return;
    try {
      await api.delete(`/admin/employees/${id}`);
      toast.success('Employee deactivated');
      fetchAll();
    } catch {
      toast.error('Error deactivating employee');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Employees</h1>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <FiPlus size={16} /> Add Employee
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-600">Employee</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600">ID</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600">Shift</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600">Week Off</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600">Salary</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600">Location</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400">No employees found</td></tr>
            ) : employees.map(emp => (
              <tr key={emp._id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-xs">
                      {emp.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{emp.name}</p>
                      <p className="text-xs text-gray-400">{emp.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-gray-600">{emp.employeeId}</td>
                <td className="py-3 px-4 text-gray-600">{emp.shiftStart} - {emp.shiftEnd}</td>
                <td className="py-3 px-4 text-gray-600">
                  <div className="flex gap-1 flex-wrap">
                    {(emp.weekOff || []).map(d => (
                      <span key={d} className="bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded">{DAYS[d]}</span>
                    ))}
                  </div>
                </td>
                <td className="py-3 px-4 text-gray-600">₹{(emp.salary || 0).toLocaleString()}</td>
                <td className="py-3 px-4 text-gray-600 text-xs">{emp.assignedLocation?.name || <span className="text-red-400">Not set</span>}</td>
                <td className="py-3 px-4">
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => navigate(`/admin/employees/${emp._id}/calendar`)}
                      title="View Attendance Calendar"
                      className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                      <FiCalendar size={15} />
                    </button>
                    <button onClick={() => openEdit(emp)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <FiEdit2 size={15} />
                    </button>
                    <button onClick={() => handleDelete(emp._id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <FiTrash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FiUser /> {editing ? 'Edit Employee' : 'Add New Employee'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <FiX size={22} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input className="input-field" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input type="email" className="input-field" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password {editing && '(leave blank to keep)'}</label>
                  <input type="password" className="input-field" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder={editing ? '••••••••' : ''} required={!editing} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input className="input-field" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Salary (₹) *</label>
                  <input type="number" className="input-field" value={form.salary} onChange={e => setForm(f => ({ ...f, salary: e.target.value }))} required min="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Location</label>
                  <select className="input-field" value={form.assignedLocation} onChange={e => setForm(f => ({ ...f, assignedLocation: e.target.value }))}>
                    <option value="">-- Select Location --</option>
                    {locations.map(loc => <option key={loc._id} value={loc._id}>{loc.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shift Start Time</label>
                  <input type="time" className="input-field" value={form.shiftStart} onChange={e => setForm(f => ({ ...f, shiftStart: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shift End Time</label>
                  <input type="time" className="input-field" value={form.shiftEnd} onChange={e => setForm(f => ({ ...f, shiftEnd: e.target.value }))} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Week Off Days</label>
                <div className="flex gap-2 flex-wrap">
                  {DAYS.map((day, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleDay(i)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${form.weekOff.includes(i)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'}`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1">Week off days are paid days.</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={loading} className="btn-primary flex-1">
                  {loading ? 'Saving...' : editing ? 'Update Employee' : 'Add Employee'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary px-6">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
