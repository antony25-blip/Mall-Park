import { createSlice } from "@reduxjs/toolkit";


const parkingSlice = createSlice({
    name:'parking',
    initialState:{
        parking:[]
    },
    reducers:{
        setParkingSlots: (state, action) => {
            state.parking= action.payload;
        },
        addParkingSlot: (state, action) => {
            state.parking.push(action.payload);
        },
        updateParkingSlot: (state, action) => {
            const index = state.parking.findIndex(slot => slot.id === action.payload.id);
            if (index !== -1) {
                state.parking[index] = action.payload;
            }
        },
        deleteParkingSlot: (state, action) => {
            state.parking = state.parking.filter(
                slot => slot.id !== action.payload
            );
        }

    }
})

export const {setParkingSlots,addParkingSlot,updateParkingSlot,deleteParkingSlot} = parkingSlice.actions;
export default parkingSlice.reducer