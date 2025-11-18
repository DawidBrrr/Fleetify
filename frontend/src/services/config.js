if(process.env.NODE_ENV !== 'production') {
    require("dotenv").config();
}


export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
export const API_KEY = process.env.REACT_APP_API_KEY;
export const HMAC_SECRET = process.env.REACT_APP_HMAC_SECRET;

export function getDefaultHeaders() {
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`, // Add token if available
        "X-API-Key": API_KEY
  };
}
