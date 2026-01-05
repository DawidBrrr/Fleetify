import { useEffect } from "react";

export default function PaymentProcessing({ onComplete }) {
  useEffect(() => {
    // Simulate payment processing
    const timer = setTimeout(() => {
      onComplete();
    }, 3000); // 3 seconds

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="min-vh-100 bg-fleet-ice d-flex flex-column align-items-center justify-content-center">
      <div className="section-shell p-5 text-center" style={{ maxWidth: '500px' }}>
        <div className="mb-4">
          <div className="spinner-border text-primary" role="status" style={{ width: '4rem', height: '4rem' }}>
            <span className="visually-hidden">Przetwarzanie...</span>
          </div>
        </div>
        <h2 className="h3 mb-3">Przetwarzanie płatności</h2>
        <p className="text-muted mb-0">
          Proszę czekać, trwa weryfikacja płatności...
        </p>
        <div className="mt-4">
          <div className="progress" style={{ height: '8px' }}>
            <div 
              className="progress-bar progress-bar-striped progress-bar-animated bg-primary" 
              role="progressbar" 
              style={{ width: '100%' }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
