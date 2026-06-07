import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {
  FiArrowLeft, FiChevronLeft, FiChevronRight,
  FiClock, FiEdit2, FiX, FiCheckCircle, FiAlertCircle
} from 'react-icons/fi';

const DAY_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const DAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const STATUS_META = {
  present:       { color: 'bg-green-500 text-white',         label: 'Present',      light: 'bg-green-50 text-green-700 border-green-200' },
  'half-day':    { color: 'bg-yellow-400 text-white',        label: 'Half Day',     light: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  absent:        { color: 'bg-red-400 text-white',           label: 'Absent',       light: 'bg-red-50 text-red-700 border-red-200' },
  'week-off':    { color: 'bg-gray-300 text-gray-700',       label: 'Week Off',     light: 'bg-gray-50 text-gray-600 border-gray-200' },
  'paid-leave':  { color: 'bg-blue-400 text-white',          label: 'Paid Leave',   light: 'bg-blue-50 text-blue-700 border-blue-200' },
  'unpaid-leave':{ color: 'bg-purple-400 text-white',        label: 'Unpaid Leave', light: 'bg-purple-50 text-purple-700 border-purple-200' },
};

const STATUS_OPTIONS = ['present', 'half-day', 'absent', 'week-off', 'paid-leave', 'unpaid-leave'];

export default function EmployeeCalendar() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [records, setRecords] = useState([]);
  const [loadError, setLoadError] = useState(false);
  const [calMonth, setCalMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedDay, setSelectedDay] = useState(null);
  const [editForm, setEditForm] = useState({ status: '', adminNote: '', punches: [] });
  const [saving, setSaving] = useState(false);

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const fetchEmployee = useCallback(async () => {
    try {
      // Try single employee endpoint first
      const res = await api.get(`/admin/employees/${id}`);
      setEmployee(res.data);
    } catch {
      // Fallback: get from employee list
      try {
        const res = await api.get('/admin/employees');
        const emp = res.data.find(e => e._id === id);
        if (emp) setEmployee(emp);
        else setLoadError(true);
      } catch {
        setLoadError(true);
      }
    }
  }, [id]);

  const fetchRecords = useCallback(async () => {
    try {
      const res = await api.get(`/admin/attendance?employeeId=${id}&month=${calMonth}`);
      setRecords(res.data);
    } catch {}
  }, [id, calMonth]);

  useEffect(() => { fetchEmployee(); }, [fetchEmployee]);
  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  // Calendar
  const [calYear, calMonthNum] = calMonth.split('-').map(Number);
  const firstDay = new Date(calYear, calMonthNum - 1, 1).getDay();
  const daysInMonth = new Date(calYear, calMonthNum, 0).getDate();
  const recordMap = {};
  records.forEach(r => { recordMap[r.date] = r; });

  const isWeekOffDay = (dayNum) =>
    employee?.weekOff?.includes(new Date(calYear, calMonthNum - 1, dayNum).getDay());

  const prevMonth = () => {
    const d = new Date(calYear, calMonthNum - 2, 1);
    setCalMonth(d.toISOString().slice(0, 7));
  };
  const nextMonth = () => {
    const d = new Date(calYear, calMonthNum, 1);
    if (d <= today) setCalMonth(d.toISOString().slice(0, 7));
  };

  const getDayStyle = (dayNum) => {
    const dateStr = `${calMonth}-${String(dayNum).padStart(2, '0')}`;
    const fullDate = new Date(calYear, calMonthNum - 1, dayNum);
    const isFuture = fullDate > today;
    const isToday = dateStr === todayStr;

    if (isToday) return { bg: 'ring-2 ring-blue-500 bg-white', status: null };
    if (isFuture) return { bg: 'bg-gray-50 text-gray-300 cursor-not-allowed', status: null };

    const rec = recordMap[dateStr];
    if (rec) {
      const meta = STATUS_META[rec.status];
      return { bg: meta ? meta.color + ' cursor-pointer hover:opacity-80' : 'bg-red-400 text-white cursor-pointer', status: rec.status };
    }
    if (isWeekOffDay(dayNum)) {
      return { bg: STATUS_META['week-off'].color + ' cursor-pointer hover:opacity-80', status: 'week-off' };
    }
    return { bg: 'bg-red-400 text-white cursor-pointer hover:opacity-80', status: 'absent' };
  };

  const handleDayClick = (dayNum) => {
    const dateStr = `${calMonth}-${String(dayNum).padStart(2, '0')}`;
    const fullDate = new Date(calYear, calMonthNum - 1, dayNum);
    if (fullDate >= today) return; // can't edit today or future

    const rec = recordMap[dateStr];
    setSelectedDay({ dateStr, record: rec || null, dayNum });
    setEditForm({
      status: rec?.status || (isWeekOffDay(dayNum) ? 'week-off' : 'absent'),
      adminNote: rec?.adminNote || '',
      punches: rec?.punches?.map(p => ({
        type: p.type,
        time: new Date(p.time).toISOString().slice(0, 16)
      })) || []
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (selectedDay.record) {
        // Update existing record
        await api.put(`/admin/attendance/${selectedDay.record._id}`, editForm);
      } else {
        // Create new manual record
        await api.post('/admin/attendance/manual', {
          employeeId: id,
          date: selectedDay.dateStr,
          status: editForm.status,
          adminNote: editForm.adminNote
        });
      }
      toast.success('Attendance updated!');
      setSelectedDay(null);
      fetchRecords();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    } finally {
      setSaving(false);
    }
  };

  const markFullDay = async (dayData) => {
    setSaving(true);
    try {
      if (dayData.record) {
        await api.put(`/admin/attendance/${dayData.record._id}`, {
          status: 'present',
          adminNote: 'Admin ne half day se full day kiya'
        });
      }
      toast.success('Half Day → Full Day (Present) ho gaya!');
      setSelectedDay(null);
      fetchRecords();
    } catch (err) {
      toast.error('Error updating');
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (t) => new Date(t).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  // Monthly stats
  const stats = STATUS_OPTIONS.map(s => ({
    label: STATUS_META[s]?.label,
    count: records.filter(r => r.status === s).length,
    light: STATUS_META[s]?.light
  }));

  if (loadError) return (
    <div className="p-8 text-center">
      <p className="text-red-500 font-medium">Employee load nahi hua.</p>
      <button onClick={() => navigate('/admin/employees')} className="mt-3 btn-secondary text-sm">← Employees Page pe wapas jao</button>
    </div>
  );
  if (!employee) return (
    <div className="p-8 text-center text-gray-400">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
      Loading employee data...
    </div>
  );

  const monthName = new Date(calYear, calMonthNum - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const isCurrentMonth = calMonth === today.toISOString().slice(0, 7);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/admin/employees')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors">
          <FiArrowLeft size={18} /> Back
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-bold text-lg">
            {employee.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">{employee.name}</h1>
            <p className="text-sm text-gray-400">{employee.employeeId} • {employee.email}</p>
          </div>
        </div>
      </div>

      {/* Employee Info Strip */}
      <div className="card mb-5 flex flex-wrap gap-6 text-sm">
        <div><span className="text-gray-400">Shift: </span><span className="font-medium">{employee.shiftStart} – {employee.shiftEnd}</span></div>
        <div><span className="text-gray-400">Week Off: </span><span className="font-medium">{(employee.weekOff || []).map(d => DAYS_FULL[d].slice(0,3)).join(', ')}</span></div>
        <div><span className="text-gray-400">Salary: </span><span className="font-medium">₹{(employee.salary || 0).toLocaleString()}</span></div>
        <div><span className="text-gray-400">Location: </span><span className="font-medium">{employee.assignedLocation?.name || '—'}</span></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Calendar */}
        <div className="lg:col-span-2 card">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <FiChevronLeft size={18} />
            </button>
            <h2 className="text-lg font-semibold text-gray-800">{monthName}</h2>
            <button onClick={nextMonth} disabled={isCurrentMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
              <FiChevronRight size={18} />
            </button>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mb-4">
            {Object.entries(STATUS_META).map(([key, val]) => (
              <div key={key} className="flex items-center gap-1.5 text-xs text-gray-600">
                <div className={`w-3 h-3 rounded-sm ${val.color.split(' ')[0]}`}></div>
                <span>{val.label}</span>
              </div>
            ))}
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAY_SHORT.map(d => (
              <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }, (_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const dayNum = i + 1;
              const dateStr = `${calMonth}-${String(dayNum).padStart(2, '0')}`;
              const { bg, status } = getDayStyle(dayNum);
              const rec = recordMap[dateStr];
              const isToday = dateStr === todayStr;
              const isSelected = selectedDay?.dateStr === dateStr;

              return (
                <div
                  key={dayNum}
                  onClick={() => handleDayClick(dayNum)}
                  title={status ? STATUS_META[status]?.label : ''}
                  className={`aspect-square flex flex-col items-center justify-center rounded-lg text-xs font-medium transition-all
                    ${bg}
                    ${isSelected ? 'ring-2 ring-offset-1 ring-slate-700 scale-105' : ''}
                  `}
                >
                  <span className="text-sm font-bold leading-none">{dayNum}</span>
                  {isToday && <span className="text-[9px] opacity-70 mt-0.5">Today</span>}
                  {rec?.punches?.length > 0 && (
                    <span className="text-[9px] opacity-80 leading-none mt-0.5">
                      {new Date(rec.punches[0].time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </span>
                  )}
                  {status === 'half-day' && <span className="text-[9px] opacity-90 leading-none">½</span>}
                </div>
              );
            })}
          </div>

          <p className="text-xs text-gray-400 mt-3 text-center">
            Past kisi bhi din pe click karo — status edit kar sakte hain
          </p>
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Monthly summary */}
          <div className="card">
            <h3 className="font-semibold text-gray-700 mb-3 text-sm">Monthly Summary</h3>
            <div className="space-y-2">
              {stats.filter(s => s.count > 0 || ['present','half-day','absent'].includes(
                STATUS_OPTIONS[stats.indexOf(s)]
              )).map(({ label, count, light }) => (
                <div key={label} className={`flex items-center justify-between px-3 py-1.5 rounded-lg border text-sm ${light}`}>
                  <span>{label}</span>
                  <span className="font-bold">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Selected day edit panel */}
          {selectedDay ? (
            <div className="card border-2 border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-1.5">
                  <FiEdit2 size={14} />
                  {new Date(selectedDay.dateStr + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </h3>
                <button onClick={() => setSelectedDay(null)} className="text-gray-400 hover:text-gray-600">
                  <FiX size={16} />
                </button>
              </div>

              {/* Quick action for half-day → full day */}
              {selectedDay.record?.status === 'half-day' && (
                <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-700 mb-2 font-medium flex items-center gap-1">
                    <FiAlertCircle size={12} /> Half Day detected
                  </p>
                  <button
                    onClick={() => markFullDay(selectedDay)}
                    disabled={saving}
                    className="w-full bg-green-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <FiCheckCircle size={15} />
                    {saving ? 'Saving...' : 'Mark as Full Day (Present)'}
                  </button>
                </div>
              )}

              {/* Status selector */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-600 mb-1">Status Change</label>
                <select className="input-field text-sm" value={editForm.status}
                  onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}>
                  {STATUS_OPTIONS.map(s => (
                    <option key={s} value={s}>{STATUS_META[s]?.label || s}</option>
                  ))}
                </select>
              </div>

              {/* Punch times (read-only display + edit) */}
              {editForm.punches.length > 0 && (
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Punch Times</label>
                  <div className="space-y-1.5">
                    {editForm.punches.map((p, i) => (
                      <div key={i} className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg ${p.type === 'in' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        <FiClock size={11} />
                        <span className="font-medium uppercase">{p.type}</span>
                        <input type="datetime-local" value={p.time}
                          onChange={e => {
                            const punches = [...editForm.punches];
                            punches[i] = { ...p, time: e.target.value };
                            setEditForm(f => ({ ...f, punches }));
                          }}
                          className="flex-1 bg-transparent border-none outline-none text-xs" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin note */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-600 mb-1">Note (optional)</label>
                <textarea className="input-field text-sm" rows={2} value={editForm.adminNote}
                  onChange={e => setEditForm(f => ({ ...f, adminNote: e.target.value }))}
                  placeholder="Reason for change..." />
              </div>

              <button onClick={handleSave} disabled={saving}
                className="btn-primary w-full text-sm">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          ) : (
            <div className="card border border-dashed border-gray-200 text-center py-6">
              <FiEdit2 size={24} className="mx-auto text-gray-300 mb-2" />
              <p className="text-xs text-gray-400">Kisi bhi past din pe click karo<br />attendance edit karne ke liye</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
