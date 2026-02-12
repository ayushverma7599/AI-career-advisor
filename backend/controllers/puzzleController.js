const { PuzzleCategory, Puzzle, PuzzleAttempt } = require('../models/Puzzle');
const { User } = require('../models/User');
const { CoinTransaction } = require('../models/Coin');
const { COIN_REWARDS, PUZZLE_DIFFICULTIES } = require('../config/constants');
const { Op } = require('sequelize');

class PuzzleController {
    // Get all available courses
    getCourses = async (req, res) => {
        try {
            const courses = await PuzzleCategory.findAll({
                where: { active: true },
                attributes: ['course'],
                group: ['course'],
                order: [['course', 'ASC']]
            });

            const courseList = courses.map(item => item.course);

            res.json({
                success: true,
                data: { courses: courseList }
            });
        } catch (error) {
            console.error('Get courses error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch courses',
                error: error.message
            });
        }
    };

    // Get all puzzle categories
    getCategories = async (req, res) => {
        try {
            const categories = await PuzzleCategory.findAll({
                where: { active: true },
                order: [['sort_order', 'ASC'], ['name', 'ASC']]
            });

            res.json({
                success: true,
                data: { categories }
            });
        } catch (error) {
            console.error('Get categories error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch puzzle categories',
                error: error.message
            });
        }
    };

    // Get daily puzzle
    getDailyPuzzle = async (req, res) => {
        try {
            const user = req.user;
            
            // Get today's puzzle (you can implement your own logic for daily puzzle selection)
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Simple approach: get puzzle based on day of year
            const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
            const totalPuzzles = await Puzzle.count({ where: { active: true } });
            const puzzleIndex = dayOfYear % totalPuzzles;

            const dailyPuzzle = await Puzzle.findAll({
                where: { active: true },
                include: [{
                    model: PuzzleCategory,
                    attributes: ['id', 'name', 'course', 'icon']
                }],
                limit: 1,
                offset: puzzleIndex,
                attributes: { exclude: ['solution', 'test_cases'] }
            });

            if (!dailyPuzzle || dailyPuzzle.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'No daily puzzle available'
                });
            }

            const puzzle = dailyPuzzle[0];

            // Check if user has already attempted today's puzzle
            const todayAttempt = await PuzzleAttempt.findOne({
                where: {
                    user_id: user.id,
                    puzzle_id: puzzle.id,
                    created_at: {
                        [Op.gte]: today
                    }
                }
            });

            res.json({
                success: true,
                data: {
                    puzzle,
                    attempted_today: !!todayAttempt,
                    attempt: todayAttempt
                }
            });
        } catch (error) {
            console.error('Get daily puzzle error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch daily puzzle',
                error: error.message
            });
        }
    };

    // Attempt puzzle
    attemptPuzzle = async (req, res) => {
        try {
            const { puzzle_id, solution } = req.body;
            const user = req.user;

            const puzzle = await Puzzle.findByPk(puzzle_id);
            if (!puzzle || !puzzle.active) {
                return res.status(404).json({
                    success: false,
                    message: 'Puzzle not found'
                });
            }

            // Check solution
            const isCorrect = this.checkSolution(solution, puzzle);
            const score = isCorrect ? 100 : 0;
            const status = isCorrect ? 'correct' : 'incorrect';

            // Calculate coins earned
            let coinsEarned = 0;
            if (isCorrect) {
                coinsEarned = COIN_REWARDS[`PUZZLE_${puzzle.difficulty.toUpperCase()}`] || 10;
            }

            // Create attempt record
            const attempt = await PuzzleAttempt.create({
                user_id: user.id,
                puzzle_id,
                submission: solution,
                submitted_at: new Date(),
                status,
                score,
                coins_earned: coinsEarned
            });

            // Award coins if correct
            if (coinsEarned > 0) {
                await CoinTransaction.create({
                    user_id: user.id,
                    transaction_type: 'earned',
                    amount: coinsEarned,
                    reason: `Solved ${puzzle.difficulty} puzzle: ${puzzle.title}`,
                    source: 'puzzle',
                    reference_id: attempt.id,
                    balance_before: user.total_coins,
                    balance_after: user.total_coins + coinsEarned
                });

                await user.update({
                    total_coins: user.total_coins + coinsEarned,
                    puzzles_solved: user.puzzles_solved + 1
                });
            }

            // Update puzzle statistics
            await puzzle.increment('attempt_count');
            if (isCorrect) {
                await puzzle.increment('success_count');
            }

            res.json({
                success: true,
                message: isCorrect ? 'Correct solution!' : 'Incorrect solution. Try again!',
                data: {
                    attempt,
                    coins_earned: coinsEarned,
                    is_correct: isCorrect,
                    score
                }
            });
        } catch (error) {
            console.error('Attempt puzzle error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to submit puzzle attempt',
                error: error.message
            });
        }
    };

    // Get puzzle history
    getPuzzleHistory = async (req, res) => {
        try {
            const user = req.user;
            const { page = 1, limit = 20 } = req.query;
            const offset = (page - 1) * limit;

            const { count, rows: attempts } = await PuzzleAttempt.findAndCountAll({
                where: { user_id: user.id },
                include: [{
                    model: Puzzle,
                    attributes: ['id', 'title', 'difficulty'],
                    include: [{
                        model: PuzzleCategory,
                        attributes: ['name', 'course']
                    }]
                }],
                order: [['created_at', 'DESC']],
                limit: parseInt(limit),
                offset,
                attributes: ['id', 'status', 'score', 'coins_earned', 'submitted_at', 'created_at']
            });

            res.json({
                success: true,
                data: {
                    attempts,
                    pagination: {
                        total: count,
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total_pages: Math.ceil(count / limit)
                    }
                }
            });
        } catch (error) {
            console.error('Get puzzle history error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch puzzle history',
                error: error.message
            });
        }
    };

    // Get leaderboard
    getLeaderboard = async (req, res) => {
        try {
            const { period = 'all_time', limit = 50 } = req.query;
            
            let whereCondition = {};
            
            // Filter by time period
            if (period === 'daily') {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                whereCondition.created_at = { [Op.gte]: today };
            } else if (period === 'weekly') {
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                whereCondition.created_at = { [Op.gte]: weekAgo };
            } else if (period === 'monthly') {
                const monthAgo = new Date();
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                whereCondition.created_at = { [Op.gte]: monthAgo };
            }

            const leaderboard = await User.findAll({
                attributes: [
                    'id',
                    'name',
                    'profile_picture',
                    'puzzles_solved',
                    'total_coins'
                ],
                include: [{
                    model: PuzzleAttempt,
                    where: { 
                        status: 'correct',
                        ...whereCondition 
                    },
                    attributes: []
                }],
                group: ['User.id'],
                order: [['puzzles_solved', 'DESC'], ['total_coins', 'DESC']],
                limit: parseInt(limit)
            });

            res.json({
                success: true,
                data: {
                    leaderboard,
                    period
                }
            });
        } catch (error) {
            console.error('Get leaderboard error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch leaderboard',
                error: error.message
            });
        }
    };

    // Helper method to check solution
    checkSolution(userSolution, puzzle) {
        if (!puzzle.solution) return false;
        // Basic string comparison (you'd implement proper test case evaluation)
        return userSolution.trim().toLowerCase() === puzzle.solution.trim().toLowerCase();
    }
}

// Create instance and export individual methods
const puzzleController = new PuzzleController();

module.exports = {
    getDailyPuzzle: puzzleController.getDailyPuzzle,
    attemptPuzzle: puzzleController.attemptPuzzle,
    getPuzzleHistory: puzzleController.getPuzzleHistory,
    getLeaderboard: puzzleController.getLeaderboard
};
