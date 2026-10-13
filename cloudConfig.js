require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configuration with Cloudinary
cloudinary.config({
    cloud_name: process.env.cloudName,
    api_key: process.env.apiKey,
    api_secret: process.env.apiSecret
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "RoomForU",
        formats: ["png", "jpg", "jpeg", "webp"]
    },
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