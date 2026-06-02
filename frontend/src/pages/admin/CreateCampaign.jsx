import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { CalendarPlus, Plus, Trash2, CalendarRange, Clock, AlertTriangle } from 'lucide-react';

export default () => {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [deadline, setDeadline] = useState('');
  const [maxSelectableDates, setMaxSelectableDates] = useState(3);
  const [locations, setLocations] = useState('Office, Remote, Hybrid');
  
  // Custom date slots allocation array
  const [dates, setDates] = useState([
    { date: '', max_capacity: 20 }
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Add date option row
  const addDateRow = () => {
    setDates([...dates, { date: '', max_capacity: 20 }]);
  };

  // Remove date option row
  const removeDateRow = (index) => {
    const updated = dates.filter((_, idx) => idx !== index);
    setDates(updated);
  };

  // Edit fields on specific row
  const handleDateChange = (index, field, value) => {
    const updated = [...dates];
    updated[index][field] = value;
    setDates(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Basic date validations
    const emptyDates = dates.some(d => !d.date);
    if (emptyDates) {
      setError('Please fill in or remove all empty interview date configurations.');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        name,
        start_date: startDate,
        end_date: endDate,
        deadline,
        max_selectable_dates: parseInt(maxSelectableDates),
        locations: locations,
        dates: dates.map(d => ({ date: d.date, max_capacity: parseInt(d.max_capacity) }))
      };

      await api.post('/api/admin/campaigns', payload);
      setSuccess('Hiring Campaign registered successfully! Redirecting...');
      
      setTimeout(() => {
        navigate('/admin');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register Availability Campaign.');
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade" style={{ maxWidth: '800px', margin: '0 auto' }}>
      
      {/* Title Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
        <CalendarPlus size={32} style={{ color: 'var(--primary)' }} />
        <div>
          <h2>Create Availability Campaign</h2>
          <p>Configure automated scheduling collections for recruitment operations</p>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Campaign Name */}
          <div className="form-group">
            <label className="form-label">Campaign Name / Identifier</label>
            <input
              type="text"
              required
              placeholder="e.g. July Hiring Drive 2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input"
            />
          </div>

          {/* Start and End date limits */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Campaign Run-Start Date</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Campaign Run-End Date</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-row">
            {/* Submission Deadline */}
            <div className="form-group">
              <label className="form-label">Availability Submission Deadline</label>
              <input
                type="datetime-local"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="form-input"
              />
            </div>

            {/* Selection Limits */}
            <div className="form-group">
              <label className="form-label">Maximum Dates Selectable by Interviewer</label>
              <input
                type="number"
                required
                min={1}
                max={10}
                value={maxSelectableDates}
                onChange={(e) => setMaxSelectableDates(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          {/* Location Options */}
          <div className="form-group">
            <label className="form-label">Campaign Location Options (comma separated)</label>
            <input
              type="text"
              required
              placeholder="e.g. Office, Remote, Hybrid"
              value={locations}
              onChange={(e) => setLocations(e.target.value)}
              className="form-input"
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
              These choices will be displayed to interviewers for them to pick when choosing their available dates.
            </span>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '12px 0' }} />

          {/* Add Interview Dates Section */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CalendarRange size={18} /> Configure Interview Date Slots
                </h4>
                <p style={{ fontSize: '0.8rem', marginTop: '2px' }}>
                  Define which dates are open for interview slots and how many interviewers you need per day.
                </p>
              </div>

              <button
                type="button"
                onClick={addDateRow}
                className="btn btn-secondary btn-sm"
                style={{ borderStyle: 'dashed' }}
              >
                <Plus size={16} /> Add Date Row
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {dates.map((d, index) => (
                <div 
                  key={index} 
                  style={{ 
                    display: 'flex', 
                    gap: '16px', 
                    alignItems: 'center',
                    padding: '16px',
                    backgroundColor: 'var(--bg)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)'
                  }}
                  className="animate-fade"
                >
                  <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', minWidth: '24px' }}>
                    #{index + 1}
                  </span>

                  <div className="form-group" style={{ flex: 1.5, marginBottom: 0 }}>
                    <label className="form-label">Interview Date</label>
                    <input
                      type="date"
                      required
                      value={d.date}
                      onChange={(e) => handleDateChange(index, 'date', e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label className="form-label">Max Capacity (Staff Count)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={d.max_capacity}
                      onChange={(e) => handleDateChange(index, 'max_capacity', e.target.value)}
                      className="form-input"
                    />
                  </div>

                  {dates.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDateRow(index)}
                      className="btn btn-secondary btn-danger"
                      style={{ 
                        width: '42px', 
                        height: '42px', 
                        padding: 0, 
                        marginTop: '22px',
                        backgroundColor: '#FEE2E2',
                        border: 'none',
                        color: 'var(--danger)'
                      }}
                      title="Remove Row"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '12px 0' }} />

          {/* Form Actions */}
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'Creating...' : 'Register Hiring Campaign'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
