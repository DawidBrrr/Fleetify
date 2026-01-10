import React, { useState, useEffect } from 'react';
import { dashboardApi } from '../services/api/dashboard';

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('pl-PL');
};

function TaskItem({ task, onToggle }) {
  return (
    <li className="d-flex align-items-center gap-2">
      <input 
        type="checkbox" 
        className="form-check-input" 
        checked={task.status === 'completed'} 
        onChange={() => onToggle(task.id, task.status === 'completed' ? 'pending' : 'completed')}
      />
      <span className={task.status === 'completed' ? 'text-decoration-line-through text-muted' : ''}>
        {task.label}
      </span>
    </li>
  );
}

function Reminder({ reminder }) {
  return (
    <div className={`alert-pill alert-pill--${reminder.severity}`}>
      <strong className="me-2">Przypomnienie</strong>
      {reminder.message}
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
      <div className="dashboard-header mb-4">
        <div>
          <p className="text-uppercase text-muted small mb-1">Panel pracownika</p>
          <h2 className="h3 mb-1">Hej {(user.full_name || user.name || "").split(" ")[0]}, oto Twój dzień</h2>
          <span className="text-muted">Przydzielony pojazd oraz zadania</span>
        </div>
        <div className="d-flex align-items-center gap-3 flex-wrap">
          <div className="d-flex align-items-center gap-2">
            {user.avatar && <img src={user.avatar} alt={user.full_name || user.name} className="avatar" />}
            <div className="small text-muted">
              <div>{user.full_name || user.name}</div>
              <div>Rola: kierowca</div>
            </div>
          </div>
          {showLogoutButton && (
            <button className="btn btn-outline-secondary" onClick={onLogout}>
              Wyloguj
            </button>
          )}
        </div>
      </div>

      <div className="row g-4">
        <div className="col-12 col-xl-5">
          <div className="dashboard-panel h-100">
            <h3 className="h5 mb-3">Przydzielony pojazd</h3>
            {localData.assignment ? (
              <div className="vehicle-card">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <p className="text-uppercase text-muted small mb-1">{localData.assignment.vehicle.id}</p>
                    <h4 className="h5 mb-0">{localData.assignment.vehicle.model}</h4>
                  </div>
                  <span className="badge bg-dark">VIN: {localData.assignment.vehicle.vin.slice(-6)}</span>
                </div>
                <div className="row g-3">
                  <div className="col-6">
                    <p className="text-muted small mb-1">Przebieg</p>
                    <h5>{localData.assignment.vehicle.mileage}</h5>
                  </div>
                  <div className="col-6">
                    <p className="text-muted small mb-1">
                      {(localData.assignment.vehicle.fuel_type === 'electric' || localData.assignment.vehicle.fuel_type === 'hybrid') ? 'Bateria' : 'Paliwo'}
                    </p>
                    <div className="battery">
                      <div
                        className="battery__level"
                          style={{ width: `${(localData.assignment.vehicle.battery ?? localData.assignment.vehicle.fuel_level ?? 0)}%` }}
                      ></div>
                        <span>{localData.assignment.vehicle.battery ?? localData.assignment.vehicle.fuel_level ?? 0}%</span>
                    </div>
                  </div>
                  <div className="col-12">
                    <p className="text-muted small mb-1">Ciśnienie opon</p>
                    <div className="badge bg-success-subtle text-success">{localData.assignment.vehicle.tirePressure}</div>
                  </div>
                </div>
                
                <div className="d-flex gap-2 mt-3">
                  <button className="btn btn-sm btn-outline-primary flex-grow-1" onClick={openUpdateModal}>
                    Aktualizuj Status
                  </button>
                  <button className="btn btn-sm btn-outline-danger flex-grow-1" onClick={handleReturnVehicle}>
                    Zwróć Pojazd
                  </button>
                </div>

                <hr className="my-4" />
                <div>
                  <p className="text-muted small mb-2">Dzisiejsze zadania</p>
                  <ul className="list-unstyled d-flex flex-column gap-2 mb-0">
                    {localData.assignment.tasks.map((task) => (
                      <TaskItem key={task.id} task={task} onToggle={handleTaskToggle} />
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-car-front display-4 mb-3 d-block"></i>
                <p>Brak przydzielonego pojazdu.</p>
                <small>Skontaktuj się z administratorem.</small>
              </div>
            )}
          </div>
        </div>
        <div className="col-12 col-xl-7 d-flex flex-column gap-4">
          <div className="dashboard-panel">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h3 className="h5 mb-0">Historia tras</h3>
              <div className="d-flex gap-2 align-items-center">
                {reportProgress && (
                  <span className="text-muted small">
                    {reportProgress.message} {reportProgress.progress > 0 && `(${reportProgress.progress}%)`}
                  </span>
                )}
                <button 
                  className="btn btn-sm btn-outline-secondary"
                  onClick={handleDownloadReport}
                  disabled={reportLoading}
                >
                  {reportLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      {reportProgress?.progress || 0}%
                    </>
                  ) : (
                    <>
                      <i className="bi bi-file-earmark-pdf me-1"></i>
                      Pobierz raport
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="table-responsive">
              <table className="table align-middle mb-0">
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
                      <td colSpan={4} className="text-center text-muted">
                        Brak zapisanych przejazdów.
                      </td>
                    </tr>
                  )}
                  {trips.map((trip) => (
                    <tr key={trip.id}>
                      <td className="fw-semibold">{trip.vehicle_label || trip.route_label || 'Nieznana trasa'}</td>
                      <td>{trip.distance_km ? `${trip.distance_km} km` : '—'}</td>
                      <td>{trip.fuel_cost ? `${trip.fuel_cost} zł` : '—'}</td>
                      <td className="text-muted small">{trip.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="dashboard-panel">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h3 className="h5 mb-0">Tankowania</h3>
              <span className="badge bg-success-subtle text-success">{fuelLogs.length}</span>
            </div>
            <div className="d-flex flex-column gap-2">
              {fuelLogs.length === 0 && <span className="text-muted small">Brak danych</span>}
              {fuelLogs.map((log) => (
                <div key={log.id} className="border rounded-3 p-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-semibold">{log.vehicle_label || 'Pojazd'}</div>
                      <small className="text-muted">{formatDate(log.created_at)}</small>
                    </div>
                    <span className="fw-bold">{log.total_cost ? `${log.total_cost} zł` : '—'}</span>
                  </div>
                  <div className="d-flex gap-4 small text-muted mt-2">
                    <span>{log.liters ? `${log.liters} L` : '—'}</span>
                    <span>{log.station || 'Stacja nieznana'}</span>
                    {log.odometer && <span>{log.odometer} km</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="dashboard-panel">
            <h3 className="h5 mb-3">Przypomnienia</h3>
            <div className="d-flex flex-column gap-2">
              {reminders.map((reminder) => (
                <Reminder key={reminder.id} reminder={reminder} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {showUpdateModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Aktualizuj Status Pojazdu</h5>
                <button type="button" className="btn-close" onClick={() => setShowUpdateModal(false)}></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleUpdateStatus}>
                  <div className="mb-3">
                    <label className="form-label">Przebieg</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={updateForm.mileage} 
                      onChange={(e) => setUpdateForm({...updateForm, mileage: e.target.value})}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Poziom Baterii / Paliwa (%)</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      min="0" max="100"
                      value={updateForm.energyLevel} 
                      onChange={(e) => setUpdateForm({...updateForm, energyLevel: e.target.value})}
                    />
                  </div>
                  <div className="text-end">
                    <button type="button" className="btn btn-secondary me-2" onClick={() => setShowUpdateModal(false)}>Anuluj</button>
                    <button type="submit" className="btn btn-primary">Zapisz</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
