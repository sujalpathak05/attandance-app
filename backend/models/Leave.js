const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fromDate: { type: String, required: true }, // YYYY-MM-DD
  toDate: { type: String, required: true },   // YYYY-MM-DD
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  type: { type: String, enum: ['paid', 'unpaid'], default: 'paid' },
  adminNote: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Leave', leaveSchema);
