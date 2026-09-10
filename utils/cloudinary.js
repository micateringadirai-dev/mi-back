const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');

/**
 * Uploads a buffer directly to Cloudinary using a stream.
 *
 * @param {Buffer} buffer - File buffer from multer memoryStorage
 * @param {Object} [options] - Upload options (folder, resource_type, etc.)
 * @returns {Promise<Object>} Cloudinary upload result (secure_url, public_id, etc.)
 */
function uploadStream(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    if (!buffer) {
      return reject(new Error('No file buffer provided for upload'));
    }

    const defaultFolder = process.env.CLOUDINARY_FOLDER || 'migroups';
    const uploadOptions = {
      folder: options.folder || defaultFolder,
      resource_type: options.resource_type || 'auto',
      ...options,
    };

    const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) {
        return reject(error);
      }
      resolve(result);
    });

    stream.end(buffer);
  });
}

/**
 * Deletes an asset from Cloudinary by its public ID.
 *
 * @param {string} publicId - The Cloudinary public_id of the asset
 * @param {string} [resourceType='image'] - The resource type ('image', 'video', 'raw')
 * @returns {Promise<Object>} Cloudinary destroy result
 */
async function deleteAsset(publicId, resourceType = 'image') {
  if (!publicId) {
    throw new Error('Public ID is required to delete asset from Cloudinary');
  }

  return cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
  });
}

module.exports = {
  uploadStream,
  deleteAsset,
  isCloudinaryConfigured,
};
