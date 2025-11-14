function PanelCard({ title, description, metrics, checklist, active }) {
  return (
    <div className={`panel-card h-100 ${active ? "panel-card--active" : ""}`}>
      <div className="d-flex justify-content-between align-items-start mb-3">
        <div>
          <p className="text-uppercase small text-muted mb-1">Widok</p>
          <h3 className="h4 mb-0">{title}</h3>
        </div>
        <span className="badge bg-dark text-white">Live</span>
      </div>
      <p className="text-muted">{description}</p>
      <div className="row g-3 my-3">
        {metrics.map(({ label, value }) => (
          <div key={label} className="col-4">
            <div className="metric-tile">
              <span className="small text-muted">{label}</span>
              <p className="h5 mb-0">{value}</p>
            </div>
          </div>
        ))}
      </div>
      <ul className="list-unstyled text-muted d-flex flex-column gap-2">
        {checklist.map((item) => (
          <li key={item}>
            <span className="badge rounded-pill bg-fleet-cyan text-dark me-2">✓</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function DashboardPreview({ role, adminData, employeeData }) {
  return (
    <div className="row g-4">
      <div className="col-md-6">
        <PanelCard {...adminData} active={role === "admin"} />
      </div>
      <div className="col-md-6">
        <PanelCard {...employeeData} active={role === "employee"} />
      </div>
    </div>
  );
}
