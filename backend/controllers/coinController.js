const { CoinTransaction, CoinRedemption } = require('../models/Coin');
const { User } = require('../models/User');
const { COIN_REWARDS } = require('../config/constants');
const { Op } = require('sequelize');
const crypto = require('crypto');
const { sequelize } = require('sequelize');

class CoinController {
    // Get user's coin balance and recent transactions
    getBalance = async (req, res) => {
        try {
            const user = req.user;

            // Get recent transactions
            const recentTransactions = await CoinTransaction.findAll({
                where: { user_id: user.id },
                order: [['created_at', 'DESC']],
                limit: 10
            });

            res.json({
                success: true,
                data: {
                    current_balance: user.total_coins,
                    recent_transactions: recentTransactions,
                    user_info: {
                        total_earned: await CoinTransaction.sum('amount', {
                            where: { user_id: user.id, transaction_type: 'earned' }
                        }) || 0,
                        total_spent: await CoinTransaction.sum('amount', {
                            where: { user_id: user.id, transaction_type: 'spent' }
                        }) || 0
                    }
                }
            });
        } catch (error) {
            console.error('Get coin balance error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch coin balance',
                error: error.message
            });
        }
    };

    // Get detailed transaction history
    getTransactions = async (req, res) => {
        try {
            const user = req.user;
            const { page = 1, limit = 20, type, source } = req.query;
            const offset = (page - 1) * limit;

            // Build where conditions
            let whereConditions = { user_id: user.id };
            if (type) whereConditions.transaction_type = type;
            if (source) whereConditions.source = source;

            const { count, rows: transactions } = await CoinTransaction.findAndCountAll({
                where: whereConditions,
                order: [['created_at', 'DESC']],
                limit: parseInt(limit),
                offset
            });

            res.json({
                success: true,
                data: {
                    transactions,
                    pagination: {
                        total: count,
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total_pages: Math.ceil(count / limit)
                    }
                }
            });
        } catch (error) {
            console.error('Get transaction history error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch transaction history',
                error: error.message
            });
        }
    };

    // Get available rewards/redemption options
    getRewards = async (req, res) => {
        try {
            const redemptionOptions = [
                {
                    id: 'alumni_mentorship',
                    type: 'mentorship',
                    name: 'Alumni Mentorship Session',
                    description: '1-hour one-on-one mentorship session with industry professionals',
                    coin_cost: 100,
                    availability: 'Available',
                    benefits: ['Career guidance', 'Industry insights', 'Network building'],
                    validity_days: 30
                },
                {
                    id: 'ebook_discount_25',
                    type: 'ebook_discount',
                    name: '25% Discount on Educational eBooks',
                    description: 'Get 25% discount on our curated collection of educational eBooks',
                    coin_cost: 25,
                    availability: 'Available',
                    benefits: ['Access to premium content', 'Skill development', 'Career preparation'],
                    validity_days: 15
                },
                {
                    id: 'ebook_discount_50',
                    type: 'ebook_discount',
                    name: '50% Discount on Educational eBooks',
                    description: 'Get 50% discount on our curated collection of educational eBooks',
                    coin_cost: 50,
                    availability: 'Available',
                    benefits: ['Access to premium content', 'Skill development', 'Career preparation'],
                    validity_days: 15
                },
                {
                    id: 'library_extension_10',
                    type: 'library_extension',
                    name: '10-Day Library Extension',
                    description: 'Extend your digital library access by 10 additional days',
                    coin_cost: 10,
                    availability: 'Available',
                    benefits: ['Extended access', 'More time to study', 'Flexible learning'],
                    validity_days: 7
                },
                {
                    id: 'library_extension_30',
                    type: 'library_extension',
                    name: '30-Day Library Extension',
                    description: 'Extend your digital library access by 30 additional days',
                    coin_cost: 25,
                    availability: 'Available',
                    benefits: ['Extended access', 'More time to study', 'Flexible learning'],
                    validity_days: 7
                },
                {
                    id: 'course_access_premium',
                    type: 'course_access',
                    name: 'Premium Course Access',
                    description: 'Get access to premium courses and advanced learning materials',
                    coin_cost: 150,
                    availability: 'Limited',
                    benefits: ['Premium content', 'Advanced topics', 'Certificate of completion'],
                    validity_days: 90
                },
                {
                    id: 'priority_support',
                    type: 'premium_features',
                    name: 'Priority Customer Support',
                    description: 'Get priority support for all your queries and issues',
                    coin_cost: 75,
                    availability: 'Available',
                    benefits: ['Faster response time', 'Dedicated support', 'Priority handling'],
                    validity_days: 30
                }
            ];

            res.json({
                success: true,
                data: { redemption_options: redemptionOptions }
            });
        } catch (error) {
            console.error('Get redemption options error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch redemption options',
                error: error.message
            });
        }
    };

    // Redeem coins
    redeemCoins = async (req, res) => {
        try {
            const { redemption_type, item_name, coins_to_spend } = req.body;
            const user = req.user;

            // Check if user has enough coins
            if (user.total_coins < coins_to_spend) {
                return res.status(400).json({
                    success: false,
                    message: 'Insufficient coins for this redemption'
                });
            }

            // Generate redemption code
            const redemptionCode = this.generateRedemptionCode();

            // Calculate expiry date based on redemption type
            const expiryDays = this.getRedemptionValidityDays(redemption_type);
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + expiryDays);

            // Create coin transaction
            await CoinTransaction.create({
                user_id: user.id,
                transaction_type: 'spent',
                amount: coins_to_spend,
                reason: `Redeemed: ${item_name}`,
                source: 'redemption',
                balance_before: user.total_coins,
                balance_after: user.total_coins - coins_to_spend
            });

            // Create redemption record
            const redemption = await CoinRedemption.create({
                user_id: user.id,
                redemption_type,
                item_name,
                coins_spent: coins_to_spend,
                redemption_code: redemptionCode,
                redemption_details: {
                    redeemed_at: new Date(),
                    expires_at: expiresAt,
                    instructions: this.getRedemptionInstructions(redemption_type)
                },
                expires_at: expiresAt,
                status: 'active'
            });

            // Update user coin balance
            await user.update({
                total_coins: user.total_coins - coins_to_spend
            });

            res.json({
                success: true,
                message: 'Coins redeemed successfully!',
                data: {
                    redemption_code: redemptionCode,
                    expires_at: expiresAt,
                    new_balance: user.total_coins - coins_to_spend,
                    redemption_id: redemption.id
                }
            });
        } catch (error) {
            console.error('Redeem coins error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to redeem coins',
                error: error.message
            });
        }
    };

    // Helper method to generate redemption code
    generateRedemptionCode() {
        return 'CN' + crypto.randomBytes(6).toString('hex').toUpperCase();
    }

    // Helper method to get redemption validity days
    getRedemptionValidityDays(redemptionType) {
        const validityMap = {
            'mentorship': 30,
            'ebook_discount': 15,
            'library_extension': 7,
            'course_access': 90,
            'premium_features': 30
        };
        return validityMap[redemptionType] || 30;
    }

    // Helper method to get redemption instructions
    getRedemptionInstructions(redemptionType) {
        const instructionsMap = {
            'mentorship': 'Contact our mentorship team with your redemption code to schedule your session.',
            'ebook_discount': 'Use this code at checkout when purchasing eBooks from our library.',
            'library_extension': 'Your library access has been automatically extended.',
            'course_access': 'Access to premium courses has been activated on your account.',
            'premium_features': 'Premium features have been activated on your account.'
        };
        return instructionsMap[redemptionType] || 'Contact support for assistance with your redemption.';
    }
}

// Create instance and export individual methods
const coinController = new CoinController();

module.exports = {
    getBalance: coinController.getBalance,
    getTransactions: coinController.getTransactions,
    redeemCoins: coinController.redeemCoins,
    getRewards: coinController.getRewards
};
