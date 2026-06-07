import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { FiDollarSign, FiChevronDown, FiChevronUp, FiCalendar } from 'react-icons/fi';

export default function Salary() {
  const [data, setData] = useState(null);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const fetchSalary = () => {
    setLoading(true);
    api.get(`/admin/salary?month=${month}`)
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSalary(); }, [month]);

  const totalPayable = data?.employees.reduce((sum, e) => sum + e.earnedSalary, 0) || 0;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Salary Management</h1>
        <div className="flex items-center gap-2">
          <FiCalendar className="text-gray-400" />
          <input type="month" className="input-field w-auto" value={month} onChange={e => setMonth(e.target.value)} />
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card">
          <p className="text-sm text-gray-500">Total Employees</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{data?.employees.length || 0}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Total Payable</p>
          <p className="text-2xl font-bold text-green-600 mt-1">₹{totalPayable.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Month</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {new Date(month + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="card text-center py-10 text-gray-400">Loading salary data...</div>
      ) : (
        <div className="space-y-3">
          {data?.employees.map(emp => (
            <div key={emp.employee._id} className="card">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(expanded === emp.employee._id ? null : emp.employee._id)}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-bold text-sm">
                    {emp.employee.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{emp.employee.name}</p>
                    <p className="text-xs text-gray-400">{emp.employee.employeeId} • {emp.employee.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Monthly Salary</p>
                    <p className="font-medium text-gray-700">₹{emp.monthlySalary.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Earned</p>
                    <p className="text-lg font-bold text-green-600">₹{emp.earnedSalary.toLocaleString()}</p>
                  </div>
                  <div className="text-gray-400">
                    {expanded === emp.employee._id ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
                  </div>
                </div>
              </div>

              {expanded === emp.employee._id && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                    {[
                      { label: 'Daily Rate', value: `₹${emp.dailyRate}`, color: 'bg-blue-50 text-blue-700' },
                      { label: 'Present Days', value: emp.presentDays, color: 'bg-green-50 text-green-700' },
                      { label: 'Half Days', value: emp.halfDays, color: 'bg-yellow-50 text-yellow-700' },
                      { label: 'Week Offs', value: emp.weekOffDays, color: 'bg-gray-50 text-gray-700' },
                      { label: 'Paid Leaves', value: emp.paidLeaveDays, color: 'bg-blue-50 text-blue-700' },
                      { label: 'Unpaid Leaves', value: emp.unpaidLeaveDays, color: 'bg-red-50 text-red-700' },
                      { label: 'Absent Days', value: emp.absentDays, color: 'bg-red-50 text-red-700' },
                      { label: 'Paid Days', value: emp.earnedDays, color: 'bg-green-50 text-green-700' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className={`${color} rounded-lg p-3 text-center`}>
                        <p className="text-lg font-bold">{value}</p>
                        <p className="text-xs mt-0.5 opacity-80">{label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 p-3 bg-green-50 rounded-lg flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Calculation: <span className="font-mono text-gray-800">
                        ({emp.presentDays} + {emp.halfDays}×0.5 + {emp.weekOffDays} + {emp.paidLeaveDays}) × ₹{emp.dailyRate} = ₹{emp.earnedSalary}
                      </span>
                    </div>
                    <div className="text-xl font-bold text-green-600">₹{emp.earnedSalary.toLocaleString()}</div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {(!data?.employees || data.employees.length === 0) && (
            <div className="card text-center py-10 text-gray-400">
              <FiDollarSign size={40} className="mx-auto mb-3 opacity-30" />
              <p>No data available for selected month</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
