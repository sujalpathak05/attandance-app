const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    const existing = await User.findOne({ email: 'admin@company.com' });
    if (existing) {
      console.log('Admin already exists!');
      console.log('Email: admin@company.com');
      process.exit(0);
    }

    const admin = new User({
      name: 'Super Admin',
      email: 'admin@company.com',
      password: 'Admin@123',
      role: 'admin'
    });

    await admin.save();
    console.log('✓ Admin created successfully!');
    console.log('─────────────────────────');
    console.log('Email   : admin@company.com');
    console.log('Password: Admin@123');
    console.log('─────────────────────────');
    console.log('Please change the password after first login.');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

createAdmin();
