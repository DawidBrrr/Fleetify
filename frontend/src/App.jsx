import { useState } from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import FeatureGrid from "./components/FeatureGrid";
import LoginPanel from "./components/LoginPanel";
import DashboardPreview from "./components/DashboardPreview";
import Footer from "./components/Footer";
import { adminPanel, employeePanel, featureCards } from "./constants";

export default function App() {
  const [role, setRole] = useState("admin");

  return (
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
            <LoginPanel role={role} onRoleChange={setRole} />
          </div>
        </section>

        <section id="panels" className="py-5 py-lg-6">
          <div className="container-lg">
            <DashboardPreview role={role} adminData={adminPanel} employeeData={employeePanel} />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
