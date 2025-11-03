import axios from "axios";

// Create axios instance with base configuration
const axiosInstance = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for adding auth tokens
axiosInstance.interceptors.request.use(
  (config) => {
    // Get token from localStorage if available
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor for handling errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem("token");
      // You can add redirect to login page here if needed
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
