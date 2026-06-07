const mongoose = require('mongoose');

const punchSchema = new mongoose.Schema({
  type: { type: String, enum: ['in', 'out'], required: true },
  time: { type: Date, required: true },
  lat: { type: Number },
  lng: { type: Number }
}, { _id: false });

const attendanceSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  punches: [punchSchema],
  status: {
    type: String,
    enum: ['present', 'absent', 'half-day', 'week-off', 'paid-leave', 'unpaid-leave'],
    default: 'absent'
  },
  totalHours: { type: Number, default: 0 },
  isAdminEdited: { type: Boolean, default: false },
  adminNote: { type: String, default: '' }
}, { timestamps: true });

attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
