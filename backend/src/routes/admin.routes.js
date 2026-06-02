const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const authMiddleware = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

// Enforce authentication and Admin authorization globally for these routes
router.use(authMiddleware, roleGuard('admin'));

router.get('/interviewers', adminController.getInterviewers);
router.post('/interviewers', adminController.createInterviewer);
router.delete('/interviewers/:id', adminController.deleteInterviewer);

router.get('/admins', adminController.getAdmins);
router.post('/admins', adminController.createAdmin);
router.delete('/admins/:id', adminController.deleteAdmin);

router.post('/campaigns', adminController.createCampaign);
router.get('/campaigns', adminController.getCampaigns);
router.get('/campaigns/:id', adminController.getCampaignById);
router.delete('/campaigns/:id', adminController.deleteCampaign);

router.get('/stats', adminController.getDashboardStats);
router.get('/charts', adminController.getDashboardCharts);
router.get('/active-sessions', adminController.getActiveSessions);

module.exports = router;
