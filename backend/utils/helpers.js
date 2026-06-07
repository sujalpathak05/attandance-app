// Haversine formula - distance between two coordinates in meters
function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function calculateTotalHours(punches) {
  let totalMinutes = 0;
  let inTime = null;
  const sorted = [...punches].sort((a, b) => new Date(a.time) - new Date(b.time));
  sorted.forEach(p => {
    if (p.type === 'in') {
      inTime = new Date(p.time);
    } else if (p.type === 'out' && inTime) {
      totalMinutes += (new Date(p.time) - inTime) / (1000 * 60);
      inTime = null;
    }
  });
  return totalMinutes / 60;
}

function calculateSalary(employee, attendanceRecords, approvedLeaves) {
  const dailyRate = employee.salary / 30;

  let presentDays = 0;
  let halfDays = 0;
  let weekOffDays = 0;
  let absentDays = 0;

  attendanceRecords.forEach(rec => {
    if (rec.status === 'present') presentDays++;
    else if (rec.status === 'half-day') halfDays++;
    else if (rec.status === 'week-off') weekOffDays++;
    else if (rec.status === 'absent') absentDays++;
  });

  // Count approved leave days this month
  let totalLeaveDays = 0;
  approvedLeaves.forEach(leave => {
    const from = new Date(leave.fromDate);
    const to = new Date(leave.toDate);
    totalLeaveDays += Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1;
  });

  const paidLeaveDays = Math.min(totalLeaveDays, 4);
  const unpaidLeaveDays = Math.max(0, totalLeaveDays - 4);

  const earnedDays = presentDays + (halfDays * 0.5) + weekOffDays + paidLeaveDays;
  const earnedSalary = earnedDays * dailyRate;

  return {
    monthlySalary: employee.salary,
    dailyRate: parseFloat(dailyRate.toFixed(2)),
    presentDays,
    halfDays,
    weekOffDays,
    paidLeaveDays,
    unpaidLeaveDays,
    absentDays,
    earnedDays: parseFloat(earnedDays.toFixed(1)),
    earnedSalary: parseFloat(earnedSalary.toFixed(2))
  };
}

module.exports = { getDistance, timeToMinutes, getDaysInMonth, calculateTotalHours, calculateSalary };
