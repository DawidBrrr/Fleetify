import { API_BASE_URL, getDefaultHeaders, HMAC_SECRET } from "../config";

const handleResponse = async (response, errorMessage) => {
	if (!response.ok) {
		throw new Error(errorMessage);
	}
	return response.json();
};

const textEncoder = new TextEncoder();

const toHex = (buffer) =>
	Array.from(new Uint8Array(buffer))
		.map((byte) => byte.toString(16).padStart(2, "0"))
		.join("");

const buildSignature = async (payload) => {
	if (!HMAC_SECRET) {
		throw new Error("Missing HMAC secret for signing notifications");
	}

	const keyData = textEncoder.encode(HMAC_SECRET);
	const payloadData = textEncoder.encode(payload);
	const cryptoKey = await crypto.subtle.importKey(
		"raw",
		keyData,
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"]
	);
	const signature = await crypto.subtle.sign("HMAC", cryptoKey, payloadData);
	return toHex(signature);
};

export const notificationsApi = {
	sendNotification: async (notification) => {
		const payload = JSON.stringify(notification);
		const signature = await buildSignature(payload);
		const headers = {
			...getDefaultHeaders(),
			"X-Client-Signature": signature,
		};
		const response = await fetch(`${API_BASE_URL}/api/notifications/send`, {
			method: "POST",
			headers,
			body: payload,
		});
		return handleResponse(response, "Failed to send notification");
	},

	fetchHistory: async (params = {}) => {
		const query = new URLSearchParams(params).toString();
		const response = await fetch(
			`${API_BASE_URL}/api/notifications/history${query ? `?${query}` : ""}`,
			{
				method: "GET",
				headers: getDefaultHeaders(),
			}
		);
		return handleResponse(response, "Failed to load notification history");
	},
};
