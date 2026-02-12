const { Assessment, AssessmentQuestion } = require('../models/Assessment');
const { User } = require('../models/User');
const { CoinTransaction } = require('../models/Coin');
const { assessmentAlgorithm } = require('../utils/assessmentAlgorithm');
const { COIN_REWARDS } = require('../config/constants');

class AssessmentController {
    // Get all assessment questions
    getQuestions = async (req, res) => {
        try {
            const questions = await AssessmentQuestion.findAll({
                where: { active: true },
                order: [['question_number', 'ASC']],
                attributes: ['id', 'question_number', 'category', 'question_text', 'options']
            });

            res.json({
                success: true,
                data: { questions }
            });
        } catch (error) {
            console.error('Get questions error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch assessment questions',
                error: error.message
            });
        }
    };

    // Start new assessment
    startAssessment = async (req, res) => {
        try {
            const user = req.user;

            // Check if user has incomplete assessment
            const existingAssessment = await Assessment.findOne({
                where: {
                    user_id: user.id,
                    status: 'in_progress'
                }
            });

            if (existingAssessment) {
                return res.json({
                    success: true,
                    message: 'Resuming existing assessment',
                    data: { assessment: existingAssessment }
                });
            }

            // Create new assessment
            const assessment = await Assessment.create({
                user_id: user.id,
                assessment_version: '1.0',
                started_at: new Date(),
                status: 'in_progress'
            });

            res.json({
                success: true,
                message: 'Assessment started successfully',
                data: { assessment }
            });
        } catch (error) {
            console.error('Start assessment error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to start assessment',
                error: error.message
            });
        }
    };

    // Submit complete assessment
    submitAssessment = async (req, res) => {
        try {
            const user = req.user;
            const { responses } = req.body;

            const assessment = await Assessment.findOne({
                where: {
                    user_id: user.id,
                    status: 'in_progress'
                }
            });

            if (!assessment) {
                return res.status(404).json({
                    success: false,
                    message: 'No active assessment found'
                });
            }

            // Calculate duration
            const startTime = new Date(assessment.started_at);
            const endTime = new Date();
            const durationMinutes = Math.round((endTime - startTime) / (1000 * 60));

            // Process assessment results using algorithm
            const results = await assessmentAlgorithm.processAssessment(responses);

            // Update assessment with results
            await assessment.update({
                responses,
                completed_at: endTime,
                duration_minutes: durationMinutes,
                status: 'completed',
                career_scores: results.careerScores,
                personality_profile: results.personalityProfile,
                recommended_careers: results.recommendedCareers,
                learning_style: results.learningStyle,
                coins_earned: COIN_REWARDS.ASSESSMENT_COMPLETION
            });

            // Award coins
            await CoinTransaction.create({
                user_id: user.id,
                transaction_type: 'earned',
                amount: COIN_REWARDS.ASSESSMENT_COMPLETION,
                reason: 'Career assessment completion',
                source: 'assessment',
                reference_id: assessment.id,
                balance_before: user.total_coins,
                balance_after: user.total_coins + COIN_REWARDS.ASSESSMENT_COMPLETION
            });

            // Update user status
            await user.update({
                assessment_completed: true,
                assessment_completed_at: endTime,
                total_coins: user.total_coins + COIN_REWARDS.ASSESSMENT_COMPLETION
            });

            res.json({
                success: true,
                message: 'Assessment completed successfully!',
                data: {
                    assessment_id: assessment.id,
                    results,
                    coins_earned: COIN_REWARDS.ASSESSMENT_COMPLETION,
                    duration_minutes: durationMinutes
                }
            });
        } catch (error) {
            console.error('Submit assessment error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to submit assessment',
                error: error.message
            });
        }
    };

    // Get assessment results
    getResults = async (req, res) => {
        try {
            const user = req.user;
            const latestAssessment = await Assessment.findOne({
                where: {
                    user_id: user.id,
                    status: 'completed'
                },
                order: [['completed_at', 'DESC']]
            });

            if (!latestAssessment) {
                return res.status(404).json({
                    success: false,
                    message: 'No completed assessment found'
                });
            }

            res.json({
                success: true,
                data: {
                    assessment: latestAssessment,
                    results: {
                        career_scores: latestAssessment.career_scores,
                        personality_profile: latestAssessment.personality_profile,
                        recommended_careers: latestAssessment.recommended_careers,
                        learning_style: latestAssessment.learning_style
                    }
                }
            });
        } catch (error) {
            console.error('Get results error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch assessment results',
                error: error.message
            });
        }
    };

    // Get assessment history
    getHistory = async (req, res) => {
        try {
            const user = req.user;
            const { page = 1, limit = 10 } = req.query;
            const offset = (page - 1) * limit;

            const { count, rows: assessments } = await Assessment.findAndCountAll({
                where: { user_id: user.id },
                order: [['created_at', 'DESC']],
                limit: parseInt(limit),
                offset,
                attributes: ['id', 'assessment_version', 'started_at', 'completed_at', 'duration_minutes', 'status', 'coins_earned']
            });

            res.json({
                success: true,
                data: {
                    assessments,
                    pagination: {
                        total: count,
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total_pages: Math.ceil(count / limit)
                    }
                }
            });
        } catch (error) {
            console.error('Get assessment history error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch assessment history',
                error: error.message
            });
        }
    };
}

// Create instance and export individual methods
const assessmentController = new AssessmentController();

module.exports = {
    startAssessment: assessmentController.startAssessment,
    submitAssessment: assessmentController.submitAssessment,
    getResults: assessmentController.getResults,
    getHistory: assessmentController.getHistory
};

     