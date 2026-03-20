const config = {
  apiBaseUrl: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5005',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};

export default config;
