# CareerNavigator Backend

A comprehensive Node.js backend for the Enhanced CareerNavigator platform - a complete lifecycle career guidance system with secure authentication, forum functionality, AI puzzles, and coin-based rewards.

## 🚀 Features

### 🔐 Authentication & Security
- **Multi-method Authentication**: Traditional email/password + Google OAuth 2.0
- **JWT Token Management**: Secure token-based authentication
- **OTP Verification**: Email and SMS verification for account security
- **Two-Factor Authentication**: Optional 2FA with QR codes
- **Password Security**: bcrypt hashing with salt rounds
- **Rate Limiting**: Protection against brute force attacks
- **Data Encryption**: Sensitive data encryption for privacy

### 👤 User Management
- **9-Step Secure Registration**: Comprehensive user onboarding
- **Document Upload**: Profile pictures, signatures, ID proofs
- **Aadhaar Verification**: Indian identity verification system
- **Progress Tracking**: Registration and assessment completion tracking
- **Profile Management**: Complete user profile with academic records
- **Family Information**: Secure family details storage

### 🎯 Career Assessment System
- **12-Question Assessment**: Multi-dimensional career evaluation
- **Category Analysis**: Interest, Aptitude, Personality, Learning Style
- **Weighted Scoring**: Advanced algorithm for career matching
- **Personalized Results**: Career recommendations with compatibility scores
- **Progress Tracking**: Assessment completion and results history

### 💬 Community Forum
- **6 Categories**: Career Guidance, Admissions, Study Groups, Alumni Network, Technical Support, Announcements
- **Role-based Access**: Student, Teacher, Alumni, Administrator permissions
- **Post Management**: Create, edit, delete posts with rich content
- **Reply System**: Nested replies with voting functionality
- **Voting System**: Upvote/downvote posts and replies
- **Best Answers**: Mark solutions and helpful responses
- **Moderation Tools**: Content management and user moderation

### 🧩 AI-Powered Puzzles
- **Course-Specific**: Computer Science, MBBS, MBA, Engineering
- **4 Difficulty Levels**: Easy, Medium, Hard, Expert
- **Adaptive Learning**: Difficulty adjustment based on performance
- **Time-limited Challenges**: Timed puzzle solving
- **Hint System**: Progressive hints for problem solving
- **Solution Tracking**: Attempt history and success rates

### 🪙 Coin & Rewards System
- **Earning Opportunities**: Registration, assessments, puzzles, streaks
- **Redemption Options**: Mentorship sessions, eBook discounts, library extensions
- **Transaction History**: Complete coin earning and spending records
- **Streak Bonuses**: Consecutive activity rewards
- **Achievement System**: Recognition for milestones

### 🏫 College Application System
- **College Database**: Comprehensive institution information
- **Course Catalog**: Detailed course information with eligibility
- **Application Management**: Submit and track college applications
- **Document Handling**: Upload and manage application documents
- **Status Tracking**: Real-time application status updates

## 📋 Prerequisites

- Node.js (v16.0.0 or higher)
- PostgreSQL (v12.0 or higher)
- npm (v8.0.0 or higher)

## ⚡ Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd careernavigator-backend

# Install dependencies
npm install

# Install Sequelize CLI globally
npm install -g sequelize-cli
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.template .env

# Edit .env file with your configuration
nano .env
```

### 3. Database Setup

```bash
# Create PostgreSQL database
createdb careernavigator

# Run migrations
npm run migrate

# Seed initial data
npm run seed
```

### 4. Start the Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3001`

## 🔧 Configuration

### Required Environment Variables

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=careernavigator
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email Configuration (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Cloudinary (File Uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# SMS Service
SMS_API_KEY=your-sms-api-key
SMS_API_SECRET=your-sms-secret

# Application Settings
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
PORT=3001
```

## 📁 Project Structure

```
careernavigator-backend/
├── config/
│   ├── database.js          # Database configuration
│   ├── auth.js              # Authentication strategies
│   └── constants.js         # Application constants
├── models/
│   ├── User.js              # User model
│   ├── Assessment.js        # Assessment models
│   ├── Forum.js             # Forum models
│   ├── Puzzle.js            # Puzzle models
│   ├── Coin.js              # Coin transaction models
│   └── College.js           # College application models
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── users.js             # User management routes
│   ├── assessment.js        # Career assessment routes
│   ├── forum.js             # Forum functionality routes
│   ├── puzzles.js           # AI puzzles routes
│   ├── coins.js             # Coin management routes
│   ├── colleges.js          # College application routes
│   └── admin.js             # Administrative routes
├── controllers/
│   ├── authController.js    # Authentication logic
│   ├── userController.js    # User management logic
│   ├── assessmentController.js
│   ├── forumController.js
│   ├── puzzleController.js
│   ├── coinController.js
│   └── collegeController.js
├── middleware/
│   ├── auth.js              # Authentication middleware
│   ├── validation.js        # Input validation
│   ├── upload.js            # File upload handling
│   └── rateLimiting.js      # Rate limiting
├── utils/
│   ├── emailService.js      # Email utilities
│   ├── otpService.js        # OTP generation/verification
│   ├── encryptionService.js # Data encryption
│   └── assessmentAlgorithm.js
├── database/
│   ├── migrations/          # Database migrations
│   └── seeds/               # Initial data
├── server.js                # Main server file
├── package.json             # Dependencies
└── .env.template            # Environment template
```

## 🛠 API Documentation

### Authentication Endpoints

```
POST   /api/auth/register           # Register new user
POST   /api/auth/login              # User login
POST   /api/auth/logout             # User logout
GET    /api/auth/google             # Google OAuth
POST   /api/auth/forgot-password    # Password reset request
POST   /api/auth/reset-password     # Reset password
POST   /api/auth/send-otp           # Send OTP
POST   /api/auth/verify-otp         # Verify OTP
POST   /api/auth/2fa/setup          # Setup 2FA
```

### User Management

```
GET    /api/users/dashboard         # User dashboard data
GET    /api/users/profile           # User profile
PUT    /api/users/profile           # Update profile
GET    /api/users/registration/status  # Registration progress
POST   /api/users/registration/step/:stepNumber  # Update step
POST   /api/users/documents/upload  # Upload documents
```

### Career Assessment

```
GET    /api/assessment/questions    # Get assessment questions
POST   /api/assessment/start        # Start assessment
POST   /api/assessment/submit       # Submit assessment
GET    /api/assessment/results      # Get results
```

### Forum System

```
GET    /api/forum/categories        # Forum categories
GET    /api/forum/posts             # Get posts
POST   /api/forum/posts             # Create post
PUT    /api/forum/posts/:id         # Update post
POST   /api/forum/posts/:id/replies # Create reply
POST   /api/forum/vote              # Vote on post/reply
```

### AI Puzzles

```
GET    /api/puzzles/courses         # Available courses
GET    /api/puzzles/:course         # Puzzles by course
POST   /api/puzzles/:id/attempt     # Start puzzle attempt
POST   /api/puzzles/:id/submit      # Submit solution
GET    /api/puzzles/attempts        # User attempts history
```

### Coin System

```
GET    /api/coins/balance           # User coin balance
GET    /api/coins/transactions      # Transaction history
GET    /api/coins/redemption-options # Available redemptions
POST   /api/coins/redeem            # Redeem coins
```

### College Applications

```
GET    /api/colleges                # List colleges
GET    /api/colleges/:id/courses    # College courses
POST   /api/colleges/apply          # Submit application
GET    /api/colleges/applications   # User applications
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: Request rate limiting per IP
- **CORS Protection**: Cross-origin resource sharing protection
- **Helmet.js**: Security headers
- **Input Validation**: Comprehensive request validation
- **SQL Injection Protection**: Sequelize ORM protection
- **XSS Protection**: Cross-site scripting prevention
- **Data Encryption**: Sensitive data encryption at rest

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 📊 Database Schema

The application uses PostgreSQL with the following main tables:

- **users**: User profiles and authentication
- **assessments**: Career assessment data
- **forum_categories**: Forum category definitions
- **forum_posts**: Forum posts and discussions
- **forum_replies**: Replies to forum posts
- **forum_votes**: Voting system for posts/replies
- **puzzles**: AI puzzle definitions
- **puzzle_attempts**: User puzzle solving attempts
- **coin_transactions**: Coin earning and spending records
- **coin_redemptions**: Coin redemption history
- **colleges**: College and institution information
- **courses**: Course catalog
- **applications**: College application records

## 🚀 Deployment

### Production Setup

1. Set `NODE_ENV=production` in environment
2. Configure production database
3. Set up SSL certificates
4. Configure reverse proxy (nginx)
5. Set up process manager (PM2)

### Docker Deployment

```bash
# Build Docker image
docker build -t careernavigator-backend .

# Run with Docker Compose
docker-compose up -d
```

## 📈 Monitoring

- Health check endpoint: `GET /api/health`
- Application logs: Console and file logging
- Database query logging in development mode
- Error tracking and reporting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support, email support@careernavigator.com or join our community forum.

---

Built with ❤️ for empowering student career journeys.
