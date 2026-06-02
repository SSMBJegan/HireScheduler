import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { Eye, Mail, CheckCircle, AlertCircle, Search, RefreshCw } from 'lucide-react';

export default () => {
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState(null);
  const [statuses, setStatuses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchCampaignAndStatuses = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch latest campaign
      const campaignRes = await api.get('/api/admin/campaigns');
      const latest = campaignRes.data.data[0];
      
      if (!latest) {
        setLoading(false);
        return;
      }
      
      setCampaign(latest);

      // Fetch availability list to compare responded status
      const reportRes = await api.get(`/api/reports/availability?campaignId=${latest.id}`);
      
      setStatuses(reportRes.data.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch campaign submission statuses.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaignAndStatuses();
  }, []);

  const handleSendQuickReminder = async (row) => {
    setError('');
    setSuccess('');
    try {
      // 1. Ask AI to draft the email
      const draftRes = await api.post('/api/ai/reminder', {
        name: row.name,
        email: row.employeeId, // Fallback for employeeId lookup
        deadline: new Date(campaign.deadline).toLocaleString()
      });

      const { subject, body } = draftRes.data.data;

      // 2. Dispatch simulated email
      await api.post('/api/ai/reminder/send', {
        email: row.employeeId + '@hirescheduler.com', // Simulate corp email from Employee ID
        subject,
        body
      });

      setSuccess(`AI generated reminder sent to ${row.name} (Simulated). Check server console!`);
      
      // Clear after 3 seconds
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError('Failed to generate or dispatch AI reminder email.');
    }
  };

  const handleDetailedReminder = (row) => {
    navigate('/admin/ai-reminders', {
      state: {
        name: row.name,
        email: row.employeeId + '@hirescheduler.com',
        deadline: new Date(campaign.deadline).toLocaleString()
      }
    });
  };

  const filtered = statuses.filter((row) => {
    const term = searchTerm.toLowerCase();
    return (
      row.name.toLowerCase().includes(term) ||
      row.employeeId.toLowerCase().includes(term)
    );
  });

  if (loading) {
    return (
      <div className="loader-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
        <AlertCircle size={48} style={{ color: 'var(--warning)', marginBottom: '16px' }} />
        <h3>No Campaigns Available</h3>
        <p style={{ marginTop: '8px' }}>Create an availability collection campaign first.</p>
      </div>
    );
  }

  // Count responses
  const total = statuses.length;
  const responded = statuses.filter(s => s.date1 !== '-').length;
  const pending = total - responded;
  const rate = total > 0 ? Math.round((responded / total) * 100) : 0;

  return (
    <div className="animate-fade">
      {/* Header Info */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: '32px',
        flexWrap: 'wrap',
        gap: '16px' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Eye size={32} style={{ color: 'var(--primary)' }} />
          <div>
            <h2>Monitor Availability Responses</h2>
            <p>Active Campaign: <strong style={{ color: 'var(--primary)' }}>{campaign.name}</strong></p>
          </div>
        </div>

        <button onClick={fetchCampaignAndStatuses} className="btn btn-secondary" style={{ height: '40px' }}>
          <RefreshCw size={16} /> Refresh Statuses
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Stats Overview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        <div className="card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Pool Size</span>
            <h3 style={{ fontSize: '1.5rem', marginTop: '2px' }}>{total} staff</h3>
          </div>
        </div>
        <div className="card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--success)' }}>Responded Count</span>
            <h3 style={{ fontSize: '1.5rem', marginTop: '2px', color: 'var(--success)' }}>{responded} staff</h3>
          </div>
        </div>
        <div className="card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--warning)' }}>Pending Submissions</span>
            <h3 style={{ fontSize: '1.5rem', marginTop: '2px', color: 'var(--warning)' }}>{pending} staff</h3>
          </div>
        </div>
        <div className="card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>Participation Rate</span>
            <h3 style={{ fontSize: '1.5rem', marginTop: '2px', color: 'var(--primary)' }}>{rate}%</h3>
          </div>
        </div>
      </div>

      {/* Searchable Listing Table */}
      <div className="card table-card">
        <div className="table-header-bar">
          <h3>Submission Status Board</h3>
          <div className="table-actions">
            <div style={{ position: 'relative', width: '260px' }}>
              <input
                type="text"
                placeholder="Search staff members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '40px', height: '40px' }}
              />
              <Search size={16} style={{ 
                position: 'absolute', 
                left: '14px', 
                top: '12px', 
                color: 'var(--text-secondary)' 
              }} />
            </div>
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Interviewer Name</th>
                <th>Employee ID</th>
                <th>Submission Status</th>
                <th>Dates Declared</th>
                <th style={{ textAlign: 'right' }}>Reminder Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((row) => {
                  const hasSubmitted = row.date1 !== '-';
                  return (
                    <tr key={row.employeeId}>
                      <td style={{ fontWeight: '600' }}>{row.name}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{row.employeeId}</td>
                      <td>
                        <span className={`badge ${hasSubmitted ? 'badge-low' : 'badge-medium'}`} style={{ fontSize: '0.65rem' }}>
                          {hasSubmitted ? 'Responded' : 'Pending'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>
                        {hasSubmitted ? (
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {row.date1 !== '-' && <span style={{ backgroundColor: '#EEF2F6', padding: '2px 8px', borderRadius: '4px' }}>{row.date1}</span>}
                            {row.date2 !== '-' && <span style={{ backgroundColor: '#EEF2F6', padding: '2px 8px', borderRadius: '4px' }}>{row.date2}</span>}
                            {row.date3 !== '-' && <span style={{ backgroundColor: '#EEF2F6', padding: '2px 8px', borderRadius: '4px' }}>{row.date3}</span>}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)' }}>Awaiting choices</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {!hasSubmitted ? (
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => handleSendQuickReminder(row)}
                              className="btn btn-secondary btn-sm"
                              style={{ 
                                padding: '6px 12px', 
                                height: '32px', 
                                fontSize: '0.75rem',
                                color: 'var(--primary)' 
                              }}
                              title="Instant Automated Send"
                            >
                              <Mail size={12} /> Send AI Email
                            </button>
                            <button
                              onClick={() => handleDetailedReminder(row)}
                              className="btn btn-primary btn-sm"
                              style={{ padding: '6px 12px', height: '32px', fontSize: '0.75rem' }}
                              title="Preview and Customize Draft"
                            >
                              Edit Draft
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                            <CheckCircle size={14} /> Completed
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                    No participant statuses matched your search filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
