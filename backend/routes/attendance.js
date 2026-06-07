const router = require('express').Router();
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { getDistance, timeToMinutes, calculateTotalHours } = require('../utils/helpers');

router.use(protect);

// Punch In / Punch Out
router.post('/punch', async (req, res) => {
  try {
    const { lat, lng } = req.body;

    if (lat === undefined || lng === undefined)
      return res.status(400).json({ message: 'Location required for punching' });

    const employee = await User.findById(req.user._id).populate('assignedLocation');

    if (!employee.assignedLocation)
      return res.status(400).json({ message: 'Koi location assign nahi hai. Admin se contact karein.' });

    // Check distance
    const distance = getDistance(lat, lng, employee.assignedLocation.lat, employee.assignedLocation.lng);
    if (distance > employee.assignedLocation.radius) {
      return res.status(400).json({
        message: `Aap office se ${Math.round(distance)}m door hain. ${employee.assignedLocation.radius}m ke andar hona zaroori hai.`,
        distance: Math.round(distance),
        required: employee.assignedLocation.radius
      });
    }

    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const dayOfWeek = now.getDay();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    let attendance = await Attendance.findOne({ employee: req.user._id, date: today });

    if (!attendance) {
      // First punch of the day — must be punch IN
      attendance = new Attendance({
        employee: req.user._id,
        date: today,
        punches: [{ type: 'in', time: now, lat, lng }]
      });

      // Week off check
      if (employee.weekOff.includes(dayOfWeek)) {
        attendance.status = 'week-off';
      } else {
        // Late check: if > shiftStart + 15 min → half day
        const shiftStartMins = timeToMinutes(employee.shiftStart);
        if (currentMinutes > shiftStartMins + 15) {
          attendance.status = 'half-day';
        } else {
          attendance.status = 'present';
        }
      }

      await attendance.save();
      return res.json({
        message: 'Punch IN successful!',
        punchType: 'in',
        time: now,
        status: attendance.status
      });
    }

    const lastPunch = attendance.punches[attendance.punches.length - 1];

    if (lastPunch.type === 'in') {
      // Punch OUT
      const lastInTime = new Date(lastPunch.time);
      const hoursWorked = (now - lastInTime) / (1000 * 60 * 60);

      if (hoursWorked < 5) {
        return res.status(400).json({
          message: `Punch out ke liye minimum 5 ghante kaam karna zaroori hai. Abhi tak: ${hoursWorked.toFixed(1)} ghante.`,
          hoursWorked: parseFloat(hoursWorked.toFixed(2))
        });
      }

      attendance.punches.push({ type: 'out', time: now, lat, lng });
      attendance.totalHours = calculateTotalHours(attendance.punches);

      // Early punch out check
      if (!employee.weekOff.includes(dayOfWeek)) {
        const shiftEndMins = timeToMinutes(employee.shiftEnd);
        if (currentMinutes < shiftEndMins) {
          attendance.status = 'half-day';
        } else if (attendance.status !== 'half-day') {
          attendance.status = 'present';
        }
      }

      await attendance.save();
      return res.json({
        message: 'Punch OUT successful!',
        punchType: 'out',
        time: now,
        status: attendance.status,
        totalHours: parseFloat(attendance.totalHours.toFixed(2))
      });

    } else {
      // Last punch was OUT → allow punch IN again
      attendance.punches.push({ type: 'in', time: now, lat, lng });
      await attendance.save();
      return res.json({
        message: 'Punch IN successful! (Re-entry)',
        punchType: 'in',
        time: now,
        status: attendance.status
      });
    }

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Today's attendance
router.get('/today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const attendance = await Attendance.findOne({ employee: req.user._id, date: today });
    res.json(attendance || null);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Monthly history
router.get('/history', async (req, res) => {
  try {
    const { month } = req.query;
    const targetMonth = month || new Date().toISOString().slice(0, 7);

    const records = await Attendance.find({
      employee: req.user._id,
      date: { $regex: `^${targetMonth}` }
    }).sort('date');

    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
