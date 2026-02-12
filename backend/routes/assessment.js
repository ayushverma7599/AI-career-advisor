const express = require('express');
const { startAssessment, submitAssessment, getResults, getHistory } = require('../controllers/assessmentController');
const authController = require('../controllers/authController');

const router = express.Router();

// All assessment routes require authentication
router.use(authController.authenticateToken);

// Assessment Routes
router.get('/start/:type', startAssessment);
router.post('/submit', submitAssessment);
router.get('/results/:id', getResults);
router.get('/history', getHistory);

module.exports = router;
