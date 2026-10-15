require('dotenv').config();
const cloudinary = require('cloudinary').v2;
// Configuration with Cloudinary SDK v2
cloudinary.config({
    cloud_name: process.env.cloudName,
    api_key: process.env.apiKey,
    api_secret: process.env.apiSecret
});

class CloudinaryCustomStorage {
    constructor(opts = {}) {
        this.cloudinary = opts.cloudinary || cloudinary;
        this.folder = opts.folder || "RoomForU";
        this.allowedFormats = opts.allowedFormats || ["png", "jpg", "jpeg", "webp"];
    }

    _handleFile(req, file, cb) {
        const uploadStream = this.cloudinary.uploader.upload_stream(
            {
                folder: this.folder,
                resource_type: "image",
                allowed_formats: this.allowedFormats
            },
            (error, result) => {
                if (error) {
                    return cb(error);
                }
                cb(null, {
                    path: result.secure_url,
                    filename: result.public_id,
                    size: result.bytes,
                    format: result.format
                });
            }
        );

        file.stream.on("error", (err) => {
            uploadStream.destroy(err);
        });

        file.stream.pipe(uploadStream);
    }

    _removeFile(req, file, cb) {
        if (file && file.filename) {
            this.cloudinary.uploader.destroy(file.filename, (err) => cb(err));
        } else {
            cb(null);
        }
    }
}

const storage = new CloudinaryCustomStorage({
    cloudinary,
    folder: "RoomForU",
    allowedFormats: ["png", "jpg", "jpeg", "webp"]
});

// Helper to safely delete old or removed images from Cloudinary storage
const destroyCloudinaryImage = async (fileName) => {
    if (!fileName || fileName === "default-room" || fileName === "custom-image") {
        return;
    }
    try {
        await cloudinary.uploader.destroy(fileName);
    } catch (err) {
        console.error("Cloudinary asset cleanup error for:", fileName, err.message);
    }
};

// Multer MIME filter for image uploads
const imageFileFilter = (req, file, cb) => {
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Invalid file format. Only JPEG, PNG, and WebP images are allowed."), false);
    }
};

module.exports = {
    cloudinary,
    storage,
    destroyCloudinaryImage,
    imageFileFilter
};