const express= require("express");
const Listing= require("../models/listing.js")
const wrapAsync= require("../utils/wrapAsync.js");
const ExpressError= require("../utils/ExpressError.js");
const router= express.Router();
const {isLoggedIn, isUser} = require("../middleware.js");
const ListingControllers= require("../controller/listing.js");
const multer  = require('multer');
const {storage}= require("../cloudConfig.js");
const upload = multer({ storage });


//route for showing all listings:=>
router.get("/",wrapAsync(ListingControllers.showAllListings));


//add route where we can add a new listing:=> 
router.get("/new",isLoggedIn,ListingControllers.showform);                                                            

router.post("/",isLoggedIn,upload.single("place[image]"),wrapAsync(ListingControllers.addListing));


//edit & update route:=>
router.get("/:id/edit",isLoggedIn,isUser,wrapAsync(ListingControllers.findForUpdate));
router.put("/:id",isLoggedIn,isUser,upload.single("place[image]"),wrapAsync(ListingControllers.updateListing));


//delete route:=>
router.delete("/:id",isLoggedIn,isUser,wrapAsync(ListingControllers.deleteListing));


//detail route:=>
router.get("/:id",isLoggedIn,wrapAsync(ListingControllers.listingDetails));




module.exports=router;
