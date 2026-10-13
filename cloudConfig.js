require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');


//configuration with cloudinary
cloudinary.config({
    cloud_name: process.env.cloudName,
    api_key: process.env.apiKey,
    api_secret: process.env.apiSecret
});


const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "RoomForU",
    formats: ["png","jpg","jpeg"]
  },
});

module.exports={
    cloudinary,
    storage
}