import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { allParkingAPI, addParkingAPI, updateParkingAPI, deleteParkingAPI } from "../../Services/allApi"


export const fetchParkingSlots = createAsyncThunk('parking/fetchParkingSlots', async (_, { rejectWithValue }) => {
    try {
        const response = await allParkingAPI()
        return response.data
    } catch (error) {
        return rejectWithValue(
            error.response?.data?.message || error.message || 'Failed to fetch parking slots'
        );
    }
})

export const createParkingSlot = createAsyncThunk('parking/createParkingSlots', async (parkingData, { rejectWithValue }) => {
    try {
        const response = await addParkingAPI(parkingData)
        return response.data
    } catch (error) {
        return rejectWithValue(
            error.response?.data?.message || error.message || 'Failed to add parking slots'
        );
    }
})

export const editParkingSlot = createAsyncThunk('parking/editParkingSlots', async ({ id, parkingData }, { rejectWithValue }) => {
    try {
        const response = await updateParkingAPI(id, parkingData)
        return response.data
    } catch (error) {
        return rejectWithValue(
            error.response?.data?.message || error.message || 'Failed to update parking slots'
        );
    }
})

export const removeParkingSlot = createAsyncThunk('parking/removeParkingSlots', async (id, { rejectWithValue }) => {
    try {
        await deleteParkingAPI(id)
        return id
    } catch (error) {
        return rejectWithValue(
            error.response?.data?.message || error.message || 'Failed to delete parking slots'
        );
    }
})

const parkingSlice = createSlice({
    name: 'parking',
    initialState: {
        parking: [],
        loading: false,
        error: null
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            // fetch
            .addCase(fetchParkingSlots.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchParkingSlots.fulfilled, (state, action) => {
                state.loading = false;
                state.error = null;
                state.parking = action.payload;
            })
            .addCase(fetchParkingSlots.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || action.error.message;
            })
            // add
            .addCase(createParkingSlot.fulfilled, (state, action) => {
                state.loading = false;
                state.error = null;
                state.parking.push(action.payload);
            })
            .addCase(createParkingSlot.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || action.error.message;
            })
            .addCase(createParkingSlot.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            // Update
            .addCase(editParkingSlot.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(editParkingSlot.fulfilled, (state, action) => {
                state.loading = false;
                state.error = null;

                const index = state.parking.findIndex(
                    slot => String(slot.id) === String(action.payload.id)
                );

                if (index !== -1) {
                    state.parking[index] = action.payload;
                }
            })
            .addCase(editParkingSlot.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || action.error.message;
            })

            // Delete
            .addCase(removeParkingSlot.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(removeParkingSlot.fulfilled, (state, action) => {
                state.loading = false;
                state.error = null;

                state.parking = state.parking.filter(
                    slot => String(slot.id) !== String(action.payload)
                );
            })
            .addCase(removeParkingSlot.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || action.error.message;
            });
    }
})

export default parkingSlice.reducer