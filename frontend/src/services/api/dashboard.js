import { API_BASE_URL, getDefaultHeaders } from "../config";

const handleResponse = async (response, errorMessage) => {
	if (!response.ok) {
		throw new Error(errorMessage);
	}
	return response.json();
};

export const dashboardApi = {
	fetchAdmin: async (params = {}) => {
		const query = new URLSearchParams(params).toString();
		const response = await fetch(
			`${API_BASE_URL}/api/dashboard/admin${query ? `?${query}` : ""}`,
			{
				method: "GET",
				headers: getDefaultHeaders(),
			}
		);
		return handleResponse(response, "Failed to load admin dashboard");
	},

	fetchEmployee: async (params = {}) => {
		const query = new URLSearchParams(params).toString();
		const response = await fetch(
			`${API_BASE_URL}/api/dashboard/employee${query ? `?${query}` : ""}`,
			{
				method: "GET",
				headers: getDefaultHeaders(),
			}
		);
		return handleResponse(response, "Failed to load employee dashboard");
	},

	fetchVehiclesSnapshot: async (params = {}) => {
		const query = new URLSearchParams(params).toString();
		const response = await fetch(
			`${API_BASE_URL}/api/dashboard/vehicles${query ? `?${query}` : ""}`,
			{
				method: "GET",
				headers: getDefaultHeaders(),
			}
		);
		return handleResponse(response, "Failed to load vehicles snapshot");
	},
};
