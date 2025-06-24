import axios from "axios";

const API_BASE_URL = "http://localhost:5116";

// Create Axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Send HttpOnly cookies like refreshToken
});

// Access token stored only in memory (not in localStorage for security)
let accessToken = null;

let isRefreshing = false;
let failedQueue = [];

// Queue processor for requests waiting on token refresh
const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Public method to set access token
export const setAccessToken = (token) => {
  console.log("🔄 New Access Token set:", token);
  accessToken = token;
};

// Public method to clear auth token (on logout or failure)
export const clearAuth = () => {
  accessToken = null;
};

// Request Interceptor – attach Bearer token if present
axiosInstance.interceptors.request.use(
  (config) => {
    if (accessToken) {
      console.log("🕵️‍♀️ Using Access Token:", accessToken);  
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    // Optional: debug logging
    if (import.meta.env.DEV) {
      console.log("[Axios Request]", config.method?.toUpperCase(), config.url);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor – handle 401 with refresh logic
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Wait for ongoing refresh to complete
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      return new Promise((resolve, reject) => {
        axiosInstance
          .post("/auth/refresh-token") // No body needed, cookie sent automatically
          .then(({ data }) => {
            if (!data?.accessToken) {
              throw new Error("No access token received");
            }

            setAccessToken(data.accessToken);

            // Update default headers
            axiosInstance.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`;
            originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;

            processQueue(null, data.accessToken);
            resolve(axiosInstance(originalRequest));
          })
          .catch((err) => {
            processQueue(err, null);
            clearAuth();
            window.location.href = "/login"; // Redirect to login page
            reject(err);
          })
          .finally(() => {
            isRefreshing = false;
          });
      });
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
