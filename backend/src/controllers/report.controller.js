const db = require('../config/db');
const exportService = require('../services/export.service');
const responseHandler = require('../utils/responseHandler');

module.exports = {
  // Get tabular data of availability selections per interviewer
  async getAvailabilityReport(req, res) {
    const { campaignId } = req.query;

    try {
      let activeCampaignId = campaignId;

      if (!activeCampaignId) {
        const campaign = await db.get(`SELECT id FROM campaigns ORDER BY id DESC LIMIT 1`);
        if (!campaign) {
          return responseHandler.success(res, []);
        }
        activeCampaignId = campaign.id;
      }

      // Fetch all selections for the campaign with location details
      const selections = await db.query(
        `SELECT a.user_id, cd.date, cd.location 
         FROM availability a
         JOIN campaign_dates cd ON a.campaign_date_id = cd.id
         WHERE a.campaign_id = ?`,
        [activeCampaignId]
      );

      // Fetch all interviewer users
      const interviewers = await db.query(
        `SELECT id, name, employee_id FROM users WHERE role = 'interviewer' ORDER BY name ASC`
      );

      // Map selections by user
      const selectionsMap = new Map();
      for (const sel of selections) {
        if (!selectionsMap.has(sel.user_id)) {
          selectionsMap.set(sel.user_id, []);
        }
        selectionsMap.get(sel.user_id).push(`${sel.date} (${sel.location || 'Remote'})`);
      }

      const report = interviewers.map(u => {
        const list = selectionsMap.get(u.id) || [];
        return {
          name: u.name,
          employeeId: u.employee_id,
          date1: list[0] || '-',
          date2: list[1] || '-',
          date3: list[2] || '-'
        };
      });

      return responseHandler.success(res, report);
    } catch (error) {
      return responseHandler.error(res, error, 'Failed to build availability report.');
    }
  },

  // Get date summary report of how many interviewers selected each date
  async getDateSummaryReport(req, res) {
    const { campaignId } = req.query;

    try {
      let activeCampaignId = campaignId;

      if (!activeCampaignId) {
        const campaign = await db.get(`SELECT id FROM campaigns ORDER BY id DESC LIMIT 1`);
        if (!campaign) {
          return responseHandler.success(res, []);
        }
        activeCampaignId = campaign.id;
      }

      const report = await db.query(
        `SELECT cd.date,
         (SELECT GROUP_CONCAT(u.name, ', ') FROM availability a
          JOIN users u ON a.user_id = u.id
          WHERE a.campaign_date_id = cd.id) as interviewers
         FROM campaign_dates cd WHERE cd.campaign_id = ? ORDER BY cd.date ASC`,
        [activeCampaignId]
      );

      const mappedReport = report.map(r => ({
        date: r.date,
        interviewers: r.interviewers || 'No selections'
      }));

      return responseHandler.success(res, mappedReport);
    } catch (error) {
      return responseHandler.error(res, error, 'Failed to build date summary report.');
    }
  },

  // Export report to CSV or Excel
  async exportReport(req, res) {
    const { reportType, format, campaignId } = req.query;

    try {
      let activeCampaignId = campaignId;
      if (!activeCampaignId) {
        const campaign = await db.get(`SELECT id FROM campaigns ORDER BY id DESC LIMIT 1`);
        if (!campaign) {
          return responseHandler.badRequest(res, 'No campaigns available to export.');
        }
        activeCampaignId = campaign.id;
      }

      let headers = [];
      let rows = [];
      let filename = '';

      if (reportType === 'availability') {
        filename = 'Availability_Report';
        headers = ['Name', 'Employee ID', 'Date 1', 'Date 2', 'Date 3'];

        // Fetch all selections for the campaign with location details
        const selections = await db.query(
          `SELECT a.user_id, cd.date, cd.location 
           FROM availability a
           JOIN campaign_dates cd ON a.campaign_date_id = cd.id
           WHERE a.campaign_id = ?`,
          [activeCampaignId]
        );

        // Fetch all interviewer users
        const interviewers = await db.query(
          `SELECT id, name, employee_id FROM users WHERE role = 'interviewer' ORDER BY name ASC`
        );

        // Map selections by user
        const selectionsMap = new Map();
        for (const sel of selections) {
          if (!selectionsMap.has(sel.user_id)) {
            selectionsMap.set(sel.user_id, []);
          }
          selectionsMap.get(sel.user_id).push(`${sel.date} (${sel.location || 'Remote'})`);
        }

        rows = interviewers.map(u => {
          const list = selectionsMap.get(u.id) || [];
          return [
            u.name,
            u.employee_id,
            list[0] || '-',
            list[1] || '-',
            list[2] || '-'
          ];
        });
      } else if (reportType === 'summary') {
        filename = 'Date_Summary_Report';
        headers = ['Date', 'Interviewers'];

        const data = await db.query(
          `SELECT cd.date,
           (SELECT GROUP_CONCAT(u.name, ', ') FROM availability a
            JOIN users u ON a.user_id = u.id
            WHERE a.campaign_date_id = cd.id) as interviewers
           FROM campaign_dates cd WHERE cd.campaign_id = ?`,
          [activeCampaignId]
        );

        rows = data.map(row => [
          row.date,
          row.interviewers || 'No selections'
        ]);
      } else {
        return responseHandler.badRequest(res, 'Invalid report type requested.');
      }

      if (format === 'csv') {
        const csvContent = exportService.generateCSV(headers, rows);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}.csv`);
        return res.send(csvContent);
      } else if (format === 'excel') {
        const excelContent = exportService.generateExcel(headers, rows);
        res.setHeader('Content-Type', 'application/vnd.ms-excel');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}.xls`);
        return res.send(excelContent);
      } else {
        return responseHandler.badRequest(res, 'Invalid export format requested.');
      }
    } catch (error) {
      return responseHandler.error(res, error, 'Failed to export reports.');
    }
  }
};
