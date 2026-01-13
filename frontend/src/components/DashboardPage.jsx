import { useState } from "react";
import AdminDashboard from "./AdminDashboard";
import EmployeeDashboard from "./EmployeeDashboard";
import VehiclesPage from "./VehiclesPage";
import EmployeesPage from "./EmployeesPage";
import TeamPage from "./TeamPage";
import NotificationsPage from "./NotificationsPage";
import AnalyticsPage from "./AnalyticsPage";
import AccountInfo from "./AccountInfo";
import { authApi } from "../services/api/auth";
import logo from "../assets/logo.svg";

const Icons = {
  dashboard: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>,
  analytics: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  car: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 11l1.5-4.5a2 2 0 0 1 1.9-1.5h7.2a2 2 0 0 1 1.9 1.5L19 11"/><path d="M3 17h1a1 1 0 0 0 1-1v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3a1 1 0 0 0 1 1h1"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="16.5" cy="17.5" r="1.5"/></svg>,
  users: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  bell: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  link: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  team: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  refresh: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
  user: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  logout: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
};

const ADMIN_NAV = [
  { id: "dashboard", label: "Pulpit", icon: "dashboard" },
  { id: "analytics", label: "Analityka", icon: "analytics" },
  { id: "vehicles", label: "Pojazdy", icon: "car" },
  { id: "employees", label: "Pracownicy", icon: "users" },
  { id: "notifications", label: "Powiadomienia", icon: "bell" },
  { id: "integrations", label: "Integracje", icon: "link" }
];

const WORKER_NAV = [
  { id: "dashboard", label: "Pulpit", icon: "dashboard" },
  { id: "vehicles", label: "Pojazdy", icon: "car" },
  { id: "team", label: "Zespół", icon: "team" },
  { id: "notifications", label: "Powiadomienia", icon: "bell" },
  { id: "integrations", label: "Integracje", icon: "link" }
];

export default function DashboardPage({ session, data, onLogout, onRefresh }) {
  const [activeView, setActiveView] = useState("dashboard");
  const [showAccountInfo, setShowAccountInfo] = useState(false);

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

  const handleSubscriptionUpdate = async (subscriptionPlan) => {
    try {
      const result = await authApi.renewSubscription(subscriptionPlan);
      // Refresh user data
      handleRefresh();
      return result;
    } catch (error) {
      console.error("Failed to renew subscription:", error);
      alert("Nie udało się przedłużyć subskrypcji. Spróbuj ponownie.");
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
      case "analytics":
        return <AnalyticsPage />;
      case "vehicles":
        return <VehiclesPage role={session.user.role} user={session.user} />;
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
      {showAccountInfo && (
        <AccountInfo 
          user={session.user} 
          onClose={() => setShowAccountInfo(false)}
          onSubscriptionUpdate={handleSubscriptionUpdate}
        />
      )}
      <aside className="dashboard-sidebar">
        <div className="sidebar-logo">
          <img src={logo} alt="Fleetify" className="sidebar-logo__img" />
          <div className="sidebar-logo__text">
            <span className="sidebar-logo__title">Fleetify</span>
            <span className="sidebar-logo__subtitle">Centrum Sterowania</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          {navLinks.map((link) => (
            <button 
              key={link.id} 
              type="button" 
              className={`sidebar-link ${activeView === link.id ? "active" : ""}`}
              onClick={() => setActiveView(link.id)}
            >
              <span className="sidebar-link__icon">
                {Icons[link.icon]}
              </span>
              {link.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user__avatar">
              {Icons.user}
            </div>
            <div className="sidebar-user__info">
              <span className="sidebar-user__name">{session.user.full_name || session.user.name}</span>
              <span className="sidebar-user__email">{session.user.email}</span>
            </div>
          </div>
          <div className="sidebar-actions">
            <button className="sidebar-btn" onClick={handleRefresh}>
              {Icons.refresh} Odśwież dane
            </button>
            <button className="sidebar-btn" onClick={() => setShowAccountInfo(true)}>
              {Icons.user} Informacje o koncie
            </button>
            <button className="sidebar-btn sidebar-btn--primary" onClick={onLogout}>
              {Icons.logout} Wyloguj się
            </button>
          </div>
        </div>
      </aside>
      <main className="dashboard-main">
        {renderContent()}
      </main>
    </div>
  );
}
