import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { Clock, Check, Calendar, AlertCircle, Save } from 'lucide-react';

export default () => {
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState(null);
  const [selectedDateIds, setSelectedDateIds] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchCampaignAndPreferences = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch active campaign details
      const campaignRes = await api.get('/api/interviewer/active-campaign');
      const active = campaignRes.data.data;
      setCampaign(active);

      // Fetch existing selections for this campaign
      const selectionsRes = await api.get(`/api/interviewer/availability/${active.id}`);
      setSelectedDateIds(selectionsRes.data.data);

      setLoading(false);
    } catch (err) {
      if (err.response?.status === 404) {
        setCampaign(null);
      } else {
        setError('Failed to fetch availability campaign configurations.');
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaignAndPreferences();
  }, []);

  const handleCardToggle = (id) => {
    setError('');
    setSuccess('');
    
    const isSelected = selectedDateIds.includes(id);
    const dateObj = campaign.dates.find(d => d.id === id);

    // Rule 2: Cannot select fully booked dates
    if (!isSelected && dateObj.remainingSlots === 0) {
      setError(`Selection blocked. Date ${dateObj.date} is fully booked.`);
      return;
    }

    if (isSelected) {
      // Remove
      setSelectedDateIds(selectedDateIds.filter(dId => dId !== id));
    } else {
      // Rule 1: Cannot exceed maximum selectable dates limit
      if (selectedDateIds.length >= campaign.max_selectable_dates) {
        setError(`Selection blocked. You cannot select more than ${campaign.max_selectable_dates} dates.`);
        return;
      }
      // Add
      setSelectedDateIds([...selectedDateIds, id]);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaveLoading(true);

    try {
      await api.post('/api/interviewer/availability', {
        campaignId: campaign.id,
        dateIds: selectedDateIds
      });

      setSuccess('Your interview availability dates have been saved successfully!');
      
      // Refresh statistics
      const campaignRes = await api.get('/api/interviewer/active-campaign');
      setCampaign(campaignRes.data.data);

      setSaveLoading(false);

      // Redirect home after 1.5 seconds
      setTimeout(() => {
        navigate('/interviewer');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit availability selections.');
      setSaveLoading(false);
    }
  };

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
        <p style={{ marginTop: '8px' }}>There are no active availability collection drives running at this time.</p>
      </div>
    );
  }

  const deadlinePassed = new Date(campaign.deadline) < new Date();

  return (
    <div className="animate-fade" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Header Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
        <Calendar size={32} style={{ color: 'var(--primary)' }} />
        <div>
          <h2>Submit Interview Availability</h2>
          <p>Campaign: <strong style={{ color: 'var(--primary)' }}>{campaign.name}</strong></p>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {deadlinePassed && (
        <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Clock size={20} />
          <strong>Submission Closed:</strong> The deadline to select availability slots was {new Date(campaign.deadline).toLocaleString()}. Edits are locked.
        </div>
      )}

      {/* Selector Grid of Cards */}
      <div className="dates-selector-grid">
        {campaign.dates.map((d) => {
          const isSelected = selectedDateIds.includes(d.id);
          const isFullyBooked = d.remainingSlots === 0;
          
          return (
            <div
              key={d.id}
              onClick={() => !deadlinePassed && handleCardToggle(d.id)}
              className={`card date-selection-card ${isSelected ? 'selected' : ''} ${isFullyBooked && !isSelected ? 'disabled' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '20px 24px',
                pointerEvents: deadlinePassed ? 'none' : 'auto'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '1.05rem', fontWeight: '700', color: isSelected ? 'var(--primary)' : 'var(--text-primary)' }}>
                  {d.date}
                </span>
                
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {isFullyBooked ? (
                    <strong style={{ color: 'var(--danger)' }}>Fully Booked</strong>
                  ) : (
                    <span>Remaining Slots: <strong>{d.remainingSlots}</strong></span>
                  )}
                </span>
              </div>

              {/* Checkbox indicator */}
              <div className="card-select-checkbox">
                {isSelected && <Check size={14} strokeWidth={3} />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Slots Policy Indicator */}
      <div className="card" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '32px',
        backgroundColor: 'var(--bg)',
        border: '1px dashed var(--border)',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={18} style={{ color: 'var(--primary)' }} />
          <span style={{ fontSize: '0.9rem' }}>
            Selected: <strong>{selectedDateIds.length}</strong> / {campaign.max_selectable_dates} maximum slots
          </span>
        </div>

        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Deadline: {new Date(campaign.deadline).toLocaleString()}
        </span>
      </div>

      {/* Save Button */}
      {!deadlinePassed && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
          <button
            onClick={() => navigate('/interviewer')}
            className="btn btn-secondary"
            style={{ height: '48px' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saveLoading}
            className="btn btn-primary"
            style={{ height: '48px', border: 'none' }}
          >
            <Save size={16} /> {saveLoading ? 'Saving changes...' : 'Save Availability'}
          </button>
        </div>
      )}

    </div>
  );
};
