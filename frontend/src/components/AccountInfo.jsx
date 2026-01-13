import { useState } from "react";

/* ───────────────────────────────────────────────────────── */
/*  SVG Icons                                                */
/* ───────────────────────────────────────────────────────── */
const Icons = {
  close: (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12"/>
    </svg>
  ),
  user: (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"/>
    </svg>
  ),
  subscription: (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z"/>
    </svg>
  ),
  calendar: (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"/>
    </svg>
  ),
  refresh: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"/>
    </svg>
  ),
  arrowLeft: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"/>
    </svg>
  ),
  check: (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5"/>
    </svg>
  ),
  warning: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"/>
    </svg>
  ),
};

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
      popular: true,
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
    <div className="vp-modal-overlay" onClick={onClose}>
      <div className="vp-modal vp-modal--lg" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="vp-modal__header">
          <h2 className="vp-modal__title">
            {step === "info" && "Informacje o koncie"}
            {step === "plans" && "Wybierz plan subskrypcji"}
            {step === "processing" && "Przetwarzanie płatności"}
          </h2>
          <button 
            className="vp-modal__close" 
            onClick={onClose} 
            disabled={step === "processing"}
            aria-label="Zamknij"
          >
            {Icons.close}
          </button>
        </div>

        {/* Body */}
        <div className="vp-modal__body">
          {/* Processing Step */}
          {step === "processing" && (
            <div className="vp-processing-state">
              <div className="vp-spinner vp-spinner--xl"></div>
              <h3 className="vp-processing-state__title">Przetwarzanie płatności</h3>
              <p className="vp-processing-state__text">Proszę czekać, trwa weryfikacja płatności...</p>
              <div className="vp-progress-bar">
                <div className="vp-progress-bar__fill vp-progress-bar__fill--animated"></div>
              </div>
            </div>
          )}

          {/* Plans Step */}
          {step === "plans" && (
            <div className="vp-plans-section">
              <p className="vp-plans-section__intro">
                Wybierz plan, który najlepiej odpowiada Twoim potrzebom
              </p>
              <div className="vp-plans-grid">
                {plans.map((plan) => (
                  <div 
                    key={plan.id} 
                    className={`vp-plan-card ${plan.popular ? 'vp-plan-card--popular' : ''}`}
                  >
                    {plan.popular && <div className="vp-plan-card__badge">Najpopularniejszy</div>}
                    <h4 className="vp-plan-card__name">{plan.name}</h4>
                    <div className="vp-plan-card__price">{plan.price}</div>
                    <div className="vp-plan-card__duration">{plan.duration}</div>
                    {plan.pricePerMonth && (
                      <div className="vp-plan-card__monthly">({plan.pricePerMonth})</div>
                    )}
                    {plan.savings && (
                      <div className="vp-plan-card__savings">{plan.savings}</div>
                    )}
                    <button 
                      className="vp-btn vp-btn--primary vp-btn--sm vp-plan-card__btn"
                      onClick={() => handleSelectPlan(plan.id)}
                    >
                      Wybierz
                    </button>
                  </div>
                ))}
              </div>
              <div className="vp-plans-section__back">
                <button className="vp-btn vp-btn--ghost" onClick={() => setStep("info")}>
                  {Icons.arrowLeft} Wróć
                </button>
              </div>
            </div>
          )}

          {/* Info Step */}
          {step === "info" && (
            <div className="vp-account-info">
              {/* User Data Section */}
              <div className="vp-info-section">
                <div className="vp-info-section__header">
                  <span className="vp-info-section__icon">{Icons.user}</span>
                  <h3 className="vp-info-section__title">Dane użytkownika</h3>
                </div>
                <div className="vp-info-grid">
                  <div className="vp-info-row">
                    <span className="vp-info-row__label">Imię i nazwisko</span>
                    <span className="vp-info-row__value">{user.full_name}</span>
                  </div>
                  <div className="vp-info-row">
                    <span className="vp-info-row__label">Email</span>
                    <span className="vp-info-row__value">{user.email}</span>
                  </div>
                  <div className="vp-info-row">
                    <span className="vp-info-row__label">Rola</span>
                    <span className="vp-info-row__value">
                      <span className={`vp-role-badge vp-role-badge--${user.role}`}>
                        {user.role === 'admin' ? 'Administrator' : 'Pracownik'}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Subscription Section (admin only) */}
              {user.role === 'admin' && (
                <div className="vp-info-section">
                  <div className="vp-info-section__header">
                    <span className="vp-info-section__icon">{Icons.subscription}</span>
                    <h3 className="vp-info-section__title">Subskrypcja</h3>
                  </div>
                  {user.subscription_plan ? (
                    <div className="vp-info-grid">
                      <div className="vp-info-row">
                        <span className="vp-info-row__label">Plan</span>
                        <span className="vp-info-row__value">{getPlanName(user.subscription_plan)}</span>
                      </div>
                      <div className="vp-info-row">
                        <span className="vp-info-row__label">Status</span>
                        <span className="vp-info-row__value">
                          <span className={`vp-status vp-status--${isActive ? 'success' : 'danger'}`}>
                            {isActive ? 'Aktywna' : 'Nieaktywna'}
                          </span>
                        </span>
                      </div>
                      <div className="vp-info-row">
                        <span className="vp-info-row__label">Ważna do</span>
                        <span className="vp-info-row__value">{formatDate(user.subscription_active_until)}</span>
                      </div>
                      <div className="vp-info-row">
                        <span className="vp-info-row__label">Pozostało</span>
                        <span className={`vp-info-row__value vp-text--${daysRemaining < 7 ? 'danger' : 'success'}`}>
                          {daysRemaining} {daysRemaining === 1 ? 'dzień' : 'dni'}
                        </span>
                      </div>
                      {daysRemaining < 30 && (
                        <div className="vp-alert vp-alert--warning">
                          {Icons.warning}
                          <span>Twoja subskrypcja wkrótce wygaśnie. Przedłuż ją, aby zachować dostęp.</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="vp-alert vp-alert--info">
                      Nie masz aktywnej subskrypcji.
                    </div>
                  )}
                </div>
              )}

              {/* Account Created Section */}
              <div className="vp-info-section">
                <div className="vp-info-section__header">
                  <span className="vp-info-section__icon">{Icons.calendar}</span>
                  <h3 className="vp-info-section__title">Konto utworzone</h3>
                </div>
                <p className="vp-info-date">{formatDate(user.created_at)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="vp-modal__footer">
          {step === "info" && user.role === 'admin' && (
            <button 
              type="button" 
              className="vp-btn vp-btn--primary"
              onClick={() => setStep("plans")}
            >
              {Icons.refresh} Przedłuż subskrypcję
            </button>
          )}
          {step === "info" && (
            <button type="button" className="vp-btn vp-btn--outline" onClick={onClose}>
              Zamknij
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
