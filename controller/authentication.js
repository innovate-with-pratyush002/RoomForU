const Listing= require("../models/listing.js");
const Registration= require("../models/authentication.js");


//signup route
module.exports.signUpForm=(req,res)=>{
    res.render("./userAuthentication/signup.ejs");
}

module.exports.Signup=async(req,res,next)=>{
   try{
    const{name,email,username,password}=req.body;
    const newUser = new Registration({name,email,username});
    const registeredUser= await Registration.register(newUser, password);
    req.login(registeredUser,(err)=>{
        if(err){
            return next(err);
        }
        req.flash("success",`Welcome ${name}! You Have Registered Successfully!`);
        return res.redirect("/listings");
    });
   }catch(e){
      req.flash("error",e.message);
      return res.redirect("/signup");
   }
}

//signin route
module.exports.signinForm=(req,res)=>{
    res.render("./userAuthentication/signin.ejs");
}

module.exports.SignIn=async(req,res)=>{
  req.flash("success","Sign-In Successfully!");
  return res.redirect("/listings");
}

//logout
module.exports.logout=(req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.flash("success", "You have logged out successfully!");
        return res.redirect('/signin');
    });
}