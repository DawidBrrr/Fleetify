import { useState } from "react";
import AdminDashboard from "./AdminDashboard";
import EmployeeDashboard from "./EmployeeDashboard";
import logo from "../assets/logo.svg";

const NAV_LINKS = [
  { id: "dashboard", label: "Pulpit", icon: "📊" },
  { id: "vehicles", label: "Pojazdy", icon: "🚗" },
  { id: "employees", label: "Pracownicy", icon: "👥" },
  { id: "notifications", label: "Powiadomienia", icon: "🔔" },
  { id: "integrations", label: "Integracje", icon: "🔗" }
];

export default function DashboardPage({ session, data, onLogout }) {
  const [activeView, setActiveView] = useState("dashboard");

  if (!session?.user || !data) return null;
  const isAdmin = session.user.role === "admin";

  const renderContent = () => {
    if (activeView === "dashboard") {
      return isAdmin ? (
        <AdminDashboard data={data} user={session.user} onLogout={onLogout} showLogoutButton={false} />
      ) : (
        <EmployeeDashboard data={data} user={session.user} onLogout={onLogout} showLogoutButton={false} />
      );
    }
    
    return (
      <div className="p-5 text-center">
        <h2 className="h4 text-muted">Widok "{NAV_LINKS.find(l => l.id === activeView)?.label}" jest w trakcie budowy</h2>
        <p>Ta funkcjonalność zostanie dodana wkrótce.</p>
      </div>
    );
  };

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
