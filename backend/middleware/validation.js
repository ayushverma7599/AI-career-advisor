const { body, param, query, validationResult } = require('express-validator');
const { USER_ROLES } = require('../config/constants');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Registration validation
const validateRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number and special character'),
  body('phone')
    .optional()
    .isMobilePhone('en-IN')
    .withMessage('Valid Indian phone number required'),
  handleValidationErrors
];

// Login validation
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// Registration step validation
const validateRegistrationStep = [
  param('stepNumber')
    .isInt({ min: 1, max: 9 })
    .withMessage('Invalid step number'),
  body('*').custom((value, { req }) => {
    const step = parseInt(req.params.stepNumber);

    switch (step) {
      case 1:
        if (!req.body.name || req.body.name.length < 2) {
          throw new Error('Name is required for step 1');
        }
        if (!req.body.phone || !/^[6-9]\d{9}$/.test(req.body.phone)) {
          throw new Error('Valid phone number is required for step 1');
        }
        break;
      case 3:
        if (!req.body.aadhaar_number || !/^\d{12}$/.test(req.body.aadhaar_number)) {
          throw new Error('Valid Aadhaar number is required for step 3');
        }
        break;
      case 4:
        if (!req.body.date_of_birth) {
          throw new Error('Date of birth is required for step 4');
        }
        if (!req.body.gender || !['male', 'female', 'other'].includes(req.body.gender)) {
          throw new Error('Valid gender is required for step 4');
        }
        break;
      case 5:
        if (!req.body.class_12_percentage || req.body.class_12_percentage < 0 || req.body.class_12_percentage > 100) {
          throw new Error('Valid class 12 percentage is required for step 5');
        }
        break;
      case 6:
        if (!req.body.father_name) {
          throw new Error('Father name is required for step 6');
        }
        break;
    }
    return true;
  }),
  handleValidationErrors
];

// Assessment validation
const validateAssessment = [
  body('responses')
    .isArray({ min: 1, max: 12 })
    .withMessage('Responses array must contain 1-12 items'),
  body('responses.*.questionId')
    .notEmpty()
    .withMessage('Question ID is required for each response'),
  body('responses.*.answer')
    .notEmpty()
    .withMessage('Answer is required for each response'),
  handleValidationErrors
];

// Forum post validation
const validateForumPost = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('content')
    .trim()
    .isLength({ min: 10, max: 10000 })
    .withMessage('Content must be between 10 and 10000 characters'),
  body('category_id')
    .isInt({ min: 1 })
    .withMessage('Valid category ID is required'),
  body('tags')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Maximum 10 tags allowed'),
  handleValidationErrors
];

// Forum reply validation
const validateForumReply = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Reply content must be between 1 and 5000 characters'),
  body('parent_reply_id')
    .optional()
    .isUUID()
    .withMessage('Parent reply ID must be valid UUID'),
  handleValidationErrors
];

// Puzzle attempt validation
const validatePuzzleAttempt = [
  body('solution')
    .trim()
    .notEmpty()
    .withMessage('Solution is required'),
  body('time_taken')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Time taken must be positive integer'),
  handleValidationErrors
];

// Coin redemption validation
const validateCoinRedemption = [
  body('redemption_type')
    .isIn(['mentorship', 'ebook_discount', 'library_extension', 'course_access', 'premium_features'])
    .withMessage('Invalid redemption type'),
  body('item_name')
    .trim()
    .notEmpty()
    .withMessage('Item name is required'),
  body('coins_to_spend')
    .isInt({ min: 1 })
    .withMessage('Coins to spend must be positive integer'),
  handleValidationErrors
];

// College search validation
const validateCollegeSearch = [
  query('query')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Search query must be at least 2 characters'),
  query('state')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('State must be at least 2 characters'),
  query('type')
    .optional()
    .isIn(['government', 'private', 'deemed', 'autonomous'])
    .withMessage('Invalid college type'),
  handleValidationErrors
];

// Application validation
const validateApplication = [
  body('college_id')
    .isInt({ min: 1 })
    .withMessage('Valid college ID is required'),
  body('course_id')
    .isInt({ min: 1 })
    .withMessage('Valid course ID is required'),
  body('application_form')
    .isObject()
    .withMessage('Application form data is required'),
  handleValidationErrors
];

// Admin role check
const checkAdminRole = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (req.user.role !== 'college_administrator') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }

  next();
};

// Admin action validation
const validateAdminAction = [
  body('reason')
    .optional()
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Reason must be between 5 and 500 characters'),
  handleValidationErrors
];

module.exports = {
  validateRegistration,
  validateLogin,
  validateRegistrationStep,
  validateAssessment,
  validateForumPost,
  validateForumReply,
  validatePuzzleAttempt,
  validateCoinRedemption,
  validateCollegeSearch,
  validateApplication,
  checkAdminRole,
  validateAdminAction,
  handleValidationErrors
};
