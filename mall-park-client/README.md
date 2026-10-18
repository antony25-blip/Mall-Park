# Antony - REDUX and JSON-SERVER

# redux:
-created a store.js
-create slice 
    -parkingSlice.js
        
        Reducer	            When to use it

        setParkingSlots	    Fetch parking slots from JSON Server
        addParkingSlot	    Admin adds a new parking slot
        updateParkingSlot	Admin edits slot details
        deleteParkingSlot	Admin deletes a slot
    
    -bookingSlice.js

        Reducer	            When to use it

        setBookings	        Fetch all bookings from JSON Server
        addBooking	        Customer confirms a new parking reservation
        updateBooking	    Update booking details or status
        deleteBooking	    Remove a booking if deletion is permitted

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
