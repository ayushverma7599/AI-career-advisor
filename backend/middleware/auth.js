const jwt = require('jsonwebtoken');
const { User } = require('../models/User');

// JWT Authentication Middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password', 'two_factor_secret'] }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    // Check if account is active
    if (user.account_status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Account suspended'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// Optional Authentication (for public routes that benefit from user context)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const user = await User.findByPk(decoded.userId, {
        attributes: { exclude: ['password', 'two_factor_secret'] }
      });

      if (user && user.account_status === 'active') {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Continue without user context if token is invalid
    next();
  }
};

// Role-based authorization
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Check if user is admin
const requireAdmin = requireRole(['college_administrator']);

// Check if user is teacher or admin
const requireTeacherOrAdmin = requireRole(['teacher', 'college_administrator']);

// Check if user is alumni, teacher, or admin
const requireAlumniTeacherOrAdmin = requireRole(['alumni', 'teacher', 'college_administrator']);

// Check if registration is completed
const requireCompletedRegistration = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (!req.user.registration_completed) {
    return res.status(403).json({
      success: false,
      message: 'Registration must be completed first',
      redirect: '/registration'
    });
  }

  next();
};

// Check if assessment is completed
const requireCompletedAssessment = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (!req.user.assessment_completed) {
    return res.status(403).json({
      success: false,
      message: 'Career assessment must be completed first',
      redirect: '/assessment'
    });
  }

  next();
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireRole,
  requireAdmin,
  requireTeacherOrAdmin,
  requireAlumniTeacherOrAdmin,
  requireCompletedRegistration,
  requireCompletedAssessment
};
