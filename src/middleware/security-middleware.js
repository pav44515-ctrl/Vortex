const helmet = require('helmet');
const cors = require('cors');

// Security middleware configuration
const securityMiddleware = (app) => {
    // Helmet - Sets various HTTP headers for security
    app.use(helmet({
        // Content Security Policy
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                fontSrc: ["'self'", "https://fonts.gstatic.com"],
                scriptSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", "data:", "https:"],
                connectSrc: ["'self'"],
            },
        },
        // Prevent clickjacking
        frameguard: {
            action: 'deny'
        },
        // Prevent MIME type sniffing
        noSniff: true,
        // Enable HSTS (HTTP Strict Transport Security)
        hsts: {
            maxAge: 31536000, // 1 year
            includeSubDomains: true,
            preload: true
        },
        // Remove X-Powered-By header
        hidePoweredBy: true,
    }));

    // CORS - Cross-Origin Resource Sharing
    const corsOptions = {
        origin: function (origin, callback) {
            // Allow requests with no origin (like mobile apps, Postman, etc.)
            if (!origin) return callback(null, true);

            // Whitelist of allowed origins
            const allowedOrigins = [
                'http://localhost:3000',
                'https://localhost:3443',
                'http://localhost:3443',
                // Add your production domain here
                // 'https://yourdomain.com'
            ];

            if (allowedOrigins.indexOf(origin) !== -1) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true, // Allow cookies to be sent
        optionsSuccessStatus: 200,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    };

    app.use(cors(corsOptions));

    // Body parser size limits to prevent large payload attacks
    app.use(require('express').json({ limit: '10mb' }));
    app.use(require('express').urlencoded({ extended: true, limit: '10mb' }));
};

module.exports = securityMiddleware;
