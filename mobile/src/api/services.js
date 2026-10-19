import apiClient from './client';
import { CONFIG } from '../constants/Config';

export const driverApi = {
  // Pobieranie danych o aucie i zadaniach
  getDashboard: () => apiClient.get('/dashboard/employee'),
  
  // Aktualizacja licznika i baterii
  updateVehicleStatus: (mileage, battery) => 
    apiClient.post('/dashboard/employee/vehicle/update', { 
        mileage: mileage.toString(), 
        battery: parseInt(battery) 
    }),

  // ZWROT: Zwalnianie auta w systemie
  returnVehicle: () => apiClient.post('/dashboard/employee/vehicle/return'),

  // USTERKI: Zgłoszenie do vehicle-service
  reportIssue: (vehicleId, issueData) => 
    apiClient.post(`/vehicles/${vehicleId}/issues`, issueData),

  // TRASY: Zapis do analytics-service
  createTrip: (tripData) => apiClient.post('/dashboard/trips', tripData),

  // TANKOWANIA: Zapis do analytics-service
  createFuelLog: (fuelData) => apiClient.post('/dashboard/fuel-logs', fuelData),

  // HISTORIA: Dla widoku list
  getMyTrips: () => apiClient.get('/dashboard/trips'),

  // RAPORTY: Generowanie i pobieranie raportów
  requestReport: (reportType, request = {}) =>
    apiClient.post(`/reports/request/${reportType}`, request),
  checkReportStatus: (jobId) => apiClient.get(`/reports/status/${jobId}`),
  getDownloadUrl: (jobId) => `${CONFIG.BASE_URL}/reports/download/${jobId}`,
};