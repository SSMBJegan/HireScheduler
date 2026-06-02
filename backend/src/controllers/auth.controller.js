const db = require('../config/db');
const otpService = require('../services/otp.service');
const generateToken = require('../utils/generateToken');
const responseHandler = require('../utils/responseHandler');

module.exports = {
  // Direct Login (bypassing OTP entirely as requested)
  async requestOTP(req, res) {
    const { role, email, employeeId } = req.body;

    try {
      let user = null;

      if (role === 'admin') {
        if (!email) {
          return responseHandler.badRequest(res, 'Admin email is required.');
        }
        // Verify user is an admin
        user = await db.get(`SELECT * FROM users WHERE email = ? AND role = 'admin'`, [email.toLowerCase().trim()]);
        if (!user) {
          return responseHandler.notFound(res, 'Admin account not found.');
        }
      } else {
        // Interviewer login (handles employeeId or email)
        if (employeeId) {
          user = await db.get(`SELECT * FROM users WHERE employee_id = ? AND role = 'interviewer'`, [employeeId.trim()]);
        } else if (email) {
          user = await db.get(`SELECT * FROM users WHERE email = ? AND role = 'interviewer'`, [email.toLowerCase().trim()]);
        } else {
          return responseHandler.badRequest(res, 'Employee ID or email is required.');
        }

        if (!user) {
          return responseHandler.notFound(res, 'Interviewer employee record not found.');
        }
      }

      // Bypass OTP: Directly sign and return the JWT token for instant access
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

  // Verify OTP passcode
  async verifyOTP(req, res) {
    const { email, employeeId, otp } = req.body;

    if (!otp) {
      return responseHandler.badRequest(res, 'Verification OTP passcode is required.');
    }

    try {
      // Verify OTP in service
      const verifiedEmail = await otpService.verifyOTP(email ? email.toLowerCase().trim() : null, employeeId ? employeeId.trim() : null, otp);
      
      if (!verifiedEmail) {
        return responseHandler.badRequest(res, 'Invalid OTP or passcode has expired.');
      }

      // Retrieve full user record
      const user = await db.get(`SELECT * FROM users WHERE email = ?`, [verifiedEmail]);
      if (!user) {
        return responseHandler.notFound(res, 'User record not found.');
      }

      // Generate JWT Token
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
      return responseHandler.error(res, error, 'Failed to verify OTP passcode.');
    }
  }
};
