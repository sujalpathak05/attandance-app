import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { FiClock, FiMapPin, FiCalendar, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const STATUS_COLORS = {
  present: 'bg-green-500 text-white',
  'half-day': 'bg-yellow-400 text-white',
  absent: 'bg-red-400 text-white',
  'week-off': 'bg-gray-300 text-gray-700',
  'paid-leave': 'bg-blue-400 text-white',
  'unpaid-leave': 'bg-purple-400 text-white',
};

const STATUS_LEGEND = [
  { color: 'bg-green-500', label: 'Present' },
  { color: 'bg-yellow-400', label: 'Half Day' },
  { color: 'bg-red-400', label: 'Absent' },
  { color: 'bg-gray-300', label: 'Week Off' },
  { color: 'bg-blue-400', label: 'Paid Leave' },
  { color: 'bg-purple-400', label: 'Unpaid Leave' },
];

export default function EmployeeDashboard() {
  const [profile, setProfile] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [monthRecords, setMonthRecords] = useState([]);
  const [punching, setPunching] = useState(false);
  const [calMonth, setCalMonth] = useState(new Date().toISOString().slice(0, 7));

  const fetchData = useCallback(async () => {
    try {
      const [profRes, todayRes, histRes] = await Promise.all([
        api.get('/employee/profile'),
        api.get('/attendance/today'),
        api.get(`/attendance/history?month=${calMonth}`)
      ]);
      setProfile(profRes.data);
      setTodayAttendance(todayRes.data);
      setMonthRecords(histRes.data);
    } catch {}
  }, [calMonth]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handlePunch = () => {
    if (!navigator.geolocation) {
      toast.error('Aapka browser location support nahi karta');
      return;
    }
    setPunching(true);
    toast.loading('Location detect ho rahi hai...', { id: 'punch' });

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { data } = await api.post('/attendance/punch', {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
          toast.success(data.message, { id: 'punch' });
          fetchData();
        } catch (err) {
          toast.error(err.response?.data?.message || 'Error occurred', { id: 'punch' });
        } finally {
          setPunching(false);
        }
      },
      () => {
        toast.error('Location permission denied. Settings me jakar allow karein.', { id: 'punch' });
        setPunching(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const getLastPunch = () => {
    if (!todayAttendance || !todayAttendance.punches.length) return null;
    return todayAttendance.punches[todayAttendance.punches.length - 1];
  };

  const lastPunch = getLastPunch();
  const isPunchedIn = lastPunch?.type === 'in';
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Calendar generation
  const [calYear, calMonthNum] = calMonth.split('-').map(Number);
  const firstDayOfMonth = new Date(calYear, calMonthNum - 1, 1).getDay();
  const daysInMonth = new Date(calYear, calMonthNum, 0).getDate();
  const recordMap = {};
  monthRecords.forEach(r => { recordMap[r.date] = r; });

  const isWeekOff = (dayNum) => profile?.weekOff?.includes(new Date(calYear, calMonthNum - 1, dayNum).getDay());

  const getDayColor = (dayNum) => {
    const dateStr = `${calMonth}-${String(dayNum).padStart(2, '0')}`;
    const fullDate = new Date(calYear, calMonthNum - 1, dayNum);
    const isFuture = fullDate > today;
    const isToday = dateStr === todayStr;

    if (isToday) return 'ring-2 ring-blue-500 bg-white';
    if (isFuture) return 'bg-gray-50 text-gray-300';

    const record = recordMap[dateStr];
    if (record) return STATUS_COLORS[record.status] || 'bg-red-400 text-white';
    if (isWeekOff(dayNum)) return STATUS_COLORS['week-off'];
    return 'bg-red-400 text-white'; // past day, no record = absent
  };

  const formatTime = (t) => new Date(t).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          {today.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-1 space-y-4">
          {/* Punch Card */}
          <div className="card text-center">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${isPunchedIn ? 'bg-green-100' : 'bg-gray-100'}`}>
              <FiClock size={36} className={isPunchedIn ? 'text-green-600' : 'text-gray-400'} />
            </div>
            <p className="text-lg font-semibold text-gray-800 mb-1">
              {isPunchedIn ? 'Punched IN' : todayAttendance ? 'Punched OUT' : 'Not Punched In'}
            </p>
            {lastPunch && (
              <p className="text-sm text-gray-500 mb-1">
                Last {lastPunch.type.toUpperCase()} at {formatTime(lastPunch.time)}
              </p>
            )}
            {todayAttendance?.totalHours > 0 && (
              <p className="text-sm text-blue-600 font-medium mb-3">
                Total: {todayAttendance.totalHours.toFixed(1)} hours
              </p>
            )}
            {todayAttendance?.status && (
              <div className="mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[todayAttendance.status] || ''}`}>
                  {todayAttendance.status}
                </span>
              </div>
            )}
            <button onClick={handlePunch} disabled={punching}
              className={`w-full py-3 rounded-xl font-semibold text-white transition-all text-base ${isPunchedIn
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-green-500 hover:bg-green-600'
              } disabled:opacity-50`}>
              {punching ? 'Detecting location...' : isPunchedIn ? 'Punch OUT' : 'Punch IN'}
            </button>
            <p className="text-xs text-gray-400 mt-2 flex items-center justify-center gap-1">
              <FiMapPin size={11} /> Location required for punching
            </p>
          </div>

          {/* Today's Punches */}
          {todayAttendance?.punches?.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-gray-700 mb-3">Today's Punches</h3>
              <div className="space-y-2">
                {todayAttendance.punches.map((p, i) => (
                  <div key={i} className={`flex items-center gap-3 p-2 rounded-lg text-sm ${p.type === 'in' ? 'bg-green-50' : 'bg-red-50'}`}>
                    <span className={`font-bold ${p.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                      {p.type.toUpperCase()}
                    </span>
                    <span className="text-gray-700">{formatTime(p.time)}</span>
                    {p.type === 'in' && todayAttendance.punches[i + 1] && (
                      <span className="text-xs text-gray-400 ml-auto">
                        → {formatTime(todayAttendance.punches[i + 1].time)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Shift Info */}
          {profile && (
            <div className="card">
              <h3 className="font-semibold text-gray-700 mb-3">My Shift</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Start Time</span>
                  <span className="font-semibold text-gray-800">{profile.shiftStart}</span>
                </div>
                <div className="flex justify-between">
                  <span>End Time</span>
                  <span className="font-semibold text-gray-800">{profile.shiftEnd}</span>
                </div>
                <div className="flex justify-between">
                  <span>Week Off</span>
                  <span className="font-semibold text-gray-800">
                    {(profile.weekOff || []).map(d => DAYS[d].slice(0, 3)).join(', ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Location</span>
                  <span className="font-semibold text-gray-800 text-right">{profile.assignedLocation?.name || <span className="text-red-400">Not set</span>}</span>
                </div>
              </div>
              <div className="mt-3 p-2 bg-yellow-50 rounded-lg text-xs text-yellow-700">
                <FiAlertCircle size={12} className="inline mr-1" />
                Punch in after {profile.shiftStart} +15min = half day. Early punch out = half day.
              </div>
            </div>
          )}
        </div>

        {/* Right column - Calendar */}
        <div className="lg:col-span-2">
          <div className="card">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <FiCalendar size={18} />
                Attendance Calendar
              </h3>
              <input type="month" className="input-field w-auto text-sm" value={calMonth}
                onChange={e => setCalMonth(e.target.value)} />
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mb-4">
              {STATUS_LEGEND.map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5 text-xs text-gray-600">
                  <div className={`w-3 h-3 rounded-sm ${color}`}></div>
                  <span>{label}</span>
                </div>
              ))}
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {DAY_SHORT.map(d => (
                <div key={d} className="text-center text-xs font-semibold text-gray-500 py-1">{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells before first day */}
              {Array.from({ length: firstDayOfMonth }, (_, i) => (
                <div key={`empty-${i}`} className="aspect-square"></div>
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const dayNum = i + 1;
                const dateStr = `${calMonth}-${String(dayNum).padStart(2, '0')}`;
                const record = recordMap[dateStr];
                const colorClass = getDayColor(dayNum);
                const isToday = dateStr === todayStr;

                return (
                  <div key={dayNum}
                    title={record ? `${record.status}${record.punches?.length ? ` | In: ${formatTime(record.punches[0].time)}` : ''}` : ''}
                    className={`aspect-square flex flex-col items-center justify-center rounded-lg text-xs font-medium cursor-default transition-all hover:opacity-80 ${colorClass}`}>
                    <span className="text-sm font-bold">{dayNum}</span>
                    {isToday && <span className="text-[9px] font-normal opacity-70">Today</span>}
                    {record?.punches?.length > 0 && (
                      <span className="text-[9px] opacity-80">
                        {new Date(record.punches[0].time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Monthly Summary */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Monthly Summary</h4>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {[
                  { label: 'Present', count: monthRecords.filter(r => r.status === 'present').length, color: 'text-green-600' },
                  { label: 'Half Day', count: monthRecords.filter(r => r.status === 'half-day').length, color: 'text-yellow-600' },
                  { label: 'Absent', count: monthRecords.filter(r => r.status === 'absent').length, color: 'text-red-600' },
                  { label: 'Week Off', count: monthRecords.filter(r => r.status === 'week-off').length, color: 'text-gray-600' },
                  { label: 'Paid Leave', count: monthRecords.filter(r => r.status === 'paid-leave').length, color: 'text-blue-600' },
                  { label: 'Unpaid', count: monthRecords.filter(r => r.status === 'unpaid-leave').length, color: 'text-purple-600' },
                ].map(({ label, count, color }) => (
                  <div key={label} className="text-center p-2 bg-gray-50 rounded-lg">
                    <p className={`text-xl font-bold ${color}`}>{count}</p>
                    <p className="text-xs text-gray-500">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
