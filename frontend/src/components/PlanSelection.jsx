export default function PlanSelection({ onSelectPlan, onBack }) {
  const plans = [
    {
      id: "1_month",
      name: "Plan Miesięczny",
      price: "199 zł",
      duration: "1 miesiąc",
      features: ["Pełny dostęp do platformy", "Zarządzanie flotą", "Analityka podstawowa", "Wsparcie e-mail"],
      popular: false,
    },
    {
      id: "6_months",
      name: "Plan 6 Miesięcy",
      price: "999 zł",
      duration: "6 miesięcy",
      pricePerMonth: "166 zł/mies.",
      features: ["Pełny dostęp do platformy", "Zarządzanie flotą", "Zaawansowana analityka", "Wsparcie priorytetowe", "Oszczędzasz 195 zł"],
      popular: true,
      savings: "16% taniej",
    },
    {
      id: "2_years",
      name: "Plan 2 Lata",
      price: "2999 zł",
      duration: "2 lata (24 miesiące)",
      pricePerMonth: "125 zł/mies.",
      features: ["Pełny dostęp do platformy", "Zarządzanie flotą", "Zaawansowana analityka", "Wsparcie 24/7", "Dedykowany menedżer konta", "Oszczędzasz 1777 zł"],
      popular: false,
      savings: "37% taniej",
    },
  ];

  return (
    <div className="min-vh-100 bg-fleet-ice d-flex flex-column">
      <main className="flex-grow-1 d-flex align-items-center py-5">
        <div className="container-lg">
          <div className="text-center mb-5">
            <h1 className="h2 mb-3">Wybierz plan subskrypcji</h1>
            <p className="text-muted">Wybierz plan, który najlepiej odpowiada Twoim potrzebom</p>
          </div>

          <div className="row g-4 justify-content-center">
            {plans.map((plan) => (
              <div key={plan.id} className="col-lg-4 col-md-6">
                <div className={`section-shell h-100 p-4 position-relative ${plan.popular ? 'border-primary border-3' : ''}`}>
                  {plan.popular && (
                    <div className="position-absolute top-0 start-50 translate-middle">
                      <span className="badge bg-primary px-3 py-2">Najpopularniejszy</span>
                    </div>
                  )}
                  
                  <div className="text-center mb-4 mt-3">
                    <h3 className="h4 mb-2">{plan.name}</h3>
                    <div className="mb-2">
                      <span className="h2 text-fleet-cyan fw-bold">{plan.price}</span>
                    </div>
                    <p className="text-muted mb-0">{plan.duration}</p>
                    {plan.pricePerMonth && (
                      <p className="text-muted small">({plan.pricePerMonth})</p>
                    )}
                    {plan.savings && (
                      <span className="badge bg-success mt-2">{plan.savings}</span>
                    )}
                  </div>

                  <ul className="list-unstyled mb-4">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="mb-2 d-flex align-items-start">
                        <span className="text-success me-2">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    className={`btn btn-lg w-100 ${plan.popular ? 'btn-primary bg-fleet-cyan border-0' : 'btn-outline-primary'}`}
                    onClick={() => onSelectPlan(plan.id)}
                  >
                    Wybierz plan
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-4">
            <button type="button" className="btn btn-link text-muted" onClick={onBack}>
              ← Wróć do rejestracji
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
