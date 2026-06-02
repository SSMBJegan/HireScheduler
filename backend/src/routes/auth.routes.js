const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

router.post('/otp-request', authController.requestOTP);
router.post('/otp-verify', authController.verifyOTP);

module.exports = router;
