import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { FiPlus, FiFileText, FiCalendar, FiAlertCircle } from 'react-icons/fi';

const STATUS_STYLES = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800'
};

const STATUS_ICONS = {
  pending: '⏳',
  approved: '✅',
  rejected: '❌'
};

export default function LeaveApply() {
  const [leaves, setLeaves] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ fromDate: '', toDate: '', reason: '' });
  const [loading, setLoading] = useState(false);

  const fetchLeaves = () => api.get('/leave/my').then(r => setLeaves(r.data));
  useEffect(() => { fetchLeaves(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (new Date(form.toDate) < new Date(form.fromDate)) {
      toast.error('End date start date se pehle nahi ho sakti');
      return;
    }
    setLoading(true);
    try {
      await api.post('/leave', form);
      toast.success('Leave application submit ho gayi!');
      setForm({ fromDate: '', toDate: '', reason: '' });
      setShowForm(false);
      fetchLeaves();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error occurred');
    } finally {
      setLoading(false);
    }
  };

  const days = (from, to) => Math.ceil((new Date(to) - new Date(from)) / (1000 * 60 * 60 * 24)) + 1;

  const totalThisMonth = () => {
    const now = new Date();
    const month = now.toISOString().slice(0, 7);
    return leaves
      .filter(l => l.fromDate.startsWith(month) && l.status === 'approved')
      .reduce((sum, l) => sum + days(l.fromDate, l.toDate), 0);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Leave Management</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <FiPlus size={16} /> Apply Leave
        </button>
      </div>

      {/* Leave Policy Info */}
      <div className="card mb-6 bg-blue-50 border border-blue-200">
        <div className="flex items-start gap-3">
          <FiAlertCircle className="text-blue-500 mt-0.5 flex-shrink-0" size={18} />
          <div className="text-sm text-blue-700">
            <p className="font-semibold mb-1">Leave Policy:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Har month mein <strong>4 paid leaves</strong> milti hain</li>
              <li>4 se zyada leaves <strong>unpaid</strong> hoti hain</li>
              <li>Is month approved leaves: <strong>{totalThisMonth()}</strong> din (4 paid mein se)</li>
              <li>Remaining paid leaves: <strong>{Math.max(0, 4 - totalThisMonth())}</strong></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Apply Form */}
      {showForm && (
        <div className="card mb-6 border-2 border-blue-200">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FiCalendar /> New Leave Application
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Date *</label>
                <input type="date" className="input-field" value={form.fromDate}
                  onChange={e => setForm(f => ({ ...f, fromDate: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Date *</label>
                <input type="date" className="input-field" value={form.toDate}
                  onChange={e => setForm(f => ({ ...f, toDate: e.target.value }))}
                  min={form.fromDate || new Date().toISOString().split('T')[0]}
                  required />
              </div>
            </div>
            {form.fromDate && form.toDate && new Date(form.toDate) >= new Date(form.fromDate) && (
              <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600">
                Duration: <strong>{days(form.fromDate, form.toDate)} day{days(form.fromDate, form.toDate) > 1 ? 's' : ''}</strong>
                {(totalThisMonth() + days(form.fromDate, form.toDate)) > 4 && (
                  <span className="text-orange-600 ml-2">
                    (kuch unpaid hogi — is mahine {4 - totalThisMonth()} paid bacha hai)
                  </span>
                )}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
              <textarea className="input-field" rows={3} value={form.reason}
                onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                placeholder="Leave ka karan batayein..."
                required />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={loading} className="btn-primary flex-1">
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary px-6">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Leave History */}
      <div>
        <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <FiFileText size={16} /> Leave History
        </h2>

        {leaves.length === 0 ? (
          <div className="card text-center py-10 text-gray-400">
            <FiFileText size={40} className="mx-auto mb-3 opacity-30" />
            <p>Koi leave application nahi hai</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaves.map(leave => (
              <div key={leave._id} className="card hover:shadow-md transition-shadow">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{STATUS_ICONS[leave.status]}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[leave.status]}`}>
                        {leave.status}
                      </span>
                      {leave.type && (
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${leave.type === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {leave.type}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-800">
                      {leave.fromDate === leave.toDate ? leave.fromDate : `${leave.fromDate} → ${leave.toDate}`}
                      <span className="text-gray-400 font-normal ml-2">({days(leave.fromDate, leave.toDate)} day{days(leave.fromDate, leave.toDate) > 1 ? 's' : ''})</span>
                    </p>
                    <p className="text-sm text-gray-600 mt-1">{leave.reason}</p>
                    {leave.adminNote && (
                      <p className="text-xs text-gray-500 mt-1 bg-gray-50 p-2 rounded">
                        Admin note: {leave.adminNote}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 flex-shrink-0">
                    {new Date(leave.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
