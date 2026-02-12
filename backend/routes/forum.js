const express = require('express');
const { 
    getPosts, 
    createPost, 
    getPost, 
    updatePost, 
    deletePost, 
    createComment, 
    updateComment, 
    deleteComment, 
    likePost, 
    unlikePost 
} = require('../controllers/forumController');
const authController = require('../controllers/authController');

const router = express.Router();

// All forum routes require authentication
router.use(authController.authenticateToken);

// Forum Post Routes
router.get('/posts', getPosts);
router.post('/posts', createPost);
router.get('/posts/:id', getPost);
router.put('/posts/:id', updatePost);
router.delete('/posts/:id', deletePost);

// Comments
router.post('/posts/:id/comments', createComment);
router.put('/comments/:id', updateComment);
router.delete('/comments/:id', deleteComment);

// Reactions
router.post('/posts/:id/like', likePost);
router.delete('/posts/:id/like', unlikePost);

module.exports = router;

