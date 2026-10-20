import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import {
    allBookingAPI,
    addBookingAPI,
    updateBookingAPI,
    deleteBookingAPI,
    allParkingAPI,
} from "../../Services/allApi";


// Fetch all bookings
export const fetchBookings = createAsyncThunk(
    "booking/fetchBookings",
    async (_, { rejectWithValue }) => {
        try {
            const response = await allBookingAPI();

            return response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                error.message ||
                "Failed to fetch bookings"
            );
        }
    }
);


// Create a booking with time-based availability
export const createBooking = createAsyncThunk(
    "booking/createBooking",
    async (bookingData, { rejectWithValue }) => {
        try {
            // Validate booking details
            if (
                !bookingData.areaId ||
                !bookingData.slotId ||
                !bookingData.date ||
                !bookingData.startTime ||
                !Number.isFinite(Number(bookingData.duration)) ||
                Number(bookingData.duration) <= 0
            ) {
                return rejectWithValue(
                    "Please provide valid booking details."
                );
            }


            // Calculate the new booking start and end times
            const newStart = new Date(
                `${bookingData.date}T${bookingData.startTime}`
            );

            const newEnd = new Date(
                newStart.getTime() +
                Number(bookingData.duration) * 60 * 60 * 1000
            );

            if (
                Number.isNaN(newStart.getTime()) ||
                Number.isNaN(newEnd.getTime())
            ) {
                return rejectWithValue(
                    "Invalid booking date or time."
                );
            }


            // Get the latest parking areas
            const parkingResponse = await allParkingAPI();

            const areas = parkingResponse.data;


            // Find the selected parking area
            const selectedArea = areas.find(
                (area) =>
                    String(area.id) === String(bookingData.areaId)
            );

            if (!selectedArea) {
                return rejectWithValue(
                    "Parking area not found."
                );
            }


            // Find the selected parking slot
            const selectedSlot = (
                selectedArea.slots || []
            ).find(
                (slot) =>
                    String(slot.id) === String(bookingData.slotId)
            );

            if (!selectedSlot) {
                return rejectWithValue(
                    "Parking slot not found."
                );
            }


            // Get all existing bookings
            const bookingsResponse = await allBookingAPI();

            const existingBookings = bookingsResponse.data;


            // Check for overlapping bookings
            const hasOverlap = existingBookings.some((booking) => {
                const sameArea =
                    String(booking.areaId) ===
                    String(bookingData.areaId);

                const sameSlot =
                    String(booking.slotId) ===
                    String(bookingData.slotId);

                const activeBooking =
                    booking.status !== "cancelled";

                if (
                    !sameArea ||
                    !sameSlot ||
                    !activeBooking ||
                    !booking.date ||
                    !booking.startTime ||
                    !Number.isFinite(Number(booking.duration)) ||
                    Number(booking.duration) <= 0
                ) {
                    return false;
                }

                const existingStart = new Date(
                    `${booking.date}T${booking.startTime}`
                );

                const existingEnd = new Date(
                    existingStart.getTime() +
                    Number(booking.duration) * 60 * 60 * 1000
                );

                if (
                    Number.isNaN(existingStart.getTime()) ||
                    Number.isNaN(existingEnd.getTime())
                ) {
                    return false;
                }

                return (
                    newStart < existingEnd &&
                    newEnd > existingStart
                );
            });


            if (hasOverlap) {
                return rejectWithValue(
                    "This slot is already booked during the selected time. Please choose another slot or time."
                );
            }


            // Save the booking without changing the slot status
            const bookingResponse = await addBookingAPI({
                ...bookingData,
                status: bookingData.status || "confirmed",
            });

            return bookingResponse.data;

        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                error.message ||
                "Failed to create booking"
            );
        }
    }
);


// Update a booking
export const editBooking = createAsyncThunk(
    "booking/editBooking",
    async ({ id, bookingData }, { rejectWithValue }) => {
        try {
            const response = await updateBookingAPI(
                id,
                bookingData
            );

            return response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                error.message ||
                "Failed to update booking"
            );
        }
    }
);


// Delete a booking
export const removeBooking = createAsyncThunk(
    "booking/removeBooking",
    async (id, { rejectWithValue }) => {
        try {
            await deleteBookingAPI(id);

            return id;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                error.message ||
                "Failed to delete booking"
            );
        }
    }
);


// Booking slice
const bookingSlice = createSlice({
    name: "booking",

    initialState: {
        bookings: [],
        loading: false,
        submitting: false,
        error: null,
    },

    reducers: {},

    extraReducers: (builder) => {
        builder

            // Fetch bookings
            .addCase(fetchBookings.pending, (state) => {
                state.loading = true;
                state.error = null;
            })

            .addCase(fetchBookings.fulfilled, (state, action) => {
                state.loading = false;
                state.error = null;

                state.bookings = action.payload;
            })

            .addCase(fetchBookings.rejected, (state, action) => {
                state.loading = false;

                state.error =
                    action.payload || action.error.message;
            })


            // Create booking
            .addCase(createBooking.pending, (state) => {
                state.submitting = true;
                state.error = null;
            })

            .addCase(createBooking.fulfilled, (state, action) => {
                state.submitting = false;
                state.error = null;

                const newBooking = action.payload;

                const existingIndex = state.bookings.findIndex(
                    (booking) =>
                        String(booking.id) ===
                        String(newBooking.id)
                );

                if (existingIndex === -1) {
                    state.bookings.push(newBooking);
                } else {
                    state.bookings[existingIndex] = newBooking;
                }
            })

            .addCase(createBooking.rejected, (state, action) => {
                state.submitting = false;

                state.error =
                    action.payload || action.error.message;
            })


            // Update booking
            .addCase(editBooking.pending, (state) => {
                state.loading = true;
                state.error = null;
            })

            .addCase(editBooking.fulfilled, (state, action) => {
                state.loading = false;
                state.error = null;

                const index = state.bookings.findIndex(
                    (booking) =>
                        String(booking.id) ===
                        String(action.payload.id)
                );

                if (index !== -1) {
                    state.bookings[index] = action.payload;
                }
            })

            .addCase(editBooking.rejected, (state, action) => {
                state.loading = false;

                state.error =
                    action.payload || action.error.message;
            })


            // Delete booking
            .addCase(removeBooking.pending, (state) => {
                state.loading = true;
                state.error = null;
            })

            .addCase(removeBooking.fulfilled, (state, action) => {
                state.loading = false;
                state.error = null;

                state.bookings = state.bookings.filter(
                    (booking) =>
                        String(booking.id) !==
                        String(action.payload)
                );
            })

            .addCase(removeBooking.rejected, (state, action) => {
                state.loading = false;

                state.error =
                    action.payload || action.error.message;
            });
    },
});

export default bookingSlice.reducer;