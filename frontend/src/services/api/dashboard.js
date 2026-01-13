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

	deleteVehicle: async (vehicleId) => {
		const response = await fetch(`${API_BASE_URL}/api/dashboard/vehicles/${vehicleId}`, {
			method: "DELETE",
			headers: getDefaultHeaders(),
		});
		return handleResponse(response, "Failed to delete vehicle");
	},

	updateVehicleLocation: async (vehicleId, payload) => {
		const response = await fetch(`${API_BASE_URL}/api/dashboard/vehicles/${vehicleId}/location`, {
			method: "POST",
			headers: getDefaultHeaders(),
			body: JSON.stringify(payload),
		});
		return handleResponse(response, "Failed to update vehicle location");
	},

	updateVehicleService: async (vehicleId, payload) => {
		const response = await fetch(`${API_BASE_URL}/api/dashboard/vehicles/${vehicleId}/service`, {
			method: "POST",
			headers: getDefaultHeaders(),
			body: JSON.stringify(payload),
		});
		return handleResponse(response, "Failed to update vehicle service date");
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

	// ==================== ASYNC REPORT GENERATION (RabbitMQ) ====================

	/**
	 * Request a report generation (async with queue)
	 * Returns a job ID for polling
	 */
	requestReport: async (reportType = "fleet-summary", startDate = null, endDate = null) => {
		const payload = {
			start_date: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
			end_date: endDate || new Date().toISOString().split('T')[0],
			include_charts: true,
			include_summary: true,
		};

		const response = await fetch(`${API_BASE_URL}/api/reports/request/${reportType}`, {
			method: "POST",
			headers: getDefaultHeaders(),
			body: JSON.stringify(payload),
		});

		return handleResponse(response, "Failed to request report");
	},

	/**
	 * Check report generation status
	 */
	checkReportStatus: async (jobId) => {
		const response = await fetch(`${API_BASE_URL}/api/reports/status/${jobId}`, {
			method: "GET",
			headers: getDefaultHeaders(),
		});

		return handleResponse(response, "Failed to check report status");
	},

	/**
	 * Download generated report
	 */
	downloadReport: async (jobId) => {
		const response = await fetch(`${API_BASE_URL}/api/reports/download/${jobId}`, {
			method: "GET",
			headers: getDefaultHeaders(),
		});

		if (!response.ok) {
			throw new Error("Failed to download report");
		}

		return response.blob();
	},

	/**
	 * Generate report with polling (convenience method)
	 * Requests a report, polls for completion, then downloads
	 */
	generateReportAsync: async (reportType = "fleet-summary", startDate = null, endDate = null, onProgress = null) => {
		// Step 1: Request report generation
		const jobResponse = await dashboardApi.requestReport(reportType, startDate, endDate);
		
		if (!jobResponse || !jobResponse.job_id) {
			throw new Error("Failed to queue report generation");
		}

		const jobId = jobResponse.job_id;
		
		if (onProgress) onProgress({ status: 'PENDING', progress: 0, message: 'Raport oczekuje w kolejce...' });

		// Step 2: Poll for status
		const maxAttempts = 60; // 2 minutes max (2s intervals)
		const pollInterval = 2000; // 2 seconds
		
		for (let attempt = 0; attempt < maxAttempts; attempt++) {
			await new Promise(resolve => setTimeout(resolve, pollInterval));
			
			const status = await dashboardApi.checkReportStatus(jobId);
			
			if (onProgress) {
				onProgress({
					status: status.status,
					progress: status.progress || 0,
					message: status.message || 'Generowanie raportu...'
				});
			}
			
			if (status.status === 'COMPLETED') {
				// Step 3: Download the report
				return dashboardApi.downloadReport(jobId);
			}
			
			if (status.status === 'FAILED') {
				throw new Error(status.error_message || 'Generowanie raportu nie powiodło się');
			}
		}
		
		throw new Error('Przekroczono czas oczekiwania na raport');
	},

	// ==================== LEGACY SYNC REPORT GENERATION ====================
	generateFleetReport: async (reportType = "fleet-summary", startDate = null, endDate = null) => {
		const payload = {
			report_type: reportType,
			start_date: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
			end_date: endDate || new Date().toISOString().split('T')[0],
			include_charts: true,
			include_summary: true,
		};

		const response = await fetch(`${API_BASE_URL}/api/reports/${reportType}`, {
			method: "POST",
			headers: getDefaultHeaders(),
			body: JSON.stringify(payload),
		});

		if (!response.ok) {
			throw new Error("Failed to generate report");
		}

		// Return blob for PDF download
		return response.blob();
	},

	downloadTripsReport: async (startDate = null, endDate = null) => {
		const payload = {
			start_date: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
			end_date: endDate || new Date().toISOString().split('T')[0],
		};

		const response = await fetch(`${API_BASE_URL}/api/reports/trips`, {
			method: "POST",
			headers: getDefaultHeaders(),
			body: JSON.stringify(payload),
		});

		if (!response.ok) {
			throw new Error("Failed to generate trips report");
		}

		return response.blob();
	},

	downloadCostReport: async (startDate = null, endDate = null) => {
		const payload = {
			start_date: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
			end_date: endDate || new Date().toISOString().split('T')[0],
		};

		const response = await fetch(`${API_BASE_URL}/api/reports/cost-analysis`, {
			method: "POST",
			headers: getDefaultHeaders(),
			body: JSON.stringify(payload),
		});

		if (!response.ok) {
			throw new Error("Failed to generate cost report");
		}

		return response.blob();
	},
};
