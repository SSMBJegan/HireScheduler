import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Users, Plus, Trash2, Search, Shield, User } from 'lucide-react';

export default () => {
  const [activeTab, setActiveTab] = useState('interviewers'); // 'interviewers', 'admins'
  const [searchTerm, setSearchTerm] = useState('');

  // Directories Data
  const [interviewers, setInterviewers] = useState([]);
  const [admins, setAdmins] = useState([]);

  // Form toggles
  const [showAddForm, setShowAddForm] = useState(false);

  // Form Fields - Interviewer
  const [employeeId, setEmployeeId] = useState('');
  const [interviewerName, setInterviewerName] = useState('');
  const [interviewerEmail, setInterviewerEmail] = useState('');

  // Form Fields - Admin
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');

  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch Interviewers
      const intvRes = await api.get('/api/admin/interviewers');
      setInterviewers(intvRes.data.data);

      // Fetch Admins
      const adminRes = await api.get('/api/admin/admins');
      setAdmins(adminRes.data.data);

      setLoading(false);
    } catch (err) {
      setError('Failed to refresh team directories.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateInterviewer = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFormLoading(true);

    try {
      const payload = { employeeId, name: interviewerName, email: interviewerEmail };
      await api.post('/api/admin/interviewers', payload);
      setSuccess(`Interviewer ${interviewerName} registered successfully!`);
      
      setEmployeeId('');
      setInterviewerName('');
      setInterviewerEmail('');
      setShowAddForm(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register interviewer.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFormLoading(true);

    try {
      const payload = { name: adminName, email: adminEmail };
      await api.post('/api/admin/admins', payload);
      setSuccess(`HR Administrator ${adminName} registered successfully!`);
      
      setAdminName('');
      setAdminEmail('');
      setShowAddForm(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register HR Admin.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteInterviewer = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove interviewer ${name}?`)) return;
    
    setError('');
    setSuccess('');
    try {
      await api.delete(`/api/admin/interviewers/${id}`);
      setSuccess(`Interviewer profile removed successfully.`);
      fetchData();
    } catch (err) {
      setError('Failed to remove interviewer profile.');
    }
  };

  const handleDeleteAdmin = async (id, email) => {
    if (email === 'admin@hirescheduler.com') {
      setError('Deletion blocked. The primary administrator account cannot be removed.');
      return;
    }

    if (!window.confirm(`Are you sure you want to remove HR Admin ${email}?`)) return;
    
    setError('');
    setSuccess('');
    try {
      await api.delete(`/api/admin/admins/${id}`);
      setSuccess(`HR Admin account removed successfully.`);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove HR Admin account.');
    }
  };

  // Search Filter Directories
  const filteredInterviewers = interviewers.filter(i => {
    const term = searchTerm.toLowerCase();
    return (
      i.name.toLowerCase().includes(term) ||
      i.employee_id.toLowerCase().includes(term) ||
      i.email.toLowerCase().includes(term)
    );
  });

  const filteredAdmins = admins.filter(a => {
    const term = searchTerm.toLowerCase();
    return (
      a.name.toLowerCase().includes(term) ||
      a.email.toLowerCase().includes(term)
    );
  });

  return (
    <div className="animate-fade">
      
      {/* Title Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: '32px',
        flexWrap: 'wrap',
        gap: '16px' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Users size={32} style={{ color: 'var(--primary)' }} />
          <div>
            <h2>Manage Team Directories</h2>
            <p>Maintain the directory of qualified interviewers and HR administrators</p>
          </div>
        </div>

        <button
          onClick={() => { setShowAddForm(!showAddForm); setError(''); setSuccess(''); }}
          className="btn btn-primary"
        >
          <Plus size={18} /> {activeTab === 'interviewers' ? 'Register Interviewer' : 'Register HR Admin'}
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Tabs Selection Bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '24px' }}>
        <button
          onClick={() => { setActiveTab('interviewers'); setShowAddForm(false); setSearchTerm(''); }}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: 'none',
            fontSize: '0.95rem',
            fontWeight: '600',
            cursor: 'pointer',
            color: activeTab === 'interviewers' ? 'var(--primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'interviewers' ? '3px solid var(--primary)' : '3px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <User size={16} /> Interviewers Directory
        </button>
        <button
          onClick={() => { setActiveTab('admins'); setShowAddForm(false); setSearchTerm(''); }}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: 'none',
            fontSize: '0.95rem',
            fontWeight: '600',
            cursor: 'pointer',
            color: activeTab === 'admins' ? 'var(--primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'admins' ? '3px solid var(--primary)' : '3px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Shield size={16} /> HR Administrators
        </button>
      </div>

      {/* Dynamic Forms Toggles */}
      {showAddForm && (
        <div className="card animate-fade" style={{ marginBottom: '32px', borderLeft: '4px solid var(--primary)' }}>
          {activeTab === 'interviewers' ? (
            <div>
              <h3 style={{ marginBottom: '20px' }}>Register New Interviewer</h3>
              <form onSubmit={handleCreateInterviewer}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                  <div className="form-group">
                    <label className="form-label">Employee ID</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. EMP100"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Interviewer Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Robert Oppenheimer"
                      value={interviewerName}
                      onChange={(e) => setInterviewerName(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Corporate Email</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. robert@hirescheduler.com"
                      value={interviewerEmail}
                      onChange={(e) => setInterviewerEmail(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                  <button type="button" onClick={() => setShowAddForm(false)} className="btn btn-secondary btn-sm">
                    Cancel
                  </button>
                  <button type="submit" disabled={formLoading} className="btn btn-primary btn-sm">
                    {formLoading ? 'Registering...' : 'Add Interviewer'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div>
              <h3 style={{ marginBottom: '20px' }}>Register New HR Administrator</h3>
              <form onSubmit={handleCreateAdmin}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                  <div className="form-group">
                    <label className="form-label">Administrator Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Richard Feynman"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Corporate Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. feynman@hirescheduler.com"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                  <button type="button" onClick={() => setShowAddForm(false)} className="btn btn-secondary btn-sm">
                    Cancel
                  </button>
                  <button type="submit" disabled={formLoading} className="btn btn-primary btn-sm">
                    {formLoading ? 'Registering...' : 'Add HR Admin'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Directory table */}
      <div className="card table-card">
        <div className="table-header-bar">
          <h3>
            {activeTab === 'interviewers' ? 'Interviewer Directory' : 'HR Administrator Registry'}
          </h3>
          <div className="table-actions">
            <div style={{ position: 'relative', width: '260px' }}>
              <input
                type="text"
                placeholder={activeTab === 'interviewers' ? "Search interviewers..." : "Search HR admins..."}
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

        {loading ? (
          <div className="loader-container">
            <div className="spinner"></div>
          </div>
        ) : activeTab === 'interviewers' ? (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Full Name</th>
                  <th>Email Address</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInterviewers.length > 0 ? (
                  filteredInterviewers.map((i) => (
                    <tr key={i.id}>
                      <td style={{ fontWeight: '600', color: 'var(--primary)' }}>{i.employee_id}</td>
                      <td style={{ fontWeight: '500' }}>{i.name}</td>
                      <td>{i.email}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => handleDeleteInterviewer(i.id, i.name)}
                          className="btn btn-secondary btn-sm btn-danger"
                          style={{ 
                            padding: '6px 12px', 
                            height: '32px',
                            backgroundColor: '#FEE2E2',
                            border: 'none',
                            color: 'var(--danger)'
                          }}
                          title="Delete Interviewer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                      No interviewer records matched your search parameters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Corporate Email Address</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAdmins.length > 0 ? (
                  filteredAdmins.map((a) => {
                    const isPrimaryAdmin = a.email === 'admin@hirescheduler.com';
                    return (
                      <tr key={a.id}>
                        <td style={{ fontWeight: '600' }}>{a.name}</td>
                        <td style={{ color: 'var(--primary)', fontWeight: '500' }}>{a.email}</td>
                        <td style={{ textAlign: 'right' }}>
                          {!isPrimaryAdmin ? (
                            <button
                              onClick={() => handleDeleteAdmin(a.id, a.email)}
                              className="btn btn-secondary btn-sm btn-danger"
                              style={{ 
                                padding: '6px 12px', 
                                height: '32px',
                                backgroundColor: '#FEE2E2',
                                border: 'none',
                                color: 'var(--danger)'
                              }}
                              title="Delete Admin account"
                            >
                              <Trash2 size={14} />
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic', paddingRight: '8px' }}>
                              Primary System Account
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                      No HR Administrator accounts matched your search parameters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
