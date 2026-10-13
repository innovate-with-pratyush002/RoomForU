const Registration = require("../../../models/authentication.js");
const passport = require("passport");
const ExpressError = require("../../../utils/ExpressError.js");

// Sanitize user object to never leak internal passport fields (hash, salt)
const formatUserResponse = (user) => {
    if (!user) return null;
    return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        username: user.username,
        picture: user.picture || null,
        createdAt: user.createdAt
    };
};

// POST /api/v1/auth/signup
module.exports.signup = async (req, res, next) => {
    try {
        const { name, email, username, password } = req.body;

        if (!name || !email || !password) {
            throw new ExpressError(400, "Name, email, and password are required.");
        }

        const normalizedEmail = email.trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(normalizedEmail)) {
            throw new ExpressError(400, "Please provide a valid email address.");
        }

        if (password.length < 6) {
            throw new ExpressError(400, "Password must be at least 6 characters long.");
        }

        const effectiveUsername = (username && username.trim()) ||
            `${normalizedEmail.split("@")[0]}_${Math.floor(1000 + Math.random() * 9000)}`;

        // Check if email already registered
        const existingEmail = await Registration.findOne({ email: normalizedEmail });
        if (existingEmail) {
            throw new ExpressError(409, "An account with this email address already exists.");
        }

        const newUser = new Registration({
            name: name.trim(),
            email: normalizedEmail,
            username: effectiveUsername.trim()
        });

        const registeredUser = await Registration.register(newUser, password);

        req.login(registeredUser, (err) => {
            if (err) return next(err);
            return res.status(201).json({
                success: true,
                status: 201,
                message: `Welcome ${registeredUser.name}! Registration successful.`,
                user: formatUserResponse(registeredUser)
            });
        });
    } catch (err) {
        next(err);
    }
};

// POST /api/v1/auth/signin
module.exports.signin = async (req, res, next) => {
    try {
        const identifier = (req.body.username || req.body.email || "").trim();
        const password = req.body.password;

        if (!identifier || !password) {
            return res.status(400).json({
                success: false,
                status: 400,
                message: "Username/email and password are required."
            });
        }

        // If user provided an email address instead of username, resolve their username
        if (identifier.includes("@")) {
            const userWithEmail = await Registration.findOne({ email: identifier.toLowerCase() });
            if (userWithEmail && userWithEmail.username) {
                req.body.username = userWithEmail.username;
            }
        } else {
            req.body.username = identifier;
        }

        passport.authenticate("local", (err, user, info) => {
            if (err) return next(err);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    status: 401,
                    message: info?.message || "Invalid username/email or password."
                });
            }

            req.login(user, (loginErr) => {
                if (loginErr) return next(loginErr);
                return res.status(200).json({
                    success: true,
                    status: 200,
                    message: "Signed in successfully.",
                    user: formatUserResponse(user)
                });
            });
        })(req, res, next);
    } catch (err) {
        next(err);
    }
};

// POST /api/v1/auth/logout & GET /api/v1/auth/logout
module.exports.logout = (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);

        const cookieName = process.env.SESSION_COOKIE_NAME || "roomforu.sid";

        // Destroy session store data if active
        if (req.session) {
            req.session.destroy((destroyErr) => {
                if (destroyErr) {
                    console.error("Session destroy error during logout:", destroyErr);
                }
                res.clearCookie(cookieName, { path: "/" });
                res.clearCookie("connect.sid", { path: "/" });
                return res.status(200).json({
                    success: true,
                    status: 200,
                    message: "Logged out successfully."
                });
            });
        } else {
            res.clearCookie(cookieName, { path: "/" });
            res.clearCookie("connect.sid", { path: "/" });
            return res.status(200).json({
                success: true,
                status: 200,
                message: "Logged out successfully."
            });
        }
    });
};

// GET /api/v1/auth/current-user & GET /api/v1/auth/me
module.exports.currentUser = (req, res) => {
    if (req.isAuthenticated() && req.user) {
        return res.status(200).json({
            success: true,
            status: 200,
            authenticated: true,
            user: formatUserResponse(req.user)
        });
    }

    return res.status(200).json({
        success: true,
        status: 200,
        authenticated: false,
        user: null
    });
};

// GET /api/v1/auth/google/callback handler
module.exports.googleCallback = (req, res) => {
    return res.redirect("/listings");
};
