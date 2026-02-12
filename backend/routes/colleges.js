const express = require('express');
const { 
    searchColleges, 
    getCollege, 
    getColleges, 
    addFavorite, 
    removeFavorite, 
    getFavorites, 
    compareColleges 
} = require('../controllers/collegeController');
const authController = require('../controllers/authController');

const router = express.Router();

// Public college routes (no authentication required)
router.get('/search', searchColleges);
router.get('/:id', getCollege);
router.get('/', getColleges);

// Protected college routes (require authentication)
router.use(authController.authenticateToken);

router.post('/favorite', addFavorite);
router.delete('/favorite/:id', removeFavorite);
router.get('/user/favorites', getFavorites);
router.post('/compare', compareColleges);

module.exports = router;
