import apiService from "../api/apiServices";

// ================= PARKING API =================

// Add parking slot
export const addParkingAPI = async (parkingDetails) => {
    return await apiService("POST", "/parking", parkingDetails);
};

// Get all parking slots
export const allParkingAPI = async () => {
    return await apiService("GET", "/parking", {});
};

// View a single parking slot
export const viewParkingAPI = async (parkingId) => {
    return await apiService("GET", `/parking/${parkingId}`, {});
};

// Update parking slot details
export const updateParkingAPI = async (parkingId, parkingDetails) => {
    return await apiService("PUT", `/parking/${parkingId}`, parkingDetails);
};

// Delete parking slot
export const deleteParkingAPI = async (parkingId) => {
    return await apiService("DELETE", `/parking/${parkingId}`, {});
};


// ================= BOOKING API =================

// Add a booking
export const addBookingAPI = async (bookingDetails) => {
    return await apiService("POST", "/booking", bookingDetails);
};

// Get all bookings
export const allBookingAPI = async () => {
    return await apiService("GET", "/booking", {});
};

// View a single booking
export const viewBookingAPI = async (bookingId) => {
    return await apiService("GET", `/booking/${bookingId}`, {});
};

// Update booking details or status
export const updateBookingAPI = async (bookingId, bookingDetails) => {
    return await apiService("PUT", `/booking/${bookingId}`, bookingDetails);
};

// Delete booking
export const deleteBookingAPI = async (bookingId) => {
    return await apiService("DELETE", `/booking/${bookingId}`, {});
};