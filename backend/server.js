require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { sequelize } = require('./config/database');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const assessmentRoutes = require('./routes/assessment');
const forumRoutes = require('./routes/forum');
const puzzleRoutes = require('./routes/puzzles');
const coinRoutes = require('./routes/coins');
const collegeRoutes = require('./routes/colleges');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware - CSP configured to allow external scripts and inline handlers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'",
                "'unsafe-inline'",
                "'unsafe-eval'",  // Added for dynamic script execution
                "https://accounts.google.com",
                "https://cdn.jsdelivr.net",
                "https://cdnjs.cloudflare.com",
                "https://unpkg.com",
                "https://apis.google.com"
            ],
            styleSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://cdn.jsdelivr.net",
                "https://cdnjs.cloudflare.com",
                "https://fonts.googleapis.com"
            ],
            imgSrc: [
                "'self'",
                "data:",
                "https:",
                "http:",
                "blob:"
            ],
           fontSrc: [
        "'self'",
        "https://r2cdn.perplexity.ai",
        "https://fonts.gstatic.com",
        "https://cdn.jsdelivr.net"
      ],

          
            connectSrc: [
                "'self'",
                "https://accounts.google.com",
                "https://api.github.com",
                "https://cdn.jsdelivr.net",  // Added for CDN connections
                "https://apis.google.com",
                "wss:",  // WebSocket support
                "ws:"    // WebSocket support
            ],
            frameSrc: [
                "'self'",
                "https://accounts.google.com"
            ],
            objectSrc: ["'none'"],  // Security best practice
            baseUri: ["'self'"],
            formAction: ["'self'"]
        }
    },
     scriptSrcAttr: ["'unsafe-inline'"],  // <-- Yahan add karo
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
    origin: [
        process.env.FRONTEND_URL || 'http://localhost:3000',
        'http://localhost:3001',  // Allow same origin
        'https://localhost:3001'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files middleware - Frontend serve karne ke liye
// Frontend folder ko static serve karo
app.use(express.static(path.join(__dirname, '../frontend'), {
    setHeaders: (res, path) => {
        // Set proper MIME types for JavaScript files
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
        if (path.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        }
    }
}));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/assessment', assessmentRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/puzzles', puzzleRoutes);
app.use('/api/coins', coinRoutes);
app.use('/api/colleges', collegeRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'CareerNavigator Backend',
        csp: 'Configured for inline scripts and external CDNs'
    });
});

// Frontend routes - SPA ke liye sab routes ko index.html pe redirect karo
app.get('*', (req, res) => {
    // Agar request API ke liye nahi hai toh index.html serve karo
    if (!req.path.startsWith('/api/')) {
        res.sendFile(path.join(__dirname, '../frontend/index.html'));
    } else {
        res.status(404).json({
            success: false,
            message: 'API Route not found'
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
    });
});

// Database connection and server startup
async function startServer() {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connected successfully');
        await sequelize.sync();
        console.log('✅ Database synchronized');
        
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🌐 Frontend available at: http://localhost:${PORT}`);
            console.log(`🔗 API endpoints available at: http://localhost:${PORT}/api/`);
            console.log(`🔒 CSP configured for inline scripts and external resources`);
            console.log(`✅ Button click handlers should now work properly`);
        });
    } catch (error) {
        console.error('❌ Unable to start server:', error);
        process.exit(1);
    }
}

startServer();

module.exports = app;