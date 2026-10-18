import axiosInstance from "./axiosInstance"

// API call should be called by component apiService
const apiService = async (httpMethod, url, reqBody) => {
    const reqConfig = {
        method: httpMethod,
        url,
        data: reqBody
    };

    try {
        const response = await axiosInstance(reqConfig);
        return response;
    } catch (err) {
        throw err;
    }
};

export default apiService;