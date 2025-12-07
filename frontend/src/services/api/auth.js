import { API_BASE_URL, getDefaultHeaders } from "../config";

const handleResponse = async (response, errorMessage) => {
	if (!response.ok) {
		throw new Error(errorMessage);
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
};
