import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, Calendar, HelpCircle, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

export default () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [campaign, setCampaign] = useState(null);
  const [hasResponded, setHasResponded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchInterviewerHome = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch active campaign details
      const campaignRes = await api.get('/api/interviewer/active-campaign');
      const active = campaignRes.data.data;
      setCampaign(active);

      // Check if user has already responded
      const selectionRes = await api.get(`/api/interviewer/availability/${active.id}`);
      setHasResponded(selectionRes.data.data.length > 0);

      setLoading(false);
    } catch (err) {
      if (err.response?.status === 404) {
        // No active campaigns
        setCampaign(null);
      } else {
        setError('Failed to fetch dashboard statuses.');
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviewerHome();
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
          <h1 style={{ margin: 0, fontSize: '1.8rem' }}>Welcome Back, {user.name}</h1>
          <p style={{ marginTop: '4px' }}>
            Empowering modern talent recruitment operations by declaring availability slots.
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
        
        {/* Campaign Info Card */}
        {campaign ? (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyBetween: 'space-between', gap: '20px' }}>
            <div>
              <span style={{ 
                fontSize: '0.75rem', 
                fontWeight: '700', 
                color: 'var(--primary)', 
                textTransform: 'uppercase',
                letterSpacing: '0.05em' 
              }}>
                Active Scheduling Campaign
              </span>
              <h3 style={{ fontSize: '1.4rem', marginTop: '6px' }}>{campaign.name}</h3>
              
              <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
                  <Calendar size={16} style={{ color: 'var(--text-secondary)' }} />
                  <span>Start Date: <strong>{campaign.start_date}</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
                  <Calendar size={16} style={{ color: 'var(--text-secondary)' }} />
                  <span>End Date: <strong>{campaign.end_date}</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: 'var(--danger)' }}>
                  <Clock size={16} />
                  <span>Deadline: <strong>{new Date(campaign.deadline).toLocaleString()}</strong></span>
                </div>
              </div>
            </div>

            <div style={{ 
              marginTop: '16px', 
              padding: '16px', 
              backgroundColor: 'var(--bg)', 
              borderRadius: 'var(--radius-sm)', 
              borderLeft: '4px solid var(--primary)',
              fontSize: '0.85rem'
            }}>
              📋 Campaign Policy: Select up to <strong>{campaign.max_selectable_dates} interview dates</strong> to complete your availability submission.
            </div>
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
            <Calendar size={48} style={{ color: 'var(--text-secondary)', marginBottom: '16px', opacity: 0.6 }} />
            <h3>No Active Campaigns</h3>
            <p style={{ marginTop: '8px' }}>HR has not launched an availability collection campaign at this time.</p>
          </div>
        )}

        {/* Response Status Card */}
        {campaign && (
          <div className="card" style={{ 
            borderLeft: `5px solid ${hasResponded ? 'var(--success)' : 'var(--warning)'}`,
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between',
            gap: '20px'
          }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
                Your Submission Status
              </span>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
                <div style={{ color: hasResponded ? 'var(--success)' : 'var(--warning)' }}>
                  {hasResponded ? <CheckCircle2 size={36} /> : <HelpCircle size={36} />}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem' }}>{hasResponded ? 'Submitted successfully' : 'Pending response'}</h3>
                  <p style={{ fontSize: '0.85rem', marginTop: '2px' }}>
                    {hasResponded ? 'Your scheduling dates have been recorded.' : 'Availability selection is outstanding.'}
                  </p>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '24px' }}>
              <button
                onClick={() => navigate('/interviewer/availability')}
                className="btn btn-primary"
                style={{ width: '100%', border: 'none' }}
              >
                {hasResponded ? 'Edit / Update Selections' : 'Select Availability Dates'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
