const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth');

router.post('/otp-request', authController.requestOTP);
router.post('/otp-verify', authController.verifyOTP);
router.post('/logout', authMiddleware, authController.logout);

module.exports = router;
