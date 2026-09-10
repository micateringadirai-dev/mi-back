const cloudinary = require('cloudinary').v2;

if (process.env.CLOUDINARY_URL) {
  cloudinary.config({
    cloudinary_url: process.env.CLOUDINARY_URL,
    secure: true,
  });
} else {
  cloudinary.config({
    cloud_name: (process.env.CLOUDINARY_CLOUD_NAME || '').trim(),
    api_key: (process.env.CLOUDINARY_API_KEY || '').trim(),
    api_secret: (process.env.CLOUDINARY_API_SECRET || '').trim(),
    secure: true,
  });
}

/**
 * Checks if valid Cloudinary credentials are configured in environment variables.
 * @returns {boolean}
 */
function isCloudinaryConfigured() {
  if (process.env.CLOUDINARY_URL && process.env.CLOUDINARY_URL.startsWith('cloudinary://')) {
    return true;
  }

  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    return false;
  }

  const placeholders = ['your_cloud_name', 'your_api_key', 'your_api_secret'];
  if (
    placeholders.includes(CLOUDINARY_CLOUD_NAME.trim()) ||
    placeholders.includes(CLOUDINARY_API_KEY.trim()) ||
    placeholders.includes(CLOUDINARY_API_SECRET.trim())
  ) {
    return false;
  }

  return true;
}

module.exports = {
  cloudinary,
  isCloudinaryConfigured,
};
