const jwt = require('jsonwebtoken');

/**
 * Resolves JWT secret with robust fallbacks.
 * Prevents "secretOrPrivateKey must have a value" error if environment variable is missing.
 */
const getJwtSecret = () => {
  const secret = (
    process.env.JWT_SECRET ||
    process.env.JWT_KEY ||
    process.env.JWT_SECRET_KEY ||
    ''
  ).trim();

  if (secret) {
    return secret;
  }

  const fallback = 'migroups_adiraipattinam_jwt_secure_secret_key_2024_auth';
  if (process.env.NODE_ENV !== 'test') {
    console.warn(
      '⚠️ [Auth] Warning: JWT_SECRET is not set in environment variables. Using fallback secret.'
    );
  }
  return fallback;
};

const getJwtExpiresIn = () => {
  return (process.env.JWT_EXPIRES_IN || process.env.JWT_EXPIRE || '7d').trim();
};

const signToken = (id) => {
  return jwt.sign({ id }, getJwtSecret(), {
    expiresIn: getJwtExpiresIn(),
  });
};

const verifyToken = (token) => {
  return jwt.verify(token, getJwtSecret());
};

module.exports = {
  getJwtSecret,
  getJwtExpiresIn,
  signToken,
  verifyToken,
};
