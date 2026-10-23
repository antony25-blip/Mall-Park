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

## Frontend deployment

The Vite frontend can be deployed to Vercel from `mall-park-client`. Vercel
builds with `npm run build` and serves the generated `dist` directory. The
included `vercel.json` rewrite supports direct navigation to React routes.

Local development sends API requests through the Vite `/api` proxy to
`http://localhost:3000`, avoiding cross-origin browser cookie issues. Set
`MALLPARK_API_TARGET` if the local API runs at a different address. For
deployment, set `VITE_API_BASE_URL` in the Vercel project environment variables
to the deployed API origin (for example, `https://api.example.com`). Vite
environment variables are public in browser bundles and must not contain
secrets.

The JSON Server must be hosted separately and allow browser requests from the
Vercel domain before the deployed frontend can load parking and booking data.

## Customer and admin flows

From the repository root, run `npm run dev` to start both the frontend and API.
To run them separately, use `npm run dev` from `mall-park-client` and
`npm run server` from the repository root in another terminal.

Customers can browse parking without an account and check available slots for
the current moment or a selected future date, start time, and duration. Admins
can use the same time-based availability filters on the slot availability
dashboard. Booking management is available on its own admin page.
Selecting a slot opens the booking flow; unauthenticated customers are sent to
Register/Sign In and returned to the selected parking area after authentication.
Customers enter a vehicle registration number when booking. The admin dashboard
shows each reservation with the customer's name and account ID, vehicle
registration, and booking details.
Signed-in customers can view and cancel their own future confirmed bookings.
The admin slot availability page shows current occupied slots as well as
availability for a selected time. The separate booking management page shows
all bookings and supports vehicle check-in and check-out. Admin accounts can
view availability but cannot create customer bookings.
Customer account IDs are sequential numbers. On API startup, existing UUID
customer IDs are migrated to numbers and linked bookings are updated to match.

Authentication and booking authorization are enforced by the API. Passwords
are salted and hashed with Node's `scrypt`; signed, HTTP-only session cookies
expire after eight hours. The public `/availability` endpoint returns slot
identifiers and counts only, not customer booking details. Booking creation
verifies the slot and time on the server and calculates the fee from the
parking record. The public `/availability` endpoint exposes only slot IDs and
counts for available and occupied spaces, not customer booking details.

Run the API from `mall-park-server` with `npm start`. Configure
`MALLPARK_JWT_SECRET` with a random value at least 32 bytes long. In production,
also configure `MALLPARK_ADMIN_EMAIL` and `MALLPARK_ADMIN_PASSWORD` (at least 8
characters) to provision the administrator account. Use a strong password in
production. Keep these values on the
server only; never put them in a `VITE_` variable or commit them. For local
development only, the API generates a temporary token secret if one is not
provided, so active sessions expire when the server restarts.

Use HTTPS in production and set `MALLPARK_CLIENT_ORIGIN` to the frontend's
origin (for example, `https://mallpark.example.com`). The JSON Server `db.json` contains account hashes and
booking records; do not expose that file or the `/users` resource publicly.

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
