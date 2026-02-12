const express = require('express');
const { 
    getUsers, 
    getUser, 
    updateUser, 
    deleteUser, 
    createCollege, 
    updateCollege, 
    deleteCollege, 
    getPosts, 
    moderatePost, 
    getAnalytics, 
    getReports 
} = require('../controllers/adminController');
const authController = require('../controllers/authController');

const router = express.Router();

// All admin routes require authentication
router.use(authController.authenticateToken);

// User Management
router.get('/users', getUsers);
router.get('/users/:id', getUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// College Management
router.post('/colleges', createCollege);
router.put('/colleges/:id', updateCollege);
router.delete('/colleges/:id', deleteCollege);

// Forum Moderation
router.get('/forum/posts', getPosts);
router.put('/forum/posts/:id/moderate', moderatePost);

// Analytics
router.get('/analytics', getAnalytics);
router.get('/reports', getReports);

module.exports = router;
