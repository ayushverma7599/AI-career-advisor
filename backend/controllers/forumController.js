const { ForumCategory, ForumPost, ForumReply, ForumVote } = require('../models/Forum');
const { User } = require('../models/User');
const { CoinTransaction } = require('../models/Coin');
const { cloudinaryService } = require('../utils/cloudinaryService');
const { Op } = require('sequelize');

class ForumController {
    // Get all forum categories
    getCategories = async (req, res) => {
        try {
            const categories = await ForumCategory.findAll({
                where: { active: true },
                order: [['sort_order', 'ASC'], ['name', 'ASC']],
                attributes: ['id', 'name', 'description', 'icon', 'color', 'posts_count', 'replies_count']
            });

            res.json({
                success: true,
                data: { categories }
            });
        } catch (error) {
            console.error('Get categories error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch forum categories',
                error: error.message
            });
        }
    };

    // Get posts with pagination and filtering
    getPosts = async (req, res) => {
        try {
            const {
                page = 1,
                limit = 20,
                category_id,
                sort = 'latest',
                search
            } = req.query;

            const offset = (page - 1) * limit;

            // Build where conditions
            let whereConditions = { status: 'active' };
            if (category_id) whereConditions.category_id = category_id;
            if (search) {
                whereConditions[Op.or] = [
                    { title: { [Op.iLike]: `%${search}%` } },
                    { content: { [Op.iLike]: `%${search}%` } }
                ];
            }

            // Build order conditions
            let orderConditions;
            switch (sort) {
                case 'popular':
                    orderConditions = [['vote_score', 'DESC'], ['created_at', 'DESC']];
                    break;
                case 'oldest':
                    orderConditions = [['created_at', 'ASC']];
                    break;
                case 'most_replies':
                    orderConditions = [['replies_count', 'DESC']];
                    break;
                default: // latest
                    orderConditions = [['is_pinned', 'DESC'], ['last_activity_at', 'DESC']];
            }

            const { count, rows: posts } = await ForumPost.findAndCountAll({
                where: whereConditions,
                include: [
                    {
                        model: User,
                        attributes: ['id', 'name', 'profile_picture', 'role', 'reputation_score']
                    },
                    {
                        model: ForumCategory,
                        attributes: ['id', 'name', 'icon', 'color']
                    }
                ],
                order: orderConditions,
                limit: parseInt(limit),
                offset,
                distinct: true
            });

            res.json({
                success: true,
                data: {
                    posts,
                    pagination: {
                        total: count,
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total_pages: Math.ceil(count / limit)
                    }
                }
            });
        } catch (error) {
            console.error('Get posts error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch posts',
                error: error.message
            });
        }
    };

    // Create new post
    createPost = async (req, res) => {
        try {
            const { title, content, category_id, tags } = req.body;
            const user = req.user;

            // Check if user can post in this category
            const category = await ForumCategory.findByPk(category_id);
            if (!category || !category.allowed_roles.includes(user.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not allowed to post in this category'
                });
            }

            // Handle file attachments
            let attachments = [];
            if (req.files && req.files.length > 0) {
                for (const file of req.files) {
                    const uploaded = await cloudinaryService.upload(file.buffer, 'forum_attachments');
                    attachments.push({
                        url: uploaded.url,
                        public_id: uploaded.public_id,
                        filename: file.originalname,
                        size: file.size
                    });
                }
            }

            // Create post
            const post = await ForumPost.create({
                user_id: user.id,
                category_id,
                title,
                content,
                tags: tags || [],
                attachments,
                last_activity_at: new Date()
            });

            // Update category counters
            await category.increment('posts_count');

            // Update user forum posts count
            await user.increment('forum_posts');

            // Load post with associations for response
            const newPost = await ForumPost.findByPk(post.id, {
                include: [
                    {
                        model: User,
                        attributes: ['id', 'name', 'profile_picture', 'role']
                    },
                    {
                        model: ForumCategory,
                        attributes: ['id', 'name', 'icon', 'color']
                    }
                ]
            });

            res.status(201).json({
                success: true,
                message: 'Post created successfully',
                data: { post: newPost }
            });
        } catch (error) {
            console.error('Create post error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create post',
                error: error.message
            });
        }
    };

    // Get post by ID
    getPost = async (req, res) => {
        try {
            const { id } = req.params;

            const post = await ForumPost.findOne({
                where: { id, status: 'active' },
                include: [
                    {
                        model: User,
                        attributes: ['id', 'name', 'profile_picture', 'role', 'reputation_score']
                    },
                    {
                        model: ForumCategory,
                        attributes: ['id', 'name', 'icon', 'color']
                    }
                ]
            });

            if (!post) {
                return res.status(404).json({
                    success: false,
                    message: 'Post not found'
                });
            }

            // Increment view count
            await post.increment('views_count');

            res.json({
                success: true,
                data: { post }
            });
        } catch (error) {
            console.error('Get post by ID error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch post',
                error: error.message
            });
        }
    };

    // Update post
    updatePost = async (req, res) => {
        try {
            const { id } = req.params;
            const { title, content, tags } = req.body;
            const user = req.user;

            const post = await ForumPost.findByPk(id);
            if (!post) {
                return res.status(404).json({
                    success: false,
                    message: 'Post not found'
                });
            }

            // Check if user owns the post or is admin
            if (post.user_id !== user.id && user.role !== 'college_administrator') {
                return res.status(403).json({
                    success: false,
                    message: 'You can only edit your own posts'
                });
            }

            // Update post
            await post.update({
                title,
                content,
                tags: tags || post.tags,
                updated_at: new Date()
            });

            res.json({
                success: true,
                message: 'Post updated successfully',
                data: { post }
            });
        } catch (error) {
            console.error('Update post error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update post',
                error: error.message
            });
        }
    };

    // Delete post
    deletePost = async (req, res) => {
        try {
            const { id } = req.params;
            const user = req.user;

            const post = await ForumPost.findByPk(id);
            if (!post) {
                return res.status(404).json({
                    success: false,
                    message: 'Post not found'
                });
            }

            // Check permissions
            if (post.user_id !== user.id && user.role !== 'college_administrator') {
                return res.status(403).json({
                    success: false,
                    message: 'You can only delete your own posts'
                });
            }

            // Soft delete
            await post.update({ status: 'deleted' });

            res.json({
                success: true,
                message: 'Post deleted successfully'
            });
        } catch (error) {
            console.error('Delete post error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete post',
                error: error.message
            });
        }
    };

    // Create comment
    createComment = async (req, res) => {
        try {
            const { id } = req.params; // post id
            const { content } = req.body;
            const user = req.user;

            // Check if post exists and is not locked
            const post = await ForumPost.findByPk(id);
            if (!post) {
                return res.status(404).json({
                    success: false,
                    message: 'Post not found'
                });
            }

            if (post.is_locked) {
                return res.status(403).json({
                    success: false,
                    message: 'This post is locked for comments'
                });
            }

            // Create reply
            const reply = await ForumReply.create({
                post_id: id,
                user_id: user.id,
                content
            });

            // Update post counters
            await post.increment('replies_count');
            await post.update({ last_activity_at: new Date() });

            // Load reply with user info
            const newReply = await ForumReply.findByPk(reply.id, {
                include: [{
                    model: User,
                    attributes: ['id', 'name', 'profile_picture', 'role']
                }]
            });

            res.status(201).json({
                success: true,
                message: 'Comment created successfully',
                data: { comment: newReply }
            });
        } catch (error) {
            console.error('Create comment error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create comment',
                error: error.message
            });
        }
    };

    // Update comment
    updateComment = async (req, res) => {
        try {
            const { id } = req.params;
            const { content } = req.body;
            const user = req.user;

            const comment = await ForumReply.findByPk(id);
            if (!comment) {
                return res.status(404).json({
                    success: false,
                    message: 'Comment not found'
                });
            }

            // Check permissions
            if (comment.user_id !== user.id && user.role !== 'college_administrator') {
                return res.status(403).json({
                    success: false,
                    message: 'You can only edit your own comments'
                });
            }

            await comment.update({ content, updated_at: new Date() });

            res.json({
                success: true,
                message: 'Comment updated successfully',
                data: { comment }
            });
        } catch (error) {
            console.error('Update comment error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update comment',
                error: error.message
            });
        }
    };

    // Delete comment
    deleteComment = async (req, res) => {
        try {
            const { id } = req.params;
            const user = req.user;

            const comment = await ForumReply.findByPk(id);
            if (!comment) {
                return res.status(404).json({
                    success: false,
                    message: 'Comment not found'
                });
            }

            // Check permissions
            if (comment.user_id !== user.id && user.role !== 'college_administrator') {
                return res.status(403).json({
                    success: false,
                    message: 'You can only delete your own comments'
                });
            }

            await comment.update({ status: 'deleted' });

            res.json({
                success: true,
                message: 'Comment deleted successfully'
            });
        } catch (error) {
            console.error('Delete comment error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete comment',
                error: error.message
            });
        }
    };

    // Like post
    likePost = async (req, res) => {
        try {
            const { id } = req.params;
            const user = req.user;

            // Check for existing vote
            const existingVote = await ForumVote.findOne({
                where: { user_id: user.id, post_id: id }
            });

            if (existingVote) {
                await existingVote.update({ vote_type: 'up' });
            } else {
                await ForumVote.create({
                    user_id: user.id,
                    post_id: id,
                    vote_type: 'up'
                });
            }

            // Update vote counts
            await this.updatePostVoteCounts(id);

            res.json({
                success: true,
                message: 'Post liked successfully'
            });
        } catch (error) {
            console.error('Like post error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to like post',
                error: error.message
            });
        }
    };

    // Unlike post
    unlikePost = async (req, res) => {
        try {
            const { id } = req.params;
            const user = req.user;

            await ForumVote.destroy({
                where: { user_id: user.id, post_id: id }
            });

            // Update vote counts
            await this.updatePostVoteCounts(id);

            res.json({
                success: true,
                message: 'Post unliked successfully'
            });
        } catch (error) {
            console.error('Unlike post error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to unlike post',
                error: error.message
            });
        }
    };

    // Helper method to update post vote counts
    updatePostVoteCounts = async (postId) => {
        const upVotes = await ForumVote.count({
            where: { post_id: postId, vote_type: 'up' }
        });

        const downVotes = await ForumVote.count({
            where: { post_id: postId, vote_type: 'down' }
        });

        await ForumPost.update({
            votes_up: upVotes,
            votes_down: downVotes,
            vote_score: upVotes - downVotes
        }, {
            where: { id: postId }
        });
    };
}

// Create instance and export individual methods
const forumController = new ForumController();

module.exports = {
    getPosts: forumController.getPosts,
    createPost: forumController.createPost,
    getPost: forumController.getPost,
    updatePost: forumController.updatePost,
    deletePost: forumController.deletePost,
    createComment: forumController.createComment,
    updateComment: forumController.updateComment,
    deleteComment: forumController.deleteComment,
    likePost: forumController.likePost,
    unlikePost: forumController.unlikePost
};
