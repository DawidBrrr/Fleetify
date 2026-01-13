const {
    VITE_API_BASE_URL,
    VITE_API_KEY,
    VITE_HMAC_SECRET,
    REACT_APP_API_BASE_URL,
    REACT_APP_API_KEY,
    REACT_APP_HMAC_SECRET,
} = import.meta.env;

export const API_BASE_URL = VITE_API_BASE_URL ?? REACT_APP_API_BASE_URL ?? "";
export const API_KEY = VITE_API_KEY ?? REACT_APP_API_KEY ?? "";
export const HMAC_SECRET = VITE_HMAC_SECRET ?? REACT_APP_HMAC_SECRET ?? "";

export function getDefaultHeaders() {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}
