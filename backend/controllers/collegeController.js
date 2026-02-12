const { College, Course, Application } = require('../models/College');
const { User } = require('../models/User');
const { cloudinaryService } = require('../utils/cloudinaryService');
const { emailService } = require('../utils/emailService');
const { Op } = require('sequelize');
const crypto = require('crypto');

class CollegeController {
    // Search colleges with filters
    searchColleges = async (req, res) => {
        try {
            const {
                query,
                state,
                city,
                type,
                ranking_max,
                page = 1,
                limit = 20
            } = req.query;

            const offset = (page - 1) * limit;

            // Build where conditions
            let whereConditions = { active: true };

            if (query) {
                whereConditions[Op.or] = [
                    { name: { [Op.iLike]: `%${query}%` } },
                    { description: { [Op.iLike]: `%${query}%` } },
                    { location: { [Op.iLike]: `%${query}%` } }
                ];
            }

            if (state) whereConditions.state = { [Op.iLike]: `%${state}%` };
            if (city) whereConditions.city = { [Op.iLike]: `%${city}%` };
            if (type) whereConditions.type = type;
            if (ranking_max) {
                whereConditions.nirf_ranking = { [Op.lte]: parseInt(ranking_max) };
            }

            const { count, rows: colleges } = await College.findAndCountAll({
                where: whereConditions,
                order: [['nirf_ranking', 'ASC'], ['name', 'ASC']],
                limit: parseInt(limit),
                offset,
                attributes: [
                    'id', 'name', 'code', 'type', 'location', 'city', 'state',
                    'ranking_national', 'nirf_ranking', 'logo', 'description'
                ]
            });

            res.json({
                success: true,
                data: {
                    colleges,
                    pagination: {
                        total: count,
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total_pages: Math.ceil(count / limit)
                    }
                }
            });
        } catch (error) {
            console.error('Search colleges error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to search colleges',
                error: error.message
            });
        }
    };

    // Get colleges list with basic info (mapped to getColleges in routes)
    getColleges = async (req, res) => {
        try {
            const { page = 1, limit = 50 } = req.query;
            const offset = (page - 1) * limit;

            const { count, rows: colleges } = await College.findAndCountAll({
                where: { active: true },
                order: [['nirf_ranking', 'ASC'], ['name', 'ASC']],
                limit: parseInt(limit),
                offset,
                attributes: ['id', 'name', 'code', 'location', 'state', 'type', 'nirf_ranking', 'logo']
            });

            res.json({
                success: true,
                data: {
                    colleges,
                    pagination: {
                        total: count,
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total_pages: Math.ceil(count / limit)
                    }
                }
            });
        } catch (error) {
            console.error('Get colleges list error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch colleges list',
                error: error.message
            });
        }
    };

    // Get college by ID (mapped to getCollege in routes)
    getCollege = async (req, res) => {
        try {
            const { id } = req.params;

            const college = await College.findOne({
                where: { id, active: true },
                include: [{
                    model: Course,
                    where: { active: true },
                    required: false,
                    limit: 10,
                    order: [['degree_type', 'ASC'], ['name', 'ASC']]
                }]
            });

            if (!college) {
                return res.status(404).json({
                    success: false,
                    message: 'College not found'
                });
            }

            res.json({
                success: true,
                data: { college }
            });
        } catch (error) {
            console.error('Get college by ID error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch college details',
                error: error.message
            });
        }
    };

    // Add favorite college
    addFavorite = async (req, res) => {
        try {
            const { college_id } = req.body;
            const user = req.user;

            const college = await College.findByPk(college_id);
            if (!college) {
                return res.status(404).json({
                    success: false,
                    message: 'College not found'
                });
            }

            // Check if already favorited
            const existingFavorite = await user.getFavoriteColleges({
                where: { id: college_id }
            });

            if (existingFavorite.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'College is already in your favorites'
                });
            }

            // Add to favorites
            await user.addFavoriteCollege(college);

            res.json({
                success: true,
                message: 'College added to favorites successfully'
            });
        } catch (error) {
            console.error('Add favorite error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to add college to favorites',
                error: error.message
            });
        }
    };

    // Remove favorite college
    removeFavorite = async (req, res) => {
        try {
            const { id } = req.params;
            const user = req.user;

            const college = await College.findByPk(id);
            if (!college) {
                return res.status(404).json({
                    success: false,
                    message: 'College not found'
                });
            }

            // Remove from favorites
            await user.removeFavoriteCollege(college);

            res.json({
                success: true,
                message: 'College removed from favorites successfully'
            });
        } catch (error) {
            console.error('Remove favorite error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to remove college from favorites',
                error: error.message
            });
        }
    };

    // Get user's favorite colleges
    getFavorites = async (req, res) => {
        try {
            const user = req.user;
            const { page = 1, limit = 20 } = req.query;
            const offset = (page - 1) * limit;

            const favoriteColleges = await user.getFavoriteColleges({
                limit: parseInt(limit),
                offset,
                attributes: [
                    'id', 'name', 'code', 'location', 'state', 'type',
                    'nirf_ranking', 'logo', 'description'
                ]
            });

            const total = await user.countFavoriteColleges();

            res.json({
                success: true,
                data: {
                    colleges: favoriteColleges,
                    pagination: {
                        total,
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total_pages: Math.ceil(total / limit)
                    }
                }
            });
        } catch (error) {
            console.error('Get favorites error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch favorite colleges',
                error: error.message
            });
        }
    };

    // Compare colleges
    compareColleges = async (req, res) => {
        try {
            const { college_ids } = req.body;

            if (!college_ids || college_ids.length < 2 || college_ids.length > 4) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide 2-4 college IDs for comparison'
                });
            }

            const colleges = await College.findAll({
                where: {
                    id: { [Op.in]: college_ids },
                    active: true
                },
                include: [{
                    model: Course,
                    where: { active: true },
                    required: false,
                    attributes: ['degree_type', 'fee_per_year']
                }]
            });

            res.json({
                success: true,
                data: { colleges }
            });
        } catch (error) {
            console.error('Compare colleges error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to compare colleges',
                error: error.message
            });
        }
    };
}

// Create instance and export individual methods
const collegeController = new CollegeController();

module.exports = {
    searchColleges: collegeController.searchColleges,
    getCollege: collegeController.getCollege,
    getColleges: collegeController.getColleges,
    addFavorite: collegeController.addFavorite,
    removeFavorite: collegeController.removeFavorite,
    getFavorites: collegeController.getFavorites,
    compareColleges: collegeController.compareColleges
};
