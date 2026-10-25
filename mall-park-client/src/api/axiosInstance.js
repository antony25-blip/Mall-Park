import axios from 'axios'

const apiBaseUrl = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? '/api' : '')
).replace(/\/+$/, '');

const axiosInstance = axios.create({
  baseURL: apiBaseUrl,
  timeout: 30000,
  withCredentials: true,
});

axiosInstance.interceptors.response.use(
  (response) => {
    console.log("Response received");
    return response;
  },

  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      window.dispatchEvent(new Event("mallpark:session-expired"));
    }
    else if (status === 404) {
      console.log("API Not Found");
    }
    else if (status === 500) {
      console.log("Something went wrong... Try again later!!!");
    }
    else if (error.request) {
      console.log("No response from Server");
    }
    else {
      console.log("Error " + error.message);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;