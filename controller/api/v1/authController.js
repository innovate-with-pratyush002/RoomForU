const mongoose = require("mongoose");
const Registration = require("../../../models/authentication.js");
const OtpVerification = require("../../../models/otp.js");
const passport = require("passport");
const ExpressError = require("../../../utils/ExpressError.js");
const emailService = require("../../../services/emailService.js");
const {
    generateNumericOtp,
    hashSecret,
    timingSafeEqualHex,
    generateRandomToken,
    encryptPayload,
    decryptPayload,
    maskEmail
} = require("../../../utils/cryptoUtils.js");

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

// =========================================================================
// 1. SIGNUP EMAIL OTP VERIFICATION WORKFLOW
// =========================================================================

/**
 * POST /api/v1/auth/signup/request-otp
 * Validates signup inputs, ensures uniqueness, encrypts pending registration data,
 * and sends a 6-digit verification OTP to the user's email address via Brevo.
 */
module.exports.requestSignupOtp = async (req, res, next) => {
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

        const effectiveUsername =
            (username && typeof username === "string" && username.trim()) ||
            `${normalizedEmail.split("@")[0]}_${Math.floor(1000 + Math.random() * 9000)}`;

        // Validate username format if explicitly provided
        if (username && typeof username === "string") {
            const cleanUser = username.trim();
            if (!/^[a-zA-Z0-9_.-]{3,30}$/.test(cleanUser)) {
                throw new ExpressError(400, "Username must be 3-30 characters and contain only letters, numbers, underscores, dots, or dashes.");
            }
        }

        // 1. Check if email is already registered in UserAuth
        const existingEmail = await Registration.findOne({ email: normalizedEmail });
        if (existingEmail) {
            throw new ExpressError(409, "An account with this email address already exists.");
        }

        // 2. Check if username is already registered in UserAuth
        const existingUsername = await Registration.findOne({ username: effectiveUsername.trim() });
        if (existingUsername) {
            throw new ExpressError(409, "This username is already taken. Please choose another username.");
        }

        // 3. Resend cooldown & rate limiting (60s cooldown per email)
        const existingOtp = await OtpVerification.findOne({
            email: normalizedEmail,
            purpose: "SIGNUP_VERIFICATION"
        });

        if (existingOtp) {
            const timeSinceLastSent = Date.now() - new Date(existingOtp.lastSentAt).getTime();
            if (timeSinceLastSent < 60 * 1000) {
                const waitSecs = Math.ceil((60000 - timeSinceLastSent) / 1000);
                throw new ExpressError(429, `Please wait ${waitSecs} seconds before requesting another verification code.`);
            }

            if (existingOtp.resendCount >= 5) {
                throw new ExpressError(429, "Too many verification requests for this email. Please try again after 15 minutes.");
            }
        }

        // 4. Generate cryptographically secure OTP & hash it
        const otp = generateNumericOtp();
        const otpHash = hashSecret(otp);

        // 5. Encrypt sensitive registration data at rest using AES-256-GCM
        const encryptedUserData = encryptPayload({
            name: name.trim(),
            email: normalizedEmail,
            username: effectiveUsername.trim(),
            password: password
        });

        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await OtpVerification.findOneAndUpdate(
            { email: normalizedEmail, purpose: "SIGNUP_VERIFICATION" },
            {
                email: normalizedEmail,
                otpHash,
                purpose: "SIGNUP_VERIFICATION",
                pendingUserData: encryptedUserData,
                attempts: 0,
                resendCount: existingOtp ? existingOtp.resendCount + 1 : 0,
                lastSentAt: new Date(),
                expiresAt,
                isVerified: false
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // 6. Send transactional email via Brevo
        await emailService.sendSignupOtpEmail({
            toEmail: normalizedEmail,
            name: name.trim(),
            otp
        });

        return res.status(200).json({
            success: true,
            status: 200,
            message: `A 6-digit verification code has been sent to ${normalizedEmail}.`,
            email: normalizedEmail
        });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/v1/auth/signup/resend-otp
 * Resends a fresh OTP for pending signup verification with cooldown checks.
 */
module.exports.resendSignupOtp = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email || typeof email !== "string") {
            throw new ExpressError(400, "Email address is required.");
        }

        const normalizedEmail = email.trim().toLowerCase();
        const otpDoc = await OtpVerification.findOne({
            email: normalizedEmail,
            purpose: "SIGNUP_VERIFICATION"
        });

        if (!otpDoc || !otpDoc.pendingUserData) {
            throw new ExpressError(400, "No pending registration found for this email. Please submit the signup form again.");
        }

        // 60-second cooldown check
        const timeSinceLastSent = Date.now() - new Date(otpDoc.lastSentAt).getTime();
        if (timeSinceLastSent < 60 * 1000) {
            const waitSecs = Math.ceil((60000 - timeSinceLastSent) / 1000);
            throw new ExpressError(429, `Please wait ${waitSecs} seconds before requesting a new verification code.`);
        }

        if (otpDoc.resendCount >= 5) {
            throw new ExpressError(429, "Maximum resend limit reached. Please start the signup process again.");
        }

        let pending;
        try {
            pending = decryptPayload(otpDoc.pendingUserData);
        } catch {
            throw new ExpressError(400, "Registration session corrupted. Please fill out the signup form again.");
        }

        const newOtp = generateNumericOtp();
        otpDoc.otpHash = hashSecret(newOtp);
        otpDoc.attempts = 0;
        otpDoc.resendCount += 1;
        otpDoc.lastSentAt = new Date();
        otpDoc.expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await otpDoc.save();

        await emailService.sendSignupOtpEmail({
            toEmail: normalizedEmail,
            name: pending.name,
            otp: newOtp
        });

        return res.status(200).json({
            success: true,
            status: 200,
            message: "A new verification code has been sent to your email."
        });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/v1/auth/signup/verify
 * Validates the OTP. Only upon valid OTP is the user account actually created in DB and session initiated.
 */
module.exports.verifySignupOtp = async (req, res, next) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            throw new ExpressError(400, "Email and 6-digit verification code are required.");
        }

        const normalizedEmail = email.trim().toLowerCase();
        const otpDoc = await OtpVerification.findOne({
            email: normalizedEmail,
            purpose: "SIGNUP_VERIFICATION"
        });

        if (!otpDoc || !otpDoc.pendingUserData) {
            throw new ExpressError(400, "Verification code has expired or registration session was not found. Please sign up again.");
        }

        // Attempt limiting to prevent brute-force
        otpDoc.attempts += 1;
        if (otpDoc.attempts > otpDoc.maxAttempts) {
            await OtpVerification.deleteOne({ _id: otpDoc._id });
            throw new ExpressError(400, "Too many incorrect attempts. This code has been invalidated. Please sign up again.");
        }
        await otpDoc.save();

        const candidateHash = hashSecret(otp.toString().trim());
        const isMatch = timingSafeEqualHex(candidateHash, otpDoc.otpHash);

        if (!isMatch) {
            const remaining = otpDoc.maxAttempts - otpDoc.attempts;
            throw new ExpressError(
                400,
                `Invalid verification code. ${remaining > 0 ? `${remaining} attempt(s) remaining.` : "Please request a new code."}`
            );
        }

        // Decrypt pending registration data
        let pendingData;
        try {
            pendingData = decryptPayload(otpDoc.pendingUserData);
        } catch {
            await OtpVerification.deleteOne({ _id: otpDoc._id });
            throw new ExpressError(400, "Unable to decrypt pending signup data. Please try signing up again.");
        }

        // Race condition prevention: check whether email or username was claimed in the interim
        const existingEmail = await Registration.findOne({ email: pendingData.email });
        if (existingEmail) {
            await OtpVerification.deleteOne({ _id: otpDoc._id });
            throw new ExpressError(409, "An account with this email address already exists.");
        }

        const existingUsername = await Registration.findOne({ username: pendingData.username });
        if (existingUsername) {
            await OtpVerification.deleteOne({ _id: otpDoc._id });
            throw new ExpressError(409, "This username has just been taken by another user. Please choose another username.");
        }

        // Create user in MongoDB with passport-local-mongoose
        const newUser = new Registration({
            name: pendingData.name,
            email: pendingData.email,
            username: pendingData.username
        });

        const registeredUser = await Registration.register(newUser, pendingData.password);

        // Delete the used OTP record
        await OtpVerification.deleteOne({ _id: otpDoc._id });

        // Establish authenticated session
        req.login(registeredUser, (err) => {
            if (err) return next(err);
            return res.status(201).json({
                success: true,
                status: 201,
                message: `Welcome ${registeredUser.name}! Email verified and account created successfully.`,
                user: formatUserResponse(registeredUser)
            });
        });
    } catch (err) {
        next(err);
    }
};

// =========================================================================
// 2. FORGOT PASSWORD / PASSWORD RESET WORKFLOW
// =========================================================================

/**
 * POST /api/v1/auth/password-reset/request-otp
 * Accepts either registered email or username.
 * Sends OTP to the registered email address.
 * Employs anti-enumeration so public response does not leak whether account exists.
 */
module.exports.requestPasswordResetOtp = async (req, res, next) => {
    try {
        const { identifier } = req.body;

        if (!identifier || typeof identifier !== "string" || !identifier.trim()) {
            throw new ExpressError(400, "Please enter your registered email address or username.");
        }

        const cleanIdentifier = identifier.trim();
        let user;

        if (cleanIdentifier.includes("@")) {
            user = await Registration.findOne({ email: cleanIdentifier.toLowerCase() });
        } else {
            user = await Registration.findOne({ username: cleanIdentifier });
            if (!user) {
                user = await Registration.findOne({
                    username: new RegExp(`^${cleanIdentifier.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i")
                });
            }
        }

        // Generic non-enumerating message
        const genericMessage = "If an account matches that email or username, a 6-digit verification code has been sent.";

        if (!user || !user.email) {
            // Delay slightly to prevent timing differences between found and not-found accounts
            await new Promise((r) => setTimeout(r, 300));
            return res.status(200).json({
                success: true,
                status: 200,
                message: genericMessage
            });
        }

        // Cooldown check (60s)
        const existingOtp = await OtpVerification.findOne({
            email: user.email,
            purpose: "PASSWORD_RESET"
        });

        if (existingOtp) {
            const timeSinceLastSent = Date.now() - new Date(existingOtp.lastSentAt).getTime();
            if (timeSinceLastSent < 60 * 1000) {
                const waitSecs = Math.ceil((60000 - timeSinceLastSent) / 1000);
                throw new ExpressError(429, `A code was recently sent. Please wait ${waitSecs} seconds before requesting another.`);
            }
        }

        const otp = generateNumericOtp();
        const otpHash = hashSecret(otp);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await OtpVerification.findOneAndUpdate(
            { email: user.email, purpose: "PASSWORD_RESET" },
            {
                email: user.email,
                otpHash,
                purpose: "PASSWORD_RESET",
                attempts: 0,
                resendCount: existingOtp ? existingOtp.resendCount + 1 : 0,
                lastSentAt: new Date(),
                resetTokenHash: null,
                resetTokenExpiresAt: null,
                isVerified: false,
                expiresAt
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        await emailService.sendPasswordResetOtpEmail({
            toEmail: user.email,
            name: user.name,
            otp
        });

        return res.status(200).json({
            success: true,
            status: 200,
            message: genericMessage,
            emailMasked: maskEmail(user.email),
            targetEmail: user.email
        });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/v1/auth/password-reset/resend-otp
 * Resends a fresh password reset OTP with cooldown enforcement.
 */
module.exports.resendPasswordResetOtp = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email || typeof email !== "string") {
            throw new ExpressError(400, "Email address is required.");
        }

        const normalizedEmail = email.trim().toLowerCase();
        const otpDoc = await OtpVerification.findOne({
            email: normalizedEmail,
            purpose: "PASSWORD_RESET"
        });

        if (!otpDoc) {
            throw new ExpressError(400, "No active password reset request found. Please request a new code.");
        }

        const timeSinceLastSent = Date.now() - new Date(otpDoc.lastSentAt).getTime();
        if (timeSinceLastSent < 60 * 1000) {
            const waitSecs = Math.ceil((60000 - timeSinceLastSent) / 1000);
            throw new ExpressError(429, `Please wait ${waitSecs} seconds before requesting a new code.`);
        }

        if (otpDoc.resendCount >= 5) {
            throw new ExpressError(429, "Maximum reset code requests exceeded. Please try again after 15 minutes.");
        }

        const user = await Registration.findOne({ email: normalizedEmail });
        const newOtp = generateNumericOtp();

        otpDoc.otpHash = hashSecret(newOtp);
        otpDoc.attempts = 0;
        otpDoc.resendCount += 1;
        otpDoc.lastSentAt = new Date();
        otpDoc.expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        otpDoc.resetTokenHash = null;
        otpDoc.resetTokenExpiresAt = null;
        otpDoc.isVerified = false;
        await otpDoc.save();

        await emailService.sendPasswordResetOtpEmail({
            toEmail: normalizedEmail,
            name: user?.name || "User",
            otp: newOtp
        });

        return res.status(200).json({
            success: true,
            status: 200,
            message: "A new password reset code has been sent to your email."
        });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/v1/auth/password-reset/verify-otp
 * Validates the entered OTP. If valid, generates an unpredictable single-use resetToken.
 * This token is required to set the new password in the final step.
 */
module.exports.verifyPasswordResetOtp = async (req, res, next) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            throw new ExpressError(400, "Email and verification code are required.");
        }

        const normalizedEmail = email.trim().toLowerCase();
        const otpDoc = await OtpVerification.findOne({
            email: normalizedEmail,
            purpose: "PASSWORD_RESET"
        });

        if (!otpDoc) {
            throw new ExpressError(400, "Verification code has expired or was not requested. Please request a new code.");
        }

        otpDoc.attempts += 1;
        if (otpDoc.attempts > otpDoc.maxAttempts) {
            await OtpVerification.deleteOne({ _id: otpDoc._id });
            throw new ExpressError(400, "Too many incorrect attempts. This code has been invalidated. Please request a new code.");
        }
        await otpDoc.save();

        const candidateHash = hashSecret(otp.toString().trim());
        const isMatch = timingSafeEqualHex(candidateHash, otpDoc.otpHash);

        if (!isMatch) {
            const remaining = otpDoc.maxAttempts - otpDoc.attempts;
            throw new ExpressError(
                400,
                `Invalid verification code. ${remaining > 0 ? `${remaining} attempt(s) remaining.` : "Please request a new code."}`
            );
        }

        // Generate unpredictable, single-use resetToken
        const resetToken = generateRandomToken(32);
        const resetTokenHash = hashSecret(resetToken);

        otpDoc.isVerified = true;
        otpDoc.resetTokenHash = resetTokenHash;
        otpDoc.resetTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min window
        await otpDoc.save();

        return res.status(200).json({
            success: true,
            status: 200,
            message: "Code verified successfully! You can now set your new password.",
            resetToken: resetToken
        });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/v1/auth/password-reset/confirm
 * Requires the verified resetToken, sets new password, invalidates the token,
 * and clears any active sessions for the user.
 */
module.exports.confirmPasswordReset = async (req, res, next) => {
    try {
        const { resetToken, newPassword, confirmPassword } = req.body;

        if (!resetToken || typeof resetToken !== "string" || !resetToken.trim()) {
            throw new ExpressError(400, "Reset authorization token is missing. Please start over.");
        }

        if (!newPassword || typeof newPassword !== "string") {
            throw new ExpressError(400, "Please provide a valid new password.");
        }

        if (newPassword.length < 6) {
            throw new ExpressError(400, "Password must be at least 6 characters long.");
        }

        if (newPassword.length > 128) {
            throw new ExpressError(400, "Password must not exceed 128 characters.");
        }

        if (newPassword !== confirmPassword) {
            throw new ExpressError(400, "Password confirmation does not match new password.");
        }

        const tokenHash = hashSecret(resetToken.trim());
        const otpDoc = await OtpVerification.findOne({
            resetTokenHash: tokenHash,
            purpose: "PASSWORD_RESET",
            isVerified: true
        });

        if (!otpDoc || !otpDoc.resetTokenExpiresAt || new Date(otpDoc.resetTokenExpiresAt).getTime() < Date.now()) {
            throw new ExpressError(400, "Reset token has expired or is invalid. Please request a new verification code.");
        }

        const user = await Registration.findOne({ email: otpDoc.email });
        if (!user) {
            await OtpVerification.deleteOne({ _id: otpDoc._id });
            throw new ExpressError(404, "Associated account was not found.");
        }

        // Use passport-local-mongoose's setPassword to securely hash salt & password
        await new Promise((resolve, reject) => {
            user.setPassword(newPassword, (err, updatedUser) => {
                if (err) return reject(err);
                resolve(updatedUser);
            });
        });

        await user.save();

        // Invalidate OTP/token record immediately (single-use guarantee)
        await OtpVerification.deleteOne({ _id: otpDoc._id });

        // Invalidate active sessions stored in MongoDB for this user
        try {
            const sessionCollection = mongoose.connection.collection("sessions");
            if (sessionCollection) {
                await sessionCollection.deleteMany({
                    session: new RegExp(`"${user._id.toString()}"`)
                });
            }
        } catch (sessionErr) {
            console.warn("Notice: Background session purge:", sessionErr.message);
        }

        // If current request has an active session, destroy it
        if (req.session) {
            req.session.destroy(() => {});
        }

        return res.status(200).json({
            success: true,
            status: 200,
            message: "Your password has been reset successfully! You can now sign in with your new password."
        });
    } catch (err) {
        next(err);
    }
};


