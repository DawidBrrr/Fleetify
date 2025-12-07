import { API_BASE_URL, getDefaultHeaders } from "../config";

const handleResponse = async (response, errorMessage) => {
	if (!response.ok) {
		throw new Error(errorMessage);
	}
	return response.json();
};

export const vehicleApi = {
	getAll: async (params = {}) => {
		const query = new URLSearchParams(params).toString();
		const response = await fetch(
			`${API_BASE_URL}/api/vehicles${query ? `?${query}` : ""}`,
			{
				method: "GET",
				headers: getDefaultHeaders(),
			}
		);
		return handleResponse(response, "Failed to load vehicles");
	},

	getById: async (id) => {
		const response = await fetch(`${API_BASE_URL}/api/vehicles/${id}`, {
			method: "GET",
			headers: getDefaultHeaders(),
		});
		return handleResponse(response, "Failed to load vehicle details");
	},

	create: async (data) => {
		const response = await fetch(`${API_BASE_URL}/api/vehicles`, {
			method: "POST",
			headers: getDefaultHeaders(),
			body: JSON.stringify(data),
		});
		return handleResponse(response, "Failed to create vehicle");
	},
};
