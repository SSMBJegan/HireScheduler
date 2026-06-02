const db = require('../config/db');
const generateToken = require('../utils/generateToken');
const responseHandler = require('../utils/responseHandler');

module.exports = {
  // Direct Simplified Sign-In (no OTP authentication required)
  async requestOTP(req, res) {
    const { role, email, name, phone } = req.body;

    try {
      let user = null;

      if (role === 'admin') {
        if (!email) {
          return responseHandler.badRequest(res, 'Admin email is required.');
        }
        
        const emailClean = email.toLowerCase().trim();
        user = await db.get(`SELECT * FROM users WHERE email = ? AND role = 'admin'`, [emailClean]);
        
        if (!user) {
          // If no admin user exists, auto-create the first admin as a convenience fallback
          if (emailClean === 'admin@hirescheduler.com') {
            await db.run(`INSERT INTO users (email, name, role) VALUES (?, 'HR Administrator', 'admin')`, [emailClean]);
            user = await db.get(`SELECT * FROM users WHERE email = ? AND role = 'admin'`, [emailClean]);
          } else {
            return responseHandler.notFound(res, 'Admin account not found.');
          }
        }
      } else {
        // Interviewer login (handles dynamic sign-in/registration with name, email, phone)
        if (!email || !name || !phone) {
          return responseHandler.badRequest(res, 'Name, Email, and Phone Number are required.');
        }

        const emailClean = email.toLowerCase().trim();
        user = await db.get(`SELECT * FROM users WHERE email = ? AND role = 'interviewer'`, [emailClean]);

        if (!user) {
          // Auto-register new interviewer dynamically!
          const userCountRow = await db.get(`SELECT COUNT(*) as cnt FROM users WHERE role = 'interviewer'`);
          const count = (userCountRow?.cnt || 0) + 1;
          const employeeId = `EMP${String(count).padStart(3, '0')}`;

          await db.run(
            `INSERT INTO users (employee_id, email, name, phone, role, is_active, last_active) VALUES (?, ?, ?, ?, 'interviewer', 1, CURRENT_TIMESTAMP)`,
            [employeeId, emailClean, name.trim(), phone.trim()]
          );
          user = await db.get(`SELECT * FROM users WHERE email = ? AND role = 'interviewer'`, [emailClean]);
        } else {
          // Update active status and details for existing interviewer
          await db.run(
            `UPDATE users SET name = ?, phone = ?, is_active = 1, last_active = CURRENT_TIMESTAMP WHERE id = ?`,
            [name.trim(), phone.trim(), user.id]
          );
          user = await db.get(`SELECT * FROM users WHERE id = ?`, [user.id]);
        }
      }

      // Directly sign and return the JWT token for instant access
      const token = generateToken({
        id: user.id,
        email: user.email,
        employeeId: user.employee_id,
        name: user.name,
        role: user.role
      });

      return responseHandler.success(res, {
        token,
        user: {
          id: user.id,
          email: user.email,
          employeeId: user.employee_id,
          name: user.name,
          role: user.role
        }
      }, 'Authenticated successfully.');
    } catch (error) {
      return responseHandler.error(res, error, 'Failed to authenticate user.');
    }
  },

  // Simplified Logout active status update
  async logout(req, res) {
    try {
      if (req.user && req.user.id) {
        await db.run(`UPDATE users SET is_active = 0 WHERE id = ?`, [req.user.id]);
      }
      return responseHandler.success(res, null, 'Logged out successfully.');
    } catch (error) {
      return responseHandler.error(res, error, 'Failed to process logout.');
    }
  },

  // Placeholder verify to prevent routes crash
  async verifyOTP(req, res) {
    return responseHandler.badRequest(res, 'Verification no longer required.');
  }
};
