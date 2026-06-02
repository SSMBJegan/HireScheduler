import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { FileSpreadsheet, Download, RefreshCw, AlertCircle, Users, CalendarRange } from 'lucide-react';

export default () => {
  const [campaign, setCampaign] = useState(null);
  const [activeTab, setActiveTab] = useState('availability'); // 'availability', 'summary'
  
  // Data Matrices
  const [availabilityReport, setAvailabilityReport] = useState([]);
  const [summaryReport, setSummaryReport] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReports = async () => {
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

      // Fetch availability list
      const availRes = await api.get(`/api/reports/availability?campaignId=${latest.id}`);
      setAvailabilityReport(availRes.data.data);

      // Fetch date summary list
      const summaryRes = await api.get(`/api/reports/summary?campaignId=${latest.id}`);
      setSummaryReport(summaryRes.data.data);

      setLoading(false);
    } catch (err) {
      setError('Failed to fetch operational report sheets.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleExport = (format) => {
    if (!campaign) return;
    
    // Resolve correct dynamic backend base URL for development and production
    const backendUrl = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || 'https://hirescheduler-backend.onrender.com');
    
    // Construct direct export API download URL path
    const url = `${backendUrl}/api/reports/export?reportType=${activeTab}&format=${format}&campaignId=${campaign.id}`;
    
    // Create virtual temporary element to trigger immediate native download
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${activeTab}_report_${campaign.id}.${format === 'csv' ? 'csv' : 'xls'}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        <h3>No Reports Available</h3>
        <p style={{ marginTop: '8px' }}>Create an availability campaign and collect responses to view report matrices.</p>
      </div>
    );
  }

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
          <FileSpreadsheet size={32} style={{ color: 'var(--primary)' }} />
          <div>
            <h2>Hiring Availability Reports</h2>
            <p>Campaign: <strong style={{ color: 'var(--primary)' }}>{campaign.name}</strong></p>
          </div>
        </div>

        <button onClick={fetchReports} className="btn btn-secondary" style={{ height: '40px' }}>
          <RefreshCw size={16} /> Refresh Reports
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Tabs Selector Navigation */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('availability')}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: 'none',
            fontSize: '0.95rem',
            fontWeight: '600',
            cursor: 'pointer',
            color: activeTab === 'availability' ? 'var(--primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'availability' ? '3px solid var(--primary)' : '3px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Users size={16} /> Availability Matrix Report
        </button>
        <button
          onClick={() => setActiveTab('summary')}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: 'none',
            fontSize: '0.95rem',
            fontWeight: '600',
            cursor: 'pointer',
            color: activeTab === 'summary' ? 'var(--primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'summary' ? '3px solid var(--primary)' : '3px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <CalendarRange size={16} /> Date Selection Summary
        </button>
      </div>

      {/* Export Toolbar actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '20px' }}>
        <button
          onClick={() => handleExport('csv')}
          className="btn btn-secondary btn-sm"
          style={{ height: '38px', borderColor: 'var(--primary)', color: 'var(--primary)', fontWeight: '600' }}
        >
          <Download size={14} /> Export to CSV
        </button>
        <button
          onClick={() => handleExport('excel')}
          className="btn btn-primary btn-sm"
          style={{ height: '38px', backgroundColor: 'var(--secondary)' }}
        >
          <Download size={14} /> Export to Excel
        </button>
      </div>

      {/* Conditional Render Matrix tables */}
      <div className="card table-card animate-fade">
        {activeTab === 'availability' ? (
          <div>
            <div className="table-header-bar">
              <h3>Interviewer Availability Allocation Sheets</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Standard reporting matrix</span>
            </div>
            
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Interviewer Name</th>
                    <th>Employee ID</th>
                    <th>Date Option 1</th>
                    <th>Date Option 2</th>
                    <th>Date Option 3</th>
                  </tr>
                </thead>
                <tbody>
                  {availabilityReport.length > 0 ? (
                    availabilityReport.map((row) => (
                      <tr key={row.employeeId}>
                        <td style={{ fontWeight: '600' }}>{row.name}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{row.employeeId}</td>
                        <td>{row.date1}</td>
                        <td>{row.date2}</td>
                        <td>{row.date3}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                        No interviewer selection logs logged for this campaign yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div>
            <div className="table-header-bar">
              <h3>Interview Date Summary Slots</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Daily participant logs</span>
            </div>
            
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '220px' }}>Interview Date</th>
                    <th>Allocated Interviewers Pool</th>
                  </tr>
                </thead>
                <tbody>
                  {summaryReport.length > 0 ? (
                    summaryReport.map((row) => (
                      <tr key={row.date}>
                        <td style={{ fontWeight: '600', color: 'var(--primary)' }}>{row.date}</td>
                        <td style={{ fontWeight: '500', fontSize: '0.85rem' }}>{row.interviewers}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                        No date allocations configured.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
