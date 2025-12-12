import { useState } from "react";
import AdminDashboard from "./AdminDashboard";
import EmployeeDashboard from "./EmployeeDashboard";
import VehiclesPage from "./VehiclesPage";
import EmployeesPage from "./EmployeesPage";
import TeamPage from "./TeamPage";
import NotificationsPage from "./NotificationsPage";
import logo from "../assets/logo.svg";

const ADMIN_NAV = [
  { id: "dashboard", label: "Pulpit", icon: "📊" },
  { id: "vehicles", label: "Pojazdy", icon: "🚗" },
  { id: "employees", label: "Pracownicy", icon: "👥" },
  { id: "notifications", label: "Powiadomienia", icon: "🔔" },
  { id: "integrations", label: "Integracje", icon: "🔗" }
];

const WORKER_NAV = [
  { id: "dashboard", label: "Pulpit", icon: "📊" },
  { id: "vehicles", label: "Pojazdy", icon: "🚗" },
  { id: "team", label: "Zespół", icon: "🤝" },
  { id: "notifications", label: "Powiadomienia", icon: "🔔" },
  { id: "integrations", label: "Integracje", icon: "🔗" }
];

export default function DashboardPage({ session, data, onLogout, onRefresh }) {
  const [activeView, setActiveView] = useState("dashboard");

  if (!session?.user || !data) return null;
  const isAdmin = session.user.role === "admin";
  const navLinks = isAdmin ? ADMIN_NAV : WORKER_NAV;

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      window.location.reload();
    }
  };

  const renderContent = () => {
    switch (activeView) {
      case "dashboard":
        return isAdmin ? (
          <AdminDashboard data={data} user={session.user} onLogout={onLogout} showLogoutButton={false} />
        ) : (
          <EmployeeDashboard data={data} user={session.user} onLogout={onLogout} showLogoutButton={false} />
        );
      case "vehicles":
        return <VehiclesPage />;
      case "team":
        return <TeamPage />;
      case "employees":
        return <EmployeesPage />;
      case "notifications":
        return <NotificationsPage />;
      default:
        return (
          <div className="p-5 text-center">
            <h2 className="h4 text-muted">Widok "{navLinks.find(l => l.id === activeView)?.label || activeView}" jest w trakcie budowy</h2>
            <p>Ta funkcjonalność zostanie dodana wkrótce.</p>
          </div>
        );
    }
  };

  return (
    <div className="dashboard-page">
      <aside className="dashboard-sidebar">
        <div className="d-flex align-items-center gap-2 mb-4">
          <img src={logo} alt="Fleetify" width="36" height="36" />
          <div>
            <p className="mb-0 fw-semibold">Fleetify</p>
            <small className="text-muted">Centrum Sterowania</small>
          </div>
        </div>
        <nav className="d-flex flex-column gap-2 flex-grow-1">
          {navLinks.map((link) => (
            <button 
              key={link.id} 
              type="button" 
              className={`sidebar-link ${activeView === link.id ? "active" : ""}`}
              onClick={() => setActiveView(link.id)}
            >
              <span className="me-2" aria-hidden="true">
                {link.icon}
              </span>
              {link.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer mt-4">
          <button className="btn btn-sm btn-outline-light w-100 mb-3" onClick={handleRefresh}>
            <i className="bi bi-arrow-clockwise me-2"></i> Odśwież
          </button>
          <p className="small text-muted mb-1">Zalogowano jako</p>
          <p className="fw-semibold mb-1">{session.user.full_name || session.user.name}</p>
          <p className="text-muted small mb-3">{session.user.email}</p>
          <button className="btn btn-sm btn-outline-light w-100" onClick={onLogout}>
            Wyloguj
          </button>
        </div>
      </aside>
      <main className="dashboard-main">
        {renderContent()}
      </main>
    </div>
  );
}
