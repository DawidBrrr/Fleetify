import { API_BASE_URL, getDefaultHeaders } from "../config";

const handleResponse = async (response, errorMessage) => {
	if (!response.ok) {
		// Try to extract error detail from response
		try {
			const errorData = await response.json();
			const detail = errorData.detail || errorData.message || errorData.error;
			if (detail) {
				const error = new Error(detail);
				error.status = response.status;
				error.data = errorData;
				throw error;
			}
		} catch (parseError) {
			if (parseError.status) throw parseError; // Re-throw if it's our error
		}
		const error = new Error(errorMessage);
		error.status = response.status;
		throw error;
	}
	return response.json();
};

export const authApi = {
	login: async (credentials) => {
		const headers = getDefaultHeaders();
		delete headers.Authorization;
		const response = await fetch(`${API_BASE_URL}/api/login`, {
			method: "POST",
			headers: headers,
			body: JSON.stringify(credentials),
		});
		return handleResponse(response, "Login failed");
	},

	register: async (payload) => {
		const headers = getDefaultHeaders();
		delete headers.Authorization;
		const response = await fetch(`${API_BASE_URL}/api/register`, {
			method: "POST",
			headers: headers,
			body: JSON.stringify(payload),
		});
		return handleResponse(response, "Registration failed");
	},

	refreshToken: async () => {
		const response = await fetch(`${API_BASE_URL}/api/refresh`, {
			method: "POST",
			headers: getDefaultHeaders(),
		});
		return handleResponse(response, "Token refresh failed");
	},

	logout: async () => {
		const response = await fetch(`${API_BASE_URL}/api/logout`, {
			method: "POST",
			headers: getDefaultHeaders(),
		});
		return handleResponse(response, "Logout failed");
	},

	getCurrentUser: async () => {
		const response = await fetch(`${API_BASE_URL}/api/users/me`, {
			method: "GET",
			headers: getDefaultHeaders(),
		});
		return handleResponse(response, "Failed to fetch user");
	},

	renewSubscription: async (subscriptionPlan) => {
		const response = await fetch(`${API_BASE_URL}/api/subscription/renew`, {
			method: "POST",
			headers: getDefaultHeaders(),
			body: JSON.stringify({ subscription_plan: subscriptionPlan }),
		});
		return handleResponse(response, "Subscription renewal failed");
	},
};
