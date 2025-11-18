import { useState } from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import FeatureGrid from "./components/FeatureGrid";
import LoginPanel from "./components/LoginPanel";
import DashboardPreview from "./components/DashboardPreview";
import Footer from "./components/Footer";
import DashboardPage from "./components/DashboardPage";
import TransitionOverlay from "./components/TransitionOverlay";
import { authApi, dashboardApi } from "./services/api";
import { adminPanel, employeePanel, featureCards } from "./constants";

export default function App() {
  const [previewRole, setPreviewRole] = useState("admin");
  const [session, setSession] = useState({ status: "loggedOut", user: null });
  const [dashboardData, setDashboardData] = useState(null);
  const [loginState, setLoginState] = useState({ loading: false, error: "" });
  const [viewMode, setViewMode] = useState("landing"); // landing | transition | dashboard

  const handleLogin = async ({ username, password }) => {
    setLoginState({ loading: true, error: "" });
    try {
      const loginData = await authApi.login({ username, password });
      const role = loginData.user.role === "employee" ? "employee" : "admin";
      localStorage.setItem("token", loginData.token);
      setSession({ status: "authenticated", user: loginData.user });
      setPreviewRole(role);
      setViewMode("transition");

      const dashboardResponse =
        role === "employee" ? await dashboardApi.fetchEmployee() : await dashboardApi.fetchAdmin();
      setDashboardData(dashboardResponse);
      setLoginState({ loading: false, error: "" });
      setTimeout(() => setViewMode("dashboard"), 1200);
    } catch (error) {
      setSession({ status: "loggedOut" });
      setDashboardData(null);
      localStorage.removeItem("token");
      setLoginState({ loading: false, error: error.message || "Nie udało się zalogować" });
      setViewMode("landing");
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.warn("Logout request failed", error);
    }
    localStorage.removeItem("token");
    setSession({ status: "loggedOut" });
    setDashboardData(null);
    setPreviewRole("admin");
    setViewMode("landing");
  };

  const showLanding = viewMode !== "dashboard";
  const showDashboard = viewMode === "dashboard" && session.status === "authenticated" && dashboardData;

  return (
    <>
      {showLanding && (
        <div className="bg-fleet-ice text-fleet-navy">
          <Header onLoginClick={() => document.getElementById("login")?.scrollIntoView({ behavior: "smooth" })} />
          <main>
            <Hero onCTAClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })} />

            <section id="features" className="py-5 py-lg-6">
              <div className="container-lg">
                <FeatureGrid cards={featureCards} />
              </div>
            </section>

            <section id="login" className="py-5">
              <div className="container-lg">
                <LoginPanel
                  role={previewRole}
                  onRoleChange={setPreviewRole}
                  onLogin={handleLogin}
                  loading={loginState.loading}
                  error={loginState.error}
                  session={session}
                  disabled={viewMode !== "landing"}
                />
              </div>
            </section>

            <section id="panels" className="py-5 py-lg-6">
              <div className="container-lg">
                <DashboardPreview role={previewRole} adminData={adminPanel} employeeData={employeePanel} />
              </div>
            </section>
          </main>
          <Footer />
        </div>
      )}

      {showDashboard && (
        <DashboardPage session={session} data={dashboardData} onLogout={handleLogout} />
      )}

      {viewMode === "transition" && session.user && (
        <TransitionOverlay user={session.user} />
      )}
    </>
  );
}
