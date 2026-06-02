const db = require('../config/db');
const aiSchedulingService = require('../services/aiScheduling.service');
const aiReminderService = require('../services/aiReminder.service');
const aiConflictService = require('../services/aiConflict.service');
const aiReportService = require('../services/aiReport.service');
const aiInsightsService = require('../services/aiInsights.service');
const mailService = require('../services/mail.service');
const responseHandler = require('../utils/responseHandler');

module.exports = {
  // AI Feature 1: Generate Optimal Schedule
  async generateSchedule(req, res) {
    const { campaignId } = req.query;

    try {
      let activeCampaignId = campaignId;
      if (!activeCampaignId) {
        const campaign = await db.get(`SELECT id FROM campaigns ORDER BY id DESC LIMIT 1`);
        if (!campaign) return responseHandler.notFound(res, 'No campaigns found.');
        activeCampaignId = campaign.id;
      }

      // Gather input data
      const interviewers = await db.query(`SELECT id, name, email, is_active FROM users WHERE role = 'interviewer'`);
      const dates = await db.query(`SELECT id, date, max_capacity FROM campaign_dates WHERE campaign_id = ?`, [activeCampaignId]);
      const availability = await db.query(`SELECT user_id, campaign_date_id FROM availability WHERE campaign_id = ?`, [activeCampaignId]);

      const aiResult = await aiSchedulingService.generateSchedule(interviewers, dates, availability);
      return responseHandler.success(res, aiResult);
    } catch (error) {
      return responseHandler.error(res, error, 'AI Schedular execution failed.');
    }
  },

  // AI Feature 2: Generate/Send personalized Reminder email
  async generateReminder(req, res) {
    const { name, email, deadline } = req.body;

    if (!name || !email || !deadline) {
      return responseHandler.badRequest(res, 'Interviewer name, email, and campaign deadline are required.');
    }

    try {
      const aiResult = await aiReminderService.generateReminder(name, email, deadline);
      return responseHandler.success(res, aiResult);
    } catch (error) {
      return responseHandler.error(res, error, 'AI Reminder generation failed.');
    }
  },

  // Trigger simulated/real reminder delivery
  async sendReminder(req, res) {
    const { email, subject, body } = req.body;

    if (!email || !subject || !body) {
      return responseHandler.badRequest(res, 'Email, subject, and body content are required.');
    }

    try {
      await mailService.sendReminder(email, subject, body);
      return responseHandler.success(res, null, 'Personalized AI reminder email dispatched successfully.');
    } catch (error) {
      return responseHandler.error(res, error, 'Failed to dispatch email.');
    }
  },

  // AI Feature 3: Conflict Detection Engine
  async detectConflicts(req, res) {
    const { campaignId } = req.query;

    try {
      let activeCampaignId = campaignId;
      if (!activeCampaignId) {
        const campaign = await db.get(`SELECT id FROM campaigns ORDER BY id DESC LIMIT 1`);
        if (!campaign) return responseHandler.notFound(res, 'No campaigns found.');
        activeCampaignId = campaign.id;
      }

      const totalIntvsRow = await db.get(`SELECT COUNT(*) as cnt FROM users WHERE role = 'interviewer'`);
      const totalInterviewers = totalIntvsRow.cnt;

      const respondedRow = await db.get(
        `SELECT COUNT(DISTINCT user_id) as cnt FROM availability WHERE campaign_id = ?`,
        [activeCampaignId]
      );
      const totalResponses = respondedRow.cnt;

      const dates = await db.query(
        `SELECT cd.date, cd.max_capacity as required_capacity,
         (SELECT COUNT(*) FROM availability a WHERE a.campaign_date_id = cd.id) as current_avail_count
         FROM campaign_dates cd WHERE cd.campaign_id = ?`,
        [activeCampaignId]
      );

      const aiResult = await aiConflictService.detectConflicts(totalInterviewers, totalResponses, dates);
      return responseHandler.success(res, aiResult);
    } catch (error) {
      return responseHandler.error(res, error, 'AI Conflict detection failed.');
    }
  },

  // AI Feature 4: Executive Report Generator
  async generateExecutiveReport(req, res) {
    const { campaignId } = req.query;

    try {
      let activeCampaignId = campaignId;
      if (!activeCampaignId) {
        const campaign = await db.get(`SELECT id FROM campaigns ORDER BY id DESC LIMIT 1`);
        if (!campaign) return responseHandler.notFound(res, 'No campaigns found.');
        activeCampaignId = campaign.id;
      }

      const totalIntvsRow = await db.get(`SELECT COUNT(*) as cnt FROM users WHERE role = 'interviewer'`);
      const totalInterviewers = totalIntvsRow.cnt;

      const respondedRow = await db.get(
        `SELECT COUNT(DISTINCT user_id) as cnt FROM availability WHERE campaign_id = ?`,
        [activeCampaignId]
      );
      const totalResponses = respondedRow.cnt;

      const dates = await db.query(
        `SELECT cd.date,
         (SELECT COUNT(*) FROM availability a WHERE a.campaign_date_id = cd.id) as selections
         FROM campaign_dates cd WHERE cd.campaign_id = ?`,
        [activeCampaignId]
      );

      const aiResult = await aiReportService.generateReport(totalInterviewers, totalResponses, dates);
      return responseHandler.success(res, aiResult);
    } catch (error) {
      return responseHandler.error(res, error, 'AI Executive Report generation failed.');
    }
  },

  // AI High-level qualitative insights
  async generateInsights(req, res) {
    const { campaignId } = req.query;

    try {
      let activeCampaignId = campaignId;
      if (!activeCampaignId) {
        const campaign = await db.get(`SELECT id FROM campaigns ORDER BY id DESC LIMIT 1`);
        if (!campaign) return responseHandler.notFound(res, 'No campaigns found.');
        activeCampaignId = campaign.id;
      }

      const totalIntvsRow = await db.get(`SELECT COUNT(*) as cnt FROM users WHERE role = 'interviewer'`);
      const totalInterviewers = totalIntvsRow.cnt;

      const respondedRow = await db.get(
        `SELECT COUNT(DISTINCT user_id) as cnt FROM availability WHERE campaign_id = ?`,
        [activeCampaignId]
      );
      const totalResponses = respondedRow.cnt;

      const dates = await db.query(
        `SELECT cd.date,
         (SELECT COUNT(*) FROM availability a WHERE a.campaign_date_id = cd.id) as selections
         FROM campaign_dates cd WHERE cd.campaign_id = ?`,
        [activeCampaignId]
      );

      const aiResult = await aiInsightsService.generateInsights(totalInterviewers, totalResponses, dates);
      return responseHandler.success(res, aiResult);
    } catch (error) {
      return responseHandler.error(res, error, 'AI Insights generation failed.');
    }
  }
};
