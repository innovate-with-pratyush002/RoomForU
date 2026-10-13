require('dotenv').config();
const express= require("express");
const app= express();
const mongoose = require("mongoose");
const Listing= require("./models/listing.js")
const path = require("path");
const methodOverride= require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync= require("./utils/wrapAsync.js");
const ExpressError= require("./utils/ExpressError.js");
const listingsRoute= require("./routes/listing.js");
const reviewRoute= require("./routes/review.js");
const authenticationRoute= require("./routes/authentication.js");
const filterAndSearchRoute= require("./routes/filterAndSearch.js");
const userProfile= require("./routes/userProfile.js");
const session= require("express-session");
const MongoStore = require('connect-mongo').default;
const flash= require("connect-flash");
const passport=require("passport");
const LocalStrategy= require("passport-local");
const userAuth=require("./models/authentication.js");
const GoogleStrategy= require("passport-google-oauth20").Strategy;




app.engine('ejs', ejsMate);
app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views")); 
if (process.env.NODE_ENV === "production") {
    app.set('trust proxy', 1);
}
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname,"/public")));



//Session 
const sessionSecret = process.env.SESSION_SECRET || "fallback_development_session_secret_key_2025";

const store = MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    crypto: { secret: sessionSecret },
    touchAfter: 24 * 3600, 
});

store.on("error", (e)=>{
    console.log("Session Store Error", e);
});

const sessionDetail = {
    store,
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000
    }
};
app.use(session(sessionDetail));
app.use(flash());



//Passport for Authentication
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(userAuth.authenticate()));

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || "https://roomforu.onrender.com/auth/google/callback",
},
  async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails?.[0]?.value;

    // find by googleId
    let user = await userAuth.findOne({ googleId: profile.id });

    if (user) {
      // if exist, then direct return
      return done(null, user);
    }

    // find by email
    user = await userAuth.findOne({ email: email });

    if (user) {
      // email matched  update googleId 
      user.googleId = profile.id;
      user.name = profile.displayName;
      user.picture = profile.photos?.[0]?.value;
      await user.save();
      return done(null, user);
    }

    // create new user
    user = await userAuth.create({
      name: profile.displayName,
      email: email,
      googleId: profile.id,
      picture: profile.photos?.[0]?.value
    });

    return done(null, user);

  } catch (error) {
    return done(error, null);
  }
}

));



passport.serializeUser((user, done) => {
    done(null, user.id); 
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await userAuth.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});




//mongoose Connection
const MONGO_URL = process.env.MONGO_URI;
const PORT = process.env.PORT || 3000;

async function main(){
    await mongoose.connect(MONGO_URL);
}

main()
    .then(()=>{
        console.log("Connected to MongoDB successfully");
        app.listen(PORT,()=>{
            console.log(`StudentRoomHub app is listening on port ${PORT}`);
        });
    })
    .catch((err)=>{
        console.error("MongoDB connection failed:", err);
    });



//home route
app.get("/",wrapAsync(async(req,res)=>{
     res.redirect("/listings");
}));

// app.get("/check",async(req,res)=>{
//     const userdetail= new userAuth({
//         name:"pratyush",
//         email:"pratyush1532@gmail.com",
//         username:"pratyush_1532"
//     });
//     let newUser= await userAuth.register(userdetail,"123@pttt");
//     res.send(newUser);
// });

//middleware for flash message
app.use((req,res,next)=>{
    res.locals.success=req.flash("success");
    res.locals.error=req.flash("error");
    res.locals.currentUser= req.user;
    next();
})

//Routes
app.use("/listings",listingsRoute);
app.use("/listings/:id/reviews",reviewRoute);
app.use("/",authenticationRoute);
app.use("/search",filterAndSearchRoute);
app.use("/profile",userProfile);


// app.all("*",(req,res,next)=>{
// res.send("somethink went wrong");
// });

    
// middleware for error handling
app.use((err,req,res,next)=>{
    let{status=500,message="Something Went Wrong!"}=err;
    res.status(status).send(message); 
});


































// TERI AANKHO KI SHOKHI ME KOYI RAAJ TO HOGA,
// BINA KAHE HI SAB KUCHH KAH JANA ANDAAJ TO HOGA.
// JHEEL SI GAHRAI, CHAND SI ROSHANI HAI INME,
// INN NIGAAHO ME CHHUPA KOYI SAAJ TO HOGA.
// JAB BHI DEKHU KHUD KO KHOYA PATA HU,
// INN AANKHO ME KOYI MERA AAJ TO HOGA.




