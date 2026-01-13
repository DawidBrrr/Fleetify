import apiClient from './client';

export const authApi = {
  login: (email, password) => apiClient.post('/login', { email, password }),
};

export const driverApi = {
  // Pobieranie danych o przypisaniu (z dashboard-service)
  getDashboard: () => apiClient.get('/dashboard/employee'),
  
  // Aktualizacja licznika (z analytics-service przez dashboard-service)
  updateOdometer: (mileage, battery) => 
    apiClient.post('/dashboard/employee/vehicle/update', { mileage: mileage.toString(), battery: parseInt(battery) }),

  // Zgłaszanie usterki (bezpośrednio do vehicle-service przez gateway)
  reportIssue: (vehicleId, issueData) => 
    apiClient.post(`/vehicles/${vehicleId}/issues`, issueData),

  // Zapisywanie trasy (do analytics-service przez gateway/dashboard)
  logTrip: (tripData) => 
    apiClient.post('/dashboard/trips', tripData),
};