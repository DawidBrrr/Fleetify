import { API_BASE_URL, getDefaultHeaders } from "../config";

const handleResponse = async (response, errorMessage) => {
	if (!response.ok) {
		throw new Error(errorMessage);
	}
	if (response.status === 204) {
		return null;
	}
	const text = await response.text();
	return text ? JSON.parse(text) : null;
};

const buildQuery = (params = {}) => {
	const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "");
	if (!entries.length) return "";
	const query = new URLSearchParams(Object.fromEntries(entries)).toString();
	return query ? `?${query}` : "";
};

export const dashboardApi = {
	fetchAdmin: async (params = {}) => {
		const query = buildQuery(params);
		const response = await fetch(
			`${API_BASE_URL}/api/dashboard/admin${query}`,
			{
				method: "GET",
				headers: getDefaultHeaders(),
			}
		);
		return handleResponse(response, "Failed to load admin dashboard");
	},

	fetchEmployee: async (params = {}) => {
		const query = buildQuery(params);
		const response = await fetch(
			`${API_BASE_URL}/api/dashboard/employee${query}`,
			{
				method: "GET",
				headers: getDefaultHeaders(),
			}
		);
		return handleResponse(response, "Failed to load employee dashboard");
	},

	fetchVehiclesSnapshot: async (params = {}) => {
		const query = buildQuery(params);
		const response = await fetch(
			`${API_BASE_URL}/api/dashboard/vehicles${query}`,
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

	fetchMyVehicles: async () => {
		const response = await fetch(`${API_BASE_URL}/api/dashboard/vehicles/me`, {
			method: "GET",
			headers: getDefaultHeaders(),
		});
		return handleResponse(response, "Failed to load assigned vehicles");
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

	removeEmployee: async (employeeId) => {
		const response = await fetch(`${API_BASE_URL}/api/dashboard/employees/${employeeId}`, {
			method: "DELETE",
			headers: getDefaultHeaders(),
		});
		return handleResponse(response, "Failed to remove employee");
	},

	updateVehicleLocation: async (vehicleId, payload) => {
		const response = await fetch(`${API_BASE_URL}/api/dashboard/vehicles/${vehicleId}/location`, {
			method: "POST",
			headers: getDefaultHeaders(),
			body: JSON.stringify(payload),
		});
		return handleResponse(response, "Failed to update vehicle location");
	},

	assignTask: async (assignmentData) => {
		const response = await fetch(`${API_BASE_URL}/api/dashboard/assignments`, {
			method: "POST",
			headers: getDefaultHeaders(),
			body: JSON.stringify(assignmentData),
		});
		return handleResponse(response, "Failed to assign task");
	},

	assignVehicle: async (payload) => {
		const response = await fetch(`${API_BASE_URL}/api/dashboard/assignments/vehicle`, {
			method: "POST",
			headers: getDefaultHeaders(),
			body: JSON.stringify(payload),
		});
		return handleResponse(response, "Failed to assign vehicle");
	},

	assignTasks: async (payload) => {
		const response = await fetch(`${API_BASE_URL}/api/dashboard/assignments/tasks`, {
			method: "POST",
			headers: getDefaultHeaders(),
			body: JSON.stringify(payload),
		});
		return handleResponse(response, "Failed to assign tasks");
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

	listTripLogs: async (params = {}) => {
		const query = buildQuery(params);
		const response = await fetch(`${API_BASE_URL}/api/dashboard/trips${query}`, {
			method: "GET",
			headers: getDefaultHeaders(),
		});
		return handleResponse(response, "Failed to load trip logs");
	},

	createTripLog: async (payload) => {
		const response = await fetch(`${API_BASE_URL}/api/dashboard/trips`, {
			method: "POST",
			headers: getDefaultHeaders(),
			body: JSON.stringify(payload),
		});
		return handleResponse(response, "Failed to create trip log");
	},

	updateTripLog: async (tripId, payload) => {
		const response = await fetch(`${API_BASE_URL}/api/dashboard/trips/${tripId}`, {
			method: "PUT",
			headers: getDefaultHeaders(),
			body: JSON.stringify(payload),
		});
		return handleResponse(response, "Failed to update trip log");
	},

	deleteTripLog: async (tripId) => {
		const response = await fetch(`${API_BASE_URL}/api/dashboard/trips/${tripId}`, {
			method: "DELETE",
			headers: getDefaultHeaders(),
		});
		return handleResponse(response, "Failed to delete trip log");
	},

	listFuelLogs: async (params = {}) => {
		const query = buildQuery(params);
		const response = await fetch(`${API_BASE_URL}/api/dashboard/fuel-logs${query}`, {
			method: "GET",
			headers: getDefaultHeaders(),
		});
		return handleResponse(response, "Failed to load fuel logs");
	},

	createFuelLog: async (payload) => {
		const response = await fetch(`${API_BASE_URL}/api/dashboard/fuel-logs`, {
			method: "POST",
			headers: getDefaultHeaders(),
			body: JSON.stringify(payload),
		});
		return handleResponse(response, "Failed to create fuel log");
	},

	updateFuelLog: async (logId, payload) => {
		const response = await fetch(`${API_BASE_URL}/api/dashboard/fuel-logs/${logId}`, {
			method: "PUT",
			headers: getDefaultHeaders(),
			body: JSON.stringify(payload),
		});
		return handleResponse(response, "Failed to update fuel log");
	},

	deleteFuelLog: async (logId) => {
		const response = await fetch(`${API_BASE_URL}/api/dashboard/fuel-logs/${logId}`, {
			method: "DELETE",
			headers: getDefaultHeaders(),
		});
		return handleResponse(response, "Failed to delete fuel log");
	},

	fetchVehicleIssues: async (vehicleId) => {
		const response = await fetch(`${API_BASE_URL}/api/dashboard/vehicles/${vehicleId}/issues`, {
			method: "GET",
			headers: getDefaultHeaders(),
		});
		return handleResponse(response, "Failed to load vehicle issues");
	},

	reportVehicleIssue: async (vehicleId, payload) => {
		const response = await fetch(`${API_BASE_URL}/api/dashboard/vehicles/${vehicleId}/issues`, {
			method: "POST",
			headers: getDefaultHeaders(),
			body: JSON.stringify(payload),
		});
		return handleResponse(response, "Failed to report vehicle issue");
	},

	updateVehicleIssue: async (vehicleId, issueId, payload) => {
		const response = await fetch(`${API_BASE_URL}/api/dashboard/vehicles/${vehicleId}/issues/${issueId}`, {
			method: "PATCH",
			headers: getDefaultHeaders(),
			body: JSON.stringify(payload),
		});
		return handleResponse(response, "Failed to update vehicle issue");
	},
};
