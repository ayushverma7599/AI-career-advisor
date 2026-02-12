const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const { validateRegistrationStep } = require('../middleware/validation');
const { uploadMiddleware } = require('../middleware/upload');

const router = express.Router();

// All user routes require authentication
router.use(authController.authenticateToken);

// Registration Progress Routes
router.get('/registration/status', userController.getRegistrationStatus);
router.post('/registration/step/:stepNumber', validateRegistrationStep, userController.updateRegistrationStep);
router.post('/registration/complete', userController.completeRegistration);

// Document Upload Routes
router.post('/documents/upload', uploadMiddleware.fields([
  { name: 'profile_picture', maxCount: 1 },
  { name: 'signature_image', maxCount: 1 },
  { name: 'id_proof_image', maxCount: 1 }
]), userController.uploadDocuments);

// Profile Management
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.put('/profile/academic', userController.updateAcademicInfo);
router.put('/profile/family', userController.updateFamilyInfo);
router.put('/profile/privacy', userController.updatePrivacySettings);

// Verification Status
router.get('/verification/status', userController.getVerificationStatus);
router.post('/verification/aadhaar', userController.verifyAadhaar);

// Dashboard Data
router.get('/dashboard', userController.getDashboard);
router.get('/progress', userController.getProgress);

// User Statistics
router.get('/statistics', userController.getStatistics);
router.get('/achievements', userController.getAchievements);

// College Information (if student is admitted)
router.put('/college-info', userController.updateCollegeInfo);

module.exports = router;
