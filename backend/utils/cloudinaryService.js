const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

class CloudinaryService {
  constructor() {
    this.folders = {
      profile_pictures: 'careernavigator/profiles',
      signatures: 'careernavigator/signatures',
      id_proofs: 'careernavigator/id_proofs',
      documents: 'careernavigator/documents',
      forum_attachments: 'careernavigator/forum',
      college_logos: 'careernavigator/colleges',
      puzzle_images: 'careernavigator/puzzles'
    };
  }

  // Upload file buffer to Cloudinary
  async upload(fileBuffer, folderType, options = {}) {
    try {
      const folder = this.folders[folderType] || 'careernavigator/misc';

      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: 'auto',
            quality: 'auto:good',
            fetch_format: 'auto',
            ...options
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve({
                url: result.secure_url,
                public_id: result.public_id,
                format: result.format,
                width: result.width,
                height: result.height,
                bytes: result.bytes,
                created_at: result.created_at
              });
            }
          }
        );

        // Convert buffer to stream and pipe to upload
        const stream = Readable.from(fileBuffer);
        stream.pipe(uploadStream);
      });
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new Error('Failed to upload file to cloud storage');
    }
  }

  // Test connection to Cloudinary
  async testConnection() {
    try {
      if (!this.isConfigured()) {
        throw new Error('Cloudinary not configured');
      }

      await cloudinary.api.ping();
      console.log('✅ Cloudinary connection successful');
      return true;
    } catch (error) {
      console.error('❌ Cloudinary connection failed:', error);
      return false;
    }
  }

  // Check if Cloudinary is configured
  isConfigured() {
    return !!(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    );
  }
}

const cloudinaryService = new CloudinaryService();
module.exports = { cloudinaryService };
