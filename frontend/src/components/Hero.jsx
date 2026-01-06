import hero from "../assets/hero-vehicle.svg";

export default function Hero({ onCTAClick }) {
  return (
    <section className="gradient-hero text-white py-5 py-lg-6">
      <div className="container-lg">
        <div className="row align-items-center g-4">
          <div className="col-lg-6">
            <p className="text-uppercase text-fleet-cyan fw-semibold mb-3">Platforma FleetOps 2.0</p>
            <h1 className="display-4 fw-bold lh-sm">
              Kontroluj całą flotę <span className="text-fleet-cyan">z jednego panelu</span>
            </h1>
            <p className="lead text-white-50 mt-3">
              Fleetify łączy dane pojazdów, zespołów i finansów, dostarczając gotowe rekomendacje
              i automatyzacje zasilane analityką predykcyjną.
            </p>
            <div className="d-flex flex-column flex-sm-row gap-3 mt-4">
              <button className="btn btn-lg btn-light text-fleet-navy px-4" onClick={onCTAClick}>
                Sprawdź funkcje
              </button>
              <button className="btn btn-lg btn-outline-light px-4" onClick={() => document.getElementById("login")?.scrollIntoView({ behavior: "smooth" })}>
                Zaloguj się
              </button>
            </div>
            <div className="d-flex gap-4 mt-5 text-white-50 small">
              <div>
                <h3 className="h2 text-white mb-0">12k+</h3>
                <p className="mb-0">Pojazdów monitorowanych dziennie</p>
              </div>
              <div>
                <h3 className="h2 text-white mb-0">42%</h3>
                <p className="mb-0">Szybsze decyzje serwisowe</p>
              </div>
              <div>
                <h3 className="h2 text-white mb-0">&lt;2 min</h3>
                <p className="mb-0">Średni czas reakcji</p>
              </div>
            </div>
          </div>
          <div className="col-lg-6">
            <div className="glass-panel rounded-4 p-4 position-relative overflow-hidden">
              <span className="badge bg-fleet-cyan text-dark mb-3">Nowość 2026</span>
              <h3 className="h4 text-white">Asystent decyzji FleetAI</h3>
              <p className="text-white-50">
                Inteligentne scenariusze wykorzystujące historię kosztów i telemetrii, aby sugerować optymalne działania.
              </p>
              <img src={hero} alt="Panel Fleetify" className="img-fluid rounded-4 shadow-lg" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
