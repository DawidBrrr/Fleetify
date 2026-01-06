import { useState } from "react";

export default function AccountInfo({ user, onClose, onSubscriptionUpdate }) {
  const [step, setStep] = useState("info"); // info, plans, processing
  const [selectedPlan, setSelectedPlan] = useState(null);

  // Debug: log user data
  console.log("AccountInfo user data:", user);
  console.log("Subscription plan:", user.subscription_plan);
  console.log("Subscription active until:", user.subscription_active_until);

  const calculateDaysRemaining = () => {
    if (!user.subscription_active_until) return 0;
    const now = new Date();
    const activeUntil = new Date(user.subscription_active_until);
    const diffTime = activeUntil - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("pl-PL", { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getPlanName = (planId) => {
    const plans = {
      "1_month": "Plan Miesięczny",
      "6_months": "Plan 6 Miesięcy",
      "2_years": "Plan 2 Lata"
    };
    return plans[planId] || "Brak planu";
  };

  const handleSelectPlan = (planId) => {
    setSelectedPlan(planId);
    setStep("processing");
    
    // Simulate payment processing
    setTimeout(async () => {
      await onSubscriptionUpdate(planId);
      setStep("info");
      setSelectedPlan(null);
    }, 3000);
  };

  const daysRemaining = calculateDaysRemaining();
  const isActive = daysRemaining > 0;

  const plans = [
    {
      id: "1_month",
      name: "Plan Miesięczny",
      price: "199 zł",
      duration: "1 miesiąc",
    },
    {
      id: "6_months",
      name: "Plan 6 Miesięcy",
      price: "999 zł",
      duration: "6 miesięcy",
      pricePerMonth: "166 zł/mies.",
      savings: "16% taniej",
    },
    {
      id: "2_years",
      name: "Plan 2 Lata",
      price: "2999 zł",
      duration: "2 lata",
      pricePerMonth: "125 zł/mies.",
      savings: "37% taniej",
    },
  ];

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {step === "info" && "Informacje o koncie"}
              {step === "plans" && "Wybierz plan subskrypcji"}
              {step === "processing" && "Przetwarzanie płatności"}
            </h5>
            <button type="button" className="btn-close" onClick={onClose} disabled={step === "processing"}></button>
          </div>
          <div className="modal-body">
            {step === "processing" && (
              <div className="text-center py-5">
                <div className="spinner-border text-primary mb-4" role="status" style={{ width: '4rem', height: '4rem' }}>
                  <span className="visually-hidden">Przetwarzanie...</span>
                </div>
                <h4 className="mb-3">Przetwarzanie płatności</h4>
                <p className="text-muted">Proszę czekać, trwa weryfikacja płatności...</p>
                <div className="progress mt-4" style={{ height: '8px' }}>
                  <div className="progress-bar progress-bar-striped progress-bar-animated bg-primary" role="progressbar" style={{ width: '100%' }}></div>
                </div>
              </div>
            )}

            {step === "plans" && (
              <div>
                <p className="text-muted mb-4">Wybierz plan, który najlepiej odpowiada Twoim potrzebom</p>
                <div className="row g-3">
                  {plans.map((plan) => (
                    <div key={plan.id} className="col-md-4">
                      <div className="card h-100">
                        <div className="card-body text-center">
                          <h5 className="card-title">{plan.name}</h5>
                          <div className="mb-3">
                            <h3 className="text-primary">{plan.price}</h3>
                            <small className="text-muted">{plan.duration}</small>
                            {plan.pricePerMonth && <div className="small text-muted">({plan.pricePerMonth})</div>}
                          </div>
                          {plan.savings && <div className="badge bg-success mb-3">{plan.savings}</div>}
                          <button className="btn btn-primary btn-sm w-100" onClick={() => handleSelectPlan(plan.id)}>
                            Wybierz
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-center mt-3">
                  <button className="btn btn-link" onClick={() => setStep("info")}>← Wróć</button>
                </div>
              </div>
            )}

            {step === "info" && (
            <div>
              <div className="mb-4">
                <h6 className="text-muted mb-2">Dane użytkownika</h6>
                <p className="mb-1"><strong>Imię i nazwisko:</strong> {user.full_name}</p>
                <p className="mb-1"><strong>Email:</strong> {user.email}</p>
                <p className="mb-1"><strong>Rola:</strong> {user.role === 'admin' ? 'Administrator' : 'Pracownik'}</p>
              </div>

            {user.role === 'admin' && (
              <div className="mb-4">
                <h6 className="text-muted mb-2">Subskrypcja</h6>
                {user.subscription_plan ? (
                  <>
                    <p className="mb-1"><strong>Plan:</strong> {getPlanName(user.subscription_plan)}</p>
                    <p className="mb-1"><strong>Status:</strong> 
                      <span className={`ms-2 badge ${isActive ? 'bg-success' : 'bg-danger'}`}>
                        {isActive ? 'Aktywna' : 'Nieaktywna'}
                      </span>
                    </p>
                    <p className="mb-1"><strong>Ważna do:</strong> {formatDate(user.subscription_active_until)}</p>
                    <p className="mb-3">
                      <strong>Pozostało:</strong> 
                      <span className={`ms-2 ${daysRemaining < 7 ? 'text-danger' : 'text-success'}`}>
                        {daysRemaining} {daysRemaining === 1 ? 'dzień' : 'dni'}
                      </span>
                    </p>
                    {daysRemaining < 30 && (
                      <div className="alert alert-warning" role="alert">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        Twoja subskrypcja wkrótce wygaśnie. Przedłuż ją, aby zachować dostęp.
                      </div>
                    )}
                  </>
                ) : (
                  <div className="alert alert-info" role="alert">
                    Nie masz aktywnej subskrypcji.
                  </div>
                )}
              </div>
            )}

              <div className="mb-3">
                <h6 className="text-muted mb-2">Konto utworzone</h6>
                <p className="mb-0">{formatDate(user.created_at)}</p>
              </div>
            </div>
            )}
          </div>
          <div className="modal-footer">
            {step === "info" && user.role === 'admin' && (
              <button 
                type="button" 
                className="btn btn-primary bg-fleet-cyan border-0"
                onClick={() => setStep("plans")}
              >
                <i className="bi bi-arrow-repeat me-2"></i>
                Przedłuż subskrypcję
              </button>
            )}
            {step === "info" && (
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Zamknij
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
