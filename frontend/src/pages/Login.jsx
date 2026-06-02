import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Briefcase, Mail, Shield, User, HelpCircle, CheckCircle2 } from 'lucide-react';

export default () => {
  const { user, requestOTP } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState('interviewer'); // 'admin', 'interviewer'
  const [loginMethod, setLoginMethod] = useState('email'); // 'email', 'employeeId'
  
  const [email, setEmail] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Automatically bypass login if user has a valid active session in localStorage
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/interviewer', { replace: true });
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const activeEmail = loginMethod === 'email' || role === 'admin' ? email : null;
      const activeEmpId = loginMethod === 'employeeId' && role === 'interviewer' ? employeeId : null;

      const res = await requestOTP(role, activeEmail, activeEmpId);
      
      setSuccessMsg('A verification code has been dispatched. Redirecting...');
      
      // Navigate to OTP verification page, passing the credential values
      setTimeout(() => {
        navigate('/otp-verify', { 
          state: { 
            role, 
            email: activeEmail, 
            employeeId: activeEmpId 
          } 
        });
      }, 1500);
    } catch (err) {
      setError(err);
      setLoading(false);
    }
  };

  return (
    <div className="login-container animate-fade">
      {/* Left Section: Branding & Highlights */}
      <div className="login-left">
        <div className="login-brand">
          <Briefcase size={36} strokeWidth={2.5} />
          <h2 style={{ color: '#ffffff', fontSize: '1.75rem', fontWeight: '800' }}>HireScheduler AI</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h1 className="login-tagline">Centralized Interview Availability & Scheduling.</h1>
          <p style={{ color: '#E2E8F0', fontSize: '1.05rem', fontWeight: '400', maxWidth: '480px' }}>
            Empower your HR operations and scheduling teams with advanced constraint-balanced automation.
          </p>
        </div>

        <div className="login-highlight-box">
          <h4 style={{ color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <CheckCircle2 size={18} /> Enterprise Capabilities Included
          </h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: '#E2E8F0' }}>
            <li>• Dual OTP Security (Employee ID / Corporate Email verification)</li>
            <li>• AI Balanced workload resource planning</li>
            <li>• Custom reporting outputs with Excel & CSV exports</li>
            <li>• Immediate staffing conflict alert thresholds</li>
          </ul>
        </div>

        <p style={{ fontSize: '0.8rem', color: '#93C5FD' }}>
          © 2026 HireScheduler Corporation. All rights reserved.
        </p>
      </div>

      {/* Right Section: Form Context */}
      <div className="login-right">
        <div className="card login-card animate-fade">
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '700' }}>Welcome Back</h2>
            <p style={{ marginTop: '4px' }}>Please request a passcode to access the portal</p>
          </div>

          {/* Role selector tab */}
          <div style={{ 
            display: 'flex', 
            backgroundColor: 'var(--bg)', 
            padding: '4px', 
            borderRadius: 'var(--radius-sm)', 
            marginBottom: '24px' 
          }}>
            <button
              onClick={() => { setRole('interviewer'); setError(''); }}
              className="btn btn-sm"
              style={{
                flex: 1,
                borderRadius: '6px',
                height: '40px',
                border: 'none',
                backgroundColor: role === 'interviewer' ? '#ffffff' : 'transparent',
                color: role === 'interviewer' ? 'var(--primary)' : 'var(--text-secondary)',
                boxShadow: role === 'interviewer' ? 'var(--shadow)' : 'none',
                fontWeight: '600'
              }}
            >
              <User size={16} style={{ marginRight: '6px' }} /> Interviewer
            </button>
            <button
              onClick={() => { setRole('admin'); setLoginMethod('email'); setError(''); }}
              className="btn btn-sm"
              style={{
                flex: 1,
                borderRadius: '6px',
                height: '40px',
                border: 'none',
                backgroundColor: role === 'admin' ? '#ffffff' : 'transparent',
                color: role === 'admin' ? 'var(--primary)' : 'var(--text-secondary)',
                boxShadow: role === 'admin' ? 'var(--shadow)' : 'none',
                fontWeight: '600'
              }}
            >
              <Shield size={16} style={{ marginRight: '6px' }} /> HR Admin
            </button>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}
          {successMsg && <div className="alert alert-success">{successMsg}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Conditional login method selection tabs for interviewer */}
            {role === 'interviewer' && (
              <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', marginBottom: '-8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="method"
                    checked={loginMethod === 'email'}
                    onChange={() => setLoginMethod('email')}
                    style={{ accentColor: 'var(--primary)' }}
                  />
                  Corporate Email
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="method"
                    checked={loginMethod === 'employeeId'}
                    onChange={() => setLoginMethod('employeeId')}
                    style={{ accentColor: 'var(--primary)' }}
                  />
                  Employee ID
                </label>
              </div>
            )}

            {/* Render appropriate input */}
            {loginMethod === 'email' || role === 'admin' ? (
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    required
                    placeholder={role === 'admin' ? 'admin@hirescheduler.com' : 'john@hirescheduler.com'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '44px' }}
                  />
                  <Mail size={18} style={{ 
                    position: 'absolute', 
                    left: '16px', 
                    top: '15px', 
                    color: 'var(--text-secondary)' 
                  }} />
                </div>
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label">Employee ID Number</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    required
                    placeholder="e.g. EMP001"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '44px' }}
                  />
                  <Briefcase size={18} style={{ 
                    position: 'absolute', 
                    left: '16px', 
                    top: '15px', 
                    color: 'var(--text-secondary)' 
                  }} />
                </div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', border: 'none' }}
            >
              {loading ? 'Processing request...' : 'Send Verification OTP'}
            </button>
          </form>

          {/* Quick reference guide info card */}
          <div style={{ 
            marginTop: '32px', 
            padding: '16px', 
            backgroundColor: '#EFF6FF', 
            borderRadius: 'var(--radius-sm)', 
            border: '1px dashed #BFDBFE',
            display: 'flex',
            gap: '10px'
          }}>
            <HelpCircle size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            <div style={{ fontSize: '0.75rem', color: '#1E3A8A' }}>
              <strong>Development Environment Demo Credentials:</strong><br />
              • Admin Email: <code>admin@hirescheduler.com</code><br />
              • Interviewer ID: <code>EMP001</code> (or Email: <code>john@hirescheduler.com</code>)<br />
              <em>Note: Once requested, your OTP code is printed directly to your local Node.js server console window.</em>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
