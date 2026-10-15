require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const passport = require("passport");
const LocalStrategy = require("passport-local");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const userAuth = require("./models/authentication.js");

// Security Middleware
const {
    helmetMiddleware,
    corsMiddleware,
    csrfProtection,
    noCacheMiddleware
} = require("./middleware/security.js");

// Error Handlers
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler.js");

// Routes
const apiV1Routes = require("./routes/api/v1/index.js");
const authRoutes = require("./routes/api/v1/auth.js");

const app = express();

// Trust Proxy in production (for load balancers, secure cookies, and rate limiting)
if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
}

// 1. Security Middlewares
app.use(helmetMiddleware);
app.use(corsMiddleware);

// 2. Request Parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 3. CSRF Protection for state mutations
app.use(csrfProtection);

// 4. Session & Persistent Store Configuration
const isProduction = process.env.NODE_ENV === "production";
const sessionSecret = process.env.SESSION_SECRET || "fallback_development_session_secret_key_2025";

if (isProduction && (!process.env.SESSION_SECRET || process.env.SESSION_SECRET === "fallback_development_session_secret_key_2025")) {
    console.error("FATAL ERROR: In production, SESSION_SECRET environment variable must be set to a secure random string.");
    process.exit(1);
}

const mongoUrl = process.env.MONGO_URI;

let store;
if (mongoUrl) {
    const createStore = typeof MongoStore?.create === "function"
        ? MongoStore.create
        : MongoStore?.default?.create;

    if (createStore) {
        store = createStore({
            mongoUrl: mongoUrl,
            crypto: { secret: sessionSecret },
            touchAfter: 24 * 3600 // Lazy session update every 24 hours
        });

        store.on("error", (err) => {
            console.error("Session Store Error:", err);
        });
    }
}

const sessionDetail = {
    ...(store ? { store } : {}),
    name: "roomforu.sid",
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        maxAge: 24 * 60 * 60 * 1000 // 1 day
    }
};

app.use(session(sessionDetail));

// 5. Passport Authentication Configuration
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(userAuth.authenticate()));

// Configure Google OAuth Strategy if credentials are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL:
                    process.env.GOOGLE_CALLBACK_URL ||
                    "http://localhost:5000/auth/google/callback"
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    const email = profile.emails?.[0]?.value;
                    const isEmailVerified = profile.emails?.[0]?.verified !== false;

                    // 1. Find by googleId
                    let user = await userAuth.findOne({ googleId: profile.id });
                    if (user) {
                        return done(null, user);
                    }

                    // 2. Find by matching verified email
                    if (email && isEmailVerified) {
                        user = await userAuth.findOne({ email });
                        if (user) {
                            user.googleId = profile.id;
                            user.name = user.name || profile.displayName;
                            user.picture = user.picture || profile.photos?.[0]?.value;
                            await user.save();
                            return done(null, user);
                        }
                    }

                    // 3. Create new user account
                    user = await userAuth.create({
                        name: profile.displayName || "User",
                        email: email || `${profile.id}@google.auth`,
                        googleId: profile.id,
                        picture: profile.photos?.[0]?.value,
                        username:
                            (email ? email.split("@")[0] : `user_${profile.id}`) +
                            "_" +
                            Math.floor(1000 + Math.random() * 9000)
                    });

                    return done(null, user);
                } catch (error) {
                    return done(error, null);
                }
            }
        )
    );
}

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await userAuth.findById(id).select("-hash -salt").lean();
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

// 6. Base API Health & Discovery Route
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        service: "RoomForU REST API Backend",
        version: "v1.0.0",
        status: "operational",
        endpoints: {
            api: "/api/v1",
            health: "/api/v1/health",
            auth: "/api/v1/auth",
            listings: "/api/v1/listings",
            profile: "/api/v1/profile"
        }
    });
});

// 7. Route Handlers
// 7.1 OAuth and Auth routes (supports /auth/google, /auth/google/callback, etc.)
app.use("/auth", authRoutes);

// 7.2 REST API v1
app.use("/api", noCacheMiddleware);
app.use("/api/v1", apiV1Routes);

// 8. Centralized 404 & Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

// 9. Production-Grade Server Startup & Lifecycle Management
const PORT = parseInt(process.env.PORT, 10) || 5000;

async function startServer() {
    if (!mongoUrl) {
        console.error("FATAL ERROR: MONGO_URI environment variable is not defined.");
        process.exit(1);
    }

    try {
        // Connect to MongoDB with production-grade pool and timeout options
        await mongoose.connect(mongoUrl, {
            maxPoolSize: 25,
            minPoolSize: 5,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log("Connected to MongoDB successfully.");

        // Monitor connection health after startup
        mongoose.connection.on("error", (err) => {
            console.error("MongoDB runtime error:", err);
        });

        mongoose.connection.on("disconnected", () => {
            console.warn("MongoDB connection disconnected.");
        });

        const server = app.listen(PORT, () => {
            console.log(`StudentRoomHub server is running on port ${PORT} [${process.env.NODE_ENV || "development"}]`);
        });

        // Graceful termination handling
        const handleShutdown = (signal) => {
            console.log(`Received ${signal}. Shutting down gracefully...`);
            server.close(async () => {
                console.log("HTTP server closed.");
                try {
                    await mongoose.connection.close(false);
                    console.log("MongoDB connection closed.");
                } catch (closeErr) {
                    console.error("Error closing MongoDB connection:", closeErr);
                }
                process.exit(0);
            });

            // Hard timeout if shutdown hangs
            setTimeout(() => {
                console.error("Forceful shutdown after timeout.");
                process.exit(1);
            }, 10000).unref();
        };

        process.on("SIGTERM", () => handleShutdown("SIGTERM"));
        process.on("SIGINT", () => handleShutdown("SIGINT"));

        return server;
    } catch (err) {
        console.error("FATAL ERROR: Failed to connect to MongoDB:", err.message);
        process.exit(1);
    }
}

// Start server if executed directly
if (require.main === module) {
    startServer();
}

app.startServer = startServer;
module.exports = app;
