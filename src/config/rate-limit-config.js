const rateLimit = require('express-rate-limit');

// Strict rate limiter for authentication endpoints (login, signup)
// Prevents brute force attacks
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: {
        error: 'Too many login attempts from this IP, please try again after 15 minutes.'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    // Skip successful requests
    skipSuccessfulRequests: false,
    // Skip failed requests
    skipFailedRequests: false,
});

// Moderate rate limiter for upload endpoints
// Prevents resource exhaustion from excessive uploads
const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 upload requests per hour
    message: {
        error: 'Too many upload requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// General API rate limiter
// Prevents API abuse and DDoS attacks
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please slow down.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    authLimiter,
    uploadLimiter,
    apiLimiter
};
