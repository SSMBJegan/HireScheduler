const db = require('../config/db');
const responseHandler = require('../utils/responseHandler');

module.exports = {
  // Retrieve active campaign for the interviewer
  async getActiveCampaign(req, res) {
    try {
      const campaign = await db.get(
        `SELECT * FROM campaigns WHERE status = 'active' ORDER BY id DESC LIMIT 1`
      );

      if (!campaign) {
        return responseHandler.notFound(res, 'No active hiring campaigns at this time.');
      }

      // Fetch campaign dates with remaining capacities
      const dates = await db.query(
        `SELECT cd.id, cd.date, cd.max_capacity,
         (SELECT COUNT(*) FROM availability a WHERE a.campaign_date_id = cd.id) as selections
         FROM campaign_dates cd WHERE cd.campaign_id = ?`,
        [campaign.id]
      );

      const mappedDates = dates.map(d => ({
        id: d.id,
        date: d.date,
        maxCapacity: d.max_capacity,
        selections: d.selections,
        remainingSlots: Math.max(0, d.max_capacity - d.selections)
      }));

      return responseHandler.success(res, {
        ...campaign,
        dates: mappedDates
      });
    } catch (error) {
      return responseHandler.error(res, error, 'Failed to retrieve active campaign.');
    }
  },

  // Submit/Update availability dates
  async submitAvailability(req, res) {
    const { campaignId, dateIds } = req.body;
    const userId = req.user.id;

    if (!campaignId || !dateIds) {
      return responseHandler.badRequest(res, 'Campaign ID and selected date list are required.');
    }

    try {
      // 1. Fetch Campaign details
      const campaign = await db.get(`SELECT * FROM campaigns WHERE id = ?`, [campaignId]);
      if (!campaign) {
        return responseHandler.notFound(res, 'Hiring campaign not found.');
      }

      // Rule 3: Cannot submit after campaign closure or deadline passed
      if (campaign.status === 'closed' || new Date(campaign.deadline) < new Date()) {
        return responseHandler.badRequest(res, 'Submission blocked. This availability campaign has already closed.');
      }

      // Rule 1: Cannot exceed maximum selectable dates
      if (dateIds.length > campaign.max_selectable_dates) {
        return responseHandler.badRequest(
          res,
          `Submission blocked. You cannot select more than ${campaign.max_selectable_dates} dates.`
        );
      }

      // 2. Fetch all campaign dates and capacity stats
      const dates = await db.query(
        `SELECT cd.id, cd.date, cd.max_capacity,
         (SELECT COUNT(*) FROM availability a WHERE a.campaign_date_id = cd.id AND a.user_id != ?) as external_selections
         FROM campaign_dates cd WHERE cd.campaign_id = ?`,
        [userId, campaignId]
      );

      const dateMap = new Map(dates.map(d => [d.id, d]));

      // Get existing selections for this user to evaluate removals/additions
      const myExisting = await db.query(
        `SELECT campaign_date_id FROM availability WHERE user_id = ? AND campaign_id = ?`,
        [userId, campaignId]
      );
      const myExistingIds = new Set(myExisting.map(e => e.campaign_date_id));

      // Rule 2: Cannot select fully booked dates
      for (const item of dateIds) {
        const dId = typeof item === 'object' && item !== null ? Number(item.dateId) : Number(item);
        const dObj = dateMap.get(dId);
        if (!dObj) {
          return responseHandler.badRequest(res, 'Invalid date selection.');
        }

        // If it's a NEW date selection (not previously selected by the user) and capacity is full
        if (!myExistingIds.has(dId) && dObj.external_selections >= dObj.max_capacity) {
          return responseHandler.badRequest(
            res,
            `Selection blocked. Date ${dObj.date} is fully booked.`
          );
        }
      }

      // 3. Update DB: Delete old selections and write new selections
      await db.run(
        `DELETE FROM availability WHERE user_id = ? AND campaign_id = ?`,
        [userId, campaignId]
      );

      for (const item of dateIds) {
        let dId;
        let loc = 'Office';

        if (typeof item === 'object' && item !== null) {
          dId = Number(item.dateId);
          loc = item.location || 'Office';
        } else {
          dId = Number(item);
        }

        await db.run(
          `INSERT INTO availability (user_id, campaign_id, campaign_date_id, location) VALUES (?, ?, ?, ?)`,
          [userId, campaignId, dId, loc]
        );
      }

      return responseHandler.success(res, dateIds, 'Availability options updated successfully.');
    } catch (error) {
      return responseHandler.error(res, error, 'Failed to save availability options.');
    }
  },

  // Fetch selections made by this user
  async getMySelections(req, res) {
    const { campaignId } = req.params;
    const userId = req.user.id;

    try {
      const selections = await db.query(
        `SELECT campaign_date_id, location FROM availability WHERE user_id = ? AND campaign_id = ?`,
        [userId, campaignId]
      );
      
      const formatted = selections.map(s => ({
        dateId: s.campaign_date_id,
        location: s.location || 'Office'
      }));
      return responseHandler.success(res, formatted);
    } catch (error) {
      return responseHandler.error(res, error, 'Failed to fetch personal availability selections.');
    }
  }
};
