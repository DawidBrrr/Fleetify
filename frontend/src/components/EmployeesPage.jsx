import React, { useState, useEffect } from 'react';
import { dashboardApi } from '../services/api/dashboard';

const PRESENCE_UI = {
  zalogowany: { label: 'Zalogowany', className: 'success' },
  dostepny: { label: 'Dostępny', className: 'info' },
  niedostepny: { label: 'Niedostępny', className: 'secondary' }
};

function PresenceBadge({ state }) {
  if (!state) {
    return <span className="badge bg-light text-dark">Brak danych</span>;
  }
  const mapping = PRESENCE_UI[state] || { label: state, className: 'secondary' };
  return <span className={`badge bg-${mapping.className}`}>{mapping.label}</span>;
}

function EmployeeCard({ employee, onAssign }) {
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
        <div className="d-flex justify-content-between align-items-center mb-3 gap-2 flex-wrap">
          <span className={`badge bg-${employee.status === 'active' ? 'success' : 'secondary'}`}>
            {employee.status === 'active' ? 'Aktywny' : employee.status}
          </span>
          {employee.worker_profile && (
            <PresenceBadge state={employee.worker_profile.presence_state} />
          )}
          <small className="text-muted ms-auto">Dołączył: {new Date(employee.created_at).toLocaleDateString()}</small>
        </div>
        <button className="btn btn-sm btn-outline-primary w-100" onClick={() => onAssign(employee)}>
          <i className="bi bi-clipboard-check me-2"></i>
          Przydziel Zadania
        </button>
      </div>
    </div>
  );
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: ''
  });

  const [assignmentData, setAssignmentData] = useState({
    vehicle_id: '',
    tasks: []
  });
  const [newTask, setNewTask] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [employeesData, vehiclesData] = await Promise.all([
        dashboardApi.fetchEmployees(),
        dashboardApi.fetchVehicles()
      ]);
      setEmployees(employeesData);
      setVehicles(vehiclesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    try {
      await dashboardApi.inviteEmployee(formData);
      setShowForm(false);
      setFormData({ full_name: '', email: '' });
      loadData();
      alert('Pracownik zaproszony pomyślnie!');
    } catch (error) {
      console.error('Failed to invite employee:', error);
      alert('Nie udało się zaprosić pracownika');
    }
  };

  const handleAssignClick = (employee) => {
    setSelectedEmployee(employee);
    setAssignmentData({ vehicle_id: '', tasks: [] });
    setShowAssignForm(true);
  };

  const handleAddTask = () => {
    if (!newTask.trim()) return;
    const task = {
      id: assignmentData.tasks.length + 1,
      label: newTask,
      status: 'pending'
    };
    setAssignmentData({
      ...assignmentData,
      tasks: [...assignmentData.tasks, task]
    });
    setNewTask('');
  };

  const handleRemoveTask = (taskId) => {
    setAssignmentData({
      ...assignmentData,
      tasks: assignmentData.tasks.filter(t => t.id !== taskId)
    });
  };

  const handleAssignmentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEmployee || !assignmentData.vehicle_id) {
      alert('Wybierz pojazd');
      return;
    }

    const selectedVehicle = vehicles.find(v => v.id.toString() === assignmentData.vehicle_id);
    if (!selectedVehicle) return;

    const payload = {
      user_id: selectedEmployee.id,
      vehicle_id: selectedVehicle.id.toString(),
      vehicle_model: `${selectedVehicle.make} ${selectedVehicle.model}`,
      vehicle_vin: selectedVehicle.vin,
      vehicle_mileage: `${selectedVehicle.odometer} km`,
      vehicle_battery: selectedVehicle.battery_level || selectedVehicle.fuel_level || 0,
      vehicle_tire_pressure: "2.4 bar", // Mock for now as we don't track this yet
      tasks: assignmentData.tasks
    };

    try {
      await dashboardApi.assignTask(payload);
      setShowAssignForm(false);
      setSelectedEmployee(null);
      alert('Zadania przydzielone pomyślnie!');
    } catch (error) {
      console.error('Failed to assign tasks:', error);
      alert('Nie udało się przydzielić zadań');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (loading) return <div className="p-5 text-center">Ładowanie zespołu...</div>;

  return (
    <div className="section-shell p-4 p-lg-5 dashboard-section">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h3 mb-1">Zespół</h2>
          <p className="text-muted">Zarządzaj pracownikami</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          <i className="bi bi-person-plus-fill me-2"></i>
          Zaproś Członka
        </button>
      </div>

      {showForm && (
        <div className="card mb-4 border-0 shadow-sm bg-light">
          <div className="card-body p-4">
            <h5 className="mb-3">Zaproś Nowego Członka</h5>
            <form onSubmit={handleInviteSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Imię i Nazwisko</label>
                  <div className="input-group">
                    <span className="input-group-text"><i className="bi bi-person"></i></span>
                    <input
                      type="text"
                      className="form-control"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      required
                      placeholder="np. Jan Kowalski"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="np. jan@firma.pl"
                  />
                </div>
                <div className="col-12 text-end">
                  <button type="button" className="btn btn-link text-muted me-2" onClick={() => setShowForm(false)}>Anuluj</button>
                  <button type="submit" className="btn btn-success">Wyślij Zaproszenie</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAssignForm && selectedEmployee && (
        <div className="card mb-4 border-0 shadow-sm bg-light">
          <div className="card-body p-4">
            <h5 className="mb-3">Przydziel Zadania dla: {selectedEmployee.full_name}</h5>
            <form onSubmit={handleAssignmentSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Wybierz Pojazd</label>
                  <select 
                    className="form-select"
                    value={assignmentData.vehicle_id}
                    onChange={(e) => setAssignmentData({...assignmentData, vehicle_id: e.target.value})}
                    required
                  >
                    <option value="">-- Wybierz pojazd --</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.make} {v.model} ({v.license_plate})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-12">
                  <label className="form-label">Lista Zadań</label>
                  <div className="input-group mb-2">
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Nowe zadanie..." 
                      value={newTask}
                      onChange={(e) => setNewTask(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTask())}
                    />
                    <button className="btn btn-outline-secondary" type="button" onClick={handleAddTask}>Dodaj</button>
                  </div>
                  <ul className="list-group">
                    {assignmentData.tasks.map(task => (
                      <li key={task.id} className="list-group-item d-flex justify-content-between align-items-center">
                        {task.label}
                        <button type="button" className="btn-close btn-sm" onClick={() => handleRemoveTask(task.id)}></button>
                      </li>
                    ))}
                    {assignmentData.tasks.length === 0 && <li className="list-group-item text-muted fst-italic">Brak zadań</li>}
                  </ul>
                </div>
                <div className="col-12 text-end">
                  <button type="button" className="btn btn-link text-muted me-2" onClick={() => setShowAssignForm(false)}>Anuluj</button>
                  <button type="submit" className="btn btn-primary">Zapisz Przydział</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="row g-4">
        {employees.map(employee => (
          <div key={employee.id} className="col-md-6 col-lg-4">
            <EmployeeCard employee={employee} onAssign={handleAssignClick} />
          </div>
        ))}
        {employees.length === 0 && (
          <div className="col-12 text-center py-5 text-muted">
            <i className="bi bi-people display-4 mb-3 d-block"></i>
            Brak pracowników w zespole.
          </div>
        )}
      </div>
    </div>
  );
}
