const { User } = require('../models/User');
const { Assessment, AssessmentQuestion } = require('../models/Assessment');
const { ForumCategory, ForumPost, ForumReply, ForumVote } = require('../models/Forum');
const { PuzzleCategory, Puzzle, PuzzleAttempt } = require('../models/Puzzle');
const { CoinTransaction, CoinRedemption } = require('../models/Coin');
const { College, Course, Application } = require('../models/College');
const { Op, sequelize } = require('sequelize');

class AdminController {
    // Get users with filters
    getUsers = async (req, res) => {
        try {
            const {
                page = 1,
                limit = 20,
                role,
                status,
                search,
                registration_date_from,
                registration_date_to
            } = req.query;

            const offset = (page - 1) * limit;

            // Build where conditions
            let whereConditions = {};
            if (role) whereConditions.role = role;
            if (status) whereConditions.account_status = status;
            if (search) {
                whereConditions[Op.or] = [
                    { name: { [Op.iLike]: `%${search}%` } },
                    { email: { [Op.iLike]: `%${search}%` } },
                    { phone: { [Op.iLike]: `%${search}%` } }
                ];
            }

            if (registration_date_from || registration_date_to) {
                whereConditions.created_at = {};
                if (registration_date_from) {
                    whereConditions.created_at[Op.gte] = new Date(registration_date_from);
                }
                if (registration_date_to) {
                    whereConditions.created_at[Op.lte] = new Date(registration_date_to);
                }
            }

            const { count, rows: users } = await User.findAndCountAll({
                where: whereConditions,
                order: [['created_at', 'DESC']],
                limit: parseInt(limit),
                offset,
                attributes: { exclude: ['password', 'two_factor_secret'] }
            });

            res.json({
                success: true,
                data: {
                    users,
                    pagination: {
                        total: count,
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total_pages: Math.ceil(count / limit)
                    }
                }
            });
        } catch (error) {
            console.error('Get users error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch users',
                error: error.message
            });
        }
    };

    // Get user by ID
    getUser = async (req, res) => {
        try {
            const { id } = req.params;

            const user = await User.findByPk(id, {
                attributes: { exclude: ['password', 'two_factor_secret'] },
                include: [
                    {
                        model: Assessment,
                        limit: 5,
                        order: [['created_at', 'DESC']]
                    },
                    {
                        model: ForumPost,
                        limit: 5,
                        order: [['created_at', 'DESC']]
                    }
                ]
            });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            res.json({
                success: true,
                data: { user }
            });
        } catch (error) {
            console.error('Get user by ID error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch user details',
                error: error.message
            });
        }
    };

    // Update user
    updateUser = async (req, res) => {
        try {
            const { id } = req.params;
            const { status, role, reason } = req.body;

            const user = await User.findByPk(id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            const oldStatus = user.account_status;
            const oldRole = user.role;

            await user.update({
                account_status: status || user.account_status,
                role: role || user.role,
                updated_at: new Date()
            });

            // Log the changes
            console.log(`Admin updated user ${user.email}. Status: ${oldStatus} -> ${status}, Role: ${oldRole} -> ${role}. Reason: ${reason || 'No reason provided'}`);

            res.json({
                success: true,
                message: 'User updated successfully',
                data: {
                    user_id: user.id,
                    changes: {
                        status: { old: oldStatus, new: status },
                        role: { old: oldRole, new: role }
                    }
                }
            });
        } catch (error) {
            console.error('Update user error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update user',
                error: error.message
            });
        }
    };

    // Delete user
    deleteUser = async (req, res) => {
        try {
            const { id } = req.params;
            const { reason } = req.body;

            const user = await User.findByPk(id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Soft delete - update status instead of actually deleting
            await user.update({
                account_status: 'deleted',
                deleted_at: new Date()
            });

            console.log(`Admin deleted user ${user.email}. Reason: ${reason || 'No reason provided'}`);

            res.json({
                success: true,
                message: 'User deleted successfully'
            });
        } catch (error) {
            console.error('Delete user error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete user',
                error: error.message
            });
        }
    };

    // Create college
    createCollege = async (req, res) => {
        try {
            const collegeData = req.body;

            const college = await College.create({
                ...collegeData,
                active: true,
                created_at: new Date()
            });

            res.status(201).json({
                success: true,
                message: 'College created successfully',
                data: { college }
            });
        } catch (error) {
            console.error('Create college error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create college',
                error: error.message
            });
        }
    };

    // Update college
    updateCollege = async (req, res) => {
        try {
            const { id } = req.params;
            const updateData = req.body;

            const college = await College.findByPk(id);
            if (!college) {
                return res.status(404).json({
                    success: false,
                    message: 'College not found'
                });
            }

            await college.update({
                ...updateData,
                updated_at: new Date()
            });

            res.json({
                success: true,
                message: 'College updated successfully',
                data: { college }
            });
        } catch (error) {
            console.error('Update college error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update college',
                error: error.message
            });
        }
    };

    // Delete college
    deleteCollege = async (req, res) => {
        try {
            const { id } = req.params;

            const college = await College.findByPk(id);
            if (!college) {
                return res.status(404).json({
                    success: false,
                    message: 'College not found'
                });
            }

            await college.update({
                active: false,
                deleted_at: new Date()
            });

            res.json({
                success: true,
                message: 'College deleted successfully'
            });
        } catch (error) {
            console.error('Delete college error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete college',
                error: error.message
            });
        }
    };

    // Get forum posts for moderation
    getPosts = async (req, res) => {
        try {
            const {
                page = 1,
                limit = 20,
                status,
                category_id,
                flagged_only = false
            } = req.query;

            const offset = (page - 1) * limit;
            let whereConditions = {};

            if (status) whereConditions.status = status;
            if (category_id) whereConditions.category_id = category_id;
            if (flagged_only === 'true') whereConditions.status = 'flagged';

            const { count, rows: posts } = await ForumPost.findAndCountAll({
                where: whereConditions,
                include: [
                    {
                        model: User,
                        attributes: ['id', 'name', 'email', 'role']
                    },
                    {
                        model: ForumCategory,
                        attributes: ['id', 'name']
                    }
                ],
                order: [['created_at', 'DESC']],
                limit: parseInt(limit),
                offset
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
            console.error('Get forum posts error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch forum posts',
                error: error.message
            });
        }
    };

    // Moderate post
    moderatePost = async (req, res) => {
        try {
            const { id } = req.params;
            const { action, reason } = req.body; // action: 'approve', 'flag', 'delete'

            const post = await ForumPost.findByPk(id);
            if (!post) {
                return res.status(404).json({
                    success: false,
                    message: 'Post not found'
                });
            }

            let newStatus;
            switch (action) {
                case 'approve':
                    newStatus = 'active';
                    break;
                case 'flag':
                    newStatus = 'flagged';
                    break;
                case 'delete':
                    newStatus = 'deleted';
                    break;
                default:
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid moderation action'
                    });
            }

            await post.update({
                status: newStatus,
                moderation_reason: reason,
                moderated_at: new Date()
            });

            res.json({
                success: true,
                message: `Post ${action}d successfully`,
                data: { post_id: id, action, new_status: newStatus }
            });
        } catch (error) {
            console.error('Moderate post error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to moderate post',
                error: error.message
            });
        }
    };

    // Get analytics
    getAnalytics = async (req, res) => {
        try {
            const { period = '30d' } = req.query;
            const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
            const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

            const analytics = {
                user_growth: await this.getUserGrowthAnalytics(startDate),
                assessment_trends: await this.getAssessmentTrends(startDate),
                forum_activity: await this.getForumActivityAnalytics(startDate),
                puzzle_performance: await this.getPuzzlePerformanceAnalytics(startDate),
                coin_economy: await this.getCoinEconomyAnalytics(startDate),
                application_metrics: await this.getApplicationMetrics(startDate)
            };

            res.json({
                success: true,
                data: { analytics, period }
            });
        } catch (error) {
            console.error('Get analytics error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch analytics',
                error: error.message
            });
        }
    };

    // Get reports
    getReports = async (req, res) => {
        try {
            const stats = {
                users: {
                    total: await User.count(),
                    active: await User.count({ where: { account_status: 'active' } }),
                    new_this_week: await User.count({
                        where: {
                            created_at: { [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
                        }
                    }),
                    pending_verification: await User.count({ where: { account_status: 'pending_verification' } })
                },
                assessments: {
                    total_completed: await Assessment.count({ where: { status: 'completed' } }),
                    completion_rate: await this.getAssessmentCompletionRate()
                },
                forum: {
                    total_posts: await ForumPost.count(),
                    total_replies: await ForumReply.count(),
                    flagged_posts: await ForumPost.count({ where: { status: 'flagged' } })
                },
                puzzles: {
                    total_puzzles: await Puzzle.count(),
                    total_attempts: await PuzzleAttempt.count(),
                    success_rate: await this.getPuzzleSuccessRate()
                },
                coins: {
                    total_transactions: await CoinTransaction.count(),
                    coins_distributed: await CoinTransaction.sum('amount', { where: { transaction_type: 'earned' } }) || 0,
                    coins_redeemed: await CoinTransaction.sum('amount', { where: { transaction_type: 'spent' } }) || 0
                }
            };

            res.json({
                success: true,
                data: { dashboard_stats: stats }
            });
        } catch (error) {
            console.error('Get reports error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch reports',
                error: error.message
            });
        }
    };

    // Helper methods
    async getAssessmentCompletionRate() {
        const totalUsers = await User.count();
        const completedAssessments = await User.count({ where: { assessment_completed: true } });
        return totalUsers > 0 ? ((completedAssessments / totalUsers) * 100).toFixed(2) : 0;
    }

    async getPuzzleSuccessRate() {
        const totalAttempts = await PuzzleAttempt.count();
        const successfulAttempts = await PuzzleAttempt.count({ where: { status: 'correct' } });
        return totalAttempts > 0 ? ((successfulAttempts / totalAttempts) * 100).toFixed(2) : 0;
    }

    async getUserGrowthAnalytics(startDate) {
        return await User.findAll({
            where: { created_at: { [Op.gte]: startDate } },
            attributes: [
                [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: [sequelize.fn('DATE', sequelize.col('created_at'))],
            order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']],
            raw: true
        });
    }

    async getAssessmentTrends(startDate) {
        return await Assessment.findAll({
            where: {
                created_at: { [Op.gte]: startDate },
                status: 'completed'
            },
            attributes: [
                [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: [sequelize.fn('DATE', sequelize.col('created_at'))],
            order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']],
            raw: true
        });
    }

    async getForumActivityAnalytics(startDate) {
        return {
            posts_per_day: await ForumPost.findAll({
                where: { created_at: { [Op.gte]: startDate } },
                attributes: [
                    [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
                    [sequelize.fn('COUNT', sequelize.col('id')), 'count']
                ],
                group: [sequelize.fn('DATE', sequelize.col('created_at'))],
                order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']],
                raw: true
            })
        };
    }

    async getPuzzlePerformanceAnalytics(startDate) {
        return await PuzzleAttempt.findAll({
            where: { created_at: { [Op.gte]: startDate } },
            attributes: [
                [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'total_attempts'],
                [sequelize.fn('COUNT', sequelize.literal("CASE WHEN status = 'correct' THEN 1 END")), 'successful_attempts']
            ],
            group: [sequelize.fn('DATE', sequelize.col('created_at'))],
            order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']],
            raw: true
        });
    }

    async getCoinEconomyAnalytics(startDate) {
        return await CoinTransaction.findAll({
            where: { created_at: { [Op.gte]: startDate } },
            attributes: [
                [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
                [sequelize.fn('SUM', sequelize.literal("CASE WHEN transaction_type = 'earned' THEN amount ELSE 0 END")), 'coins_earned'],
                [sequelize.fn('SUM', sequelize.literal("CASE WHEN transaction_type = 'spent' THEN amount ELSE 0 END")), 'coins_spent']
            ],
            group: [sequelize.fn('DATE', sequelize.col('created_at'))],
            order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']],
            raw: true
        });
    }

    async getApplicationMetrics(startDate) {
        return await Application.findAll({
            where: { created_at: { [Op.gte]: startDate } },
            attributes: [
                [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'total_applications'],
                [sequelize.fn('COUNT', sequelize.literal("CASE WHEN status = 'accepted' THEN 1 END")), 'accepted'],
                [sequelize.fn('COUNT', sequelize.literal("CASE WHEN status = 'rejected' THEN 1 END")), 'rejected']
            ],
            group: [sequelize.fn('DATE', sequelize.col('created_at'))],
            order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']],
            raw: true
        });
    }
}

// Create instance and export individual methods
const adminController = new AdminController();

module.exports = {
    getUsers: adminController.getUsers,
    getUser: adminController.getUser,
    updateUser: adminController.updateUser,
    deleteUser: adminController.deleteUser,
    createCollege: adminController.createCollege,
    updateCollege: adminController.updateCollege,
    deleteCollege: adminController.deleteCollege,
    getPosts: adminController.getPosts,
    moderatePost: adminController.moderatePost,
    getAnalytics: adminController.getAnalytics,
    getReports: adminController.getReports
};
