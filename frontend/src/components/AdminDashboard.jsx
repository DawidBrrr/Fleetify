import React, { useState } from 'react';
import { dashboardApi } from '../services/api/dashboard';

// SVG Icons
const Icons = {
  truck: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7V8z"/>
      <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  ),
  fuel: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 22V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v17"/>
      <path d="M15 12h3.5a2 2 0 0 1 2 2v3a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L21 5.5"/>
      <line x1="3" y1="22" x2="15" y2="22"/><line x1="6" y1="12" x2="12" y2="12"/>
    </svg>
  ),
  alert: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  chart: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  wallet: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>
    </svg>
  ),
  wrench: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  ),
  route: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/>
      <circle cx="18" cy="5" r="3"/>
    </svg>
  ),
  download: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  user: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  activity: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  trendUp: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  trendDown: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/>
    </svg>
  ),
  location: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  clock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  file: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
};

function StatCard({ label, value, delta, tone = "info", icon }) {
  const iconComponent = icon ? Icons[icon] : Icons.chart;
  const toneColors = {
    success: { bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.2)', color: '#10b981' },
    warning: { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' },
    danger: { bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' },
    info: { bg: 'rgba(5, 180, 217, 0.1)', border: 'rgba(5, 180, 217, 0.2)', color: '#05b4d9' },
  };
  const colors = toneColors[tone] || toneColors.info;

  return (
    <div className="vp-stat-card">
      <div className="vp-stat-card__icon" style={{ background: colors.bg, color: colors.color }}>
        {iconComponent}
      </div>
      <div className="vp-stat-card__content">
        <p className="vp-stat-card__label">{label}</p>
        <div className="vp-stat-card__row">
          <span className="vp-stat-card__value">{value}</span>
          <span className="vp-stat-card__delta" style={{ background: colors.bg, color: colors.color, border: `1px solid ${colors.border}` }}>
            {delta}
          </span>
        </div>
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
  const statusClass = statusClassMap[item.status] || "info";

  const isElectric = item.fuel_type === "electric";
  const isHybrid = item.fuel_type === "hybrid";
  const showBattery = isElectric || isHybrid;
  const openIssues = item.open_issues || 0;

  return (
    <tr className="vp-table-row">
      <td>
        <div className="d-flex align-items-center gap-2">
          <div className="vp-table-avatar">{Icons.truck}</div>
          <span className="fw-semibold" style={{ fontSize: '0.82rem' }}>{item.id}</span>
        </div>
      </td>
      <td style={{ fontSize: '0.82rem' }}>{item.model}</td>
      <td>
        <span className={`vp-status vp-status--${statusClass}`}>
          <span className="vp-status__dot"></span>
          {statusLabel}
        </span>
      </td>
      <td style={{ fontSize: '0.8rem' }}>{item.location}</td>
      <td>
        {showBattery ? (
          <div className="vp-energy-bar">
            <div className="vp-energy-bar__track">
              <div
                className={`vp-energy-bar__fill vp-energy-bar__fill--${item.battery > 20 ? "success" : "danger"}`}
                style={{ width: `${item.battery ?? 0}%` }}
              ></div>
            </div>
            <span className="vp-energy-bar__text">{item.battery ?? 0}%</span>
            <span className="vp-energy-bar__type">{isElectric ? "EV" : "HEV"}</span>
          </div>
        ) : item.fuel_level !== undefined ? (
          <div className="vp-energy-bar">
            <div className="vp-energy-bar__track">
              <div
                className={`vp-energy-bar__fill vp-energy-bar__fill--${item.fuel_level > 20 ? "success" : "danger"}`}
                style={{ width: `${item.fuel_level}%` }}
              ></div>
            </div>
            <span className="vp-energy-bar__text">{item.fuel_level}%</span>
            <span className="vp-energy-bar__type">{item.fuel_type?.toUpperCase() || "ICE"}</span>
          </div>
        ) : (
          "—"
        )}
      </td>
      <td style={{ fontSize: '0.8rem' }}>{formatDate(item.last_service_date)}</td>
      <td>
        {openIssues > 0 ? (
          <span className="vp-status vp-status--danger">
            <span className="vp-status__dot"></span>
            {openIssues} zgłosz.
          </span>
        ) : (
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Brak</span>
        )}
      </td>
    </tr>
  );
}

function AlertPill({ alert }) {
  const severityIcons = {
    warning: Icons.alert,
    info: Icons.activity,
    danger: Icons.alert,
  };
  return (
    <div className={`vp-alert-pill vp-alert-pill--${alert.severity}`}>
      <div className="vp-alert-pill__icon">{severityIcons[alert.severity] || Icons.alert}</div>
      <div className="vp-alert-pill__content">
        <strong>{alert.type}</strong>
        <span>{alert.message}</span>
      </div>
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
      <div className="vp-dashboard-header">
        <div className="vp-dashboard-header__info">
          <div className="vp-dashboard-header__badge">Panel administratora floty</div>
          <h2 className="vp-dashboard-header__title">
            Cześć {(user.full_name || user.name || "").split(" ")[0]}, oto dzisiejsze kluczowe liczby
          </h2>
          <span className="vp-dashboard-header__subtitle">{user.email}</span>
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
              <span className="vp-user-badge__role">Administrator</span>
            </div>
          </div>
          {showLogoutButton && (
            <button className="vp-btn vp-btn--outline" onClick={onLogout}>
              {Icons.logout} Wyloguj
            </button>
          )}
        </div>
      </div>

      <div className="row g-3 mb-4">
        {data.stats.map((item, index) => (
          <div key={item.label} className="col-12 col-md-6 col-xl-3">
            <StatCard {...item} icon={['truck', 'route', 'fuel', 'wrench'][index % 4]} />
          </div>
        ))}
      </div>

      <div className="row g-3">
        <div className="col-12 col-xl-7">
          <div className="vp-panel vp-panel--full">
            <div className="vp-panel__header">
              <div>
                <h3 className="vp-panel__title">{Icons.activity} Zdrowie floty</h3>
                <p className="vp-panel__subtitle">Monitorowane pojazdy z telemetrią na żywo</p>
              </div>
              <div className="d-flex gap-2 align-items-center">
                {reportProgress && (
                  <span className="vp-hint">
                    {reportProgress.message} {reportProgress.progress > 0 && `(${reportProgress.progress}%)`}
                  </span>
                )}
                <button 
                  className="vp-btn vp-btn--primary"
                  onClick={handleDownloadFleetReport}
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
                    <th>Pojazd</th>
                    <th>Model</th>
                    <th>Status</th>
                    <th>Lokalizacja</th>
                    <th>Paliwo / Energia</th>
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
        <div className="col-12 col-xl-5 d-flex flex-column gap-3">
          <div className="vp-panel">
            <div className="vp-panel__header">
              <h3 className="vp-panel__title">{Icons.alert} Alerty</h3>
            </div>
            <div className="d-flex flex-column gap-2">
              {data.alerts.map((alert) => (
                <AlertPill key={alert.id} alert={alert} />
              ))}
            </div>
          </div>
          <div className="vp-panel">
            <div className="vp-panel__header">
              <h3 className="vp-panel__title">{Icons.wallet} Koszty operacyjne</h3>
              <span className="vp-status vp-status--info">
                <span className="vp-status__dot"></span>
                {data.costBreakdown?.period || 'ostatnie 30 dni'}
              </span>
            </div>
            {data.costBreakdown?.breakdown ? (
              <>
                <div className="vp-cost-total">
                  <span className="vp-cost-total__value">{(data.costBreakdown.total || 0).toLocaleString('pl-PL')}</span>
                  <span className="vp-cost-total__currency">PLN</span>
                </div>
                <div className="d-flex flex-column gap-2 mb-3">
                  {data.costBreakdown.breakdown.map((item) => (
                    <div key={item.category} className="vp-cost-row">
                      <div className="vp-cost-row__label">
                        <span className="vp-cost-row__icon">{item.icon === 'bi-fuel-pump' ? Icons.fuel : Icons.route}</span>
                        <span>{item.category}</span>
                      </div>
                      <span className="vp-cost-row__value">{item.amount.toLocaleString('pl-PL')} PLN</span>
                    </div>
                  ))}
                </div>
                {data.costBreakdown.stats && (
                  <div className="vp-stats-grid">
                    <div className="vp-stats-grid__item">
                      <span className="vp-stats-grid__value">{data.costBreakdown.stats.trip_count}</span>
                      <span className="vp-stats-grid__label">przejazdów</span>
                    </div>
                    <div className="vp-stats-grid__item">
                      <span className="vp-stats-grid__value">{(data.costBreakdown.stats.total_distance_km || 0).toLocaleString('pl-PL')} km</span>
                      <span className="vp-stats-grid__label">dystans</span>
                    </div>
                    <div className="vp-stats-grid__item">
                      <span className="vp-stats-grid__value">{data.costBreakdown.stats.avg_cost_per_km} PLN</span>
                      <span className="vp-stats-grid__label">za km</span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="d-flex flex-column gap-2">
                {costEntries.map(([label, value]) => (
                  <div key={label} className="vp-cost-row">
                    <span className="text-capitalize">{label}</span>
                    <span>{value}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="vp-panel">
            <div className="vp-panel__header">
              <h3 className="vp-panel__title">{Icons.wrench} Utrzymanie</h3>
              <span className="vp-status vp-status--danger">
                <span className="vp-status__dot"></span>
                Otwarte: {issueSummary.open}
              </span>
            </div>
            <div className="d-flex flex-column gap-2">
              {issueSummary.byVehicle.length === 0 && <span className="vp-hint">Brak aktywnych zgłoszeń</span>}
              {issueSummary.byVehicle.map((item) => (
                <div key={item.vehicle_id} className="vp-maintenance-row">
                  <div className="vp-maintenance-row__info">
                    <span className="vp-maintenance-row__label">{item.vehicle_label}</span>
                    <span className="vp-maintenance-row__date">{Icons.clock} Serwis: {formatDate(item.last_service_date)}</span>
                  </div>
                  <span className="vp-status vp-status--danger">
                    <span className="vp-status__dot"></span>
                    {item.open_issues} zgłosz.
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3 mt-1">
        <div className="col-12 col-xl-7">
          <div className="vp-panel vp-panel--full">
            <div className="vp-panel__header">
              <h3 className="vp-panel__title">{Icons.route} Ostatnie przejazdy</h3>
              <span className="vp-status vp-status--info">
                <span className="vp-status__dot"></span>
                {recentTrips.length} wpisów
              </span>
            </div>
            <div className="vp-table-wrapper">
              <table className="vp-table">
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
                      <td colSpan={4} className="text-center vp-hint" style={{ padding: '24px' }}>
                        Brak zapisanych przejazdów.
                      </td>
                    </tr>
                  )}
                  {recentTrips.map((trip) => (
                    <tr key={trip.id} className="vp-table-row">
                      <td>
                        <span style={{ fontWeight: 600, fontSize: '0.82rem' }}>{trip.vehicle_label || trip.route_label || "Nieznana trasa"}</span>
                      </td>
                      <td style={{ fontSize: '0.82rem' }}>{trip.distance_km ? `${trip.distance_km} km` : "—"}</td>
                      <td style={{ fontSize: '0.82rem' }}>{trip.fuel_used_l ? `${trip.fuel_used_l} L` : "—"}</td>
                      <td className="vp-hint">{trip.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="col-12 col-xl-5">
          <div className="vp-panel vp-panel--full">
            <div className="vp-panel__header">
              <h3 className="vp-panel__title">{Icons.fuel} Tankowania</h3>
              <span className="vp-status vp-status--success">
                <span className="vp-status__dot"></span>
                {recentFuelLogs.length} wpisów
              </span>
            </div>
            <div className="d-flex flex-column gap-2">
              {recentFuelLogs.length === 0 && <span className="vp-hint">Brak tankowań</span>}
              {recentFuelLogs.map((log) => (
                <div key={log.id} className="vp-fuel-card">
                  <div className="vp-fuel-card__header">
                    <div>
                      <span className="vp-fuel-card__label">{log.vehicle_label || "Pojazd"}</span>
                      <span className="vp-fuel-card__date">{Icons.clock} {formatDate(log.created_at)}</span>
                    </div>
                    <span className="vp-fuel-card__cost">{log.total_cost ? `${log.total_cost} zł` : "—"}</span>
                  </div>
                  <div className="vp-fuel-card__meta">
                    <span>{Icons.fuel} {log.liters ? `${log.liters} L` : "—"}</span>
                    <span>{Icons.location} {log.station || "Stacja nieznana"}</span>
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
