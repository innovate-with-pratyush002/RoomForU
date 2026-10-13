const express= require("express");
const wrapAsync= require("../utils/wrapAsync.js");
const router= express.Router();
const Registration= require("../models/authentication.js");
const passport= require("passport");
const ListingControllers= require("../controller/authentication.js");




//signup route
router.get("/signup",ListingControllers.signUpForm);

router.post("/signup",wrapAsync(ListingControllers.Signup));




// google authentication
router.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/signin' }),
    (req, res) => {
        res.redirect('/listings');
    }
);





//signin route
router.get("/signin",ListingControllers.signinForm);

router.post("/signin", passport.authenticate("local", { failureRedirect: '/signin',failureFlash:true }),wrapAsync(ListingControllers.SignIn));




//logout route
router.get('/logout', ListingControllers.logout);

module.exports=router;