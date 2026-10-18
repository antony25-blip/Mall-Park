import axios from 'axios'

const axiosInstance = axios.create({
  baseURL: "http://localhost:3000",
  timeout: 5000,
});

axiosInstance.interceptors.response.use(
  (response) => {
    console.log("Response received");
    return response;
  },

  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      console.log("Unauthorised Access - Redirect to Login page");
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