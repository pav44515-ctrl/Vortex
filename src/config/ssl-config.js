const fs = require('fs');
const path = require('path');
const https = require('https');

// SSL Configuration for local development
// For production, use proper SSL certificates from Let's Encrypt or your provider

const sslDir = path.join(__dirname, '../../ssl');

// Function to generate self-signed certificates for development
const generateSelfSignedCert = () => {
    const { execSync } = require('child_process');

    // Create ssl directory if it doesn't exist
    if (!fs.existsSync(sslDir)) {
        fs.mkdirSync(sslDir, { recursive: true });
    }

    const keyPath = path.join(sslDir, 'server.key');
    const certPath = path.join(sslDir, 'server.cert');

    // Check if certificates already exist
    if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
        console.log('✅ SSL certificates already exist');
        return { keyPath, certPath };
    }

    try {
        console.log('🔐 Generating self-signed SSL certificate for development...');

        // Generate self-signed certificate using OpenSSL
        // This requires OpenSSL to be installed on the system
        const command = `openssl req -x509 -newkey rsa:4096 -keyout "${keyPath}" -out "${certPath}" -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"`;

        execSync(command, { stdio: 'inherit' });

        console.log('✅ Self-signed SSL certificate generated successfully');
        return { keyPath, certPath };
    } catch (error) {
        console.error('❌ Failed to generate SSL certificate:', error.message);
        console.log('ℹ️  OpenSSL is required to generate certificates.');
        console.log('ℹ️  You can install OpenSSL or manually create certificates.');
        return null;
    }
};

// Load SSL certificates
const loadSSLCredentials = () => {
    try {
        const keyPath = path.join(sslDir, 'server.key');
        const certPath = path.join(sslDir, 'server.cert');

        // Check if certificates exist, if not, try to generate them
        if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
            const generated = generateSelfSignedCert();
            if (!generated) {
                return null;
            }
        }

        // Read certificate files
        const privateKey = fs.readFileSync(keyPath, 'utf8');
        const certificate = fs.readFileSync(certPath, 'utf8');

        return {
            key: privateKey,
            cert: certificate
        };
    } catch (error) {
        console.error('❌ Error loading SSL credentials:', error.message);
        return null;
    }
};

// Create HTTPS server
const createHTTPSServer = (app) => {
    const credentials = loadSSLCredentials();

    if (!credentials) {
        console.log('⚠️  HTTPS server not available - running HTTP only');
        return null;
    }

    return https.createServer(credentials, app);
};

// Middleware to redirect HTTP to HTTPS
const redirectToHTTPS = (req, res, next) => {
    if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
        // Request is already using HTTPS
        next();
    } else {
        // Redirect to HTTPS
        const httpsPort = process.env.HTTPS_PORT || 3443;
        res.redirect(`https://${req.hostname}:${httpsPort}${req.url}`);
    }
};

module.exports = {
    createHTTPSServer,
    redirectToHTTPS,
    loadSSLCredentials
};
