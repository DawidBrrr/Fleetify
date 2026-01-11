import React, { useState, useEffect } from 'react';
import { dashboardApi } from '../services/api/dashboard';

const Icons = {
  user: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  userPlus: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>,
  userMinus: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="23" y1="11" x2="17" y2="11"/></svg>,
  car: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 11l1.5-4.5a2 2 0 0 1 1.9-1.5h7.2a2 2 0 0 1 1.9 1.5L19 11"/><path d="M3 17h1a1 1 0 0 0 1-1v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3a1 1 0 0 0 1 1h1"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="16.5" cy="17.5" r="1.5"/></svg>,
  tasks: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  mail: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  plus: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  x: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  calendar: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
};

const PRESENCE_UI = {
  zalogowany: { label: 'Zalogowany', className: 'success' },
  dostepny: { label: 'Dostępny', className: 'info' },
  niedostepny: { label: 'Niedostępny', className: 'warning' }
};

function PresenceBadge({ state }) {
  if (!state) {
    return <span className="vp-status vp-status--warning"><span className="vp-status__dot"></span>Brak danych</span>;
  }
  const mapping = PRESENCE_UI[state] || { label: state, className: 'warning' };
  return (
    <span className={`vp-status vp-status--${mapping.className}`}>
      <span className="vp-status__dot"></span>
      {mapping.label}
    </span>
  );
}

function EmployeeCard({ employee, onAssign, onRemove }) {
  return (
    <div className="vp-employee-card">
      <div className="vp-employee-card__header">
        <div className="vp-employee-card__avatar">
          {Icons.user}
        </div>
        <div className="vp-employee-card__info">
          <h5 className="vp-employee-card__name">{employee.full_name}</h5>
          <p className="vp-employee-card__email">{employee.email}</p>
        </div>
      </div>
      <div className="vp-employee-card__meta">
        <span className={`vp-status vp-status--${employee.status === 'active' ? 'success' : 'warning'}`}>
          <span className="vp-status__dot"></span>
          {employee.status === 'active' ? 'Aktywny' : employee.status}
        </span>
        {employee.worker_profile && (
          <PresenceBadge state={employee.worker_profile.presence_state} />
        )}
        <span className="vp-employee-card__date">
          {Icons.calendar}
          {new Date(employee.created_at).toLocaleDateString('pl-PL')}
        </span>
      </div>
      <div className="vp-employee-card__actions">
        <button
          className="vp-btn vp-btn--primary"
          onClick={() => onAssign(employee, 'vehicle')}
        >
          {Icons.car} Przydziel pojazd
        </button>
        <button
          className="vp-btn vp-btn--outline"
          onClick={() => onAssign(employee, 'tasks')}
        >
          {Icons.tasks} Zadania
        </button>
        <button
          className="vp-btn vp-btn--danger"
          onClick={() => onRemove(employee)}
        >
          {Icons.userMinus}
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
  const [assigningVehicle, setAssigningVehicle] = useState(false);
  const [savingTasks, setSavingTasks] = useState(false);
  const [assignmentMode, setAssignmentMode] = useState('vehicle');

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

  const handleAssignClick = (employee, mode = 'vehicle') => {
    setSelectedEmployee(employee);
    setAssignmentData({ vehicle_id: '', tasks: [] });
    setAssignmentMode(mode);
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

  const buildVehiclePayload = () => {
    const selectedVehicle = vehicles.find(v => v.id.toString() === assignmentData.vehicle_id);
    if (!selectedVehicle) return null;
    return {
      user_id: selectedEmployee.id,
      vehicle_id: selectedVehicle.id.toString(),
      vehicle_model: `${selectedVehicle.make} ${selectedVehicle.model}`,
      vehicle_vin: selectedVehicle.vin,
      vehicle_mileage: `${selectedVehicle.odometer} km`,
      vehicle_battery: selectedVehicle.battery_level || selectedVehicle.fuel_level || 0,
      vehicle_tire_pressure: "2.4 bar",
    };
  };

  const handleVehicleAssignment = async (e) => {
    e.preventDefault();
    if (!selectedEmployee || !assignmentData.vehicle_id) {
      alert('Wybierz pojazd');
      return;
    }
    const payload = buildVehiclePayload();
    if (!payload) return;
    setAssigningVehicle(true);
    try {
      await dashboardApi.assignVehicle(payload);
      alert('Pojazd przydzielony pomyślnie!');
      loadData();
    } catch (error) {
      console.error('Failed to assign vehicle:', error);
      alert('Nie udało się przydzielić pojazdu');
    } finally {
      setAssigningVehicle(false);
    }
  };

  const handleTasksAssignment = async (e) => {
    e.preventDefault();
    if (!selectedEmployee) {
      alert('Wybierz pracownika');
      return;
    }
    setSavingTasks(true);
    try {
      await dashboardApi.assignTasks({
        user_id: selectedEmployee.id,
        tasks: assignmentData.tasks,
      });
      alert('Zadania zapisane pomyślnie!');
    } catch (error) {
      console.error('Failed to assign tasks:', error);
      alert('Nie udało się zapisać zadań');
    } finally {
      setSavingTasks(false);
    }
  };

  const handleRemoveEmployee = async (employee) => {
    if (!window.confirm(`Czy na pewno chcesz usunąć ${employee.full_name} z zespołu?`)) {
      return;
    }
    try {
      await dashboardApi.removeEmployee(employee.id);
      alert('Pracownik został usunięty z zespołu.');
      if (selectedEmployee?.id === employee.id) {
        setShowAssignForm(false);
        setSelectedEmployee(null);
        setAssignmentMode('vehicle');
      }
      loadData();
    } catch (error) {
      console.error('Failed to remove employee:', error);
      alert('Nie udało się usunąć pracownika');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (loading) return <div className="vp-loading">Ładowanie zespołu...</div>;

  return (
    <div className="section-shell p-4 p-lg-5 dashboard-section">
      <div className="vp-dashboard-header">
        <div className="vp-dashboard-header__info">
          <div className="vp-dashboard-header__badge">Zarządzanie zespołem</div>
          <h2 className="vp-dashboard-header__title">Pracownicy</h2>
          <span className="vp-dashboard-header__subtitle">Zarządzaj członkami zespołu i przydzielaj zasoby</span>
        </div>
        <button 
          className="vp-btn vp-btn--primary"
          onClick={() => setShowForm(!showForm)}
        >
          {Icons.userPlus} Zaproś członka
        </button>
      </div>

      {showForm && (
        <div className="vp-form-card mb-4">
          <div className="vp-form-card__header vp-form-card__header--trip">
            <span className="vp-form-card__icon">{Icons.userPlus}</span>
            <span className="vp-form-card__title">Zaproś nowego członka</span>
          </div>
          <form onSubmit={handleInviteSubmit}>
            <div className="vp-grid vp-grid--2">
              <div className="vp-form-group">
                <label className="vp-label">Imię i nazwisko</label>
                <input
                  type="text"
                  className="vp-input"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                  placeholder="np. Jan Kowalski"
                />
              </div>
              <div className="vp-form-group">
                <label className="vp-label">Email</label>
                <input
                  type="email"
                  className="vp-input"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="np. jan@firma.pl"
                />
              </div>
            </div>
            <div className="vp-form-actions d-flex justify-content-end gap-2">
              <button type="button" className="vp-btn vp-btn--outline" onClick={() => setShowForm(false)}>Anuluj</button>
              <button type="submit" className="vp-btn vp-btn--success">{Icons.mail} Wyślij zaproszenie</button>
            </div>
          </form>
        </div>
      )}

      {showAssignForm && selectedEmployee && (
        <div className="vp-form-card mb-4">
          <div className="vp-form-card__header vp-form-card__header--manage">
            <span className="vp-form-card__icon">{Icons.user}</span>
            <span className="vp-form-card__title">Przydział dla: {selectedEmployee.full_name}</span>
          </div>
          <div className="vp-tab-group mb-4">
            <button
              type="button"
              className={`vp-tab ${assignmentMode === 'vehicle' ? 'vp-tab--active' : ''}`}
              onClick={() => setAssignmentMode('vehicle')}
            >
              {Icons.car} Pojazd
            </button>
            <button
              type="button"
              className={`vp-tab ${assignmentMode === 'tasks' ? 'vp-tab--active' : ''}`}
              onClick={() => setAssignmentMode('tasks')}
            >
              {Icons.tasks} Zadania
            </button>
          </div>
          <div className="row g-3">
            {assignmentMode === 'vehicle' && (
              <div className="col-12 col-lg-6">
                <form onSubmit={handleVehicleAssignment}>
                  <div className="vp-form-group">
                    <label className="vp-label">Wybierz pojazd</label>
                    <select 
                      className="vp-select"
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
                  <button type="submit" className="vp-btn vp-btn--primary w-100" disabled={assigningVehicle}>
                    {assigningVehicle ? 'Zapisywanie...' : <>{Icons.check} Zapisz przydział</>}
                  </button>
                </form>
              </div>
            )}
            {assignmentMode === 'tasks' && (
              <div className="col-12 col-lg-8">
                <form onSubmit={handleTasksAssignment}>
                  <div className="vp-form-group">
                    <label className="vp-label">Lista zadań</label>
                    <div className="vp-input-group">
                      <input 
                        type="text" 
                        className="vp-input" 
                        placeholder="Nowe zadanie..." 
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTask())}
                      />
                      <button className="vp-btn vp-btn--outline" type="button" onClick={handleAddTask}>
                        {Icons.plus}
                      </button>
                    </div>
                  </div>
                  <div className="vp-task-list mb-3">
                    {assignmentData.tasks.map(task => (
                      <div key={task.id} className="vp-task-item">
                        <span className="vp-task-item__label">{task.label}</span>
                        <button type="button" className="vp-task-item__remove" onClick={() => handleRemoveTask(task.id)}>
                          {Icons.x}
                        </button>
                      </div>
                    ))}
                    {assignmentData.tasks.length === 0 && (
                      <div className="vp-hint text-center py-3">Brak zadań — dodaj pierwsze zadanie powyżej</div>
                    )}
                  </div>
                  <button type="submit" className="vp-btn vp-btn--success" disabled={savingTasks}>
                    {savingTasks ? 'Zapisywanie...' : <>{Icons.check} Zapisz zadania</>}
                  </button>
                </form>
              </div>
            )}
          </div>
          <div className="text-end mt-3">
            <button
              type="button"
              className="vp-btn vp-btn--outline"
              onClick={() => {
                setShowAssignForm(false);
                setAssignmentMode('vehicle');
              }}
            >
              Zamknij
            </button>
          </div>
        </div>
      )}

      <div className="row g-3">
        {employees.map(employee => (
          <div key={employee.id} className="col-md-6 col-lg-4">
            <EmployeeCard employee={employee} onAssign={handleAssignClick} onRemove={handleRemoveEmployee} />
          </div>
        ))}
        {employees.length === 0 && (
          <div className="col-12">
            <div className="vp-empty-state">
              <div className="vp-empty-state__icon">{Icons.user}</div>
              <p className="vp-empty-state__title">Brak pracowników w zespole</p>
              <p className="vp-empty-state__desc">Zaproś pierwszego członka zespołu</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
