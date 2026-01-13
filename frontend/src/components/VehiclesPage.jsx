import React, { useState, useEffect, useRef } from 'react';
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

// SVG Icons as components
const Icons = {
  car: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10l-3-5H9L6 10l-2.5 1.1C2.7 11.3 2 12.1 2 13v3c0 .6.4 1 1 1h2"/>
      <circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>
    </svg>
  ),
  electric: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  fuel: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 22V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v17"/>
      <path d="M15 12h3.5a2 2 0 0 1 2 2v3a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L21 5.5"/>
      <line x1="3" y1="22" x2="15" y2="22"/><line x1="6" y1="12" x2="12" y2="12"/>
    </svg>
  ),
  route: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/>
      <circle cx="18" cy="5" r="3"/>
    </svg>
  ),
  alert: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  send: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  ),
  location: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  trash: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>
  ),
  speedometer: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-1.41 5.66-5.66 1.41"/>
    </svg>
  ),
  wrench: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  ),
  gauge: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a10 10 0 1 0 10 10H12V2z"/><path d="M12 12 19.07 4.93"/>
    </svg>
  ),
  plus: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  calculator: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/>
      <line x1="8" y1="10" x2="8" y2="10.01"/><line x1="12" y1="10" x2="12" y2="10.01"/>
      <line x1="16" y1="10" x2="16" y2="10.01"/><line x1="8" y1="14" x2="8" y2="14.01"/>
    </svg>
  ),
  refresh: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
    </svg>
  ),
  truck: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7V8z"/>
      <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  ),
  success: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  error: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
  ),
};

const getVehicleIcon = (fuelType) => {
  if (fuelType === 'electric') return Icons.electric;
  if (fuelType === 'hybrid') return Icons.electric;
  if (fuelType === 'diesel') return Icons.fuel;
  return Icons.car;
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

const formatLocationLabel = (vehicle) => {
  if (vehicle?.city) return vehicle.city;
  const hasLatLng =
    vehicle && vehicle.latitude !== undefined && vehicle.latitude !== null && vehicle.longitude !== undefined && vehicle.longitude !== null;
  if (hasLatLng) {
    const lat = Number(vehicle.latitude).toFixed(4);
    const lng = Number(vehicle.longitude).toFixed(4);
    return `${lat}, ${lng}`;
  }
  return 'Brak lokalizacji';
};

const buildLogContext = (vehicle, user) => {
  const rawId = vehicle?.id ?? vehicle?.vehicle_id;
  return {
    vehicleId: rawId !== undefined && rawId !== null ? String(rawId) : null,
    vehicleLabel: getVehicleLabel(vehicle),
    targetUserId: vehicle?.current_driver_id || user?.id || null,
  };
};

const loadLeaflet = (() => {
  let promise;
  return () => {
    if (typeof window !== 'undefined' && window.L) return Promise.resolve(window.L);
    if (promise) return promise;
    promise = new Promise((resolve, reject) => {
      const cssId = 'leaflet-css';
      if (!document.getElementById(cssId)) {
        const link = document.createElement('link');
        link.id = cssId;
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => resolve(window.L);
      script.onerror = reject;
      document.body.appendChild(script);
    });
    return promise;
  };
})();

export default function VehiclesPage({ role = 'admin', user }) {
  const isAdmin = role === 'admin';
  const canLogUsage = role === 'admin' || role === 'worker' || role === 'employee';
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
  const [locationModalVehicle, setLocationModalVehicle] = useState(null);
  const [locationForms, setLocationForms] = useState({});
  const [locationLookups, setLocationLookups] = useState({});
  const mapRefs = useRef({});
  const markerRefs = useRef({});

  useEffect(() => {
    loadVehicles();
  }, [role]);

  const showBanner = (type, message) => {
    setBanner({ type, message });
    setTimeout(() => setBanner(null), 3500);
  };

  const setLocationFormValues = (vehicleId, updates) => {
    setLocationForms((prev) => ({
      ...prev,
      [vehicleId]: {
        ...(prev[vehicleId] || {}),
        ...updates,
      },
    }));
  };

  const extractCityName = (address = {}) => {
    return (
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      address.hamlet ||
      address.county ||
      null
    );
  };

  const updateMapView = (vehicleId, lat, lng) => {
    const map = mapRefs.current[vehicleId];
    const marker = markerRefs.current[vehicleId];
    if (map && typeof lat === 'number' && typeof lng === 'number') {
      map.setView([lat, lng], Math.max(map.getZoom(), 11));
    }
    if (map && typeof lat === 'number' && typeof lng === 'number') {
      if (marker) {
        marker.setLatLng([lat, lng]);
      } else if (window.L) {
        markerRefs.current[vehicleId] = window.L.marker([lat, lng]).addTo(map);
      }
    }
  };

  const reverseGeocodeLocation = async (vehicleId, lat, lng) => {
    if (lat === undefined || lng === undefined || Number.isNaN(lat) || Number.isNaN(lng)) {
      return;
    }
    setLocationLookups((prev) => ({ ...prev, [vehicleId]: 'loading' }));
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=pl&zoom=10`,
        { headers: { Accept: 'application/json' } }
      );
      const data = await response.json();
      const cityName = extractCityName(data?.address || {}) || (data?.display_name || '').split(',')[0] || '';
      setLocationFormValues(vehicleId, {
        latitude: Number(lat.toFixed ? lat.toFixed(6) : lat),
        longitude: Number(lng.toFixed ? lng.toFixed(6) : lng),
        city: cityName || (locationForms[vehicleId]?.city || ''),
      });
      setLocationLookups((prev) => ({ ...prev, [vehicleId]: cityName ? 'ready' : 'no-city' }));
    } catch (error) {
      console.error('Reverse geocoding failed', error);
      setLocationLookups((prev) => ({ ...prev, [vehicleId]: 'error' }));
    }
  };

  const handleSearchCity = async (vehicleId) => {
    const query = (locationForms[vehicleId]?.city || '').trim();
    if (!query) {
      showBanner('error', 'Podaj nazwę miasta, aby wyszukać.');
      return;
    }
    setLocationLookups((prev) => ({ ...prev, [vehicleId]: 'searching' }));
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&addressdetails=1&q=${encodeURIComponent(query)}`,
        { headers: { Accept: 'application/json' } }
      );
      const results = await response.json();
      const place = Array.isArray(results) ? results[0] : null;
      if (!place) {
        showBanner('error', 'Nie znaleziono takiej miejscowości.');
        setLocationLookups((prev) => ({ ...prev, [vehicleId]: 'not-found' }));
        return;
      }
      const lat = Number.parseFloat(place.lat);
      const lng = Number.parseFloat(place.lon);
      const cityName = extractCityName(place.address || {}) || (place.display_name || '').split(',')[0] || query;
      setLocationFormValues(vehicleId, {
        latitude: Number(lat.toFixed(6)),
        longitude: Number(lng.toFixed(6)),
        city: cityName,
      });
      updateMapView(vehicleId, lat, lng);
      setLocationLookups((prev) => ({ ...prev, [vehicleId]: 'ready' }));
    } catch (error) {
      console.error('City search failed', error);
      showBanner('error', 'Nie udało się wyszukać miasta.');
      setLocationLookups((prev) => ({ ...prev, [vehicleId]: 'error' }));
    }
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
  const handleIssueChange = updateFormState(setIssueForms, createIssueForm);

  // Specjalna obsługa tankowania z auto-kalkulacją
  const handleFuelChange = (vehicleId, field, value) => {
    setFuelForms((prev) => {
      const current = prev[vehicleId] ? { ...prev[vehicleId] } : createFuelForm();
      current[field] = value;
      
      // Auto-kalkulacja kosztu całkowitego
      const liters = parseNumber(field === 'liters' ? value : current.liters);
      const pricePerLiter = parseNumber(field === 'price_per_liter' ? value : current.price_per_liter);
      
      if (liters !== undefined && pricePerLiter !== undefined && field !== 'total_cost') {
        current.total_cost = (liters * pricePerLiter).toFixed(2);
      }
      
      return { ...prev, [vehicleId]: current };
    });
  };

  const handleTripSubmit = async (event, vehicle) => {
    event.preventDefault();
    const form = tripForms[vehicle.id] || createTripForm();
    const distanceValue = parseNumber(form.distance_km);
    const fuelUsedValue = parseNumber(form.fuel_used_l);
    if (distanceValue === undefined) {
      showBanner('error', 'Podaj prawidłowy dystans (km).');
      return;
    }
    if (fuelUsedValue === undefined) {
      showBanner('error', 'Podaj ilość spalonego paliwa (L) - wymagane do analityki.');
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

  const openLocationModal = (vehicle) => {
    const lat = vehicle.latitude ?? 52.2297;
    const lng = vehicle.longitude ?? 21.0122;
    setLocationFormValues(vehicle.id, {
      latitude: lat,
      longitude: lng,
      city: vehicle.city || '',
    });
    setLocationModalVehicle(vehicle);
    setTimeout(() => initializeMap(vehicle.id, lat, lng), 0);
    if (!vehicle.city && vehicle.latitude !== undefined && vehicle.longitude !== undefined) {
      reverseGeocodeLocation(vehicle.id, vehicle.latitude, vehicle.longitude);
    }
  };

  const initializeMap = async (vehicleId, lat, lng) => {
    try {
      const L = await loadLeaflet();
      const containerId = `vehicle-map-${vehicleId}`;
      const container = document.getElementById(containerId);
      if (!container) return;
      if (mapRefs.current[vehicleId]) {
        mapRefs.current[vehicleId].off();
        mapRefs.current[vehicleId].remove();
      }
      const map = L.map(containerId).setView([lat, lng], 12);
      mapRefs.current[vehicleId] = map;
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);
      markerRefs.current[vehicleId] = L.marker([lat, lng]).addTo(map);
      map.on('click', (e) => {
        const { lat: newLat, lng: newLng } = e.latlng;
        setLocationFormValues(vehicleId, {
          latitude: Number(newLat.toFixed(6)),
          longitude: Number(newLng.toFixed(6)),
        });
        if (markerRefs.current[vehicleId]) {
          markerRefs.current[vehicleId].setLatLng([newLat, newLng]);
        }
        reverseGeocodeLocation(vehicleId, Number(newLat), Number(newLng));
      });
    } catch (err) {
      console.error('Failed to load map', err);
    }
  };

  const handleLocationInput = (vehicleId, field, value) => {
    setLocationForms((prev) => {
      const next = { ...(prev[vehicleId] || {}), [field]: value };
      const latNum = parseNumber(next.latitude);
      const lngNum = parseNumber(next.longitude);
      if (latNum !== undefined && lngNum !== undefined && (field === 'latitude' || field === 'longitude')) {
        updateMapView(vehicleId, latNum, lngNum);
      }
      return { ...prev, [vehicleId]: next };
    });
  };

  const handleSaveLocation = async () => {
    if (!locationModalVehicle) return;
    const form = locationForms[locationModalVehicle.id] || {};
    const lat = parseNumber(form.latitude);
    const lng = parseNumber(form.longitude);
    if (lat === undefined || lng === undefined) {
      showBanner('error', 'Podaj prawidłowe współrzędne.');
      return;
    }
    try {
      await dashboardApi.updateVehicleLocation(locationModalVehicle.id, {
        latitude: lat,
        longitude: lng,
        city: (form.city || '').trim() || null,
      });
      showBanner('success', 'Lokalizacja pojazdu zaktualizowana');
      setLocationModalVehicle(null);
      loadVehicles();
    } catch (error) {
      console.error('Failed to update location', error);
      showBanner('error', 'Nie udało się zapisać lokalizacji');
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

  const handleDeleteVehicle = async (vehicle) => {
    if (!window.confirm(`Czy na pewno chcesz usunąć pojazd ${vehicle.make} ${vehicle.model} (${vehicle.license_plate}) z floty? Ta operacja jest nieodwracalna.`)) {
      return;
    }
    try {
      await dashboardApi.deleteVehicle(vehicle.id);
      showBanner('success', 'Pojazd został usunięty z floty');
      loadVehicles();
    } catch (error) {
      console.error('Failed to delete vehicle', error);
      if (error.message?.includes('assigned')) {
        showBanner('error', 'Nie można usunąć pojazdu, który jest przypisany do pracownika');
      } else {
        showBanner('error', 'Nie udało się usunąć pojazdu');
      }
    }
  };

  const renderIssues = (vehicle) => {
    const issues = issuesByVehicle[vehicle.id] || vehicle.issues || [];
    if (issuesLoading[vehicle.id]) {
      return <div className="text-muted small">Ładowanie zgłoszeń...</div>;
    }
    if (!issues.length) {
      return <div className="vp-hint">Brak zgłoszeń dla tego pojazdu.</div>;
    }
    return (
      <div className="d-flex flex-column gap-2 mt-2">
        {issues.map((issue) => (
          <div key={issue.id} className="vp-issue">
            <div className="vp-issue__header">
              <h6 className="vp-issue__title">{issue.title}</h6>
              <span className={`vp-status vp-status--${issue.status === 'resolved' ? 'success' : 'danger'}`}>
                <span className="vp-status__dot"></span>
                {issue.status === 'resolved' ? 'Zamknięte' : 'Otwarte'}
              </span>
            </div>
            <p className="vp-issue__desc">{issue.description}</p>
            <div className="vp-issue__meta">
              <span>Poziom: {issue.severity}</span>
              <span>{formatDate(issue.created_at)}</span>
            </div>
            {isAdmin && issue.status !== 'resolved' && (
              <button
                type="button"
                className="vp-btn vp-btn--outline vp-btn--full"
                style={{ marginTop: '8px', padding: '8px 12px' }}
                onClick={() => handleResolveIssue(vehicle.id, issue.id)}
              >
                {Icons.check} Oznacz jako rozwiązane
              </button>
            )}
          </div>
        ))}
      </div>
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
      <div key={vehicle.id} className={`vehicle-panel h-100 ${isActive ? 'vehicle-panel--active' : ''}`}>
        <button type="button" className="vehicle-panel__header" onClick={() => toggleVehicle(vehicle.id)}>
          <div className="d-flex align-items-center gap-3">
            <div className="vehicle-avatar">
              {getVehicleIcon(vehicle.fuel_type)}
            </div>
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '2px', letterSpacing: '0.03em' }}>#{vehicle.id}</p>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '2px', color: '#0f1c2e' }} title={`${vehicle.make} ${vehicle.model}`}>
                {vehicle.make} {vehicle.model}
              </h4>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }} title={vehicle.license_plate}>
                {vehicle.license_plate}
              </span>
            </div>
          </div>
          <span className={`vp-status vp-status--${statusVariants[vehicle.status] || 'info'}`}>
            <span className="vp-status__dot"></span>
            {statusLabels[vehicle.status] || vehicle.status}
          </span>
        </button>
        <div className="vehicle-panel__meta d-flex flex-wrap gap-2">
          <span className="vp-chip" title={`Przebieg: ${vehicle.odometer || 0} km`}>
            {Icons.speedometer}{vehicle.odometer || 0} km
          </span>
          <span className="vp-chip" title={`Ostatni serwis: ${formatDate(vehicle.last_service_date)}`}>
            {Icons.wrench}{formatDate(vehicle.last_service_date)}
          </span>
          <span className="vp-chip" title={`Lokalizacja: ${formatLocationLabel(vehicle)}`}>
            {Icons.location}{formatLocationLabel(vehicle)}
          </span>
          <span className="vp-chip" title={energyLabel}>
            {Icons.gauge}{energyLabel}
          </span>
          <span className="vp-chip" title={`Otwarte zgłoszenia: ${openIssueCount}`}>
            {Icons.alert}{openIssueCount} zgłoszeń
          </span>
        </div>
        {isActive && (
          <div className="vehicle-panel__body" style={{ padding: '16px 20px 20px' }}>
            {canLogUsage && (
              <>
              <div className="row g-3">
                <div className="col-12 col-lg-6">
                  <div className="vp-form-card">
                    <div className="vp-form-card__header vp-form-card__header--trip">
                      {Icons.route}
                      <span>Zapisz przejazd</span>
                    </div>
                    <div className="vp-form-card__body">
                      <form onSubmit={(event) => handleTripSubmit(event, vehicle)}>
                        <div className="vp-form-group">
                          <label className="vp-label">Trasa / klient</label>
                          <input
                            type="text"
                            className="vp-input"
                            placeholder="np. Warszawa → Łódź"
                            value={tripForm.route_label}
                            onChange={(e) => handleTripChange(vehicle.id, 'route_label', e.target.value)}
                          />
                        </div>
                        <div className="vp-grid vp-grid--2 vp-form-group">
                          <div>
                            <label className="vp-label">Dystans <span className="vp-label__required">*</span></label>
                            <div className="vp-input-group">
                              <input
                                type="number"
                                step="0.1"
                                className="vp-input"
                                placeholder="120"
                                value={tripForm.distance_km}
                                onChange={(e) => handleTripChange(vehicle.id, 'distance_km', e.target.value)}
                                required
                              />
                              <span className="vp-input-group__suffix">km</span>
                            </div>
                          </div>
                          <div>
                            <label className="vp-label">Spalone paliwo <span className="vp-label__required">*</span></label>
                            <div className="vp-input-group">
                              <input
                                type="number"
                                step="0.1"
                                className="vp-input"
                                placeholder="8.5"
                                value={tripForm.fuel_used_l}
                                onChange={(e) => handleTripChange(vehicle.id, 'fuel_used_l', e.target.value)}
                                required
                              />
                              <span className="vp-input-group__suffix">L</span>
                            </div>
                            <span className="vp-hint">Ważne dla analityki</span>
                          </div>
                        </div>
                        <div className="vp-form-group">
                          <label className="vp-label">Opłaty drogowe</label>
                          <div className="vp-input-group">
                            <input
                              type="number"
                              step="0.01"
                              className="vp-input"
                              placeholder="0"
                              value={tripForm.tolls_cost}
                              onChange={(e) => handleTripChange(vehicle.id, 'tolls_cost', e.target.value)}
                            />
                            <span className="vp-input-group__suffix">PLN</span>
                          </div>
                        </div>
                        <div className="vp-form-group">
                          <label className="vp-label">Notatki</label>
                          <textarea
                            className="vp-textarea"
                            rows="2"
                            placeholder="Dodatkowe informacje..."
                            value={tripForm.notes}
                            onChange={(e) => handleTripChange(vehicle.id, 'notes', e.target.value)}
                          ></textarea>
                        </div>
                        <div className="vp-form-actions">
                          <button type="submit" className="vp-btn vp-btn--primary vp-btn--full">
                            {Icons.check} Zapisz przejazd
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
                <div className="col-12 col-lg-6">
                  <div className="vp-form-card">
                    <div className="vp-form-card__header vp-form-card__header--fuel">
                      {Icons.fuel}
                      <span>Tankowanie</span>
                    </div>
                    <div className="vp-form-card__body">
                      <form onSubmit={(event) => handleFuelSubmit(event, vehicle)}>
                        <div className="vp-grid vp-grid--2 vp-form-group">
                          <div>
                            <label className="vp-label">Ilość paliwa <span className="vp-label__required">*</span></label>
                            <div className="vp-input-group">
                              <input
                                type="number"
                                step="0.01"
                                className="vp-input"
                                placeholder="45"
                                value={fuelForm.liters}
                                onChange={(e) => handleFuelChange(vehicle.id, 'liters', e.target.value)}
                                required
                              />
                              <span className="vp-input-group__suffix">L</span>
                            </div>
                          </div>
                          <div>
                            <label className="vp-label">Cena za litr</label>
                            <div className="vp-input-group">
                              <input
                                type="number"
                                step="0.01"
                                className="vp-input"
                                placeholder="6.20"
                                value={fuelForm.price_per_liter}
                                onChange={(e) => handleFuelChange(vehicle.id, 'price_per_liter', e.target.value)}
                              />
                              <span className="vp-input-group__suffix">PLN/L</span>
                            </div>
                          </div>
                        </div>
                        <div className="vp-grid vp-grid--2 vp-form-group">
                          <div>
                            <label className="vp-label">Koszt całkowity</label>
                            <div className="vp-input-group">
                              <input
                                type="number"
                                step="0.01"
                                className="vp-input"
                                style={fuelForm.liters && fuelForm.price_per_liter ? { borderColor: '#10b981', background: 'rgba(16, 185, 129, 0.05)' } : {}}
                                placeholder="280"
                                value={fuelForm.total_cost}
                                onChange={(e) => handleFuelChange(vehicle.id, 'total_cost', e.target.value)}
                                readOnly={!!(fuelForm.liters && fuelForm.price_per_liter)}
                              />
                              <span className="vp-input-group__suffix">PLN</span>
                            </div>
                            {fuelForm.liters && fuelForm.price_per_liter && (
                              <span className="vp-calc-badge">{Icons.calculator} Auto</span>
                            )}
                          </div>
                          <div>
                            <label className="vp-label">Stan licznika</label>
                            <div className="vp-input-group">
                              <input
                                type="number"
                                className="vp-input"
                                placeholder={vehicle.odometer || '15200'}
                                value={fuelForm.odometer}
                                onChange={(e) => handleFuelChange(vehicle.id, 'odometer', e.target.value)}
                              />
                              <span className="vp-input-group__suffix">km</span>
                            </div>
                          </div>
                        </div>
                        <div className="vp-form-group">
                          <label className="vp-label">Stacja paliw</label>
                          <input
                            type="text"
                            className="vp-input"
                            placeholder="np. Orlen, ul. Główna 15"
                            value={fuelForm.station}
                            onChange={(e) => handleFuelChange(vehicle.id, 'station', e.target.value)}
                          />
                        </div>
                        <div className="vp-form-actions">
                          <button type="submit" className="vp-btn vp-btn--success vp-btn--full">
                            {Icons.check} Zapisz tankowanie
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
              <div className="row g-3 mt-1">
                <div className="col-12 col-lg-6">
                  <div className="vp-form-card">
                    <div className="vp-form-card__header vp-form-card__header--issue">
                      {Icons.alert}
                      <span>Zgłoś problem</span>
                    </div>
                    <div className="vp-form-card__body">
                      <form onSubmit={(event) => handleIssueSubmit(event, vehicle)}>
                        <div className="vp-form-group">
                          <label className="vp-label">Poziom ważności</label>
                          <select className="vp-select" value={issueForm.severity} onChange={(e) => handleIssueChange(vehicle.id, 'severity', e.target.value)}>
                            <option value="low">🟢 Niski - może poczekać</option>
                            <option value="medium">🟡 Średni - do załatwienia</option>
                            <option value="high">🟠 Wysoki - pilne</option>
                            <option value="critical">🔴 Krytyczny - natychmiast</option>
                          </select>
                        </div>
                        <div className="vp-form-group">
                          <label className="vp-label">Tytuł problemu <span className="vp-label__required">*</span></label>
                          <input 
                            type="text" 
                            className="vp-input" 
                            placeholder="np. Uszkodzone lusterko boczne" 
                            value={issueForm.title} 
                            onChange={(e) => handleIssueChange(vehicle.id, 'title', e.target.value)} 
                            required 
                          />
                        </div>
                        <div className="vp-form-group">
                          <label className="vp-label">Opis szczegółowy <span className="vp-label__required">*</span></label>
                          <textarea 
                            className="vp-textarea" 
                            placeholder="Opisz dokładnie co się stało..." 
                            rows="3" 
                            value={issueForm.description} 
                            onChange={(e) => handleIssueChange(vehicle.id, 'description', e.target.value)} 
                            required
                          ></textarea>
                        </div>
                        <div className="vp-form-actions">
                          <button type="submit" className="vp-btn vp-btn--danger vp-btn--full">
                            {Icons.send} Wyślij zgłoszenie
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
                <div className="col-12 col-lg-6">
                  <div className="vp-form-card">
                    <div className="vp-form-card__header vp-form-card__header--manage">
                      {Icons.settings}
                      <span>Zarządzanie</span>
                    </div>
                    <div className="vp-form-card__body d-flex flex-column gap-2">
                      <button
                        type="button"
                        className="vp-btn vp-btn--outline vp-btn--full"
                        onClick={() => openLocationModal(vehicle)}
                      >
                        {Icons.location} Zmień lokalizację
                      </button>
                      {isAdmin && (
                        <button
                          type="button"
                          className="vp-btn vp-btn--outline-danger vp-btn--full"
                          onClick={() => handleDeleteVehicle(vehicle)}
                          disabled={vehicle.current_driver_id}
                          title={vehicle.current_driver_id ? 'Nie można usunąć pojazdu przypisanego do pracownika' : 'Usuń pojazd z floty'}
                        >
                          {Icons.trash} Usuń pojazd
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              </>
            )}
            <div className="vp-divider">
              <div className="vp-divider__line"></div>
              <span className="vp-divider__text">Zgłoszenia</span>
              <div className="vp-divider__line"></div>
            </div>
            <div className="d-flex justify-content-end mb-2">
              <button type="button" className="vp-btn vp-btn--outline" style={{ padding: '6px 12px' }} onClick={() => fetchVehicleIssues(vehicle.id)}>
                {Icons.refresh} Odśwież
              </button>
            </div>
            {renderIssues(vehicle)}
          </div>
        )}
      </div>
    );
  };

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
      <div className="loading-spinner"></div>
    </div>
  );

  return (
    <div className="section-shell p-4 p-lg-5 dashboard-section">
      <div className="vp-page-header">
        <div>
          <h2 className="vp-page-header__title">Pojazdy floty</h2>
          <p className="vp-page-header__subtitle">
            {isAdmin ? 'Zarządzaj inwentarzem i stanem pojazdów' : 'Zapisuj trasy, tankowania i zgłaszaj usterki'}
          </p>
        </div>
        {isAdmin ? (
          <button className="vp-btn vp-btn--primary" onClick={() => setShowForm(!showForm)}>
            {Icons.plus} Dodaj pojazd
          </button>
        ) : (
          <span className="vp-status vp-status--info"><span className="vp-status__dot"></span>Widok kierowcy</span>
        )}
      </div>

      {banner && (
        <div className={`vp-alert vp-alert--${banner.type}`}>
          {banner.type === 'error' ? Icons.error : Icons.success}
          {banner.message}
        </div>
      )}

      {isAdmin && showForm && (
        <div className="vp-add-form">
          <h5 className="vp-add-form__title">Dodaj nowy pojazd</h5>
          <form onSubmit={handleVehicleSubmit}>
            <div className="vp-grid vp-grid--2 vp-grid--3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
              <div className="vp-form-group">
                <label className="vp-label">Marka</label>
                <input type="text" className="vp-input" name="make" value={formData.make} onChange={handleVehicleFieldChange} required placeholder="np. Toyota" />
              </div>
              <div className="vp-form-group">
                <label className="vp-label">Model</label>
                <input type="text" className="vp-input" name="model" value={formData.model} onChange={handleVehicleFieldChange} required placeholder="np. Camry" />
              </div>
              <div className="vp-form-group">
                <label className="vp-label">Rok</label>
                <input type="number" className="vp-input" name="year" value={formData.year} onChange={handleVehicleFieldChange} required />
              </div>
              <div className="vp-form-group">
                <label className="vp-label">VIN (17 znaków)</label>
                <input type="text" className="vp-input" name="vin" value={formData.vin} onChange={handleVehicleFieldChange} required maxLength={17} />
              </div>
              <div className="vp-form-group">
                <label className="vp-label">Rejestracja</label>
                <input type="text" className="vp-input" name="license_plate" value={formData.license_plate} onChange={handleVehicleFieldChange} required />
              </div>
              <div className="vp-form-group">
                <label className="vp-label">Typ napędu</label>
                <select className="vp-select" name="fuel_type" value={formData.fuel_type} onChange={handleVehicleFieldChange}>
                  <option value="gasoline">Benzyna</option>
                  <option value="diesel">Diesel</option>
                  <option value="electric">Elektryczny</option>
                  <option value="hybrid">Hybryda</option>
                </select>
              </div>
              <div className="vp-form-group">
                <label className="vp-label">Przebieg (km)</label>
                <input type="number" className="vp-input" name="odometer" value={formData.odometer} onChange={handleVehicleFieldChange} min="0" />
              </div>
              {(formData.fuel_type === 'electric' || formData.fuel_type === 'hybrid') && (
                <div className="vp-form-group">
                  <label className="vp-label">Poziom baterii (%)</label>
                  <input type="number" className="vp-input" name="battery_level" value={formData.battery_level} onChange={handleVehicleFieldChange} min="0" max="100" />
                </div>
              )}
              {formData.fuel_type !== 'electric' && (
                <div className="vp-form-group">
                  <label className="vp-label">Poziom paliwa (%)</label>
                  <input type="number" className="vp-input" name="fuel_level" value={formData.fuel_level} onChange={handleVehicleFieldChange} min="0" max="100" />
                </div>
              )}
              <div className="vp-form-group">
                <label className="vp-label">Pojemność baku (L)</label>
                <input type="number" className="vp-input" name="fuel_capacity" value={formData.fuel_capacity} onChange={handleVehicleFieldChange} min="0" />
              </div>
            </div>
            <div className="d-flex justify-content-end gap-2 mt-3">
              <button type="button" className="vp-btn vp-btn--outline" onClick={() => setShowForm(false)}>Anuluj</button>
              <button type="submit" className="vp-btn vp-btn--success">{Icons.check} Zapisz pojazd</button>
            </div>
          </form>
        </div>
      )}

      <div className="row g-3">
        {vehicles.map((vehicle) => (
          <div key={vehicle.id} className="col-12 col-lg-6">
            {renderVehicleCard(vehicle)}
          </div>
        ))}
        {vehicles.length === 0 && (
          <div className="col-12">
            <div className="vp-empty">
              <div className="vp-empty__icon">{Icons.truck}</div>
              <p className="vp-empty__text">
                {isAdmin ? 'Brak pojazdów we flocie.' : 'Brak przydzielonych pojazdów.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {locationModalVehicle && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(15, 28, 46, 0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: '16px', border: 'none', overflow: 'hidden' }}>
              <div className="modal-header" style={{ background: 'linear-gradient(135deg, #0f1c2e 0%, #1e3a5f 100%)', color: 'white', border: 'none', padding: '16px 20px' }}>
                <h5 className="modal-title" style={{ fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {Icons.location}
                  Zmień lokalizację: {getVehicleLabel(locationModalVehicle)}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setLocationModalVehicle(null)}></button>
              </div>
              <div className="modal-body" style={{ padding: '20px' }}>
                <div className="row g-3">
                  <div className="col-12 col-lg-8">
                    <div
                      id={`vehicle-map-${locationModalVehicle.id}`}
                      style={{ height: '320px', borderRadius: '12px', overflow: 'hidden', background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)' }}
                    ></div>
                  </div>
                  <div className="col-12 col-lg-4">
                    <div className="vp-form-group">
                      <label className="vp-label">Miasto / miejscowość</label>
                      <div className="d-flex gap-2">
                        <input
                          type="text"
                          className="vp-input"
                          placeholder="np. Warszawa"
                          value={locationForms[locationModalVehicle.id]?.city ?? ''}
                          onChange={(e) => handleLocationInput(locationModalVehicle.id, 'city', e.target.value)}
                        />
                        <button
                          type="button"
                          className="vp-btn vp-btn--outline"
                          style={{ whiteSpace: 'nowrap', padding: '9px 14px' }}
                          onClick={() => handleSearchCity(locationModalVehicle.id)}
                        >
                          Znajdź
                        </button>
                      </div>
                      <span className="vp-hint" style={{ marginTop: '6px', display: 'block' }}>
                        {locationLookups[locationModalVehicle.id] === 'loading' && '🔍 Wyszukiwanie...'}
                        {locationLookups[locationModalVehicle.id] === 'searching' && '🔍 Wyszukiwanie lokalizacji...'}
                        {locationLookups[locationModalVehicle.id] === 'ready' && '✓ Miasto zaktualizowane'}
                        {locationLookups[locationModalVehicle.id] === 'not-found' && '✗ Nie znaleziono'}
                        {locationLookups[locationModalVehicle.id] === 'error' && '✗ Błąd'}
                      </span>
                    </div>
                    <div className="vp-grid vp-grid--2 vp-form-group">
                      <div>
                        <label className="vp-label">Szerokość geo.</label>
                        <input
                          type="number"
                          step="0.000001"
                          className="vp-input"
                          value={locationForms[locationModalVehicle.id]?.latitude ?? ''}
                          onChange={(e) => handleLocationInput(locationModalVehicle.id, 'latitude', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="vp-label">Długość geo.</label>
                        <input
                          type="number"
                          step="0.000001"
                          className="vp-input"
                          value={locationForms[locationModalVehicle.id]?.longitude ?? ''}
                          onChange={(e) => handleLocationInput(locationModalVehicle.id, 'longitude', e.target.value)}
                        />
                      </div>
                    </div>
                    <p className="vp-hint" style={{ lineHeight: 1.5 }}>Kliknij na mapę, aby ustawić pinezkę — miasto zostanie dobrane automatycznie.</p>
                  </div>
                </div>
              </div>
              <div className="modal-footer" style={{ border: 'none', padding: '16px 20px', background: '#f8fafc' }}>
                <button type="button" className="vp-btn vp-btn--outline" onClick={() => setLocationModalVehicle(null)}>Anuluj</button>
                <button type="button" className="vp-btn vp-btn--primary" onClick={handleSaveLocation}>
                  {Icons.check} Zapisz lokalizację
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
