import axiosInstance from "./axiosInstance"

// API call should be called by component apiService
const apiService = async (httpMethod, url, reqBody) => {
    const reqConfig = {
        method: httpMethod,
        url,
        data: reqBody
    };

    return axiosInstance(reqConfig);
};

export default apiService;