const express = require('express');
const router = express.Router();
const { getWalletBalance, getWalletHistory } = require('../controllers/wallet.controller.js');
const { authenticateAdmin } = require('../middleware/auth.js');

// All wallet routes require authentication
router.use(authenticateAdmin);

// Get wallet balance and SMS count
router.get('/balance', getWalletBalance);

module.exports = router;
