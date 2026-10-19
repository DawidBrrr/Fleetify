const baseUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

if (!baseUrl) {
  throw new Error('Missing EXPO_PUBLIC_API_URL environment variable.');
}

export const CONFIG = {
  BASE_URL: baseUrl,
  COLORS: {
    navy: '#0F1C2E',
    cyan: '#05B4D9',
    orange: '#FF9800',
    ice: '#F7FBFF',
    white: '#FFFFFF',
    gray: '#607D94',
    danger: '#D64032'
  }
};