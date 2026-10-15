// 404 Route Not Found Middleware
const notFoundHandler = (req, res) => {
    return res.status(404).json({
        success: false,
        status: 404,
        message: `Route not found: ${req.method} ${req.originalUrl}`
    });
};

// Centralized Error Handling Middleware
const errorHandler = (err, req, res, next) => {
    let status = err.status || err.statusCode || 500;
    let message = err.message || "Internal Server Error";
    let details = err.details || null;

    // Handle Mongoose CastError (e.g. invalid ObjectId format)
    if (err.name === "CastError") {
        status = 400;
        message = `Invalid ID format for parameter: ${err.path}`;
    }

    // Handle Mongoose Validation Error
    if (err.name === "ValidationError") {
        status = 400;
        const messages = Object.values(err.errors || {}).map((val) => val.message);
        message = `Validation Error: ${messages.join(", ")}`;
        details = messages;
    }

    // Handle Mongoose Duplicate Key Error
    if (err.code === 11000) {
        status = 409;
        const field = Object.keys(err.keyValue || {})[0] || "field";
        message = `A record with this ${field} already exists.`;
    }

    // Handle Passport / Authentication Errors
    if (err.name === "UserExistsError") {
        status = 409;
        message = "A user with that username or email is already registered.";
    }

    if (err.name === "AuthenticationError") {
        status = 401;
        message = "Invalid username/email or password.";
    }

    // Handle Multer upload errors
    if (err.name === "MulterError") {
        status = 400;
        if (err.code === "LIMIT_FILE_SIZE") {
            message = "Uploaded file exceeds the maximum allowed limit of 5MB.";
        } else {
            message = `File upload error: ${err.message}`;
        }
    }

    // Handle SyntaxError for bad JSON request body
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        status = 400;
        message = "Malformed JSON payload provided in request body.";
    }

    // Handle CORS policy violations
    if (err.message && err.message.includes("CORS policy violation")) {
        status = 403;
        message = "Access Forbidden: Origin is not permitted by CORS policy.";
    }

    // Log 500 unexpected errors
    if (status >= 500) {
        console.error("SERVER ERROR:", err);
    }

    if (res.headersSent) {
        return next(err);
    }

    // In production, sanitize 500 error messages to prevent leaking database/system internals
    if (status >= 500 && process.env.NODE_ENV === "production") {
        message = "An unexpected server error occurred. Please try again later.";
        details = null;
    }

    // Return structured JSON for all requests
    return res.status(status).json({
        success: false,
        status,
        message,
        ...(details ? { details } : {}),
        ...(process.env.NODE_ENV !== "production" && status >= 500 ? { stack: err.stack } : {})
    });
};

module.exports = {
    notFoundHandler,
    errorHandler
};
