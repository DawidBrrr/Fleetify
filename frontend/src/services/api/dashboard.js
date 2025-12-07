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

	fetchVehicles: async () => {
		const response = await fetch(`${API_BASE_URL}/api/dashboard/vehicles`, {
			method: "GET",
			headers: getDefaultHeaders(),
		});
		return handleResponse(response, "Failed to load vehicles");
	},

	addVehicle: async (vehicleData) => {
		const response = await fetch(`${API_BASE_URL}/api/dashboard/vehicles`, {
			method: "POST",
			headers: getDefaultHeaders(),
			body: JSON.stringify(vehicleData),
		});
		return handleResponse(response, "Failed to add vehicle");
	},

	fetchEmployees: async () => {
		const response = await fetch(`${API_BASE_URL}/api/dashboard/employees`, {
			method: "GET",
			headers: getDefaultHeaders(),
		});
		return handleResponse(response, "Failed to load employees");
	},

	inviteEmployee: async (employeeData) => {
		const response = await fetch(`${API_BASE_URL}/api/dashboard/employees`, {
			method: "POST",
			headers: getDefaultHeaders(),
			body: JSON.stringify(employeeData),
		});
		return handleResponse(response, "Failed to invite employee");
	},

	assignTask: async (assignmentData) => {
		const response = await fetch(`${API_BASE_URL}/api/dashboard/assignments`, {
			method: "POST",
			headers: getDefaultHeaders(),
			body: JSON.stringify(assignmentData),
		});
		return handleResponse(response, "Failed to assign task");
	},
};
