import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Container,
    Stack,
    Typography,
} from "@mui/material";
import { toast } from "react-toastify";
import { editBooking, fetchBookings } from "../redux/slice/bookingSlice";
import { fetchParkingSlots } from "../redux/slice/parkingSlice";
import { parkingAvailabilityAPI } from "../Services/allApi";
import { getBookingEnd, getBookingStart } from "../utils/bookingUtils";

const statusColors = {
    confirmed: "info",
    "checked-in": "warning",
    "checked-out": "success",
    cancelled: "default",
};

function formatDate(date) {
    if (!date) {
        return "Date unavailable";
    }

    const parsedDate = new Date(`${date}T00:00:00`);
    return Number.isNaN(parsedDate.getTime())
        ? date
        : parsedDate.toLocaleDateString();
}

function AdminDashboard() {
    const dispatch = useDispatch();
    const { bookings, loading, error } = useSelector(
        (state) => state.bookingSlice
    );
    const { parking = [] } = useSelector((state) => state.parkingSlice);
    const [actionError, setActionError] = useState("");
    const [currentTime, setCurrentTime] = useState(0);
    const [availability, setAvailability] = useState([]);
    const [availabilityError, setAvailabilityError] = useState("");

    useEffect(() => {
        const refreshDashboard = () => {
            dispatch(fetchBookings());
            dispatch(fetchParkingSlots());
            parkingAvailabilityAPI()
                .then((response) => {
                    setAvailability(response.data);
                    setAvailabilityError("");
                })
                .catch((error) => {
                    setAvailabilityError(
                        error.response?.data?.message ||
                        "Unable to load parking availability."
                    );
                });
        };

        refreshDashboard();
        const refreshTimer = window.setInterval(refreshDashboard, 60_000);
        return () => window.clearInterval(refreshTimer);
    }, [dispatch]);

    useEffect(() => {
        const updateTime = () => setCurrentTime(Date.now());
        updateTime();
        const timer = window.setInterval(updateTime, 60_000);
        return () => window.clearInterval(timer);
    }, []);

    const alerts = bookings.flatMap((booking) => {
        const start = getBookingStart(booking);
        const end = getBookingEnd(booking);

        if (
            booking.status === "confirmed" &&
            start &&
            start.getTime() >= currentTime &&
            start.getTime() <= currentTime + 60 * 60 * 1000
        ) {
            return [{
                id: `upcoming-${booking.id}`,
                severity: "info",
                message: `${booking.areaName || "Parking"} · ${booking.slotName || booking.slotId} is booked for ${formatDate(booking.date)} at ${booking.startTime}.`,
            }];
        }

        if (
            booking.status === "checked-in" &&
            end &&
            end.getTime() <= currentTime
        ) {
            return [{
                id: `overdue-${booking.id}`,
                severity: "warning",
                message: `${booking.areaName || "Parking"} · ${booking.slotName || booking.slotId} has passed its reserved end time and needs checkout.`,
            }];
        }
        return [];
    });

    const handleStatusUpdate = async (booking, status) => {
        setActionError("");
        const now = new Date().toISOString();
        const bookingData = {
            ...booking,
            status,
            ...(status === "checked-in" ? { checkedInAt: now } : {}),
            ...(status === "checked-out" ? { checkedOutAt: now } : {}),
        };

        try {
            await dispatch(editBooking({
                id: booking.id,
                bookingData,
            })).unwrap();
            toast.success(status === "checked-in"
                ? "Vehicle checked in."
                : "Vehicle checked out.");
        } catch (updateError) {
            const message = typeof updateError === "string"
                ? updateError
                : "Unable to update this booking. Please try again.";
            setActionError(message);
            toast.error(message);
        }
    };

    if (loading && bookings.length === 0) {
        return (
            <Container sx={{ py: 6, textAlign: "center" }}>
                <CircularProgress />
                <Typography sx={{ mt: 2 }}>Loading bookings...</Typography>
            </Container>
        );
    }

    if (error && bookings.length === 0) {
        return (
            <Container maxWidth="md" sx={{ py: 5 }}>
                <Alert
                    severity="error"
                    action={
                        <Button color="inherit" onClick={() => dispatch(fetchBookings())}>
                            Retry
                        </Button>
                    }
                >
                    {error}
                </Alert>
            </Container>
        );
    }

    const activeCount = bookings.filter(
        (booking) => booking.status === "confirmed" || booking.status === "checked-in"
    ).length;
    const checkedInCount = bookings.filter(
        (booking) => booking.status === "checked-in"
    ).length;

    return (
        <Container maxWidth="lg" sx={{ py: 5 }}>
            <Typography variant="h4" fontWeight="bold">
                Admin Dashboard
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
                Monitor reservations, parking alerts, and vehicle check-in/check-out.
            </Typography>

            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
                    gap: 2,
                    mb: 4,
                }}
            >
                <Card><CardContent>
                    <Typography color="text.secondary">Total bookings</Typography>
                    <Typography variant="h4" fontWeight="bold">{bookings.length}</Typography>
                </CardContent></Card>
                <Card><CardContent>
                    <Typography color="text.secondary">Active reservations</Typography>
                    <Typography variant="h4" fontWeight="bold">{activeCount}</Typography>
                </CardContent></Card>
                <Card><CardContent>
                    <Typography color="text.secondary">Vehicles checked in</Typography>
                    <Typography variant="h4" fontWeight="bold">{checkedInCount}</Typography>
                </CardContent></Card>
            </Box>

            <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
                Parking availability
            </Typography>
            {availabilityError ? (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {availabilityError}
                </Alert>
            ) : (
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
                        gap: 2,
                        mb: 4,
                    }}
                >
                    {parking.map((area) => {
                        const areaAvailability = availability.find(
                            (entry) => String(entry.areaId) === String(area.id)
                        );
                        return (
                            <Card key={area.id} variant="outlined">
                                <CardContent>
                                    <Typography fontWeight="bold">{area.name}</Typography>
                                    <Typography color="text.secondary">
                                        {areaAvailability
                                            ? `${areaAvailability.availableCount} of ${areaAvailability.totalSlots} slots available now`
                                            : "Availability loading..."}
                                    </Typography>
                                </CardContent>
                            </Card>
                        );
                    })}
                </Box>
            )}

            <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
                Parking alerts
            </Typography>
            <Stack spacing={1} sx={{ mb: 4 }}>
                {alerts.length > 0
                    ? alerts.map((alert) => (
                        <Alert key={alert.id} severity={alert.severity}>
                            {alert.message}
                        </Alert>
                    ))
                    : <Alert severity="success">No upcoming check-ins or overdue check-outs.</Alert>}
            </Stack>

            <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
                Booking management
            </Typography>
            {actionError && <Alert severity="error" sx={{ mb: 2 }}>{actionError}</Alert>}
            {error && bookings.length > 0 && (
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
            )}
            {bookings.length === 0 ? (
                <Alert severity="info">There are no bookings to manage yet.</Alert>
            ) : (
                <Stack spacing={2}>
                    {bookings.map((booking) => (
                        <Card key={booking.id} variant="outlined">
                            <CardContent
                                sx={{
                                    display: "flex",
                                    alignItems: { xs: "flex-start", sm: "center" },
                                    justifyContent: "space-between",
                                    flexDirection: { xs: "column", sm: "row" },
                                    gap: 2,
                                }}
                            >
                                <Box>
                                    <Typography variant="h6" fontWeight="bold">
                                        {booking.areaName || "Parking area"} · {booking.slotName || booking.slotId}
                                    </Typography>
                                    <Typography color="text.secondary">
                                        {formatDate(booking.date)} at {booking.startTime || "time unavailable"}
                                        {booking.duration ? ` · ${booking.duration} hour(s)` : ""}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Booking #{booking.id}
                                    </Typography>
                                </Box>
                                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                                    <Chip
                                        label={booking.status || "unknown"}
                                        color={statusColors[booking.status] || "default"}
                                    />
                                    {booking.status === "confirmed" && (
                                        <Button
                                            variant="contained"
                                            disabled={loading}
                                            onClick={() => handleStatusUpdate(booking, "checked-in")}
                                        >
                                            Check in
                                        </Button>
                                    )}
                                    {booking.status === "checked-in" && (
                                        <Button
                                            variant="contained"
                                            color="success"
                                            disabled={loading}
                                            onClick={() => handleStatusUpdate(booking, "checked-out")}
                                        >
                                            Check out
                                        </Button>
                                    )}
                                </Stack>
                            </CardContent>
                        </Card>
                    ))}
                </Stack>
            )}
            {(loading && bookings.length > 0) && (
                <Typography color="text.secondary" sx={{ mt: 2 }}>
                    Updating booking...
                </Typography>
            )}
        </Container>
    );
}

export default AdminDashboard;
