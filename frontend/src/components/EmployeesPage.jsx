import React, { useState, useEffect } from 'react';
import { dashboardApi } from '../services/api/dashboard';

function EmployeeCard({ employee }) {
  return (
    <div className="card h-100 shadow-sm border-0">
      <div className="card-body">
        <div className="d-flex align-items-center mb-3">
          <div className="bg-primary bg-opacity-10 rounded-circle p-3 me-3 text-primary">
            <i className="bi bi-person-fill h4 mb-0"></i>
          </div>
          <div>
            <h5 className="card-title mb-1">{employee.full_name}</h5>
            <p className="text-muted small mb-0">{employee.email}</p>
          </div>
        </div>
        <div className="d-flex justify-content-between align-items-center">
          <span className={`badge bg-${employee.status === 'active' ? 'success' : 'secondary'}`}>
            {employee.status}
          </span>
          <small className="text-muted">Joined: {new Date(employee.created_at).toLocaleDateString()}</small>
        </div>
      </div>
    </div>
  );
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: ''
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const data = await dashboardApi.fetchEmployees();
      setEmployees(data);
    } catch (error) {
      console.error('Failed to load employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dashboardApi.inviteEmployee(formData);
      setShowForm(false);
      setFormData({ full_name: '', email: '' });
      loadEmployees();
      alert('Employee invited successfully!');
    } catch (error) {
      console.error('Failed to invite employee:', error);
      alert('Failed to invite employee');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (loading) return <div className="p-5 text-center">Loading team...</div>;

  return (
    <div className="section-shell p-4 p-lg-5 dashboard-section">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h3 mb-1">Team Members</h2>
          <p className="text-muted">Manage your workforce</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          <i className="bi bi-person-plus-fill me-2"></i>
          Invite Member
        </button>
      </div>

      {showForm && (
        <div className="card mb-4 border-0 shadow-sm bg-light">
          <div className="card-body p-4">
            <h5 className="mb-3">Invite New Member</h5>
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Full Name</label>
                  <div className="input-group">
                    <span className="input-group-text"><i className="bi bi-person"></i></span>
                    <input
                      type="text"
                      className="form-control"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      required
                      placeholder="John Doe"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Email Address</label>
                  <div className="input-group">
                    <span className="input-group-text"><i className="bi bi-envelope"></i></span>
                    <input
                      type="email"
                      className="form-control"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="john@company.com"
                    />
                  </div>
                </div>
                <div className="col-12 text-end">
                  <button type="button" className="btn btn-link text-muted me-2" onClick={() => setShowForm(false)}>Cancel</button>
                  <button type="submit" className="btn btn-success">Send Invite</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="row g-4">
        {employees.map(employee => (
          <div key={employee.id} className="col-md-6 col-lg-4">
            <EmployeeCard employee={employee} />
          </div>
        ))}
        {employees.length === 0 && (
          <div className="col-12 text-center py-5 text-muted">
            <i className="bi bi-people display-4 mb-3 d-block"></i>
            No team members yet.
          </div>
        )}
      </div>
    </div>
  );
}
