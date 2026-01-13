import React, { useState, useEffect } from 'react';
import { dashboardApi } from '../services/api/dashboard';

const Icons = {
  car: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 11l1.5-4.5a2 2 0 0 1 1.9-1.5h7.2a2 2 0 0 1 1.9 1.5L19 11"/><path d="M3 17h1a1 1 0 0 0 1-1v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3a1 1 0 0 0 1 1h1"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="16.5" cy="17.5" r="1.5"/></svg>,
  route: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/></svg>,
  fuel: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 22V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v17"/><path d="M15 12h2a2 2 0 0 1 2 2v5a2 2 0 0 0 4 0V9.83a2 2 0 0 0-.59-1.42L18 4"/><path d="M6 12h6"/></svg>,
  clock: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  alert: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  user: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  logout: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  download: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  location: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  speedometer: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>,
  tire: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/></svg>,
  refresh: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
  return: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>,
  tasks: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  bell: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
};

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('pl-PL');
};

function TaskItem({ task, onToggle }) {
  return (
    <div className="vp-task-item">
      <label className="vp-task-checkbox">
        <input 
          type="checkbox" 
          checked={task.status === 'completed'} 
          onChange={() => onToggle(task.id, task.status === 'completed' ? 'pending' : 'completed')}
        />
        <span className="vp-task-checkbox__mark">{Icons.check}</span>
      </label>
      <span className={`vp-task-item__label ${task.status === 'completed' ? 'vp-task-item__label--done' : ''}`}>
        {task.label}
      </span>
    </div>
  );
}

function Reminder({ reminder }) {
  const severityClass = reminder.severity === 'critical' ? 'danger' : reminder.severity === 'warning' ? 'warning' : 'info';
  return (
    <div className={`vp-alert-pill vp-alert-pill--${severityClass}`}>
      <div className="vp-alert-pill__icon">{Icons.bell}</div>
      <div className="vp-alert-pill__content">
        <p className="vp-alert-pill__title">Przypomnienie</p>
        <p className="vp-alert-pill__desc">{reminder.message}</p>
      </div>
    </div>
  );
}

export default function EmployeeDashboard({ data, user, onLogout, showLogoutButton = true }) {
  const [localData, setLocalData] = useState(data);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateForm, setUpdateForm] = useState({ mileage: '', energyLevel: '' });
  const [reportLoading, setReportLoading] = useState(false);
  const [reportProgress, setReportProgress] = useState(null);

  useEffect(() => {
    setLocalData(data);
  }, [data]);

  if (!localData) return null;

  const trips = localData.tripLogs || localData.trips || [];
  const fuelLogs = localData.fuelLogs || [];
  const reminders = localData.reminders || [];

  const handleTaskToggle = async (taskId, newStatus) => {
    try {
      await dashboardApi.updateTaskStatus({ task_id: taskId, status: newStatus });
      const newTasks = localData.assignment.tasks.map(t => 
        t.id === taskId ? { ...t, status: newStatus } : t
      );
      setLocalData({
        ...localData,
        assignment: { ...localData.assignment, tasks: newTasks }
      });
    } catch (error) {
      console.error("Failed to update task", error);
    }
  };

  const handleReturnVehicle = async () => {
    if (!window.confirm("Czy na pewno chcesz zwrócić pojazd?")) return;
    try {
      await dashboardApi.returnVehicle();
      setLocalData({ ...localData, assignment: null });
    } catch (error) {
      console.error("Failed to return vehicle", error);
    }
  };

  const handleDownloadReport = async () => {
    setReportLoading(true);
    setReportProgress({ status: 'STARTING', progress: 0, message: 'Rozpoczynam generowanie...' });
    try {
      const blob = await dashboardApi.generateReportAsync(
        'trips',
        null,
        null,
        (progress) => setReportProgress(progress)
      );
      
      setReportProgress({ status: 'DOWNLOADING', progress: 100, message: 'Pobieranie...' });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `raport-przejazdy-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setReportProgress(null);
    } catch (error) {
      console.error("Failed to download report", error);
      alert(error.message || "Nie udało się pobrać raportu. Spróbuj ponownie później.");
      setReportProgress(null);
    } finally {
      setReportLoading(false);
    }
  };

  const openUpdateModal = () => {
    if (localData.assignment) {
      setUpdateForm({
        mileage: localData.assignment.vehicle.mileage,
        energyLevel: localData.assignment.vehicle.battery ?? localData.assignment.vehicle.fuel_level ?? 0
      });
      setShowUpdateModal(true);
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        mileage: updateForm.mileage,
        battery: Number(updateForm.energyLevel),
      };
      await dashboardApi.updateVehicleStatus(payload);
      setShowUpdateModal(false);
      setLocalData({
        ...localData,
        assignment: {
          ...localData.assignment,
          vehicle: {
            ...localData.assignment.vehicle,
            mileage: updateForm.mileage,
            battery: parseInt(updateForm.energyLevel, 10)
          }
        }
      });
    } catch (error) {
      console.error("Failed to update vehicle status", error);
    }
  };

  return (
    <div className="section-shell p-4 p-lg-5 dashboard-section">
      <div className="vp-dashboard-header">
        <div className="vp-dashboard-header__info">
          <div className="vp-dashboard-header__badge">Panel pracownika</div>
          <h2 className="vp-dashboard-header__title">
            Hej {(user.full_name || user.name || "").split(" ")[0]}, oto Twój dzień
          </h2>
          <span className="vp-dashboard-header__subtitle">Przydzielony pojazd oraz zadania</span>
        </div>
        <div className="vp-dashboard-header__actions">
          <div className="vp-user-badge">
            <div className="vp-user-badge__avatar">
              {user.avatar ? (
                <img src={user.avatar} alt={user.full_name || user.name} />
              ) : (
                Icons.user
              )}
            </div>
            <div className="vp-user-badge__info">
              <span className="vp-user-badge__name">{user.full_name || user.name}</span>
              <span className="vp-user-badge__role">Kierowca</span>
            </div>
          </div>
          {showLogoutButton && (
            <button className="vp-btn vp-btn--outline" onClick={onLogout}>
              {Icons.logout} Wyloguj
            </button>
          )}
        </div>
      </div>

      <div className="row g-3">
        <div className="col-12 col-xl-5">
          <div className="vp-panel vp-panel--full">
            <div className="vp-panel__header">
              <h3 className="vp-panel__title">{Icons.car} Przydzielony pojazd</h3>
            </div>
            {localData.assignment ? (
              <div className="vp-vehicle-card">
                <div className="vp-vehicle-card__header">
                  <div className="vp-vehicle-card__avatar">
                    {Icons.car}
                  </div>
                  <div className="vp-vehicle-card__info">
                    <span className="vp-vehicle-card__id">{localData.assignment.vehicle.id}</span>
                    <h4 className="vp-vehicle-card__model">{localData.assignment.vehicle.model}</h4>
                  </div>
                  <span className="vp-chip">VIN: {localData.assignment.vehicle.vin.slice(-6)}</span>
                </div>
                
                <div className="vp-vehicle-stats">
                  <div className="vp-vehicle-stats__item">
                    <span className="vp-vehicle-stats__icon">{Icons.speedometer}</span>
                    <div>
                      <span className="vp-vehicle-stats__label">Przebieg</span>
                      <span className="vp-vehicle-stats__value">{localData.assignment.vehicle.mileage}</span>
                    </div>
                  </div>
                  <div className="vp-vehicle-stats__item">
                    <span className="vp-vehicle-stats__icon">{Icons.fuel}</span>
                    <div>
                      <span className="vp-vehicle-stats__label">
                        {(localData.assignment.vehicle.fuel_type === 'electric' || localData.assignment.vehicle.fuel_type === 'hybrid') ? 'Bateria' : 'Paliwo'}
                      </span>
                      <div className="vp-energy-display">
                        <div className="vp-energy-bar" style={{ width: '100%' }}>
                          <div 
                            className={`vp-energy-bar__fill vp-energy-bar__fill--${(localData.assignment.vehicle.battery ?? localData.assignment.vehicle.fuel_level ?? 0) > 50 ? 'high' : (localData.assignment.vehicle.battery ?? localData.assignment.vehicle.fuel_level ?? 0) > 20 ? 'medium' : 'low'}`}
                            style={{ width: `${localData.assignment.vehicle.battery ?? localData.assignment.vehicle.fuel_level ?? 0}%` }}
                          ></div>
                        </div>
                        <span className="vp-energy-label">{localData.assignment.vehicle.battery ?? localData.assignment.vehicle.fuel_level ?? 0}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="vp-vehicle-stats__item">
                    <span className="vp-vehicle-stats__icon">{Icons.tire}</span>
                    <div>
                      <span className="vp-vehicle-stats__label">Ciśnienie opon</span>
                      <span className="vp-status vp-status--success">
                        <span className="vp-status__dot"></span>
                        {localData.assignment.vehicle.tirePressure}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="vp-vehicle-actions">
                  <button className="vp-btn vp-btn--primary" onClick={openUpdateModal}>
                    {Icons.refresh} Aktualizuj status
                  </button>
                  <button className="vp-btn vp-btn--danger" onClick={handleReturnVehicle}>
                    {Icons.return} Zwróć pojazd
                  </button>
                </div>

                <div className="vp-divider"></div>
                
                <div className="vp-tasks-section">
                  <div className="vp-tasks-section__header">
                    <span className="vp-tasks-section__icon">{Icons.tasks}</span>
                    <span className="vp-tasks-section__title">Dzisiejsze zadania</span>
                    <span className="vp-chip">{localData.assignment.tasks.filter(t => t.status === 'completed').length}/{localData.assignment.tasks.length}</span>
                  </div>
                  <div className="vp-tasks-list">
                    {localData.assignment.tasks.map((task) => (
                      <TaskItem key={task.id} task={task} onToggle={handleTaskToggle} />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="vp-empty-state">
                <div className="vp-empty-state__icon">{Icons.car}</div>
                <p className="vp-empty-state__title">Brak przydzielonego pojazdu</p>
                <p className="vp-empty-state__desc">Skontaktuj się z administratorem.</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="col-12 col-xl-7 d-flex flex-column gap-3">
          <div className="vp-panel">
            <div className="vp-panel__header">
              <h3 className="vp-panel__title">{Icons.route} Historia tras</h3>
              <div className="d-flex gap-2 align-items-center">
                {reportProgress && (
                  <span className="vp-hint">
                    {reportProgress.message} {reportProgress.progress > 0 && `(${reportProgress.progress}%)`}
                  </span>
                )}
                <button 
                  className="vp-btn vp-btn--outline"
                  onClick={handleDownloadReport}
                  disabled={reportLoading}
                >
                  {reportLoading ? (
                    <>
                      <span className="vp-spinner"></span>
                      {reportProgress?.progress || 0}%
                    </>
                  ) : (
                    <>{Icons.download} Raport PDF</>
                  )}
                </button>
              </div>
            </div>
            <div className="vp-table-wrapper">
              <table className="vp-table">
                <thead>
                  <tr>
                    <th>Pojazd / Trasa</th>
                    <th>Dystans</th>
                    <th>Koszt paliwa</th>
                    <th>Notatka</th>
                  </tr>
                </thead>
                <tbody>
                  {trips.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center vp-hint" style={{ padding: '24px' }}>
                        Brak zapisanych przejazdów.
                      </td>
                    </tr>
                  )}
                  {trips.map((trip) => (
                    <tr key={trip.id} className="vp-table-row">
                      <td>
                        <span style={{ fontWeight: 600, fontSize: '0.82rem' }}>{trip.vehicle_label || trip.route_label || 'Nieznana trasa'}</span>
                      </td>
                      <td style={{ fontSize: '0.82rem' }}>{trip.distance_km ? `${trip.distance_km} km` : '—'}</td>
                      <td style={{ fontSize: '0.82rem' }}>{trip.fuel_cost ? `${trip.fuel_cost} zł` : '—'}</td>
                      <td className="vp-hint">{trip.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="vp-panel">
            <div className="vp-panel__header">
              <h3 className="vp-panel__title">{Icons.fuel} Tankowania</h3>
              <span className="vp-status vp-status--success">
                <span className="vp-status__dot"></span>
                {fuelLogs.length} wpisów
              </span>
            </div>
            <div className="d-flex flex-column gap-2">
              {fuelLogs.length === 0 && <span className="vp-hint">Brak tankowań</span>}
              {fuelLogs.map((log) => (
                <div key={log.id} className="vp-fuel-card">
                  <div className="vp-fuel-card__header">
                    <div>
                      <span className="vp-fuel-card__label">{log.vehicle_label || 'Pojazd'}</span>
                      <span className="vp-fuel-card__date">{Icons.clock} {formatDate(log.created_at)}</span>
                    </div>
                    <span className="vp-fuel-card__cost">{log.total_cost ? `${log.total_cost} zł` : '—'}</span>
                  </div>
                  <div className="vp-fuel-card__meta">
                    <span>{Icons.fuel} {log.liters ? `${log.liters} L` : '—'}</span>
                    <span>{Icons.location} {log.station || 'Stacja nieznana'}</span>
                    {log.odometer && <span>{log.odometer} km</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="vp-panel">
            <div className="vp-panel__header">
              <h3 className="vp-panel__title">{Icons.bell} Przypomnienia</h3>
            </div>
            <div className="d-flex flex-column gap-2">
              {reminders.length === 0 && <span className="vp-hint">Brak przypomnień</span>}
              {reminders.map((reminder) => (
                <Reminder key={reminder.id} reminder={reminder} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {showUpdateModal && (
        <div className="vp-modal-overlay">
          <div className="vp-modal">
            <div className="vp-modal__header">
              <h5 className="vp-modal__title">{Icons.refresh} Aktualizuj status pojazdu</h5>
              <button className="vp-modal__close" onClick={() => setShowUpdateModal(false)}>×</button>
            </div>
            <form onSubmit={handleUpdateStatus}>
              <div className="vp-modal__body">
                <div className="vp-form-group">
                  <label className="vp-label">Przebieg</label>
                  <input 
                    type="text" 
                    className="vp-input" 
                    value={updateForm.mileage} 
                    onChange={(e) => setUpdateForm({...updateForm, mileage: e.target.value})}
                    placeholder="np. 125000 km"
                  />
                </div>
                <div className="vp-form-group">
                  <label className="vp-label">Poziom baterii / paliwa (%)</label>
                  <input 
                    type="number" 
                    className="vp-input" 
                    min="0" 
                    max="100"
                    value={updateForm.energyLevel} 
                    onChange={(e) => setUpdateForm({...updateForm, energyLevel: e.target.value})}
                    placeholder="0-100"
                  />
                </div>
              </div>
              <div className="vp-modal__footer">
                <button type="button" className="vp-btn vp-btn--outline" onClick={() => setShowUpdateModal(false)}>Anuluj</button>
                <button type="submit" className="vp-btn vp-btn--primary">Zapisz</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
