import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
// These should be set in your .env file or Vercel dashboard:
// CLOUDINARY_CLOUD_NAME=...
// CLOUDINARY_API_KEY=...
// CLOUDINARY_API_SECRET=...

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

/**
 * Uploads a buffer or file to Cloudinary
 * Useful for medical records, profile pictures, or case evidence
 */
export async function uploadToCloudinary(fileBuffer: Buffer, folder: string = 'lawhelper'): Promise<string> {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: folder,
                resource_type: 'auto',
            },
            (error, result) => {
                if (error) return reject(error);
                if (!result) return reject(new Error('Cloudinary upload failed'));
                resolve(result.secure_url);
            }
        );

        uploadStream.end(fileBuffer);
    });
}

export default cloudinary;
