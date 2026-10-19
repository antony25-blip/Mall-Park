# Antony - REDUX and JSON-SERVER

## Redux
- Created store.js 
- Created Redux slices using Redux Toolkit (`createSlice` and `createAsyncThunk`) to manage parking slots and bookings.
- Integrated API calls with JSON Server using API service functions.

1. parkingSlice.js

Manages parking slot data and API operations.

| Async Thunk           | Purpose |

| `fetchParkingSlots`   | Fetch all parking slots from JSON Server |
| `createParkingSlot`   | Add a new parking slot (Admin) |
| `editParkingSlot`     | Update existing parking slot details (Admin) |
| `removeParkingSlot`   | Delete a parking slot (Admin) |

State:
- `parking` – Stores parking slot data.
- `loading` – Tracks API request status.
- `error` – Stores API error messages.

2. bookingSlice.js

Manages parking reservation data and API operations.

| Async Thunk       | Purpose |

| `fetchBookings`   | Fetch all bookings from JSON Server |
| `createBooking`   | Create a new parking reservation (Customer) |
| `editBooking`     | Update booking details or status |
| `removeBooking`   | Delete a booking when permitted |

State:
- `bookings` – Stores booking data.
- `loading` – Tracks API request status.
- `error` – Stores API error messages.

## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## 

# json-server:
-create a db.json // parking=[],booking=[]
-created the server file index.js 

-create apiservices,apiInstance in api folder
-create allapi in service folder 
    apis:
        - saveResumeAPI
        - viewResumeAPI
        - allresumeAPI
        - downloadResumeAPI
        - getALlDownloadResumeAPI
        - updateResumeAPI
        - deleteResumeAPI


## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## 
