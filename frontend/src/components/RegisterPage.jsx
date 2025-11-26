import { useState } from "react";
import logo from "../assets/logo.svg";

export default function RegisterPage({ onRegister, onBack, loading, error }) {
  const [form, setForm] = useState({ fullName: "", email: "", password: "", role: "employee" });

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (loading) return;
    onRegister(form);
  };

  return (
    <div className="min-vh-100 bg-fleet-ice d-flex flex-column">
      <header className="border-bottom bg-white py-3 shadow-sm">
        <div className="container-lg d-flex align-items-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-2">
            <img src={logo} alt="Fleetify" width="38" height="38" />
            <div>
              <span className="fw-bold text-uppercase text-fleet-cyan">Fleetify</span>
              <p className="mb-0 small text-muted">Inteligentna flota</p>
            </div>
          </div>
          <div className="d-flex gap-2">
            <button type="button" className="btn btn-outline-secondary" onClick={onBack}>
              ← Wróć do strony głównej
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow-1 d-flex align-items-center py-5">
        <div className="container-lg">
          <div className="row justify-content-center">
            <div className="col-lg-8 col-xl-7">
              <div className="section-shell p-4 p-lg-5">
                <p className="text-uppercase text-muted mb-2">Dołącz do Fleetify</p>
                <h1 className="h2 mb-4">Utwórz konto i zacznij zarządzać flotą szybciej</h1>
                <form className="row gy-4" onSubmit={handleSubmit}>
                  <div className="col-12 col-md-6">
                    <label className="form-label">Imię i nazwisko</label>
                    <input
                      type="text"
                      className="form-control form-control-lg"
                      value={form.fullName}
                      onChange={handleChange("fullName")}
                      placeholder="np. Jan Kowalski"
                      required
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label">Adres e-mail</label>
                    <input
                      type="email"
                      className="form-control form-control-lg"
                      value={form.email}
                      onChange={handleChange("email")}
                      placeholder="np. jan@firma.pl"
                      required
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label">Hasło</label>
                    <input
                      type="password"
                      className="form-control form-control-lg"
                      value={form.password}
                      onChange={handleChange("password")}
                      placeholder="Minimum 6 znaków"
                      minLength={6}
                      required
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label">Rola użytkownika</label>
                    <select
                      className="form-select form-select-lg"
                      value={form.role}
                      onChange={handleChange("role")}
                    >
                      <option value="employee">Pracownik</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                  <div className="col-12">
                    <button
                      type="submit"
                      className="btn btn-lg btn-primary bg-fleet-cyan border-0 w-100"
                      disabled={loading}
                    >
                      {loading ? "Tworzenie konta..." : "Zarejestruj się"}
                    </button>
                  </div>
                </form>
                {error && (
                  <div className="alert alert-danger mt-4 mb-0" role="alert">
                    {error}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
