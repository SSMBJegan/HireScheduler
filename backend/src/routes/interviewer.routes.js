const express = require('express');
const router = express.Router();
const interviewerController = require('../controllers/interviewer.controller');
const authMiddleware = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

// Enforce auth and interviewer role
router.use(authMiddleware, roleGuard('interviewer'));

router.get('/active-campaign', interviewerController.getActiveCampaign);
router.post('/availability', interviewerController.submitAvailability);
router.get('/availability/:campaignId', interviewerController.getMySelections);

module.exports = router;
