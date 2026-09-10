const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config();
const connectDB = require('../config/db');
const User = require('../models/User');

(async () => {
  await connectDB();
  const email = process.env.ADMIN_EMAIL;
  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`Admin already exists: ${email}`);
    process.exit(0);
  }
  await User.create({
    name: process.env.ADMIN_NAME || 'MI Groups Admin',
    email,
    password: process.env.ADMIN_PASSWORD,
    role: 'superadmin',
  });
  console.log(`Admin created: ${email}`);
  process.exit(0);
})();
