const rateLimit = require('express-rate-limit');

// General API rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Authentication rate limiting (more restrictive)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login requests per windowMs
  message: {
    success: false,
    message: 'Too many login attempts, please try again later.'
  },
  skipSuccessfulRequests: true
});

// Registration rate limiting
const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 registration attempts per hour
  message: {
    success: false,
    message: 'Too many registration attempts, please try again later.'
  }
});

// Password reset rate limiting
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 password reset requests per hour
  message: {
    success: false,
    message: 'Too many password reset requests, please try again later.'
  }
});

// OTP sending rate limiting
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // limit each IP to 5 OTP requests per 10 minutes
  message: {
    success: false,
    message: 'Too many OTP requests, please try again later.'
  }
});

// OTP verification rate limiting
const otpVerifyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10, // limit each IP to 10 OTP verification attempts per 10 minutes
  message: {
    success: false,
    message: 'Too many OTP verification attempts, please try again later.'
  }
});

// Forum posting rate limiting
const forumPostLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 posts per hour
  message: {
    success: false,
    message: 'Too many posts created, please try again later.'
  }
});

// Forum reply rate limiting
const forumReplyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // limit each IP to 20 replies per hour
  message: {
    success: false,
    message: 'Too many replies created, please try again later.'
  }
});

// File upload rate limiting
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // limit each IP to 50 upload requests per hour
  message: {
    success: false,
    message: 'Too many file uploads, please try again later.'
  }
});

// Assessment submission rate limiting
const assessmentLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5, // limit each IP to 5 assessment submissions per day
  message: {
    success: false,
    message: 'Too many assessment attempts, please try again tomorrow.'
  }
});

// Puzzle attempt rate limiting
const puzzleLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // limit each IP to 50 puzzle attempts per hour
  message: {
    success: false,
    message: 'Too many puzzle attempts, please try again later.'
  }
});

// Admin actions rate limiting
const adminLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // limit each IP to 100 admin actions per hour
  message: {
    success: false,
    message: 'Too many admin actions, please try again later.'
  }
});

// Search rate limiting
const searchLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100, // limit each IP to 100 search requests per 10 minutes
  message: {
    success: false,
    message: 'Too many search requests, please try again later.'
  }
});

// Custom rate limiter for user-specific actions
const createUserBasedLimiter = (windowMs, max, keyGenerator) => {
  return rateLimit({
    windowMs,
    max,
    keyGenerator: keyGenerator || ((req) => req.user?.id || req.ip),
    message: {
      success: false,
      message: 'Rate limit exceeded for this user.'
    }
  });
};

// User-specific puzzle attempts (per user, not IP)
const userPuzzleLimiter = createUserBasedLimiter(
  60 * 60 * 1000, // 1 hour
  20, // 20 attempts per user per hour
  (req) => req.user?.id
);

// User-specific forum actions
const userForumLimiter = createUserBasedLimiter(
  60 * 60 * 1000, // 1 hour
  15, // 15 forum actions per user per hour
  (req) => req.user?.id
);

// Dynamic rate limiting based on user role
const roleBasedLimiter = (req, res, next) => {
  const user = req.user;

  if (!user) {
    return generalLimiter(req, res, next);
  }

  // Different limits for different roles
  let limit;
  switch (user.role) {
    case 'college_administrator':
      limit = 200; // Higher limit for admins
      break;
    case 'teacher':
      limit = 150; // Higher limit for teachers
      break;
    case 'alumni':
      limit = 120; // Slightly higher for alumni
      break;
    case 'student':
    default:
      limit = 100; // Standard limit for students
      break;
  }

  const dynamicLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: limit,
    message: {
      success: false,
      message: 'Rate limit exceeded for your account type.'
    },
    keyGenerator: (req) => req.user.id
  });

  return dynamicLimiter(req, res, next);
};

// Export all limiters
const rateLimiting = {
  general: generalLimiter,
  auth: authLimiter,
  login: authLimiter, // Alias for backward compatibility
  registration: registrationLimiter,
  passwordReset: passwordResetLimiter,
  otpSend: otpLimiter,
  otpVerify: otpVerifyLimiter,
  forumPost: forumPostLimiter,
  forumReply: forumReplyLimiter,
  upload: uploadLimiter,
  assessment: assessmentLimiter,
  puzzle: puzzleLimiter,
  userPuzzle: userPuzzleLimiter,
  userForum: userForumLimiter,
  admin: adminLimiter,
  search: searchLimiter,
  roleBased: roleBasedLimiter,
  createUserBased: createUserBasedLimiter
};

module.exports = { rateLimiting };
