import apiClient from './client';

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
};