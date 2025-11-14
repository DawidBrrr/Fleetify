import { useState } from "react";

export default function LoginPanel({ role, onRoleChange }) {
  const [message, setMessage] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    setMessage(
      role === "admin"
        ? "Witaj w panelu administratora Fleetify. Wkrótce przejdziesz do dashboardu."
        : "Witaj w panelu kierowcy. Twoje pojazdy są już zsynchronizowane."
    );
  };

  return (
    <div className="row g-4 align-items-center">
      <div className="col-lg-6">
        <div className="section-shell p-4 p-lg-5 h-100">
          <div className="d-flex gap-2 mb-4">
            {[
              { key: "admin", label: "Administrator" },
              { key: "employee", label: "Pracownik" }
            ].map((option) => (
              <button
                key={option.key}
                type="button"
                className={`btn flex-fill rounded-pill ${
                  role === option.key ? "btn-dark" : "btn-outline-secondary"
                }`}
                onClick={() => onRoleChange(option.key)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <form className="row gy-3" onSubmit={handleSubmit}>
            <div className="col-12">
              <label className="form-label">Adres e-mail</label>
              <input type="email" className="form-control form-control-lg" placeholder="np. fleet@fleetify.io" required />
            </div>
            <div className="col-12">
              <label className="form-label">Hasło</label>
              <input type="password" className="form-control form-control-lg" placeholder="••••••••" required />
            </div>
            <div className="col-12 d-flex justify-content-between align-items-center">
              <div className="form-check">
                <input className="form-check-input" type="checkbox" id="remember" />
                <label className="form-check-label" htmlFor="remember">
                  Zapamiętaj mnie
                </label>
              </div>
              <a className="text-decoration-none" href="#reset">
                Zapomniałem hasła
              </a>
            </div>
            <div className="col-12 d-grid">
              <button type="submit" className="btn btn-lg btn-primary bg-fleet-cyan border-0">
                Wejdź do panelu
              </button>
            </div>
          </form>
          {message && <div className="alert alert-success mt-4 mb-0">{message}</div>}
        </div>
      </div>
      <div className="col-lg-6">
        <div className="section-shell p-4 p-lg-5 h-100 d-flex flex-column gap-3">
          <h3 className="h4">Logowanie SSO z kontrolą dostępu</h3>
          <ul className="list-unstyled d-flex flex-column gap-3 text-muted">
            <li>• Oparte o Django + OpenID Connect</li>
            <li>• MFA, WebAuthn i klucze bezpieczeństwa</li>
            <li>• Role-based access i pełny audyt logowań</li>
          </ul>
          <div className="d-flex gap-3">
            <div className="flex-fill mini-panel">
              <span className="text-uppercase text-muted small">Aktywne sesje</span>
              <p className="display-6 fw-bold mb-0">56</p>
              <small className="text-success">+12% vs. wczoraj</small>
            </div>
            <div className="flex-fill mini-panel">
              <span className="text-uppercase text-muted small">Średni czas log.</span>
              <p className="display-6 fw-bold mb-0">3.2s</p>
              <small className="text-success">SSO Azure AD</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
