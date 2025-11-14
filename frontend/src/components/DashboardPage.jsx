import AdminDashboard from "./AdminDashboard";
import EmployeeDashboard from "./EmployeeDashboard";
import logo from "../assets/logo.svg";

const NAV_LINKS = [
  { label: "Pulpit", icon: "📊" },
  { label: "Pojazdy", icon: "🚗" },
  { label: "Pracownicy", icon: "👥" },
  { label: "Powiadomienia", icon: "🔔" },
  { label: "Integracje", icon: "🔗" }
];

export default function DashboardPage({ session, data, onLogout }) {
  if (!session?.user || !data) return null;
  const isAdmin = session.user.role === "admin";

  return (
    <div className="dashboard-page">
      <aside className="dashboard-sidebar">
        <div className="d-flex align-items-center gap-2 mb-4">
          <img src={logo} alt="Fleetify" width="36" height="36" />
          <div>
            <p className="mb-0 fw-semibold">Fleetify</p>
            <small className="text-muted">Control Center</small>
          </div>
        </div>
        <nav className="d-flex flex-column gap-2 flex-grow-1">
          {NAV_LINKS.map((link) => (
            <button key={link.label} type="button" className="sidebar-link">
              <span className="me-2" aria-hidden="true">
                {link.icon}
              </span>
              {link.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer mt-4">
          <p className="small text-muted mb-1">Zalogowano jako</p>
          <p className="fw-semibold mb-1">{session.user.name}</p>
          <p className="text-muted small mb-3">{session.user.email}</p>
          <button className="btn btn-sm btn-outline-light w-100" onClick={onLogout}>
            Wyloguj
          </button>
        </div>
      </aside>
      <main className="dashboard-main">
        {isAdmin ? (
          <AdminDashboard data={data} user={session.user} onLogout={onLogout} showLogoutButton={false} />
        ) : (
          <EmployeeDashboard data={data} user={session.user} onLogout={onLogout} showLogoutButton={false} />
        )}
      </main>
    </div>
  );
}
