import {configureStore} from '@reduxjs/toolkit';
import parkingSlice from './slice/parkingSlice'
import bookingSlice from './slice/bookingSlice'

const store = configureStore({
    reducer:{
        parkingSlice: parkingSlice,
        bookingSlice: bookingSlice
    }
});

export default store;