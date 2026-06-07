const router = require('express').Router();
const Leave = require('../models/Leave');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/', async (req, res) => {
  try {
    const { fromDate, toDate, reason } = req.body;
    if (!fromDate || !toDate || !reason)
      return res.status(400).json({ message: 'Sabhi fields required hain' });

    const leave = new Leave({
      employee: req.user._id,
      fromDate,
      toDate,
      reason
    });

    await leave.save();
    res.status(201).json({ message: 'Leave application submit ho gayi' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/my', async (req, res) => {
  try {
    const leaves = await Leave.find({ employee: req.user._id }).sort('-createdAt');
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
