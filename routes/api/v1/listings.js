const express = require("express");
const router = express.Router();
const multer = require("multer");
const { storage } = require("../../../cloudConfig.js");
const { isLoggedIn, isUser, isReviewOwner } = require("../../../middleware.js");
const listingController = require("../../../controller/api/v1/listingController.js");

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB file upload limit
});

// Flexible upload middleware supporting both JSON APIs and multipart forms
const uploadListingImage = (req, res, next) => {
    // If Content-Type is multipart/form-data, process with multer
    if (req.is("multipart/form-data")) {
        return upload.fields([
            { name: "image", maxCount: 1 },
            { name: "place[image]", maxCount: 1 }
        ])(req, res, (err) => {
            if (err) return next(err);
            if (req.files) {
                if (req.files["image"] && req.files["image"][0]) {
                    req.file = req.files["image"][0];
                } else if (req.files["place[image]"] && req.files["place[image]"][0]) {
                    req.file = req.files["place[image]"][0];
                }
            }
            next();
        });
    }
    // Otherwise continue for JSON or other payloads
    next();
};

// Listings CRUD
router.get("/", listingController.getAllListings);
router.get("/:id", listingController.getListingById);
router.post("/", isLoggedIn, uploadListingImage, listingController.createListing);
router.put("/:id", isLoggedIn, isUser, uploadListingImage, listingController.updateListing);
router.patch("/:id", isLoggedIn, isUser, uploadListingImage, listingController.updateListing);
router.delete("/:id", isLoggedIn, isUser, listingController.deleteListing);

// Nested Reviews
router.post("/:id/reviews", isLoggedIn, listingController.createReview);
router.delete("/:id/reviews/:reviewId", isLoggedIn, isReviewOwner, listingController.deleteReview);

module.exports = router;
