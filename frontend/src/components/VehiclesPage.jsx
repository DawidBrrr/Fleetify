import React, { useState, useEffect } from 'react';
import { dashboardApi } from '../services/api/dashboard';

function VehicleCard({ vehicle }) {
  return (
    <div className="card h-100 shadow-sm border-0">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div>
            <h5 className="card-title mb-1">{vehicle.make} {vehicle.model}</h5>
            <p className="text-muted small mb-0">{vehicle.year}</p>
          </div>
          <span className={`badge bg-${vehicle.status === 'available' ? 'success' : 'warning'}`}>
            {vehicle.status === 'available' ? 'Dostępny' : vehicle.status}
          </span>
        </div>
        <div className="mb-3">
          <div className="d-flex align-items-center text-muted small mb-2">
            <i className="bi bi-upc-scan me-2"></i>
            VIN: {vehicle.vin}
          </div>
          <div className="d-flex align-items-center text-muted small mb-2">
            <i className="bi bi-card-text me-2"></i>
            Rejestracja: {vehicle.license_plate}
          </div>
          <div className="d-flex align-items-center text-muted small mb-2">
            <i className="bi bi-speedometer2 me-2"></i>
            {vehicle.odometer || 0} km
          </div>
          <div className="d-flex align-items-center text-muted small mb-2">
            <i className={`bi bi-${vehicle.fuel_type === 'electric' ? 'battery-charging' : 'fuel-pump'} me-2`}></i>
            {vehicle.fuel_type === 'electric' || vehicle.fuel_type === 'hybrid' 
              ? `${vehicle.battery_level || 0}% Baterii` 
              : `${vehicle.fuel_level || 0}% Paliwa`}
          </div>
          {vehicle.fuel_capacity && (
             <div className="d-flex align-items-center text-muted small">
             <i className="bi bi-droplet me-2"></i>
             Pojemność: {vehicle.fuel_capacity}L
           </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VehiclesPage() {
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
    odometer: 0,
    fuel_capacity: ''
  });

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      const data = await dashboardApi.fetchVehicles();
      setVehicles(data);
    } catch (error) {
      console.error('Failed to load vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dashboardApi.addVehicle(formData);
      setShowForm(false);
      setFormData({
        make: '',
        model: '',
        year: new Date().getFullYear(),
        vin: '',
        license_plate: '',
        fuel_type: 'gasoline',
        odometer: 0,
        fuel_capacity: ''
      });
      loadVehicles();
    } catch (error) {
      console.error('Failed to add vehicle:', error);
      alert('Nie udało się dodać pojazdu');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (loading) return <div className="p-5 text-center">Ładowanie floty...</div>;

  return (
    <div className="section-shell p-4 p-lg-5 dashboard-section">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h3 mb-1">Pojazdy Floty</h2>
          <p className="text-muted">Zarządzaj inwentarzem floty</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          <i className="bi bi-plus-lg me-2"></i>
          Dodaj Pojazd
        </button>
      </div>

      {showForm && (
        <div className="card mb-4 border-0 shadow-sm bg-light">
          <div className="card-body p-4">
            <h5 className="mb-3">Dodaj Nowy Pojazd</h5>
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Marka</label>
                  <div className="input-group">
                    <span className="input-group-text"><i className="bi bi-car-front"></i></span>
                    <input
                      type="text"
                      className="form-control"
                      name="make"
                      value={formData.make}
                      onChange={handleChange}
                      required
                      placeholder="np. Toyota"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Model</label>
                  <input
                    type="text"
                    className="form-control"
                    name="model"
                    value={formData.model}
                    onChange={handleChange}
                    required
                    placeholder="np. Camry"
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Rok</label>
                  <input
                    type="number"
                    className="form-control"
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">VIN</label>
                  <input
                    type="text"
                    className="form-control"
                    name="vin"
                    value={formData.vin}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Rejestracja</label>
                  <input
                    type="text"
                    className="form-control"
                    name="license_plate"
                    value={formData.license_plate}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Typ Paliwa</label>
                  <select
                    className="form-select"
                    name="fuel_type"
                    value={formData.fuel_type}
                    onChange={handleChange}
                  >
                    <option value="gasoline">Benzyna</option>
                    <option value="diesel">Diesel</option>
                    <option value="electric">Elektryczny</option>
                    <option value="hybrid">Hybryda</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Przebieg (km)</label>
                  <input
                    type="number"
                    className="form-control"
                    name="odometer"
                    value={formData.odometer}
                    onChange={handleChange}
                    min="0"
                  />
                </div>
                {(formData.fuel_type === 'electric' || formData.fuel_type === 'hybrid') && (
                  <div className="col-md-4">
                    <label className="form-label">Poziom Baterii (%)</label>
                    <input
                      type="number"
                      className="form-control"
                      name="battery_level"
                      value={formData.battery_level || ''}
                      onChange={handleChange}
                      min="0"
                      max="100"
                    />
                  </div>
                )}
                {(formData.fuel_type !== 'electric') && (
                  <div className="col-md-4">
                    <label className="form-label">Poziom Paliwa (%)</label>
                    <input
                      type="number"
                      className="form-control"
                      name="fuel_level"
                      value={formData.fuel_level || ''}
                      onChange={handleChange}
                      min="0"
                      max="100"
                    />
                  </div>
                )}
                <div className="col-md-4">
                  <label className="form-label">Pojemność Baku (L)</label>
                  <input
                    type="number"
                    className="form-control"
                    name="fuel_capacity"
                    value={formData.fuel_capacity || ''}
                    onChange={handleChange}
                    min="0"
                  />
                </div>
                <div className="col-12 text-end">
                  <button type="button" className="btn btn-link text-muted me-2" onClick={() => setShowForm(false)}>Anuluj</button>
                  <button type="submit" className="btn btn-success">Zapisz Pojazd</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="row g-4">
        {vehicles.map(vehicle => (
          <div key={vehicle.id} className="col-md-6 col-lg-4">
            <VehicleCard vehicle={vehicle} />
          </div>
        ))}
        {vehicles.length === 0 && (
          <div className="col-12 text-center py-5 text-muted">
            <i className="bi bi-truck display-4 mb-3 d-block"></i>
            Brak pojazdów we flocie.
          </div>
        )}
      </div>
    </div>
  );
}
