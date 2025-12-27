import { API_BASE_URL, getDefaultHeaders } from "../config";

const handleResponse = async (response, errorMessage) => {
    if (!response.ok) {
        throw new Error(errorMessage);
    }
    return response.json();
};

export const analyticsApi = {
    // Pobierz dane o zużyciu paliwa w czasie
    getFuelConsumption: async (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.days) queryParams.append("days", params.days);
        if (params.vehicleId) queryParams.append("vehicle_id", params.vehicleId);
        if (params.groupBy) queryParams.append("group_by", params.groupBy);
        
        const response = await fetch(
            `${API_BASE_URL}/api/analytics/charts/fuel-consumption?${queryParams}`,
            {
                method: "GET",
                headers: getDefaultHeaders(),
            }
        );
        return handleResponse(response, "Nie udało się pobrać danych o zużyciu paliwa");
    },

    // Pobierz podział kosztów
    getCostBreakdown: async (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.days) queryParams.append("days", params.days);
        
        const response = await fetch(
            `${API_BASE_URL}/api/analytics/charts/cost-breakdown?${queryParams}`,
            {
                method: "GET",
                headers: getDefaultHeaders(),
            }
        );
        return handleResponse(response, "Nie udało się pobrać danych o kosztach");
    },

    // Pobierz dane o przebiegu pojazdów
    getVehicleMileage: async (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.days) queryParams.append("days", params.days);
        if (params.limit) queryParams.append("limit", params.limit);
        
        const response = await fetch(
            `${API_BASE_URL}/api/analytics/charts/vehicle-mileage?${queryParams}`,
            {
                method: "GET",
                headers: getDefaultHeaders(),
            }
        );
        return handleResponse(response, "Nie udało się pobrać danych o przebiegu");
    },

    // Pobierz efektywność paliwową w czasie
    getFuelEfficiency: async (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.days) queryParams.append("days", params.days);
        if (params.vehicleId) queryParams.append("vehicle_id", params.vehicleId);
        
        const response = await fetch(
            `${API_BASE_URL}/api/analytics/charts/fuel-efficiency?${queryParams}`,
            {
                method: "GET",
                headers: getDefaultHeaders(),
            }
        );
        return handleResponse(response, "Nie udało się pobrać danych o efektywności");
    },

    // Pobierz trend kosztów miesięcznych
    getCostTrend: async (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.months) queryParams.append("months", params.months);
        if (params.vehicleId) queryParams.append("vehicle_id", params.vehicleId);
        
        const response = await fetch(
            `${API_BASE_URL}/api/analytics/charts/cost-trend?${queryParams}`,
            {
                method: "GET",
                headers: getDefaultHeaders(),
            }
        );
        return handleResponse(response, "Nie udało się pobrać trendu kosztów");
    },

    // Pobierz podsumowanie floty
    getFleetSummary: async () => {
        const response = await fetch(
            `${API_BASE_URL}/api/analytics/charts/fleet-summary`,
            {
                method: "GET",
                headers: getDefaultHeaders(),
            }
        );
        return handleResponse(response, "Nie udało się pobrać podsumowania floty");
    },

    // Pobierz listę pojazdów do filtrów
    getVehiclesList: async () => {
        const response = await fetch(
            `${API_BASE_URL}/api/analytics/vehicles-list`,
            {
                method: "GET",
                headers: getDefaultHeaders(),
            }
        );
        return handleResponse(response, "Nie udało się pobrać listy pojazdów");
    },

    // Predykcja dziennych kosztów na podstawie regresji
    getCostPrediction: async (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.historyDays) queryParams.append("history_days", params.historyDays);
        if (params.predictDays) queryParams.append("predict_days", params.predictDays);
        if (params.vehicleId) queryParams.append("vehicle_id", params.vehicleId);
        
        const response = await fetch(
            `${API_BASE_URL}/api/analytics/charts/cost-prediction?${queryParams}`,
            {
                method: "GET",
                headers: getDefaultHeaders(),
            }
        );
        return handleResponse(response, "Nie udało się pobrać predykcji kosztów");
    },

    // Predykcja miesięcznych kosztów
    getMonthlyPrediction: async (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.historyMonths) queryParams.append("history_months", params.historyMonths);
        if (params.predictMonths) queryParams.append("predict_months", params.predictMonths);
        
        const response = await fetch(
            `${API_BASE_URL}/api/analytics/charts/monthly-prediction?${queryParams}`,
            {
                method: "GET",
                headers: getDefaultHeaders(),
            }
        );
        return handleResponse(response, "Nie udało się pobrać miesięcznej predykcji");
    },
};
