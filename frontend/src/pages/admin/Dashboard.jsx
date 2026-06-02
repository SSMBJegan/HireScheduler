import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { 
  Users, 
  CheckCircle2, 
  HelpCircle, 
  Percent, 
  Sparkles, 
  CalendarRange, 
  ArrowUpRight 
} from 'lucide-react';

export default () => {
  const [stats, setStats] = useState({
    totalInterviewers: 0,
    totalResponses: 0,
    pendingResponses: 0,
    responsePercentage: 0,
    campaignName: 'Loading...'
  });
  
  const [charts, setCharts] = useState({
    responseOverview: [],
    dateDistribution: []
  });

  const [activeSessions, setActiveSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const statsRes = await api.get('/api/admin/stats');
      setStats(statsRes.data.data);

      const chartsRes = await api.get('/api/admin/charts');
      setCharts(chartsRes.data.data);
      
      const activeRes = await api.get('/api/admin/active-sessions');
      setActiveSessions(activeRes.data.data);
      
      setLoading(false);
    } catch (err) {
      setError('Failed to refresh dashboard stats.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="loader-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade">
      {/* Welcome Card Section */}
      <div className="welcome-card">
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8rem' }}>Welcome Back, HR Admin</h1>
          <p style={{ marginTop: '4px' }}>
            Current Campaign: <strong style={{ color: 'var(--primary)' }}>{stats.campaignName}</strong>. 
            Manage and optimize interview availability pools seamlessly.
          </p>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--primary)',
          color: '#ffffff',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          boxShadow: 'var(--shadow)'
        }}>
          <Sparkles size={28} />
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* KPI Stats Cards Section */}
      <div className="stats-grid">
        
        {/* Total Interviewers Card */}
        <div className="card stat-card">
          <div className="stat-info">
            <span className="stat-title">Total Interviewers</span>
            <span className="stat-value">{stats.totalInterviewers}</span>
            <span className="stat-trend up">
              Active Pool
            </span>
          </div>
          <div className="stat-icon-container" style={{ backgroundColor: '#EFF6FF', color: 'var(--primary)' }}>
            <Users size={24} />
          </div>
        </div>

        {/* Responses Received Card */}
        <div className="card stat-card">
          <div className="stat-info">
            <span className="stat-title">Responses Received</span>
            <span className="stat-value">{stats.totalResponses}</span>
            <span className="stat-trend up" style={{ color: 'var(--success)' }}>
              Declared Availability
            </span>
          </div>
          <div className="stat-icon-container" style={{ backgroundColor: '#ECFDF5', color: 'var(--success)' }}>
            <CheckCircle2 size={24} />
          </div>
        </div>

        {/* Pending Responses Card */}
        <div className="card stat-card">
          <div className="stat-info">
            <span className="stat-title">Pending Responses</span>
            <span className="stat-value">{stats.pendingResponses}</span>
            <span className="stat-trend down" style={{ color: 'var(--warning)' }}>
              Awaiting Action
            </span>
          </div>
          <div className="stat-icon-container" style={{ backgroundColor: '#FFFBEB', color: 'var(--warning)' }}>
            <HelpCircle size={24} />
          </div>
        </div>

        {/* Response Percentage Card */}
        <div className="card stat-card">
          <div className="stat-info">
            <span className="stat-title">Response Rate</span>
            <span className="stat-value">{stats.responsePercentage}%</span>
            <span className="stat-trend up" style={{ color: stats.responsePercentage >= 70 ? 'var(--success)' : 'var(--danger)' }}>
              {stats.responsePercentage >= 70 ? 'Target met' : 'Needs attention'}
            </span>
          </div>
          <div className="stat-icon-container" style={{ backgroundColor: '#EEF2F6', color: 'var(--secondary)' }}>
            <Percent size={24} />
          </div>
        </div>

      </div>

      {/* Visual Chart Analytics Section */}
      <div className="charts-grid">
        
        {/* Response Overview Pie Chart Emulator */}
        <div className="card chart-container">
          <div className="chart-header">
            <h3>Response Overview Participation</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Status Metrics</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', height: '220px', gap: '32px' }}>
            {/* Visual Ring Chart */}
            <div style={{
              width: '150px',
              height: '150px',
              borderRadius: '50%',
              background: `conic-gradient(var(--primary) ${stats.responsePercentage}%, var(--border) ${stats.responsePercentage}% 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}>
              <div style={{
                width: '110px',
                height: '110px',
                borderRadius: '50%',
                backgroundColor: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column'
              }}>
                <span style={{ fontSize: '1.5rem', fontWeight: '700' }}>{stats.responsePercentage}%</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Participation</span>
              </div>
            </div>

            {/* Labels Side */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: 'var(--primary)' }}></div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Responded</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{stats.totalResponses} staff members</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: 'var(--border)' }}></div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Pending Submissions</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{stats.pendingResponses} staff members</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Date Capacity Selection Distribution Bar Chart */}
        <div className="card chart-container">
          <div className="chart-header">
            <h3>Date Capacity Selection Distributions</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Max capacity vs actual</span>
          </div>

          <div className="chart-bars-list">
            {charts.dateDistribution && charts.dateDistribution.length > 0 ? (
              charts.dateDistribution.map((d) => {
                const percent = d.capacity > 0 ? Math.round((d.selections / d.capacity) * 100) : 0;
                return (
                  <div key={d.date} className="chart-bar-item">
                    <div className="bar-label-container">
                      <span>{d.date}</span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        <strong>{d.selections}</strong> / {d.capacity} selected ({percent}%)
                      </span>
                    </div>
                    <div className="bar-track">
                      <div 
                        className="bar-fill bar-capacity-fill" 
                        style={{ width: `${Math.min(100, percent)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '180px',
                color: 'var(--text-secondary)',
                fontSize: '0.85rem'
              }}>
                <CalendarRange size={32} style={{ marginBottom: '8px', opacity: 0.6 }} />
                No active dates configured. Create a campaign first.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Active Sessions Monitoring Section */}
      <div className="card" style={{ marginTop: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h3>Currently Logged In Team Members</h3>
            <p style={{ fontSize: '0.8rem', marginTop: '2px' }}>Real-time active interviewer session tracking</p>
          </div>
          <span className="badge badge-low" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
            {activeSessions.length} Active Now
          </span>
        </div>

        {activeSessions.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {activeSessions.map((session) => (
              <div 
                key={session.id} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px', 
                  padding: '16px', 
                  backgroundColor: 'var(--bg)', 
                  borderRadius: 'var(--radius-sm)', 
                  border: '1px solid var(--border)',
                  position: 'relative'
                }}
              >
                {/* Visual pulsing green indicator */}
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--success)',
                  boxShadow: '0 0 0 2px rgb(34 197 94 / 0.4)',
                  animation: 'pulse 1.5s infinite'
                }}></div>

                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '0.9rem'
                }}>
                  {session.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <strong style={{ fontSize: '0.9rem' }}>{session.name}</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{session.email}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Phone: {session.phone || 'N/A'}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            No interviewers currently logged in.
          </div>
        )}
      </div>

    </div>
  );
};
