import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation } from "react-router-dom";
import {Alert, Box,Button,Card,CardContent,CircularProgress, Container,MenuItem,TextField, Typography,} from "@mui/material";
import { fetchParkingSlots } from "../redux/slice/parkingSlice";
import { createBooking } from "../redux/slice/bookingSlice";
import { toast } from "react-toastify";
import { parkingAvailabilityAPI } from "../Services/allApi";


function Booking() {
    const dispatch = useDispatch();
    const location = useLocation();

    // Get the parking option selected on the Parking page.
    const selectedArea = location.state?.area;

    // Read parking data from Redux.
    const {
        parking: areas = [],
        loading: areasLoading,
        error: areasError,
    } = useSelector((state) => state.parkingSlice);

    // Read bookings from Redux.
    const { submitting } = useSelector((state) => state.bookingSlice);

    // Find the matching backend parking area by name.
    const area = areas.find(
        (item) =>
            item.name?.trim().toLowerCase() ===
            selectedArea?.name?.trim().toLowerCase()
    );
    const areaStartingPrice = area?.slots?.length
        ? Math.min(...area.slots.map((item) => Number(item.pricePerHour) || 0))
        : Number(selectedArea?.price || 0);

    // Form values.
    const [slotId, setSlotId] = useState("");
    const [date, setDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [duration, setDuration] = useState(1);
    const [vehicleRegistration, setVehicleRegistration] = useState("");

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("error");
    const [availabilityResult, setAvailabilityResult] = useState({
        key: "",
        data: null,
        error: "",
    });
    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    const minimumDate = today.toISOString().slice(0, 10);
    const requestedStart = date && startTime
        ? new Date(`${date}T${startTime}`)
        : null;
    const selectedTimeIsPast = Boolean(
        requestedStart &&
        (Number.isNaN(requestedStart.getTime()) || requestedStart <= new Date())
    );

    // Load parking areas.
    useEffect(() => {
        dispatch(fetchParkingSlots());
    }, [dispatch]);

    useEffect(() => {
        if (!area || selectedTimeIsPast) {
            return undefined;
        }

        let active = true;
        const filters = date && startTime
            ? {
                areaId: area.id,
                date,
                startTime,
                duration,
                timeZoneOffsetMinutes: new Date(`${date}T${startTime}`).getTimezoneOffset(),
            }
            : { areaId: area.id };
        const requestKey = JSON.stringify(filters);

        parkingAvailabilityAPI(filters)
            .then((response) => {
                if (active) {
                    setAvailabilityResult({
                        key: requestKey,
                        data: response.data.find(
                            (entry) => String(entry.areaId) === String(area.id)
                        ) || null,
                        error: "",
                    });
                }
            })
            .catch((error) => {
                if (active) {
                    setAvailabilityResult({
                        key: requestKey,
                        data: null,
                        error: error.response?.data?.message ||
                            "Unable to check slot availability. Please try again.",
                    });
                }
            });

        return () => {
            active = false;
        };
    }, [area, date, startTime, duration, selectedTimeIsPast]);

    const availabilityKey = JSON.stringify(
        date && startTime
            ? {
                areaId: area?.id,
                date,
                startTime,
                duration,
                timeZoneOffsetMinutes: new Date(`${date}T${startTime}`).getTimezoneOffset(),
            }
            : { areaId: area?.id }
    );
    const availability = availabilityResult.key === availabilityKey
        ? availabilityResult.data
        : null;
    const availabilityError = availabilityResult.key === availabilityKey
        ? availabilityResult.error
        : "";
    const availabilityLoading = Boolean(
        area && !selectedTimeIsPast && availabilityResult.key !== availabilityKey
    );
    // Get available slots for the selected area.
    const availableSlots = useMemo(() => {
        if (!area?.slots || !availability) {
            return [];
        }

        const availableIds = new Set(
            availability.availableSlotIds.map(String)
        );
        return area.slots.filter((slot) => availableIds.has(String(slot.id)));
    }, [area, availability]);

    const selectedSlotId = availableSlots.some(
        (item) => String(item.id) === String(slotId)
    )
        ? slotId
        : "";

    // Find the selected slot.
    const slot = area?.slots?.find(
        (item) => String(item.id) === String(selectedSlotId)
    );

    // Use the backend slot price, falling back to the card price.
    const pricePerHour = Number(
        slot?.pricePerHour ?? selectedArea?.price ?? 0
    );

    const totalFee = pricePerHour * Number(duration);

    const clearMessage = () => {
        setMessage("");
    };

    // Handle booking submission.
    const handleSubmit = async (event) => {
        event.preventDefault();
        clearMessage();

        if (!selectedArea) {
            setMessage(
                "Please return to the Parking page and select a parking area."
            );
            setMessageType("error");
            return;
        }

        if (!area) {
            setMessage(
                "This parking area was not found in the server data. Please check the parking records in db.json."
            );
            setMessageType("error");
            return;
        }

        if (!slot || !date || !startTime) {
            setMessage("Please complete all booking fields.");
            setMessageType("error");
            return;
        }

        const normalizedVehicleRegistration = vehicleRegistration.trim().toUpperCase();
        if (
            normalizedVehicleRegistration.length < 2 ||
            normalizedVehicleRegistration.length > 20 ||
            !/^[A-Z0-9 -]+$/.test(normalizedVehicleRegistration)
        ) {
            setMessage("Enter a valid vehicle registration number.");
            setMessageType("error");
            return;
        }

        if (
            !Number.isInteger(Number(duration)) ||
            Number(duration) < 1
        ) {
            setMessage("Please select a valid duration.");
            setMessageType("error");
            return;
        }

        const start = new Date(`${date}T${startTime}`);

        if (
            Number.isNaN(start.getTime()) ||
            start <= new Date()
        ) {
            setMessage(
                "Please select a valid future date and time."
            );
            setMessageType("error");
            return;
        }

        const bookingData = {
            areaId: area.id,
            areaName: area.name,
            slotId: slot.id,
            slotName: slot.name,
            vehicleRegistration: normalizedVehicleRegistration,
            date,
            startTime,
            timeZoneOffsetMinutes: start.getTimezoneOffset(),
            duration: Number(duration),
            pricePerHour,
            totalFee,
            status: "confirmed",
        };

        try {
            await dispatch(
                createBooking(bookingData)
            ).unwrap();
            await dispatch(fetchParkingSlots()).unwrap();

            toast.success("Parking slot has been booked successfully!")

            setSlotId("");
            setDate("");
            setStartTime("");
            setDuration(1);
            setVehicleRegistration("");

        } catch (error) {
            setMessageType("error");

            setMessage(
                typeof error === "string"
                    ? error
                    : "Could not save the booking. Please check the server and try again."
            );
        }
    };

    // Show a loading indicator while data is fetched.
    if (areasLoading) {
        return (
            <Container
                sx={{
                    py: 5,
                    textAlign: "center",
                }}
            >
                <CircularProgress />

                <Typography sx={{ mt: 2 }}>
                    Loading parking information...
                </Typography>
            </Container>
        );
    }

    // Show errors returned by the API.
    if (areasError) {
        return (
            <Container sx={{ py: 5 }}>
                <Alert severity="error">
                    {areasError}
                </Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="sm" sx={{ py: 5 }}>
            <Card sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: 4 }}>
                    <Typography
                        variant="h4"
                        fontWeight="bold"
                    >
                        Book Your Parking
                    </Typography>

                    <Typography
                        color="text.secondary"
                        sx={{ mt: 1 }}
                    >
                        Complete the details for your selected
                        parking area.
                    </Typography>

                    {/* Display the selected area instead of a dropdown. */}
                    <Box
                        sx={{
                            mt: 3,
                            p: 2,
                            borderRadius: 2,
                            bgcolor: "#f0fdfa",
                        }}
                    >
                        <Typography
                            variant="subtitle2"
                            color="text.secondary"
                        >
                            Selected Parking Area
                        </Typography>

                        <Typography
                            variant="h6"
                            fontWeight="bold"
                        >
                            {selectedArea?.name || "No area selected"}
                        </Typography>

                        <Typography>
                            ₹{areaStartingPrice} / hour
                        </Typography>
                    </Box>

                    {!selectedArea && (
                        <Alert severity="warning" sx={{ mt: 2 }}>
                            Please select a parking area first.
                        </Alert>
                    )}

                    {selectedArea && !area && (
                        <Alert severity="warning" sx={{ mt: 2 }}>
                            This area is not available in the backend
                            parking data. Please check db.json.
                        </Alert>
                    )}

                    <Box
                        component="form"
                        onSubmit={handleSubmit}
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 3,
                            mt: 3,
                        }}
                    >
                        {/* Parking slot selection */}
                        <TextField
                            select
                            label="Parking Slot"
                            value={selectedSlotId}
                            onChange={(event) => {
                                setSlotId(event.target.value);
                                clearMessage();
                            }}
                            disabled={
                                !area ||
                                selectedTimeIsPast ||
                                availabilityLoading ||
                                Boolean(availabilityError) ||
                                availableSlots.length === 0
                            }
                            required
                        >
                            {availableSlots.map((item) => (
                                <MenuItem
                                    key={item.id}
                                    value={String(item.id)}
                                >
                                    {item.name} — ₹
                                    {item.pricePerHour ?? selectedArea?.price}/hour
                                </MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            label="Vehicle Registration Number"
                            value={vehicleRegistration}
                            onChange={(event) => {
                                setVehicleRegistration(event.target.value.toUpperCase());
                                clearMessage();
                            }}
                            slotProps={{
                                htmlInput: {
                                    maxLength: 20,
                                    autoCapitalize: "characters",
                                },
                            }}
                            required
                        />

                        {availabilityError && (
                            <Alert severity="error">{availabilityError}</Alert>
                        )}

                        {selectedTimeIsPast && (
                            <Alert severity="warning">
                                This date and time have already passed. Choose a future time to check slot availability.
                            </Alert>
                        )}

                        {availabilityLoading && (
                            <Typography color="text.secondary">
                                Checking availability...
                            </Typography>
                        )}

                        {area && !selectedTimeIsPast && !availabilityLoading && !availabilityError && availableSlots.length === 0 && (
                            <Alert severity="info">
                                No available slots were found for this
                                parking area.
                            </Alert>
                        )}

                        {/* Booking date */}
                        <TextField
                            label="Booking Date"
                            type="date"
                            value={date}
                            onChange={(event) => {
                                setDate(event.target.value);
                                clearMessage();
                            }}
                            slotProps={{
                                inputLabel: { shrink: true },
                                htmlInput: {
                                    min: minimumDate,
                                },
                            }}
                            required
                        />

                        {/* Start time */}
                        <TextField
                            label="Start Time"
                            type="time"
                            value={startTime}
                            onChange={(event) => {
                                setStartTime(event.target.value);
                                clearMessage();
                            }}
                            slotProps={{
                                inputLabel: { shrink: true },
                            }}
                            required
                        />

                        {/* Booking duration */}
                        <TextField
                            select
                            label="Duration"
                            value={duration}
                            onChange={(event) => {
                                setDuration(
                                    Number(event.target.value)
                                );
                                clearMessage();
                            }}
                        >
                            {[1, 2, 3, 4, 5, 6, 8, 12].map(
                                (hours) => (
                                    <MenuItem
                                        key={hours}
                                        value={hours}
                                    >
                                        {hours} hour
                                        {hours > 1 ? "s" : ""}
                                    </MenuItem>
                                )
                            )}
                        </TextField>

                        {/* Fee summary */}
                        <Box
                            sx={{
                                bgcolor: "#f0fdfa",
                                p: 2,
                                borderRadius: 2,
                            }}
                        >
                            <Typography>
                                Parking Area:{" "}
                                {selectedArea?.name || "Not selected"}
                            </Typography>

                            <Typography>
                                Parking Slot:{" "}
                                {slot?.name || "Not selected"}
                            </Typography>

                            <Typography>
                                Price per hour: ₹{pricePerHour}
                            </Typography>

                            <Typography>
                                Duration: {duration} hour(s)
                            </Typography>

                            <Typography
                                variant="h6"
                                sx={{ mt: 1 }}
                            >
                                Total Fee: ₹{totalFee}
                            </Typography>
                        </Box>

                        {message && (
                            <Alert severity={messageType}>
                                {message}
                            </Alert>
                        )}

                        <Button
                            type="submit"
                            variant="contained"
                            disabled={
                                submitting ||
                                !area ||
                                !slot ||
                                !vehicleRegistration.trim() ||
                                !date ||
                                !startTime
                            }
                        >
                            {submitting
                                ? "Booking..."
                                : "Confirm Booking"}
                        </Button>

                        <Button
                            component={Link}
                            to="/parking"
                            variant="outlined"
                        >
                            Back to Parking
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        </Container>
    );
}

export default Booking;