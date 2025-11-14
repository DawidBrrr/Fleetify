import logo from "../assets/logo.svg";

export default function Header({ onLoginClick }) {
  return (
    <header className="position-sticky top-0 z-50 bg-fleet-ice/95 border-bottom border-light shadow-sm">
      <div className="container-lg py-3 d-flex align-items-center justify-content-between gap-3">
        <div className="d-flex align-items-center gap-2">
          <img src={logo} alt="Fleetify" width="42" height="42" />
          <div>
            <span className="fw-bold text-uppercase text-fleet-cyan">Fleetify</span>
            <p className="mb-0 small text-muted">Inteligentna flota</p>
          </div>
        </div>

        <nav className="d-none d-lg-flex gap-4 fw-medium">
          <a href="#features" className="text-decoration-none text-dark">Funkcje</a>
          <a href="#login" className="text-decoration-none text-dark">Logowanie</a>
          <a href="#panels" className="text-decoration-none text-dark">Panele</a>
        </nav>

        <div className="d-flex gap-2">
          <button className="btn btn-link text-decoration-none text-dark">EN</button>
          <button className="btn btn-primary px-4 rounded-pill bg-fleet-cyan border-0" onClick={onLoginClick}>
            Zaloguj
          </button>
        </div>
      </div>
    </header>
  );
}
