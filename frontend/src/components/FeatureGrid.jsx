export default function FeatureGrid({ cards }) {
  return (
    <div className="section-shell p-4 p-lg-5">
      <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3 mb-4">
        <div>
          <p className="text-uppercase text-fleet-cyan fw-semibold mb-2">Dlaczego Fleetify?</p>
          <h2 className="mb-0">Pełna kontrola od onboardingu po serwis</h2>
        </div>
        <p className="text-muted mb-0 max-w-420">
          Modułowa architektura mikroserwisowa i API-first umożliwiają szybkie dopinanie kolejnych systemów.
        </p>
      </div>
      <div className="row g-4">
        {cards.map(({ icon: Icon, title, description, badge }) => (
          <div key={title} className="col-12 col-md-6">
            <div className="card h-100 border-0 shadow-sm rounded-4 p-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="icon-circle">
                  <Icon size={24} />
                </div>
                <span className="badge rounded-pill bg-fleet-cyan text-dark">{badge}</span>
              </div>
              <h3 className="h5">{title}</h3>
              <p className="text-muted mb-0">{description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
