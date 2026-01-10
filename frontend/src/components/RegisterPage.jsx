import { useState, useMemo } from "react";
import logo from "../assets/logo.svg";
import PlanSelection from "./PlanSelection";
import PaymentProcessing from "./PaymentProcessing";

// Password validation helper
function validatePassword(password) {
  return {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasDigit: /\d/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\;'`~]/.test(password),
  };
}

function PasswordRequirement({ met, label }) {
  return (
    <div className={`d-flex align-items-center gap-2 small ${met ? 'text-success' : 'text-muted'}`}>
      <span>{met ? '✓' : '○'}</span>
      <span>{label}</span>
    </div>
  );
}

export default function RegisterPage({ onRegister, onBack, loading, error }) {
  const [form, setForm] = useState({ fullName: "", email: "", password: "", role: "employee" });
  const [step, setStep] = useState("form"); // form, plans, payment
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Calculate password validation state
  const passwordValidation = useMemo(() => validatePassword(form.password), [form.password]);
  const isPasswordValid = Object.values(passwordValidation).every(Boolean);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (loading) return;
    
    // If admin, show plan selection
    if (form.role === "admin") {
      setStep("plans");
    } else {
      // Employees register for free
      onRegister(form);
    }
  };

  const handleSelectPlan = (planId) => {
    setSelectedPlan(planId);
    setStep("payment");
  };

  const handlePaymentComplete = () => {
    setStep("form");
    // Register with selected plan
    onRegister({ ...form, subscription_plan: selectedPlan });
  };

  if (step === "payment") {
    return <PaymentProcessing onComplete={handlePaymentComplete} />;
  }

  if (step === "plans") {
    return (
      <PlanSelection 
        onSelectPlan={handleSelectPlan}
        onBack={() => setStep("form")}
      />
    );
  }

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
                      className={`form-control form-control-lg ${form.password && (isPasswordValid ? 'is-valid' : 'is-invalid')}`}
                      value={form.password}
                      onChange={handleChange("password")}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      placeholder="Minimum 8 znaków"
                      minLength={8}
                      required
                    />
                    {(passwordFocused || form.password) && (
                      <div className="mt-2 p-2 bg-light rounded border">
                        <div className="small fw-semibold mb-1">Wymagania hasła:</div>
                        <PasswordRequirement met={passwordValidation.minLength} label="Minimum 8 znaków" />
                        <PasswordRequirement met={passwordValidation.hasUppercase} label="Wielka litera (A-Z)" />
                        <PasswordRequirement met={passwordValidation.hasLowercase} label="Mała litera (a-z)" />
                        <PasswordRequirement met={passwordValidation.hasDigit} label="Cyfra (0-9)" />
                        <PasswordRequirement met={passwordValidation.hasSpecial} label="Znak specjalny (!@#$%^&*)" />
                      </div>
                    )}
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
