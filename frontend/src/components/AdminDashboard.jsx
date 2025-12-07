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

function FleetRow({ item }) {
  const statusMap = {
    'available': 'Dostępny',
    'in_use': 'W użyciu',
    'maintenance': 'W serwisie'
  };
  const statusLabel = statusMap[item.status] || item.status;
  const statusClass = item.status === 'available' ? 'success' : (item.status === 'maintenance' ? 'danger' : 'warning');

  return (
    <tr>
      <td className="fw-semibold">{item.id}</td>
      <td>{item.model}</td>
      <td>
        <span className={`badge bg-${statusClass}`}>{statusLabel}</span>
      </td>
      <td>{item.location}</td>
      <td>
        {item.battery !== undefined ? (
          <div className="d-flex align-items-center gap-2">
            <div className="progress flex-grow-1" style={{ height: "6px", width: "60px" }}>
              <div 
                className={`progress-bar bg-${item.battery > 20 ? 'success' : 'danger'}`} 
                role="progressbar" 
                style={{ width: `${item.battery}%` }}
              ></div>
            </div>
            <span className="small">{item.battery}%</span>
            <span className="text-muted small" style={{fontSize: '0.7em'}}>({item.fuel_type === 'electric' ? 'EV' : (item.fuel_type === 'hybrid' ? 'HEV' : 'ICE')})</span>
          </div>
        ) : "—"}
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
  if (!data) return null;

  const costEntries = Object.entries(data.costBreakdown);
  const totalCost = costEntries.reduce((acc, [, value]) => acc + value, 0);

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
              <button className="btn btn-sm btn-outline-secondary">Eksportuj CSV</button>
            </div>
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Pojazd</th>
                    <th>Model</th>
                    <th>Status</th>
                    <th>Lokalizacja</th>
                    <th>Poziom baterii</th>
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
            <h3 className="h5 mb-3">Koszty operacyjne</h3>
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
          </div>
        </div>
      </div>
    </div>
  );
}
