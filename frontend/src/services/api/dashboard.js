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

	fetchTeam: async () => {
		const response = await fetch(`${API_BASE_URL}/api/dashboard/team`, {
			method: "GET",
			headers: getDefaultHeaders(),
		});
		return handleResponse(response, "Failed to load team info");
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

	fetchNotifications: async () => {
		const response = await fetch(`${API_BASE_URL}/api/dashboard/notifications`, {
			method: "GET",
			headers: getDefaultHeaders(),
		});
		return handleResponse(response, "Failed to load notifications");
	},

	ackNotification: async (notificationId) => {
		const response = await fetch(`${API_BASE_URL}/api/dashboard/notifications/${notificationId}/ack`, {
			method: "POST",
			headers: getDefaultHeaders(),
			body: JSON.stringify({}),
		});
		return handleResponse(response, "Failed to update notification");
	},

	respondToNotification: async (notificationId, action) => {
		const response = await fetch(`${API_BASE_URL}/api/dashboard/notifications/${notificationId}/respond`, {
			method: "POST",
			headers: getDefaultHeaders(),
			body: JSON.stringify({ action }),
		});
		return handleResponse(response, "Failed to respond to notification");
	},

	updateTaskStatus: async (data) => {
		const response = await fetch(`${API_BASE_URL}/api/dashboard/employee/tasks/update`, {
			method: "POST",
			headers: getDefaultHeaders(),
			body: JSON.stringify(data),
		});
		return handleResponse(response, "Failed to update task status");
	},

	returnVehicle: async () => {
		const response = await fetch(`${API_BASE_URL}/api/dashboard/employee/vehicle/return`, {
			method: "POST",
			headers: getDefaultHeaders(),
			body: JSON.stringify({}),
		});
		return handleResponse(response, "Failed to return vehicle");
	},

	updateVehicleStatus: async (data) => {
		const response = await fetch(`${API_BASE_URL}/api/dashboard/employee/vehicle/update`, {
			method: "POST",
			headers: getDefaultHeaders(),
			body: JSON.stringify(data),
		});
		return handleResponse(response, "Failed to update vehicle status");
	},
};
