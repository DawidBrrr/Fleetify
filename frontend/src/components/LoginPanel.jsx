import { useEffect, useState, useMemo } from "react";

// Helper to detect lockout vs remaining attempts
function parseLoginError(error) {
  if (!error) return null;
  
  const isLocked = error.toLowerCase().includes('locked') || error.toLowerCase().includes('zablokowane');
  const attemptsMatch = error.match(/(\d+)\s*(attempts?|prób)/i);
  const remainingAttempts = attemptsMatch ? parseInt(attemptsMatch[1], 10) : null;
  
  return {
    message: error,
    isLocked,
    remainingAttempts,
  };
}

export default function LoginPanel({ role, onRoleChange, onLogin, loading, error, session, disabled }) {
  const [credentials, setCredentials] = useState({ username: "admin", password: "admin" });

  // Parse error for special handling
  const errorInfo = useMemo(() => parseLoginError(error), [error]);

  useEffect(() => {
    if (session.status !== "authenticated") {
      setCredentials({ username: role === "admin" ? "admin@fleetify.io" : "Kowalski@firma.pl", password: role === "admin" ? "adminadmin" : "Kowalski" });
    }
  }, [role, session.status]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (disabled) return;
    onLogin(credentials);
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
                disabled={disabled}
              >
                {option.label}
              </button>
            ))}
          </div>
          <form className="row gy-3" onSubmit={handleSubmit}>
            <div className="col-12">
              <label className="form-label">Login lub e-mail</label>
              <input
                type="text"
                className="form-control form-control-lg"
                value={credentials.username}
                onChange={(event) => setCredentials((prev) => ({ ...prev, username: event.target.value }))}
                placeholder="np. admin"
                required
                disabled={disabled}
              />
            </div>
            <div className="col-12">
              <label className="form-label">Hasło</label>
              <input
                type="password"
                className="form-control form-control-lg"
                value={credentials.password}
                onChange={(event) => setCredentials((prev) => ({ ...prev, password: event.target.value }))}
                placeholder="np. admin"
                required
                disabled={disabled}
              />
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
            <div className="col-12">
              <button
                type="submit"
                className="btn btn-lg btn-primary bg-fleet-cyan border-0 w-100"
                disabled={loading || disabled}
              >
                {loading ? "Logowanie..." : disabled ? "Ładowanie..." : "Wejdź do panelu"}
              </button>
            </div>
          </form>
          {errorInfo && (
            <div className={`alert mt-4 mb-0 ${errorInfo.isLocked ? 'alert-warning' : 'alert-danger'}`} role="alert">
              {errorInfo.isLocked ? (
                <div className="d-flex align-items-center gap-2">
                  <span className="fs-4">🔒</span>
                  <div>
                    <strong>Konto tymczasowo zablokowane</strong>
                    <p className="mb-0 small">{errorInfo.message}</p>
                  </div>
                </div>
              ) : (
                <div>
                  <div>{errorInfo.message}</div>
                  {errorInfo.remainingAttempts !== null && errorInfo.remainingAttempts <= 3 && (
                    <div className="mt-2 d-flex align-items-center gap-2">
                      <span className="badge bg-warning text-dark">
                        ⚠️ Pozostało prób: {errorInfo.remainingAttempts}
                      </span>
                      <small className="text-muted">
                        Po {errorInfo.remainingAttempts} nieudanych próbach konto zostanie zablokowane.
                      </small>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {session.status === "authenticated" && session.user && !error && (
            <div className="alert alert-success mt-4 mb-0" role="status">
              Witaj ponownie, {session.user.name}! Twoja sesja jest aktywna.
            </div>
          )}
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
