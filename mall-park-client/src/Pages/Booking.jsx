import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation } from "react-router-dom";
import {Alert, Box,Button,Card,CardContent,CircularProgress, Container,MenuItem,TextField, Typography,} from "@mui/material";
import { fetchParkingSlots } from "../redux/slice/parkingSlice";
import {fetchBookings, createBooking,} from "../redux/slice/bookingSlice";
import { toast } from "react-toastify";


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
    const {
        bookings = [],
        loading: bookingsLoading,
        submitting,
        error: bookingError,
    } = useSelector((state) => state.bookingSlice);

    // Find the matching backend parking area by name.
    const area = areas.find(
        (item) =>
            item.name?.trim().toLowerCase() ===
            selectedArea?.name?.trim().toLowerCase()
    );

    // Form values.
    const [slotId, setSlotId] = useState("");
    const [date, setDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [duration, setDuration] = useState(1);

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("error");

    // Load parking areas and existing bookings.
    useEffect(() => {
        dispatch(fetchParkingSlots());
        dispatch(fetchBookings());
    }, [dispatch]);


    useEffect(() => {
  if (date && startTime) {
    dispatch(fetchBookings());
  }
}, [date, startTime, dispatch]);

    // Get available slots for the selected area.
   const availableSlots = useMemo(() => {
  if (!area?.slots) {
    return [];
  }

  // Show all slots until the user selects a date and time.
  if (!date || !startTime) {
    return area.slots;
  }

  const requestedStart = new Date(`${date}T${startTime}`);

  const requestedEnd = new Date(
    requestedStart.getTime() +
      Number(duration) * 60 * 60 * 1000
  );

  return area.slots.filter((slot) => {
    const hasOverlap = bookings.some((booking) => {
      const sameArea =
        String(booking.areaId) === String(area.id);

      const sameSlot =
        String(booking.slotId) === String(slot.id);

      const activeBooking =
        booking.status !== "cancelled";

      if (!sameArea || !sameSlot || !activeBooking) {
        return false;
      }

      const existingStart = new Date(
        `${booking.date}T${booking.startTime}`
      );

      const existingEnd = new Date(
        existingStart.getTime() +
          Number(booking.duration) * 60 * 60 * 1000
      );

      return (
        requestedStart < existingEnd &&
        requestedEnd > existingStart
      );
    });

    return !hasOverlap;
  });
}, [area, bookings, date, startTime, duration]);

    // Find the selected slot.
    const slot = area?.slots?.find(
        (item) => String(item.id) === String(slotId)
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

        if (
            !Number.isInteger(Number(duration)) ||
            Number(duration) < 1
        ) {
            setMessage("Please select a valid duration.");
            setMessageType("error");
            return;
        }

        const start = new Date(`${date}T${startTime}`);

        const end = new Date(
            start.getTime() +
                Number(duration) * 60 * 60 * 1000
        );

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

        // Check whether the same slot is already booked.
        const hasOverlap = bookings.some((booking) => {
            const sameArea =
                String(booking.areaId) === String(area.id);

            const sameSlot =
                String(booking.slotId) === String(slot.id);

            if (
                !sameArea ||
                !sameSlot ||
                booking.status === "cancelled"
            ) {
                return false;
            }

            const existingStart = new Date(
                `${booking.date}T${booking.startTime}`
            );

            const existingEnd = new Date(
                existingStart.getTime() +
                    Number(booking.duration) *
                    60 * 60 * 1000
            );

            return (
                start < existingEnd &&
                end > existingStart
            );
        });

        if (hasOverlap) {
            setMessage(
                "This slot is already booked during that time. Please choose another time."
            );
            setMessageType("error");
            return;
        }

        const bookingData = {
            areaId: area.id,
            areaName: area.name,
            slotId: slot.id,
            slotName: slot.name,
            date,
            startTime,
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

            toast.success("Parking slot has been booked succesfully!")

            setSlotId("");
            setDate("");
            setStartTime("");
            setDuration(1);

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
    if (areasLoading || bookingsLoading) {
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
    if (areasError || bookingError) {
        return (
            <Container sx={{ py: 5 }}>
                <Alert severity="error">
                    {areasError || bookingError}
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
                            ₹{selectedArea?.price ?? 0} / hour
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
                            value={slotId}
                            onChange={(event) => {
                                setSlotId(event.target.value);
                                clearMessage();
                            }}
                            disabled={
                                !area ||
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

                        {area && availableSlots.length === 0 && (
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
                                    min: new Date(
                                        Date.now() -
                                            new Date().getTimezoneOffset() *
                                            60000
                                    )
                                        .toISOString()
                                        .slice(0, 10),
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