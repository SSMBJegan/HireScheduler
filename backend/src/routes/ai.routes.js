const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const authMiddleware = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

// Enforce auth and admin validation
router.use(authMiddleware, roleGuard('admin'));

router.get('/schedule', aiController.generateSchedule);
router.post('/reminder', aiController.generateReminder);
router.post('/reminder/send', aiController.sendReminder);
router.get('/conflict', aiController.detectConflicts);
router.get('/report', aiController.generateExecutiveReport);
router.get('/insights', aiController.generateInsights);

module.exports = router;
