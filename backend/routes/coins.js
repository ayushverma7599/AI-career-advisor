const express = require('express');
const { 
    getBalance, 
    getTransactions, 
    redeemCoins, 
    getRewards 
} = require('../controllers/coinController');
const authController = require('../controllers/authController');

const router = express.Router();

// All coin routes require authentication
router.use(authController.authenticateToken);

// Coin Management Routes
router.get('/balance', getBalance);
router.get('/transactions', getTransactions);
router.post('/redeem', redeemCoins);
router.get('/rewards', getRewards);

module.exports = router;
