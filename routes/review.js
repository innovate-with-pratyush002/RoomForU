const express= require("express");
const Listing= require("../models/listing.js")
const wrapAsync= require("../utils/wrapAsync.js");
const ExpressError= require("../utils/ExpressError.js");
const Review= require("../models/review.js");
const router= express.Router({mergeParams: true});
const {isLoggedIn, isReviewOwner} = require("../middleware.js");
const ListingControllers= require("../controller/review.js");



//review route
router.post("/",isLoggedIn,wrapAsync(ListingControllers.createReview));

//delete review route
router.delete("/:reviewId",isLoggedIn,isReviewOwner,wrapAsync(ListingControllers.deleteReview));

module.exports=router;