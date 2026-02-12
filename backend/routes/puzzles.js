const express = require('express');
const { 
    getDailyPuzzle, 
    attemptPuzzle, 
    getPuzzleHistory, 
    getLeaderboard 
} = require('../controllers/puzzleController');
const authController = require('../controllers/authController');

const router = express.Router();

// All puzzle routes require authentication
router.use(authController.authenticateToken);

// Puzzle Routes
router.get('/daily', getDailyPuzzle);
router.post('/attempt', attemptPuzzle);
router.get('/history', getPuzzleHistory);
router.get('/leaderboard', getLeaderboard);

module.exports = router;
