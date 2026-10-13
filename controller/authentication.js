const Listing = require("../models/listing.js");
const Registration = require("../models/authentication.js");

// Render signup form
module.exports.signUpForm = (req, res) => {
    res.render("./userAuthentication/signup.ejs");
};

// Process signup
module.exports.Signup = async (req, res, next) => {
    try {
        const { name, email, username, password } = req.body;
        const normalizedEmail = (email || "").trim().toLowerCase();
        const effectiveUsername =
            (username && username.trim()) ||
            `${normalizedEmail.split("@")[0]}_${Math.floor(1000 + Math.random() * 9000)}`;

        const newUser = new Registration({
            name: (name || "").trim(),
            email: normalizedEmail,
            username: effectiveUsername
        });

        const registeredUser = await Registration.register(newUser, password);

        req.login(registeredUser, (err) => {
            if (err) {
                return next(err);
            }
            req.flash("success", `Welcome ${registeredUser.name}! You Have Registered Successfully!`);
            return res.redirect("/listings");
        });
    } catch (e) {
        req.flash("error", e.message);
        return res.redirect("/signup");
    }
};

// Render signin form
module.exports.signinForm = (req, res) => {
    res.render("./userAuthentication/signin.ejs");
};

// Process signin success
module.exports.SignIn = async (req, res) => {
    req.flash("success", "Signed In Successfully!");
    return res.redirect("/listings");
};

// Process logout
module.exports.logout = (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.flash("success", "You have logged out successfully!");
        return res.redirect("/signin");
    });
};