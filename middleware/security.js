const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

// Determine allowed origins for CORS and CSRF validation
const allowedOrigins = [
    process.env.FRONTEND_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5000",
    "http://127.0.0.1:5000",
    "https://roomforu.onrender.com"
].filter(Boolean);

// 1. Helmet Security Headers with balanced CSP for EJS views & Leaflet maps
const helmetMiddleware = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://cdn.jsdelivr.net",
                "https://unpkg.com",
                "https://cdnjs.cloudflare.com"
            ],
            styleSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://fonts.googleapis.com",
                "https://cdn.jsdelivr.net",
                "https://unpkg.com",
                "https://cdnjs.cloudflare.com"
            ],
            fontSrc: [
                "'self'",
                "https://fonts.gstatic.com",
                "https://cdn.jsdelivr.net",
                "https://cdnjs.cloudflare.com"
            ],
            imgSrc: [
                "'self'",
                "data:",
                "blob:",
                "https://res.cloudinary.com",
                "https://images.unsplash.com",
                "https://*.tile.openstreetmap.org",
                "https://lh3.googleusercontent.com"
            ],
            connectSrc: [
                "'self'",
                "https://*.tile.openstreetmap.org",
                "https://nominatim.openstreetmap.org"
            ],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: process.env.NODE_ENV === "production" ? [] : null
        }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
});

// 2. CORS allowlist configuration
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin, null origin (redirects, file://, privacy mode), or in development
        if (!origin || origin === "null" || process.env.NODE_ENV !== "production") {
            return callback(null, true);
        }

        const isAllowed = allowedOrigins.some((allowed) => {
            try {
                return new URL(allowed).origin === new URL(origin).origin;
            } catch (_) {
                return allowed === origin;
            }
        });

        if (isAllowed) {
            return callback(null, true);
        }

        // Omit CORS headers gracefully rather than throwing an exception
        return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-CSRF-Token", "Accept"]
};

const corsMiddleware = cors(corsOptions);

// 3. Rate Limiters
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300, // 300 requests per 15 minutes per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        status: 429,
        message: "Too many requests from this IP. Please try again after 15 minutes."
    }
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30, // 30 attempts per 15 minutes
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        status: 429,
        message: "Too many authentication attempts. Please try again after 15 minutes."
    }
});

// 4. CSRF Protection for state-changing (mutation) requests
const csrfProtection = (req, res, next) => {
    // Safe HTTP methods do not change state
    if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
        return next();
    }

    // Skip OAuth callback endpoints where external redirects occur
    if (req.path.includes("/auth/google/callback")) {
        return next();
    }

    // Custom header presence (e.g. XMLHttpRequest, fetch with custom headers)
    const hasCustomHeader = Boolean(req.headers["x-requested-with"] || req.headers["x-csrf-token"]);
    if (hasCustomHeader) {
        return next();
    }

    // In development mode, allow local requests
    if (process.env.NODE_ENV !== "production") {
        return next();
    }

    const origin = req.headers.origin;
    const referer = req.headers.referer;
    const host = req.headers.host;

    // Direct same-origin requests or clients without Origin/Referer headers
    if (!origin && !referer) {
        return next();
    }

    // Helper to check if a hostname is allowed
    const isHostAllowed = (targetHost) => {
        if (!targetHost) return false;
        if (targetHost === host) return true;

        return allowedOrigins.some((allowed) => {
            try {
                return new URL(allowed).host === targetHost;
            } catch (_) {
                return false;
            }
        });
    };

    if (origin && origin !== "null") {
        try {
            const originHost = new URL(origin).host;
            if (isHostAllowed(originHost)) {
                return next();
            }
            return res.status(403).json({
                success: false,
                status: 403,
                message: "CSRF check failed: Request origin is not permitted."
            });
        } catch (_) {
            return res.status(403).json({
                success: false,
                status: 403,
                message: "CSRF check failed: Malformed Origin header."
            });
        }
    }

    if (referer) {
        try {
            const refererHost = new URL(referer).host;
            if (isHostAllowed(refererHost)) {
                return next();
            }
            return res.status(403).json({
                success: false,
                status: 403,
                message: "CSRF check failed: Request referer is not permitted."
            });
        } catch (_) {
            return res.status(403).json({
                success: false,
                status: 403,
                message: "CSRF check failed: Malformed Referer header."
            });
        }
    }

    next();
};

module.exports = {
    helmetMiddleware,
    corsMiddleware,
    apiLimiter,
    authLimiter,
    csrfProtection,
    allowedOrigins
};
