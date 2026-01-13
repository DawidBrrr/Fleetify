import apiClient from './client';

export const driverApi = {
  getDashboard: () => apiClient.get('/dashboard/employee'),
  
  updateOdometer: (mileage, battery) => 
    apiClient.post('/dashboard/employee/vehicle/update', { 
      mileage: mileage.toString(), 
      battery: parseInt(battery) 
    }),

  // FIX: Usunięto /api/ z początku ścieżki, bo jest w baseURL
  reportIssue: (vehicleId, issueData) => 
    apiClient.post(`/vehicles/${vehicleId}/issues`, issueData),

  getMyTrips: () => apiClient.get('/dashboard/trips'),
  
  // NOWOŚĆ: Dodawanie trasy
  createTrip: (tripData) => apiClient.post('/dashboard/trips', tripData),

  getMyStats: () => apiClient.get('/dashboard/charts/fleet-summary'),
  
  // RAPORTY PDF
  requestReport: (reportType = 'trips') => 
    apiClient.post(`/reports/request/${reportType}`, { include_charts: true, include_summary: true }),
  checkReportStatus: (jobId) => apiClient.get(`/reports/status/${jobId}`),
  getDownloadUrl: (jobId) => `${apiClient.defaults.baseURL}/reports/download/${jobId}`,
};