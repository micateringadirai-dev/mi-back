const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { verifyToken } = require('../config/jwt');

const protect = asyncHandler(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token provided');
  }

  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      res.status(401);
      throw new Error('Not authorized, user not found or inactive');
    }
    req.user = user;
    next();
  } catch (err) {
    res.status(401);
    throw new Error('Not authorized, invalid or expired token');
  }
});

const requireSuperAdmin = (req, res, next) => {
  if (req.user?.role !== 'superadmin') {
    res.status(403);
    throw new Error('Requires super-admin privileges');
  }
  next();
};

module.exports = { protect, requireSuperAdmin };
