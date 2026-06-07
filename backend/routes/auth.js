const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password)
      return res.status(400).json({ message: 'Email aur password required hai' });

    if (typeof email !== 'string' || typeof password !== 'string')
      return res.status(400).json({ message: 'Invalid input' });

    // Max length check (prevents huge string attacks)
    if (email.length > 100 || password.length > 128)
      return res.status(400).json({ message: 'Invalid input length' });

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail, isActive: true });

    // Same error for wrong email or wrong password (prevents user enumeration)
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Email ya password galat hai' });

    // Token expires in 8 hours
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h', issuer: 'attendance-app' }
    );

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId || null
      }
    });
  } catch (err) {
    console.error('[Login Error]', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/auth/me — verify token still valid
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user || !user.isActive)
      return res.status(401).json({ message: 'Account inactive' });
    res.json(user);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
