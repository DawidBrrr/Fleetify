import React, { useState } from 'react';
import { dashboardApi } from '../services/api/dashboard';

function StatCard({ label, value, delta, tone = "info" }) {
  return (
    <div className="stat-card h-100">
      <p className="text-uppercase text-muted small mb-1">{label}</p>
      <div className="d-flex align-items-baseline gap-2">
        <span className="display-6 fw-bold mb-0">{value}</span>
        <span className={`badge rounded-pill stat-delta stat-delta--${tone}`}>{delta}</span>
      </div>
    </div>
  );
}

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("pl-PL");
};

function FleetRow({ item }) {
  const statusMap = {
    available: "Dostępny",
    in_use: "W użyciu",
    maintenance: "W serwisie",
    assigned: "Przydzielone",
  };
  const statusLabel = statusMap[item.status] || item.status;
  const statusClassMap = {
    available: "success",
    in_use: "warning",
    maintenance: "danger",
    assigned: "info",
  };
  const statusClass = statusClassMap[item.status] || "secondary";

  const isElectric = item.fuel_type === "electric";
  const isHybrid = item.fuel_type === "hybrid";
  const showBattery = isElectric || isHybrid;
  const openIssues = item.open_issues || 0;

  return (
    <tr>
      <td className="fw-semibold">{item.id}</td>
      <td>{item.model}</td>
      <td>
        <span className={`badge bg-${statusClass}`}>{statusLabel}</span>
      </td>
      <td>{item.location}</td>
      <td>
        {showBattery ? (
          <div className="d-flex align-items-center gap-2">
            <div className="progress flex-grow-1" style={{ height: "6px", width: "60px" }}>
              <div
                className={`progress-bar bg-${item.battery > 20 ? "success" : "danger"}`}
                role="progressbar"
                style={{ width: `${item.battery ?? 0}%` }}
              ></div>
            </div>
            <span className="small">{item.battery ?? 0}%</span>
            <span className="text-muted small" style={{ fontSize: "0.7em" }}>
              ({isElectric ? "EV" : "HEV"})
            </span>
          </div>
        ) : item.fuel_level !== undefined ? (
          <div className="d-flex align-items-center gap-2">
            <div className="progress flex-grow-1" style={{ height: "6px", width: "60px" }}>
              <div
                className={`progress-bar bg-${item.fuel_level > 20 ? "success" : "danger"}`}
                role="progressbar"
                style={{ width: `${item.fuel_level}%` }}
              ></div>
            </div>
            <span className="small">{item.fuel_level}%</span>
            <span className="text-muted small" style={{ fontSize: "0.7em" }}>
              ({item.fuel_type?.toUpperCase() || "ICE"})
            </span>
          </div>
        ) : (
          "—"
        )}
      </td>
      <td>{formatDate(item.last_service_date)}</td>
      <td>
        {openIssues > 0 ? (
          <span className="badge bg-danger-subtle text-danger">
            {openIssues} zgłosz.
          </span>
        ) : (
          <span className="text-muted">Brak</span>
        )}
      </td>
    </tr>
  );
}

function AlertPill({ alert }) {
  return (
    <div className={`alert-pill alert-pill--${alert.severity}`}>
      <strong className="me-2">{alert.type}</strong>
      <span>{alert.message}</span>
    </div>
  );
}

export default function AdminDashboard({ data, user, onLogout, showLogoutButton = true }) {
  const [reportLoading, setReportLoading] = useState(false);
  const [reportProgress, setReportProgress] = useState(null);

  if (!data) return null;

  const costEntries = Object.entries(data.costBreakdown);
  const totalCost = costEntries.reduce((acc, [, value]) => acc + value, 0);
  const recentTrips = data.recentTrips || [];
  const recentFuelLogs = data.recentFuelLogs || [];
  const issueSummary = data.issueSummary || { open: 0, byVehicle: [] };

  const handleDownloadFleetReport = async () => {
    setReportLoading(true);
    setReportProgress({ status: 'STARTING', progress: 0, message: 'Rozpoczynam generowanie...' });
    try {
      const blob = await dashboardApi.generateReportAsync(
        'fleet-summary',
        null,
        null,
        (progress) => setReportProgress(progress)
      );
      
      setReportProgress({ status: 'DOWNLOADING', progress: 100, message: 'Pobieranie...' });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `raport-flota-${new Date().toISOString().split('T')[0]}.pdf`;
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

  return (
    <div className="section-shell p-4 p-lg-5 dashboard-section">
      <div className="dashboard-header mb-4">
        <div>
          <p className="text-uppercase text-muted small mb-1">Panel administratora floty</p>
          <h2 className="h3 mb-1">Cześć {(user.full_name || user.name || "").split(" ")[0]}, oto dzisiejsze kluczowe liczby</h2>
          <span className="text-muted">{user.email}</span>
        </div>
        <div className="d-flex align-items-center gap-3 flex-wrap">
          <div className="d-flex align-items-center gap-2">
            {user.avatar && <img src={user.avatar} alt={user.full_name || user.name} className="avatar" />}
            <div className="small text-muted">
              <div>{user.full_name || user.name}</div>
              <div>Rola: administrator</div>
            </div>
          </div>
          {showLogoutButton && (
            <button className="btn btn-outline-secondary" onClick={onLogout}>
              Wyloguj
            </button>
          )}
        </div>
      </div>

      <div className="row g-4 mb-4">
        {data.stats.map((item) => (
          <div key={item.label} className="col-12 col-md-6 col-xl-3">
            <StatCard {...item} />
          </div>
        ))}
      </div>

      <div className="row g-4">
        <div className="col-12 col-xl-7">
          <div className="dashboard-panel h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h3 className="h5 mb-1">Zdrowie floty</h3>
                <p className="text-muted small mb-0">Monitorowane pojazdy z telemetrią na żywo</p>
              </div>
              <div className="d-flex gap-2 align-items-center">
                {reportProgress && (
                  <span className="text-muted small me-2">
                    {reportProgress.message} {reportProgress.progress > 0 && `(${reportProgress.progress}%)`}
                  </span>
                )}
                <button 
                  className="btn btn-sm btn-primary"
                  onClick={handleDownloadFleetReport}
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
                      Pobierz raport PDF
                    </>
                  )}
                </button>
                <button className="btn btn-sm btn-outline-secondary">Eksportuj CSV</button>
              </div>
            </div>
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Pojazd</th>
                    <th>Model</th>
                    <th>Status</th>
                    <th>Lokalizacja</th>
                    <th>Energia / Paliwo</th>
                    <th>Serwis</th>
                    <th>Alerty</th>
                  </tr>
                </thead>
                <tbody>
                  {data.fleetHealth.map((vehicle) => (
                    <FleetRow key={vehicle.id} item={vehicle} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="col-12 col-xl-5 d-flex flex-column gap-4">
          <div className="dashboard-panel">
            <h3 className="h5 mb-3">Alerty</h3>
            <div className="d-flex flex-column gap-2">
              {data.alerts.map((alert) => (
                <AlertPill key={alert.id} alert={alert} />
              ))}
            </div>
          </div>
          <div className="dashboard-panel">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h3 className="h5 mb-0">Koszty operacyjne</h3>
              <span className="badge bg-primary-subtle text-primary">{data.costBreakdown?.period || 'ostatnie 30 dni'}</span>
            </div>
            {data.costBreakdown?.breakdown ? (
              <>
                <div className="d-flex justify-content-center mb-3">
                  <div className="text-center">
                    <p className="display-5 fw-bold text-primary mb-0">{(data.costBreakdown.total || 0).toLocaleString('pl-PL')} PLN</p>
                    <small className="text-muted">Łączne koszty</small>
                  </div>
                </div>
                <div className="d-flex flex-column gap-2 mb-3">
                  {data.costBreakdown.breakdown.map((item) => (
                    <div key={item.category} className="d-flex justify-content-between align-items-center p-2 bg-light rounded">
                      <div className="d-flex align-items-center gap-2">
                        <i className={`bi ${item.icon || 'bi-currency-exchange'} text-muted`}></i>
                        <span>{item.category}</span>
                      </div>
                      <span className="fw-semibold">{item.amount.toLocaleString('pl-PL')} PLN</span>
                    </div>
                  ))}
                </div>
                {data.costBreakdown.stats && (
                  <div className="row g-2 text-center small text-muted">
                    <div className="col-4">
                      <div className="fw-semibold text-dark">{data.costBreakdown.stats.trip_count}</div>
                      <div>przejazdów</div>
                    </div>
                    <div className="col-4">
                      <div className="fw-semibold text-dark">{(data.costBreakdown.stats.total_distance_km || 0).toLocaleString('pl-PL')} km</div>
                      <div>dystans</div>
                    </div>
                    <div className="col-4">
                      <div className="fw-semibold text-dark">{data.costBreakdown.stats.avg_cost_per_km} PLN</div>
                      <div>za km</div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="d-flex flex-column gap-2">
                {costEntries.map(([label, value]) => (
                  <div key={label}>
                    <div className="d-flex justify-content-between small text-muted mb-1 text-capitalize">
                      <span>{label}</span>
                      <span>{value}%</span>
                    </div>
                    <div className="progress w-100" role="progressbar" aria-valuenow={value} aria-valuemin="0" aria-valuemax={totalCost}>
                      <div className="progress-bar" style={{ width: `${value}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="dashboard-panel">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h3 className="h5 mb-0">Utrzymanie</h3>
              <span className="badge bg-danger text-white">Otwarte: {issueSummary.open}</span>
            </div>
            <div className="d-flex flex-column gap-2">
              {issueSummary.byVehicle.length === 0 && <span className="text-muted small">Brak aktywnych zgłoszeń</span>}
              {issueSummary.byVehicle.map((item) => (
                <div key={item.vehicle_id} className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="fw-semibold">{item.vehicle_label}</div>
                    <small className="text-muted">Ostatni serwis: {formatDate(item.last_service_date)}</small>
                  </div>
                  <span className="badge bg-danger-subtle text-danger">{item.open_issues} zgłosz.</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4 mt-1">
        <div className="col-12 col-xl-7">
          <div className="dashboard-panel h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h3 className="h5 mb-0">Ostatnie przejazdy</h3>
              <span className="badge bg-primary-subtle text-primary">{recentTrips.length} wpisów</span>
            </div>
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Pojazd / Trasa</th>
                    <th>Dystans</th>
                    <th>Spalone paliwo</th>
                    <th>Notatka</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTrips.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center text-muted">
                        Brak zapisanych przejazdów.
                      </td>
                    </tr>
                  )}
                  {recentTrips.map((trip) => (
                    <tr key={trip.id}>
                      <td className="fw-semibold">{trip.vehicle_label || trip.route_label || "Nieznana trasa"}</td>
                      <td>{trip.distance_km ? `${trip.distance_km} km` : "—"}</td>
                      <td>{trip.fuel_used_l ? `${trip.fuel_used_l} L` : "—"}</td>
                      <td className="text-muted small">{trip.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="col-12 col-xl-5 d-flex flex-column gap-4">
          <div className="dashboard-panel">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h3 className="h5 mb-0">Tankowania</h3>
              <span className="badge bg-success-subtle text-success">{recentFuelLogs.length} wpisów</span>
            </div>
            <div className="d-flex flex-column gap-2">
              {recentFuelLogs.length === 0 && <span className="text-muted small">Brak tankowań</span>}
              {recentFuelLogs.map((log) => (
                <div key={log.id} className="border rounded-3 p-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-semibold">{log.vehicle_label || "Pojazd"}</div>
                      <small className="text-muted">{formatDate(log.created_at)}</small>
                    </div>
                    <span className="fw-bold">{log.total_cost ? `${log.total_cost} zł` : "—"}</span>
                  </div>
                  <div className="d-flex gap-4 small text-muted mt-2">
                    <span>{log.liters ? `${log.liters} L` : "—"}</span>
                    <span>{log.station || "Stacja nieznana"}</span>
                    {log.odometer && <span>{log.odometer} km</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
