const Registration = require("../../../models/authentication.js");
const passport = require("passport");
const ExpressError = require("../../../utils/ExpressError.js");

// Sanitize user object to never leak internal passport fields (hash, salt)
const formatUserResponse = (user) => {
    if (!user) return null;
    return {
        id: user._id.toString(),
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        username: user.username || (user.email ? user.email.split("@")[0] : null),
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

        if (typeof name !== "string" || !name.trim()) {
            throw new ExpressError(400, "Name must be a valid string.");
        }

        if (typeof email !== "string" || !email.trim()) {
            throw new ExpressError(400, "Email must be a valid string.");
        }

        const normalizedEmail = email.trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(normalizedEmail)) {
            throw new ExpressError(400, "Please provide a valid email address.");
        }

        if (typeof password !== "string") {
            throw new ExpressError(400, "Password must be a valid string.");
        }

        if (password.length < 6) {
            throw new ExpressError(400, "Password must be at least 6 characters long.");
        }

        if (password.length > 128) {
            throw new ExpressError(400, "Password must not exceed 128 characters.");
        }

        const effectiveUsername = (username && typeof username === "string" && username.trim()) ||
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
        const rawIdentifier = req.body.username || req.body.email || "";
        const identifier = typeof rawIdentifier === "string" ? rawIdentifier.trim() : "";
        const password = req.body.password;

        if (!identifier || !password) {
            return res.status(400).json({
                success: false,
                status: 400,
                message: "Username/email and password are required."
            });
        }

        if (typeof password !== "string") {
            return res.status(400).json({
                success: false,
                status: 400,
                message: "Password must be a valid string."
            });
        }

        if (password.length > 128) {
            return res.status(400).json({
                success: false,
                status: 400,
                message: "Password must not exceed 128 characters."
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
        const isProduction = process.env.NODE_ENV === "production";
        const cookieOptions = {
            path: "/",
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax"
        };

        // Destroy session store data if active
        if (req.session) {
            req.session.destroy((destroyErr) => {
                if (destroyErr) {
                    console.error("Session destroy error during logout:", destroyErr);
                }
                res.clearCookie(cookieName, cookieOptions);
                res.clearCookie("connect.sid", cookieOptions);
                return res.status(200).json({
                    success: true,
                    status: 200,
                    message: "Logged out successfully."
                });
            });
        } else {
            res.clearCookie(cookieName, cookieOptions);
            res.clearCookie("connect.sid", cookieOptions);
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
    let returnTo = req.session?.returnTo || "/listings";
    delete req.session?.returnTo;

    // Validate returnTo strictly as a safe relative path
    if (
        typeof returnTo !== "string" ||
        !returnTo.startsWith("/") ||
        returnTo.startsWith("//") ||
        returnTo.includes("\\") ||
        returnTo.includes("://")
    ) {
        returnTo = "/listings";
    }

    const frontendBase =
        process.env.FRONTEND_URL && !process.env.FRONTEND_URL.includes("localhost:5000")
            ? process.env.FRONTEND_URL
            : "http://localhost:3000";

    const targetUrl = `${frontendBase}${returnTo}`;
    return res.redirect(targetUrl);
};

