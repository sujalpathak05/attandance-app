const router = require('express').Router();
const User = require('../models/User');
const Location = require('../models/Location');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const { protect, adminOnly } = require('../middleware/auth');
const { calculateSalary, calculateTotalHours } = require('../utils/helpers');

router.use(protect, adminOnly);

// ───────── DASHBOARD ─────────
router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const totalEmployees = await User.countDocuments({ role: 'employee', isActive: true });
    const presentToday = await Attendance.countDocuments({ date: today, status: 'present' });
    const halfDayToday = await Attendance.countDocuments({ date: today, status: 'half-day' });
    const pendingLeaves = await Leave.countDocuments({ status: 'pending' });
    res.json({
      totalEmployees,
      presentToday,
      halfDayToday,
      absentToday: Math.max(0, totalEmployees - presentToday - halfDayToday),
      pendingLeaves
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ───────── EMPLOYEES ─────────
router.get('/employees', async (req, res) => {
  try {
    const employees = await User.find({ role: 'employee', isActive: true })
      .populate('assignedLocation')
      .sort('-createdAt');
    res.json(employees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/employees/:id', async (req, res) => {
  try {
    const employee = await User.findById(req.params.id).populate('assignedLocation');
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    res.json(employee);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/employees', async (req, res) => {
  try {
    const { name, email, password, phone, salary, shiftStart, shiftEnd, weekOff, assignedLocation } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already exists' });

    const count = await User.countDocuments({ role: 'employee' });
    const employeeId = `EMP${String(count + 1).padStart(4, '0')}`;

    const employee = new User({
      name, email, password, phone,
      salary: salary || 0,
      shiftStart: shiftStart || '09:00',
      shiftEnd: shiftEnd || '18:00',
      weekOff: weekOff || [0],
      assignedLocation: assignedLocation || null,
      employeeId,
      role: 'employee'
    });

    await employee.save();
    res.status(201).json({ message: 'Employee created successfully', employeeId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/employees/:id', async (req, res) => {
  try {
    const { password, ...updateData } = req.body;
    const employee = await User.findById(req.params.id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    Object.assign(employee, updateData);
    if (password && password.trim() !== '') employee.password = password;

    await employee.save();
    res.json({ message: 'Employee updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/employees/:id', async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Employee deactivated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ───────── CREATE ADMIN ─────────
router.post('/create-admin', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already exists' });

    const admin = new User({ name, email, password, role: 'admin' });
    await admin.save();
    res.status(201).json({ message: 'Admin created successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ───────── LOCATIONS ─────────
router.get('/locations', async (req, res) => {
  try {
    const locations = await Location.find().sort('-createdAt');
    res.json(locations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/locations', async (req, res) => {
  try {
    const { name, address, lat, lng, radius } = req.body;
    const location = new Location({ name, address, lat, lng, radius: radius || 50, createdBy: req.user._id });
    await location.save();
    res.status(201).json(location);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/locations/:id', async (req, res) => {
  try {
    const location = await Location.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!location) return res.status(404).json({ message: 'Location not found' });
    res.json(location);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/locations/:id', async (req, res) => {
  try {
    await Location.findByIdAndDelete(req.params.id);
    res.json({ message: 'Location deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ───────── ATTENDANCE ─────────
router.get('/attendance', async (req, res) => {
  try {
    const { date, employeeId, month } = req.query;
    const query = {};
    if (date) query.date = date;
    else if (month) query.date = { $regex: `^${month}` };
    if (employeeId) query.employee = employeeId;

    const records = await Attendance.find(query)
      .populate('employee', 'name employeeId email shiftStart shiftEnd')
      .sort({ date: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/attendance/:id', async (req, res) => {
  try {
    const { status, adminNote, punches } = req.body;
    const record = await Attendance.findById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Attendance record not found' });

    if (status) record.status = status;
    if (adminNote !== undefined) record.adminNote = adminNote;
    if (punches && Array.isArray(punches)) {
      record.punches = punches.map(p => ({ type: p.type, time: new Date(p.time), lat: p.lat, lng: p.lng }));
      record.totalHours = calculateTotalHours(record.punches);
    }
    record.isAdminEdited = true;
    await record.save();
    res.json({ message: 'Attendance updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/attendance/manual', async (req, res) => {
  try {
    const { employeeId, date, status, adminNote } = req.body;
    let record = await Attendance.findOne({ employee: employeeId, date });
    if (!record) {
      record = new Attendance({ employee: employeeId, date });
    }
    record.status = status;
    record.adminNote = adminNote || '';
    record.isAdminEdited = true;
    await record.save();
    res.json({ message: 'Attendance set manually' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ───────── SALARY ─────────
router.get('/salary', async (req, res) => {
  try {
    const { month } = req.query;
    const targetMonth = month || new Date().toISOString().slice(0, 7);

    const employees = await User.find({ role: 'employee', isActive: true });

    const salaryData = await Promise.all(employees.map(async (emp) => {
      const attendanceRecords = await Attendance.find({
        employee: emp._id,
        date: { $regex: `^${targetMonth}` }
      });

      const approvedLeaves = await Leave.find({
        employee: emp._id,
        status: 'approved',
        fromDate: { $regex: `^${targetMonth}` }
      });

      const salary = calculateSalary(emp, attendanceRecords, approvedLeaves);
      return {
        employee: { _id: emp._id, name: emp.name, employeeId: emp.employeeId, email: emp.email },
        ...salary
      };
    }));

    res.json({ month: targetMonth, employees: salaryData });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/salary/:employeeId', async (req, res) => {
  try {
    const { month } = req.query;
    const targetMonth = month || new Date().toISOString().slice(0, 7);

    const employee = await User.findById(req.params.employeeId);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    const attendanceRecords = await Attendance.find({
      employee: employee._id,
      date: { $regex: `^${targetMonth}` }
    });

    const approvedLeaves = await Leave.find({
      employee: employee._id,
      status: 'approved',
      fromDate: { $regex: `^${targetMonth}` }
    });

    const salary = calculateSalary(employee, attendanceRecords, approvedLeaves);
    res.json({
      employee: { name: employee.name, employeeId: employee.employeeId },
      ...salary
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ───────── LEAVES ─────────
router.get('/leaves', async (req, res) => {
  try {
    const leaves = await Leave.find()
      .populate('employee', 'name employeeId email')
      .sort('-createdAt');
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/leaves/:id', async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ message: 'Leave not found' });

    leave.status = status;
    if (adminNote !== undefined) leave.adminNote = adminNote;

    if (status === 'approved') {
      // Count already used paid leaves this month
      const monthStr = leave.fromDate.slice(0, 7);
      const existingApproved = await Leave.find({
        employee: leave.employee,
        status: 'approved',
        _id: { $ne: leave._id },
        fromDate: { $regex: `^${monthStr}` }
      });

      let paidUsed = existingApproved.reduce((sum, l) => {
        return sum + Math.ceil((new Date(l.toDate) - new Date(l.fromDate)) / (1000 * 60 * 60 * 24)) + 1;
      }, 0);

      const from = new Date(leave.fromDate);
      const to = new Date(leave.toDate);
      let leavePaidCount = 0;

      for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const dayStatus = paidUsed < 4 ? 'paid-leave' : 'unpaid-leave';
        paidUsed++;
        leavePaidCount++;

        await Attendance.findOneAndUpdate(
          { employee: leave.employee, date: dateStr },
          { employee: leave.employee, date: dateStr, status: dayStatus, isAdminEdited: true, adminNote: 'Leave approved' },
          { upsert: true, new: true }
        );
      }

      leave.type = leavePaidCount <= 4 ? 'paid' : 'unpaid';
    }

    await leave.save();
    res.json({ message: 'Leave status updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
