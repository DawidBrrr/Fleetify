export default function Footer() {
  return (
    <footer className="py-5 border-top border-light bg-white">
      <div className="container-lg d-flex flex-column flex-lg-row justify-content-between gap-3">
        <div>
          <h5 className="fw-bold">Fleetify</h5>
          <p className="text-muted mb-0">© {new Date().getFullYear()} Wszystkie prawa zastrzeżone.</p>
        </div>
        <div className="d-flex gap-4 text-muted">
          <a href="#" className="text-decoration-none">Polityka prywatności</a>
          <a href="#" className="text-decoration-none">Status systemu</a>
          <a href="#" className="text-decoration-none">Kontakt sprzedażowy</a>
        </div>
      </div>
    </footer>
  );
}
