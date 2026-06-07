import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { FiFileText, FiCheck, FiX, FiMessageSquare } from 'react-icons/fi';

const STATUS_STYLES = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800'
};

export default function Leaves() {
  const [leaves, setLeaves] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [noteModal, setNoteModal] = useState(null);
  const [note, setNote] = useState('');
  const [actionStatus, setActionStatus] = useState('');

  const fetchLeaves = () => api.get('/admin/leaves').then(r => setLeaves(r.data));
  useEffect(() => { fetchLeaves(); }, []);

  const openAction = (leave, status) => {
    setNoteModal(leave._id);
    setNote('');
    setActionStatus(status);
  };

  const handleAction = async () => {
    try {
      await api.put(`/admin/leaves/${noteModal}`, { status: actionStatus, adminNote: note });
      toast.success(`Leave ${actionStatus}!`);
      setNoteModal(null);
      fetchLeaves();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  const filtered = filter === 'all' ? leaves : leaves.filter(l => l.status === filter);
  const days = (from, to) => Math.ceil((new Date(to) - new Date(from)) / (1000 * 60 * 60 * 24)) + 1;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Leave Management</h1>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {['pending', 'approved', 'rejected', 'all'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${filter === s ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
            {s} {s !== 'all' && `(${leaves.filter(l => l.status === s).length})`}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="card text-center py-10 text-gray-400">
            <FiFileText size={40} className="mx-auto mb-3 opacity-30" />
            <p>No {filter} leave requests</p>
          </div>
        ) : filtered.map(leave => (
          <div key={leave._id} className="card">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {leave.employee?.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{leave.employee?.name}</p>
                  <p className="text-xs text-gray-400">{leave.employee?.employeeId}</p>
                  <div className="mt-2 space-y-1 text-sm text-gray-600">
                    <p><span className="font-medium">Dates:</span> {leave.fromDate} to {leave.toDate} ({days(leave.fromDate, leave.toDate)} days)</p>
                    <p><span className="font-medium">Reason:</span> {leave.reason}</p>
                    {leave.adminNote && <p><span className="font-medium">Admin Note:</span> {leave.adminNote}</p>}
                    <p className="text-xs text-gray-400">Applied: {new Date(leave.createdAt).toLocaleDateString('en-IN')}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${STATUS_STYLES[leave.status]}`}>
                  {leave.status}
                </span>
                {leave.status === 'pending' && (
                  <div className="flex gap-2">
                    <button onClick={() => openAction(leave, 'approved')}
                      className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-700 transition-colors">
                      <FiCheck size={14} /> Approve
                    </button>
                    <button onClick={() => openAction(leave, 'rejected')}
                      className="flex items-center gap-1 bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-red-700 transition-colors">
                      <FiX size={14} /> Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Note Modal */}
      {noteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FiMessageSquare />
              {actionStatus === 'approved' ? 'Approve Leave' : 'Reject Leave'}
            </h2>
            <textarea
              className="input-field"
              rows={3}
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Add a note (optional)..."
            />
            <div className="flex gap-3 mt-4">
              <button onClick={handleAction}
                className={`flex-1 text-white py-2 rounded-lg font-medium transition-colors ${actionStatus === 'approved' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                Confirm {actionStatus === 'approved' ? 'Approval' : 'Rejection'}
              </button>
              <button onClick={() => setNoteModal(null)} className="btn-secondary px-6">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
