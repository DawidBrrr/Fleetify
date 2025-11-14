export default function TransitionOverlay({ user }) {
  return (
    <div className="loading-overlay">
      <div className="loading-card">
        <div className="loading-spinner" aria-hidden="true"></div>
        <p className="text-uppercase text-muted small mb-2">Ładowanie</p>
        <h2 className="h4 mb-2">Przygotowujemy kokpit dla {user?.name?.split(" ")[0] ?? "Ciebie"}</h2>
        <p className="text-muted mb-0">Synchronizujemy dane floty i preferencje użytkownika...</p>
      </div>
    </div>
  );
}
