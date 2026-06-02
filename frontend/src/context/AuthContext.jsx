import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Synchronize authentication on startup
  useEffect(() => {
    const token = localStorage.getItem('hirescheduler_token');
    const storedUser = localStorage.getItem('hirescheduler_user');
    
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        logout();
      }
    }
    setLoading(false);
  }, []);

  // Request 6-digit verification OTP
  const requestOTP = async (role, email, employeeId) => {
    try {
      const response = await api.post('/api/auth/otp-request', { role, email, employeeId });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to dispatch OTP verification passcode.';
    }
  };

  // Verify OTP and complete login
  const verifyOTP = async (email, employeeId, otp) => {
    try {
      const response = await api.post('/api/auth/otp-verify', { email, employeeId, otp });
      const { token, user: userData } = response.data.data;
      
      localStorage.setItem('hirescheduler_token', token);
      localStorage.setItem('hirescheduler_user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    } catch (error) {
      throw error.response?.data?.message || 'Verification passcode invalid or expired.';
    }
  };

  // Sign out user session
  const logout = () => {
    localStorage.removeItem('hirescheduler_token');
    localStorage.removeItem('hirescheduler_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, requestOTP, verifyOTP, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be consumed within an AuthProvider.');
  }
  return context;
};
