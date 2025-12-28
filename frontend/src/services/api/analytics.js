import { API_BASE_URL, getDefaultHeaders } from "../config";

const handleResponse = async (response, errorMessage) => {
    if (!response.ok) {
        throw new Error(errorMessage);
    }
    return response.json();
};

export const analyticsApi = {
    // Pobierz dane o zużyciu paliwa w czasie (przez dashboard proxy)
    getFuelConsumption: async (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.days) queryParams.append("days", params.days);
        if (params.vehicleId) queryParams.append("vehicle_id", params.vehicleId);
        if (params.groupBy) queryParams.append("group_by", params.groupBy);
        
        const response = await fetch(
            `${API_BASE_URL}/api/dashboard/charts/fuel-consumption?${queryParams}`,
            {
                method: "GET",
                headers: getDefaultHeaders(),
            }
        );
        return handleResponse(response, "Nie udało się pobrać danych o zużyciu paliwa");
    },

    // Pobierz podział kosztów (przez dashboard proxy)
    getCostBreakdown: async (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.days) queryParams.append("days", params.days);
        
        const response = await fetch(
            `${API_BASE_URL}/api/dashboard/charts/cost-breakdown?${queryParams}`,
            {
                method: "GET",
                headers: getDefaultHeaders(),
            }
        );
        return handleResponse(response, "Nie udało się pobrać danych o kosztach");
    },

    // Pobierz dane o przebiegu pojazdów (przez dashboard proxy)
    getVehicleMileage: async (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.days) queryParams.append("days", params.days);
        if (params.limit) queryParams.append("limit", params.limit);
        
        const response = await fetch(
            `${API_BASE_URL}/api/dashboard/charts/vehicle-mileage?${queryParams}`,
            {
                method: "GET",
                headers: getDefaultHeaders(),
            }
        );
        return handleResponse(response, "Nie udało się pobrać danych o przebiegu");
    },

    // Pobierz efektywność paliwową w czasie (przez dashboard proxy)
    getFuelEfficiency: async (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.days) queryParams.append("days", params.days);
        if (params.vehicleId) queryParams.append("vehicle_id", params.vehicleId);
        
        const response = await fetch(
            `${API_BASE_URL}/api/dashboard/charts/fuel-efficiency?${queryParams}`,
            {
                method: "GET",
                headers: getDefaultHeaders(),
            }
        );
        return handleResponse(response, "Nie udało się pobrać danych o efektywności");
    },

    // Pobierz trend kosztów miesięcznych (przez dashboard proxy)
    getCostTrend: async (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.months) queryParams.append("months", params.months);
        if (params.vehicleId) queryParams.append("vehicle_id", params.vehicleId);
        
        const response = await fetch(
            `${API_BASE_URL}/api/dashboard/charts/cost-trend?${queryParams}`,
            {
                method: "GET",
                headers: getDefaultHeaders(),
            }
        );
        return handleResponse(response, "Nie udało się pobrać trendu kosztów");
    },

    // Pobierz podsumowanie floty (przez dashboard proxy)
    getFleetSummary: async () => {
        const response = await fetch(
            `${API_BASE_URL}/api/dashboard/charts/fleet-summary`,
            {
                method: "GET",
                headers: getDefaultHeaders(),
            }
        );
        return handleResponse(response, "Nie udało się pobrać podsumowania floty");
    },

    // Pobierz listę pojazdów do filtrów (przez dashboard proxy)
    getVehiclesList: async () => {
        const response = await fetch(
            `${API_BASE_URL}/api/dashboard/vehicles-list`,
            {
                method: "GET",
                headers: getDefaultHeaders(),
            }
        );
        return handleResponse(response, "Nie udało się pobrać listy pojazdów");
    },

    // Predykcja dziennych kosztów na podstawie regresji (przez dashboard proxy)
    getCostPrediction: async (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.historyDays) queryParams.append("history_days", params.historyDays);
        if (params.predictDays) queryParams.append("predict_days", params.predictDays);
        if (params.vehicleId) queryParams.append("vehicle_id", params.vehicleId);
        
        const response = await fetch(
            `${API_BASE_URL}/api/dashboard/charts/cost-prediction?${queryParams}`,
            {
                method: "GET",
                headers: getDefaultHeaders(),
            }
        );
        return handleResponse(response, "Nie udało się pobrać predykcji kosztów");
    },

    // Predykcja miesięcznych kosztów (przez dashboard proxy)
    getMonthlyPrediction: async (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.historyMonths) queryParams.append("history_months", params.historyMonths);
        if (params.predictMonths) queryParams.append("predict_months", params.predictMonths);
        
        const response = await fetch(
            `${API_BASE_URL}/api/dashboard/charts/monthly-prediction?${queryParams}`,
            {
                method: "GET",
                headers: getDefaultHeaders(),
            }
        );
        return handleResponse(response, "Nie udało się pobrać miesięcznej predykcji");
    },
};
