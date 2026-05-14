const express = require('express');
const walletController = require('../controllers/wallet.controller');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

// All wallet routes are protected
router.use(authRequired);

router.post('/daily-bonus', walletController.claimDailyBonus);
router.post('/dev-coins', walletController.addDevCoins);
router.get('/ledger', walletController.getLedger);

module.exports = router;
