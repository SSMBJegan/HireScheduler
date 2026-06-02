const db = require('../config/db');
const responseHandler = require('../utils/responseHandler');

module.exports = {
  // Retrieve all interviewer profiles
  async getInterviewers(req, res) {
    try {
      const interviewers = await db.query(
        `SELECT id, employee_id, email, name FROM users WHERE role = 'interviewer' ORDER BY id DESC`
      );
      return responseHandler.success(res, interviewers);
    } catch (error) {
      return responseHandler.error(res, error, 'Failed to fetch interviewers.');
    }
  },

  // Create new interviewer profile
  async createInterviewer(req, res) {
    const { employeeId, email, name } = req.body;

    if (!employeeId || !email || !name) {
      return responseHandler.badRequest(res, 'Employee ID, email, and name are required.');
    }

    try {
      // Check existing employee ID or email
      const existing = await db.get(
        `SELECT * FROM users WHERE employee_id = ? OR email = ?`,
        [employeeId.trim(), email.toLowerCase().trim()]
      );

      if (existing) {
        return responseHandler.badRequest(res, 'An interviewer with this Employee ID or Email already exists.');
      }

      const result = await db.run(
        `INSERT INTO users (employee_id, email, name, role) VALUES (?, ?, ?, 'interviewer')`,
        [employeeId.trim(), email.toLowerCase().trim(), name.trim()]
      );

      return responseHandler.success(
        res,
        { id: result.insertId, employeeId, email, name },
        'Interviewer profile created successfully.',
        201
      );
    } catch (error) {
      return responseHandler.error(res, error, 'Failed to create interviewer.');
    }
  },

  // Delete interviewer profile
  async deleteInterviewer(req, res) {
    const { id } = req.params;
    try {
      const user = await db.get(`SELECT * FROM users WHERE id = ? AND role = 'interviewer'`, [id]);
      if (!user) {
        return responseHandler.notFound(res, 'Interviewer not found.');
      }

      await db.run(`DELETE FROM users WHERE id = ?`, [id]);
      return responseHandler.success(res, null, 'Interviewer profile deleted successfully.');
    } catch (error) {
      return responseHandler.error(res, error, 'Failed to delete interviewer.');
    }
  },

  // Create a hiring availability campaign
  async createCampaign(req, res) {
    const { name, start_date, end_date, deadline, max_selectable_dates, dates } = req.body;

    if (!name || !start_date || !end_date || !deadline || !dates || !dates.length) {
      return responseHandler.badRequest(res, 'Missing required campaign details or date allocations.');
    }

    try {
      // Insert campaign
      const campaignResult = await db.run(
        `INSERT INTO campaigns (name, start_date, end_date, deadline, max_selectable_dates, status) VALUES (?, ?, ?, ?, ?, 'active')`,
        [name, start_date, end_date, deadline, max_selectable_dates || 3]
      );

      const campaignId = campaignResult.insertId;

      // Insert dates with capacities and specific locations (e.g. Hyderabad, Noida, etc.)
      for (const d of dates) {
        await db.run(
          `INSERT INTO campaign_dates (campaign_id, date, max_capacity, location) VALUES (?, ?, ?, ?)`,
          [campaignId, d.date, d.max_capacity || 20, d.location ? d.location.trim() : 'Remote']
        );
      }

      return responseHandler.success(
        res,
        { campaignId, name, start_date, end_date, deadline },
        'Hiring campaign created successfully.',
        201
      );
    } catch (error) {
      return responseHandler.error(res, error, 'Failed to create campaign.');
    }
  },

  // Fetch all availability campaigns
  async getCampaigns(req, res) {
    try {
      const campaigns = await db.query(`SELECT * FROM campaigns ORDER BY id DESC`);
      return responseHandler.success(res, campaigns);
    } catch (error) {
      return responseHandler.error(res, error, 'Failed to fetch campaigns.');
    }
  },

  // Fetch campaign by details
  async getCampaignById(req, res) {
    const { id } = req.params;
    try {
      const campaign = await db.get(`SELECT * FROM campaigns WHERE id = ?`, [id]);
      if (!campaign) {
        return responseHandler.notFound(res, 'Campaign not found.');
      }

      const dates = await db.query(
        `SELECT cd.id, cd.date, cd.max_capacity, cd.location,
         (SELECT COUNT(*) FROM availability a WHERE a.campaign_date_id = cd.id) as current_selections
         FROM campaign_dates cd WHERE cd.campaign_id = ?`,
        [id]
      );

      return responseHandler.success(res, { ...campaign, dates });
    } catch (error) {
      return responseHandler.error(res, error, 'Failed to fetch campaign details.');
    }
  },

  // Delete campaign
  async deleteCampaign(req, res) {
    const { id } = req.params;
    try {
      const campaign = await db.get(`SELECT * FROM campaigns WHERE id = ?`, [id]);
      if (!campaign) {
        return responseHandler.notFound(res, 'Campaign not found.');
      }

      await db.run(`DELETE FROM campaigns WHERE id = ?`, [id]);
      return responseHandler.success(res, null, 'Campaign deleted successfully.');
    } catch (error) {
      return responseHandler.error(res, error, 'Failed to delete campaign.');
    }
  },

  // Gather dashboard KPI metrics
  async getDashboardStats(req, res) {
    try {
      // Find latest campaign
      const campaign = await db.get(`SELECT * FROM campaigns ORDER BY id DESC LIMIT 1`);
      
      const totalIntvsRow = await db.get(`SELECT COUNT(*) as cnt FROM users WHERE role = 'interviewer'`);
      const totalInterviewers = totalIntvsRow.cnt;

      if (!campaign) {
        return responseHandler.success(res, {
          totalInterviewers,
          totalResponses: 0,
          pendingResponses: totalInterviewers,
          responsePercentage: 0,
          campaignName: 'No Active Campaign'
        });
      }

      // Total interviewers who submitted availability for this campaign
      const respondedRow = await db.get(
        `SELECT COUNT(DISTINCT user_id) as cnt FROM availability WHERE campaign_id = ?`,
        [campaign.id]
      );
      const totalResponses = respondedRow.cnt;
      const pendingResponses = Math.max(0, totalInterviewers - totalResponses);
      const responsePercentage = totalInterviewers > 0 
        ? Math.round((totalResponses / totalInterviewers) * 100) 
        : 0;

      return responseHandler.success(res, {
        campaignId: campaign.id,
        campaignName: campaign.name,
        totalInterviewers,
        totalResponses,
        pendingResponses,
        responsePercentage
      });
    } catch (error) {
      return responseHandler.error(res, error, 'Failed to retrieve dashboard KPI metrics.');
    }
  },

  // Fetch charts visual data distributions
  async getDashboardCharts(req, res) {
    const { campaignId } = req.query;

    try {
      let activeCampaignId = campaignId;

      if (!activeCampaignId) {
        const campaign = await db.get(`SELECT id FROM campaigns ORDER BY id DESC LIMIT 1`);
        if (!campaign) {
          return responseHandler.success(res, { responseOverview: [], dateDistribution: [] });
        }
        activeCampaignId = campaign.id;
      }

      const totalIntvsRow = await db.get(`SELECT COUNT(*) as cnt FROM users WHERE role = 'interviewer'`);
      const totalCount = totalIntvsRow.cnt;

      const respondedRow = await db.get(
        `SELECT COUNT(DISTINCT user_id) as cnt FROM availability WHERE campaign_id = ?`,
        [activeCampaignId]
      );
      const respondedCount = respondedRow.cnt;
      const pendingCount = Math.max(0, totalCount - respondedCount);

      // 1. Response Status Overview Chart
      const responseOverview = [
        { status: 'Responded', count: respondedCount },
        { status: 'Pending', count: pendingCount }
      ];

      // 2. Date Selection Capacity Distribution
      const dateSelections = await db.query(
        `SELECT cd.date, cd.max_capacity,
         (SELECT COUNT(*) FROM availability a WHERE a.campaign_date_id = cd.id) as selections
         FROM campaign_dates cd WHERE cd.campaign_id = ?`,
        [activeCampaignId]
      );

      const dateDistribution = dateSelections.map(d => ({
        date: d.date,
        selections: d.selections,
        capacity: d.max_capacity
      }));

      return responseHandler.success(res, {
        responseOverview,
        dateDistribution
      });
    } catch (error) {
      return responseHandler.error(res, error, 'Failed to fetch visual chart data.');
    }
  },

  // Retrieve all HR admin profiles
  async getAdmins(req, res) {
    try {
      const admins = await db.query(
        `SELECT id, email, name FROM users WHERE role = 'admin' ORDER BY id DESC`
      );
      return responseHandler.success(res, admins);
    } catch (error) {
      return responseHandler.error(res, error, 'Failed to fetch HR Administrator profiles.');
    }
  },

  // Create a new HR admin profile
  async createAdmin(req, res) {
    const { email, name } = req.body;

    if (!email || !name) {
      return responseHandler.badRequest(res, 'Email and name are required.');
    }

    try {
      const emailClean = email.toLowerCase().trim();
      const existing = await db.get(`SELECT * FROM users WHERE email = ?`, [emailClean]);

      if (existing) {
        return responseHandler.badRequest(res, 'A user account with this email address already exists.');
      }

      const result = await db.run(
        `INSERT INTO users (email, name, role) VALUES (?, ?, 'admin')`,
        [emailClean, name.trim()]
      );

      return responseHandler.success(
        res,
        { id: result.insertId, email: emailClean, name: name.trim() },
        'HR Administrator account registered successfully.',
        201
      );
    } catch (error) {
      return responseHandler.error(res, error, 'Failed to register HR Admin.');
    }
  },

  // Delete an HR admin profile (prevents system lockout for primary admin)
  async deleteAdmin(req, res) {
    const { id } = req.params;

    try {
      const user = await db.get(`SELECT * FROM users WHERE id = ? AND role = 'admin'`, [id]);
      if (!user) {
        return responseHandler.notFound(res, 'HR Admin account not found.');
      }

      if (user.email === 'admin@hirescheduler.com') {
        return responseHandler.badRequest(res, 'Deletion blocked. The primary system administrator account cannot be deleted.');
      }

      await db.run(`DELETE FROM users WHERE id = ?`, [id]);
      return responseHandler.success(res, null, 'HR Admin account removed successfully.');
    } catch (error) {
      return responseHandler.error(res, error, 'Failed to remove HR Admin.');
    }
  },

  // Retrieve active logged in interviewer sessions
  async getActiveSessions(req, res) {
    try {
      const activeUsers = await db.query(
        `SELECT id, employee_id, email, name, phone, last_active FROM users 
         WHERE role = 'interviewer' AND is_active = 1 
         ORDER BY last_active DESC`
      );
      return responseHandler.success(res, activeUsers);
    } catch (error) {
      return responseHandler.error(res, error, 'Failed to fetch active logged in sessions.');
    }
  }
};
