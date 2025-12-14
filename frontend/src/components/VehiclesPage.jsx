import React, { useState, useEffect } from 'react';
import { dashboardApi } from '../services/api/dashboard';

const statusLabels = {
  available: 'Dostępny',
  in_use: 'W użyciu',
  maintenance: 'W serwisie',
  assigned: 'Przydzielone',
};

const statusVariants = {
  available: 'success',
  in_use: 'warning',
  maintenance: 'danger',
  assigned: 'info',
};

const getVehicleIcon = (fuelType) => {
  if (fuelType === 'electric') return 'bi-lightning-charge';
  if (fuelType === 'hybrid') return 'bi-ev-front';
  if (fuelType === 'diesel') return 'bi-droplet-half';
  return 'bi-fuel-pump';
};

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('pl-PL');
};

const createTripForm = () => ({
  route_label: '',
  distance_km: '',
  fuel_used_l: '',
  fuel_cost: '',
  tolls_cost: '',
  notes: '',
});

const createFuelForm = () => ({
  liters: '',
  price_per_liter: '',
  total_cost: '',
  station: '',
  odometer: '',
  notes: '',
});

const createIssueForm = () => ({
  title: '',
  description: '',
  severity: 'medium',
});

const parseNumber = (value) => {
  if (value === '' || value === null || value === undefined) return undefined;
  const normalized = String(value).replace(/\s+/g, '').replace(/,/g, '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const parseInteger = (value) => {
  const parsed = parseNumber(value);
  return parsed === undefined ? undefined : Math.round(parsed);
};

const getVehicleLabel = (vehicle) => {
  const make = vehicle?.make || '';
  const model = vehicle?.model || '';
  const label = `${make} ${model}`.trim();
  return label || 'Pojazd';
};

const buildLogContext = (vehicle, user) => {
  const rawId = vehicle?.id ?? vehicle?.vehicle_id;
  return {
    vehicleId: rawId !== undefined && rawId !== null ? String(rawId) : null,
    vehicleLabel: getVehicleLabel(vehicle),
    targetUserId: vehicle?.current_driver_id || user?.id || null,
  };
};

export default function VehiclesPage({ role = 'admin', user }) {
  const isAdmin = role === 'admin';
  const canLogUsage = role === 'admin' || role === 'worker';
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    vin: '',
    license_plate: '',
    fuel_type: 'gasoline',
    odometer: '',
    fuel_capacity: '',
    fuel_level: '',
    battery_level: '',
  });
  const [activeVehicleId, setActiveVehicleId] = useState(null);
  const [issuesByVehicle, setIssuesByVehicle] = useState({});
  const [issuesLoading, setIssuesLoading] = useState({});
  const [tripForms, setTripForms] = useState({});
  const [fuelForms, setFuelForms] = useState({});
  const [issueForms, setIssueForms] = useState({});
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    loadVehicles();
  }, [role]);

  const showBanner = (type, message) => {
    setBanner({ type, message });
    setTimeout(() => setBanner(null), 3500);
  };

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const data = isAdmin ? await dashboardApi.fetchVehicles() : await dashboardApi.fetchMyVehicles();
      setVehicles(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load vehicles:', error);
      showBanner('error', 'Nie udało się pobrać listy pojazdów');
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicleIssues = async (vehicleId) => {
    setIssuesLoading((prev) => ({ ...prev, [vehicleId]: true }));
    try {
      const issues = await dashboardApi.fetchVehicleIssues(vehicleId);
      setIssuesByVehicle((prev) => ({ ...prev, [vehicleId]: issues }));
    } catch (error) {
      console.error('Failed to load issues', error);
      showBanner('error', 'Nie udało się pobrać zgłoszeń dla pojazdu');
    } finally {
      setIssuesLoading((prev) => ({ ...prev, [vehicleId]: false }));
    }
  };

  const toggleVehicle = (vehicleId) => {
    const nextId = activeVehicleId === vehicleId ? null : vehicleId;
    setActiveVehicleId(nextId);
    if (nextId && !issuesByVehicle[nextId]) {
      fetchVehicleIssues(nextId);
    }
  };

  const handleVehicleFieldChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const normalizeNumber = (value) => {
    if (value === '' || value === null || value === undefined) return undefined;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  };

  const handleVehicleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      year: Number(formData.year) || new Date().getFullYear(),
      odometer: normalizeNumber(formData.odometer),
      fuel_capacity: normalizeNumber(formData.fuel_capacity),
      fuel_level: normalizeNumber(formData.fuel_level),
      battery_level: normalizeNumber(formData.battery_level),
    };
    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined) {
        delete payload[key];
      }
    });
    try {
      await dashboardApi.addVehicle(payload);
      setShowForm(false);
      setFormData({
        make: '',
        model: '',
        year: new Date().getFullYear(),
        vin: '',
        license_plate: '',
        fuel_type: 'gasoline',
        odometer: '',
        fuel_capacity: '',
        fuel_level: '',
        battery_level: '',
      });
      showBanner('success', 'Pojazd został dodany');
      loadVehicles();
    } catch (error) {
      console.error('Failed to add vehicle:', error);
      showBanner('error', 'Nie udało się dodać pojazdu');
    }
  };

  const updateFormState = (setter, creator) => (vehicleId, field, value) => {
    setter((prev) => {
      const current = prev[vehicleId] ? { ...prev[vehicleId] } : creator();
      current[field] = value;
      return { ...prev, [vehicleId]: current };
    });
  };

  const handleTripChange = updateFormState(setTripForms, createTripForm);
  const handleFuelChange = updateFormState(setFuelForms, createFuelForm);
  const handleIssueChange = updateFormState(setIssueForms, createIssueForm);

  const handleTripSubmit = async (event, vehicle) => {
    event.preventDefault();
    const form = tripForms[vehicle.id] || createTripForm();
    const distanceValue = parseNumber(form.distance_km);
    if (distanceValue === undefined) {
      showBanner('error', 'Podaj prawidłowy dystans (km).');
      return;
    }
    const { vehicleId, vehicleLabel, targetUserId } = buildLogContext(vehicle, user);
    if (!vehicleId || !targetUserId) {
      showBanner('error', 'Brakuje danych pojazdu lub pracownika do zapisania przejazdu.');
      return;
    }
    try {
      await dashboardApi.createTripLog({
        user_id: targetUserId,
        vehicle_id: vehicleId,
        vehicle_label: vehicleLabel,
        route_label: form.route_label,
        distance_km: distanceValue,
        fuel_used_l: parseNumber(form.fuel_used_l),
        fuel_cost: parseNumber(form.fuel_cost),
        tolls_cost: parseNumber(form.tolls_cost),
        notes: form.notes,
      });
      setTripForms((prev) => ({ ...prev, [vehicle.id]: createTripForm() }));
      showBanner('success', 'Przejazd zapisany');
    } catch (error) {
      console.error('Failed to log trip', error);
      showBanner('error', 'Nie udało się zapisać przejazdu');
    }
  };

  const handleFuelSubmit = async (event, vehicle) => {
    event.preventDefault();
    const form = fuelForms[vehicle.id] || createFuelForm();
    const litersValue = parseNumber(form.liters);
    if (litersValue === undefined) {
      showBanner('error', 'Podaj prawidłową ilość paliwa (L).');
      return;
    }
    const { vehicleId, vehicleLabel, targetUserId } = buildLogContext(vehicle, user);
    if (!vehicleId || !targetUserId) {
      showBanner('error', 'Brakuje danych pojazdu lub pracownika do zapisania tankowania.');
      return;
    }
    try {
      await dashboardApi.createFuelLog({
        user_id: targetUserId,
        vehicle_id: vehicleId,
        vehicle_label: vehicleLabel,
        liters: litersValue,
        price_per_liter: parseNumber(form.price_per_liter),
        total_cost: parseNumber(form.total_cost),
        station: form.station,
        odometer: parseInteger(form.odometer),
        notes: form.notes,
      });
      setFuelForms((prev) => ({ ...prev, [vehicle.id]: createFuelForm() }));
      showBanner('success', 'Tankowanie zapisane');
    } catch (error) {
      console.error('Failed to log fuel', error);
      showBanner('error', 'Nie udało się zapisać tankowania');
    }
  };

  const handleIssueSubmit = async (event, vehicle) => {
    event.preventDefault();
    const form = issueForms[vehicle.id] || createIssueForm();
    try {
      await dashboardApi.reportVehicleIssue(vehicle.id, {
        title: form.title,
        description: form.description,
        severity: form.severity,
        reporter_id: user?.id,
      });
      setIssueForms((prev) => ({ ...prev, [vehicle.id]: createIssueForm() }));
      showBanner('success', 'Zgłoszenie wysłane do administratorów');
      fetchVehicleIssues(vehicle.id);
    } catch (error) {
      console.error('Failed to create issue', error);
      showBanner('error', 'Nie udało się zgłosić problemu');
    }
  };

  const handleResolveIssue = async (vehicleId, issueId) => {
    try {
      await dashboardApi.updateVehicleIssue(vehicleId, issueId, {
        status: 'resolved',
        resolved_at: new Date().toISOString(),
      });
      showBanner('success', 'Zgłoszenie zostało zamknięte');
      fetchVehicleIssues(vehicleId);
    } catch (error) {
      console.error('Failed to resolve issue', error);
      showBanner('error', 'Nie udało się zamknąć zgłoszenia');
    }
  };

  const renderIssues = (vehicle) => {
    const issues = issuesByVehicle[vehicle.id] || vehicle.issues || [];
    if (issuesLoading[vehicle.id]) {
      return <div className="text-muted small">Ładowanie zgłoszeń...</div>;
    }
    if (!issues.length) {
      return <div className="text-muted small">Brak zgłoszeń dla tego pojazdu.</div>;
    }
    return (
      <ul className="list-unstyled d-flex flex-column gap-2 mt-2 mb-0">
        {issues.map((issue) => (
          <li key={issue.id} className="border rounded-3 p-3">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <strong>{issue.title}</strong>
              <span className={`badge bg-${issue.status === 'resolved' ? 'success' : 'danger'}`}>
                {issue.status === 'resolved' ? 'Zamknięte' : 'Otwarte'}
              </span>
              {isAdmin && issue.status !== 'resolved' && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-success"
                  onClick={() => handleResolveIssue(vehicle.id, issue.id)}
                >
                  Oznacz jako rozwiązane
                </button>
              )}
            </div>
            <p className="mb-2 small text-muted" title={issue.description}>{issue.description}</p>
            <div className="d-flex justify-content-between small text-muted">
              <span>Poziom: {issue.severity}</span>
              <span>{formatDate(issue.created_at)}</span>
            </div>
          </li>
        ))}
      </ul>
    );
  };

  const renderVehicleCard = (vehicle) => {
    const isActive = activeVehicleId === vehicle.id;
    const tripForm = tripForms[vehicle.id] || createTripForm();
    const fuelForm = fuelForms[vehicle.id] || createFuelForm();
    const issueForm = issueForms[vehicle.id] || createIssueForm();
    const openIssueCount = (vehicle.issues || []).filter((issue) => issue.status !== 'resolved').length;
    const energyLabel =
      vehicle.fuel_type === 'electric' || vehicle.fuel_type === 'hybrid'
        ? `${vehicle.battery_level ?? 0}% Baterii`
        : `${vehicle.fuel_level ?? 0}% Paliwa`;

    return (
      <div key={vehicle.id} className={`vehicle-panel card border-0 shadow-sm h-100 ${isActive ? 'vehicle-panel--active' : ''}`}>
        <button type="button" className="vehicle-panel__header text-start" onClick={() => toggleVehicle(vehicle.id)}>
          <div className="d-flex align-items-center gap-3">
            <div className="vehicle-avatar">
              <i className={`bi ${getVehicleIcon(vehicle.fuel_type)}`}></i>
            </div>
            <div>
              <p className="text-uppercase text-muted small mb-1">#{vehicle.id}</p>
              <h4 className="h6 mb-0" title={`${vehicle.make} ${vehicle.model}`}>
                {vehicle.make} {vehicle.model}
              </h4>
              <small className="text-muted" title={vehicle.license_plate}>
                {vehicle.license_plate}
              </small>
            </div>
          </div>
          <span className={`badge bg-${statusVariants[vehicle.status] || 'secondary'}`}>
            {statusLabels[vehicle.status] || vehicle.status}
          </span>
        </button>
        <div className="vehicle-panel__meta d-flex flex-wrap gap-3 px-4 pb-3">
          <span className="small text-muted" title={`Przebieg: ${vehicle.odometer || 0} km`}>
            <i className="bi bi-speedometer2 me-1"></i>{vehicle.odometer || 0} km
          </span>
          <span className="small text-muted" title={`Ostatni serwis: ${formatDate(vehicle.last_service_date)}`}>
            <i className="bi bi-tools me-1"></i>Serwis: {formatDate(vehicle.last_service_date)}
          </span>
          <span className="small text-muted" title={energyLabel}>
            <i className="bi bi-thermometer-half me-1"></i>{energyLabel}
          </span>
          <span className="small text-muted" title={`Otwarte zgłoszenia: ${openIssueCount}`}>
            <i className="bi bi-exclamation-triangle me-1"></i>
            {openIssueCount} zgłoszeń
          </span>
        </div>
        {isActive && (
          <div className="vehicle-panel__body px-4 pb-4">
            {canLogUsage && (
              <div className="row g-4">
                <div className="col-12 col-xxl-4">
                  <h5 className="h6 mb-3">Zapisz przejazd</h5>
                  <form onSubmit={(event) => handleTripSubmit(event, vehicle)} className="d-flex flex-column gap-2">
                    <div>
                      <label className="form-label small text-muted">Trasa / klient</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="np. Warszawa → Łódź"
                        title="Podaj nazwę trasy lub klienta"
                        value={tripForm.route_label}
                        onChange={(e) => handleTripChange(vehicle.id, 'route_label', e.target.value)}
                      />
                    </div>
                    <div className="row g-2">
                      <div className="col">
                        <label className="form-label small text-muted">Dystans (km)</label>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="120"
                          title="Dystans przejazdu w kilometrach"
                          value={tripForm.distance_km}
                          onChange={(e) => handleTripChange(vehicle.id, 'distance_km', e.target.value)}
                          required
                        />
                      </div>
                      <div className="col">
                        <label className="form-label small text-muted">Koszt paliwa (PLN)</label>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="150"
                          title="Łączny koszt paliwa"
                          value={tripForm.fuel_cost}
                          onChange={(e) => handleTripChange(vehicle.id, 'fuel_cost', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="row g-2">
                      <div className="col">
                        <label className="form-label small text-muted">Zużycie paliwa (L)</label>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="10"
                          title="Ile paliwa zostało zużyte"
                          value={tripForm.fuel_used_l}
                          onChange={(e) => handleTripChange(vehicle.id, 'fuel_used_l', e.target.value)}
                        />
                      </div>
                      <div className="col">
                        <label className="form-label small text-muted">Inne opłaty (PLN)</label>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="25"
                          title="Np. opłaty za autostrady"
                          value={tripForm.tolls_cost}
                          onChange={(e) => handleTripChange(vehicle.id, 'tolls_cost', e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="form-label small text-muted">Notatki</label>
                      <textarea
                        className="form-control"
                        rows="2"
                        placeholder="Dodaj ważne informacje, np. klient odmówił podpisu"
                        title="Dowolne uwagi dotyczące przejazdu"
                        value={tripForm.notes}
                        onChange={(e) => handleTripChange(vehicle.id, 'notes', e.target.value)}
                      ></textarea>
                    </div>
                    <button type="submit" className="btn btn-primary btn-sm">Zapisz przejazd</button>
                  </form>
                </div>
                <div className="col-12 col-xxl-4">
                  <h5 className="h6 mb-3">Zgłoś tankowanie</h5>
                  <form onSubmit={(event) => handleFuelSubmit(event, vehicle)} className="d-flex flex-column gap-2">
                    <div className="row g-2">
                      <div className="col">
                        <label className="form-label small text-muted">Ilość paliwa (L)</label>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="45"
                          title="Ile litrów zostało zatankowanych"
                          value={fuelForm.liters}
                          onChange={(e) => handleFuelChange(vehicle.id, 'liters', e.target.value)}
                          required
                        />
                      </div>
                      <div className="col">
                        <label className="form-label small text-muted">Cena za litr (PLN)</label>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="6.20"
                          title="Średnia cena paliwa"
                          value={fuelForm.price_per_liter}
                          onChange={(e) => handleFuelChange(vehicle.id, 'price_per_liter', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="row g-2">
                      <div className="col">
                        <label className="form-label small text-muted">Koszt całkowity (PLN)</label>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="280"
                          title="Suma do zapłaty"
                          value={fuelForm.total_cost}
                          onChange={(e) => handleFuelChange(vehicle.id, 'total_cost', e.target.value)}
                        />
                      </div>
                      <div className="col">
                        <label className="form-label small text-muted">Stan licznika (km)</label>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="15200"
                          title="Przebieg pojazdu podczas tankowania"
                          value={fuelForm.odometer}
                          onChange={(e) => handleFuelChange(vehicle.id, 'odometer', e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="form-label small text-muted">Stacja / lokalizacja</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="np. Orlen, Łódź"
                        title="Gdzie odbyło się tankowanie"
                        value={fuelForm.station}
                        onChange={(e) => handleFuelChange(vehicle.id, 'station', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="form-label small text-muted">Notatki</label>
                      <textarea
                        className="form-control"
                        rows="2"
                        placeholder="Np. płatność kartą firmową"
                        title="Dowolne dodatkowe informacje"
                        value={fuelForm.notes}
                        onChange={(e) => handleFuelChange(vehicle.id, 'notes', e.target.value)}
                      ></textarea>
                    </div>
                    <button type="submit" className="btn btn-outline-primary btn-sm">Zapisz tankowanie</button>
                  </form>
                </div>
                <div className="col-12 col-xxl-4">
                  <h5 className="h6 mb-3">Zgłoś problem</h5>
                  <form onSubmit={(event) => handleIssueSubmit(event, vehicle)} className="d-flex flex-column gap-2">
                    <select className="form-select" value={issueForm.severity} onChange={(e) => handleIssueChange(vehicle.id, 'severity', e.target.value)}>
                      <option value="low">Niski</option>
                      <option value="medium">Średni</option>
                      <option value="high">Wysoki</option>
                      <option value="critical">Krytyczny</option>
                    </select>
                    <input type="text" className="form-control" placeholder="Tytuł" value={issueForm.title} onChange={(e) => handleIssueChange(vehicle.id, 'title', e.target.value)} required />
                    <textarea className="form-control" placeholder="Opis" rows="3" value={issueForm.description} onChange={(e) => handleIssueChange(vehicle.id, 'description', e.target.value)} required></textarea>
                    <button type="submit" className="btn btn-danger btn-sm">Zgłoś problem</button>
                  </form>
                </div>
              </div>
            )}
            <div className="mt-4">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h5 className="h6 mb-0">Zgłoszenia</h5>
                <button type="button" className="btn btn-link btn-sm" onClick={() => fetchVehicleIssues(vehicle.id)}>
                  Odśwież
                </button>
              </div>
              {renderIssues(vehicle)}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) return <div className="p-5 text-center">Ładowanie floty...</div>;

  return (
    <div className="section-shell p-4 p-lg-5 dashboard-section">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 className="h3 mb-1">Pojazdy floty</h2>
          <p className="text-muted mb-0">
            {isAdmin ? 'Zarządzaj inwentarzem i zdrowiem pojazdów' : 'Zapisuj trasy, tankowania i zgłaszaj usterki dla przydzielonych aut'}
          </p>
        </div>
        {isAdmin ? (
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            <i className="bi bi-plus-lg me-2"></i>
            Dodaj pojazd
          </button>
        ) : (
          <span className="badge bg-dark-subtle text-dark">Widok kierowcy</span>
        )}
      </div>

      {banner && (
        <div className={`alert ${banner.type === 'error' ? 'alert-danger' : 'alert-success'} mb-4`}>
          {banner.message}
        </div>
      )}

      {isAdmin && showForm && (
        <div className="card mb-4 border-0 shadow-sm bg-light">
          <div className="card-body p-4">
            <h5 className="mb-3">Dodaj nowy pojazd</h5>
            <form onSubmit={handleVehicleSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Marka</label>
                  <div className="input-group">
                    <span className="input-group-text"><i className="bi bi-car-front"></i></span>
                    <input type="text" className="form-control" name="make" value={formData.make} onChange={handleVehicleFieldChange} required placeholder="np. Toyota" />
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Model</label>
                  <input type="text" className="form-control" name="model" value={formData.model} onChange={handleVehicleFieldChange} required placeholder="np. Camry" />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Rok</label>
                  <input type="number" className="form-control" name="year" value={formData.year} onChange={handleVehicleFieldChange} required />
                </div>
                <div className="col-md-4">
                  <label className="form-label">VIN</label>
                  <input type="text" className="form-control" name="vin" value={formData.vin} onChange={handleVehicleFieldChange} required />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Rejestracja</label>
                  <input type="text" className="form-control" name="license_plate" value={formData.license_plate} onChange={handleVehicleFieldChange} required />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Typ napędu</label>
                  <select className="form-select" name="fuel_type" value={formData.fuel_type} onChange={handleVehicleFieldChange}>
                    <option value="gasoline">Benzyna</option>
                    <option value="diesel">Diesel</option>
                    <option value="electric">Elektryczny</option>
                    <option value="hybrid">Hybryda</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Przebieg (km)</label>
                  <input type="number" className="form-control" name="odometer" value={formData.odometer} onChange={handleVehicleFieldChange} min="0" />
                </div>
                {(formData.fuel_type === 'electric' || formData.fuel_type === 'hybrid') && (
                  <div className="col-md-4">
                    <label className="form-label">Poziom baterii (%)</label>
                    <input type="number" className="form-control" name="battery_level" value={formData.battery_level} onChange={handleVehicleFieldChange} min="0" max="100" />
                  </div>
                )}
                {formData.fuel_type !== 'electric' && (
                  <div className="col-md-4">
                    <label className="form-label">Poziom paliwa (%)</label>
                    <input type="number" className="form-control" name="fuel_level" value={formData.fuel_level} onChange={handleVehicleFieldChange} min="0" max="100" />
                  </div>
                )}
                <div className="col-md-4">
                  <label className="form-label">Pojemność baku (L)</label>
                  <input type="number" className="form-control" name="fuel_capacity" value={formData.fuel_capacity} onChange={handleVehicleFieldChange} min="0" />
                </div>
                <div className="col-12 text-end">
                  <button type="button" className="btn btn-link text-muted me-2" onClick={() => setShowForm(false)}>Anuluj</button>
                  <button type="submit" className="btn btn-success">Zapisz pojazd</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="row g-4">
        {vehicles.map((vehicle) => (
          <div key={vehicle.id} className="col-12 col-lg-6">
            {renderVehicleCard(vehicle)}
          </div>
        ))}
        {vehicles.length === 0 && (
          <div className="col-12 text-center py-5 text-muted">
            <i className="bi bi-truck display-4 mb-3 d-block"></i>
            {isAdmin ? 'Brak pojazdów we flocie.' : 'Brak przydzielonych pojazdów.'}
          </div>
        )}
      </div>
    </div>
  );
}
