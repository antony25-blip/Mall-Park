import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
    allBookingAPI,
    addBookingAPI,
    updateBookingAPI,
    deleteBookingAPI
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

// Add a booking
export const createBooking = createAsyncThunk(
    "booking/createBooking",
    async (bookingData, { rejectWithValue }) => {
        try {
            const response = await addBookingAPI(bookingData);
            return response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                error.message ||
                "Failed to add booking"
            );
        }
    }
);

// Update a booking
export const editBooking = createAsyncThunk(
    "booking/editBooking",
    async ({ id, bookingData }, { rejectWithValue }) => {
        try {
            const response = await updateBookingAPI(id, bookingData);
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

const bookingSlice = createSlice({
    name: "booking",

    initialState: {
        bookings: [],
        loading: false,
        error: null
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
                state.error = action.payload || action.error.message;
            })

            // Add booking
            .addCase(createBooking.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createBooking.fulfilled, (state, action) => {
                state.loading = false;
                state.error = null;
                state.bookings.push(action.payload);
            })
            .addCase(createBooking.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || action.error.message;
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
                    booking => String(booking.id) === String(action.payload.id)
                );

                if (index !== -1) {
                    state.bookings[index] = action.payload;
                }
            })
            .addCase(editBooking.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || action.error.message;
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
                    booking => String(booking.id) !== String(action.payload)
                );
            })
            .addCase(removeBooking.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || action.error.message;
            });
    }
});

export default bookingSlice.reducer;
