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
import { getBookingStart } from "../utils/bookingUtils";

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

function MyBookings() {
    const dispatch = useDispatch();
    const { bookings, loading, error } = useSelector(
        (state) => state.bookingSlice
    );
    const [actionError, setActionError] = useState("");
    const [currentTime, setCurrentTime] = useState(0);

    useEffect(() => {
        dispatch(fetchBookings());
    }, [dispatch]);

    useEffect(() => {
        const updateTime = () => setCurrentTime(Date.now());
        updateTime();
        const timer = window.setInterval(updateTime, 60_000);
        return () => window.clearInterval(timer);
    }, []);

    const cancelBooking = async (booking) => {
        setActionError("");

        try {
            await dispatch(editBooking({
                id: booking.id,
                bookingData: { ...booking, status: "cancelled" },
            })).unwrap();
            toast.success("Booking cancelled.");
        } catch (cancelError) {
            const message = typeof cancelError === "string"
                ? cancelError
                : "Unable to cancel this booking. Please try again.";
            setActionError(message);
            toast.error(message);
        }
    };

    if (loading && bookings.length === 0) {
        return (
            <Container sx={{ py: 6, textAlign: "center" }}>
                <CircularProgress />
                <Typography sx={{ mt: 2 }}>Loading your bookings...</Typography>
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

    return (
        <Container maxWidth="md" sx={{ py: 5 }}>
            <Typography variant="h4" fontWeight="bold">
                My Bookings
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
                Review and manage the reservations saved by MallPark.
            </Typography>
            {actionError && <Alert severity="error" sx={{ mb: 2 }}>{actionError}</Alert>}
            {error && bookings.length > 0 && (
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
            )}
            {bookings.length === 0 ? (
                <Alert severity="info">No bookings have been made yet.</Alert>
            ) : (
                <Stack spacing={2}>
                    {bookings.map((booking) => {
                        const start = getBookingStart(booking);
                        const canCancel = booking.status === "confirmed" &&
                            start &&
                            currentTime > 0 &&
                            start.getTime() > currentTime;

                        return (
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
                                            {booking.totalFee != null ? ` · Total ₹${booking.totalFee}` : ""}
                                        </Typography>
                                    </Box>
                                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                                        <Chip
                                            label={booking.status || "unknown"}
                                            color={statusColors[booking.status] || "default"}
                                        />
                                        {canCancel && (
                                            <Button
                                                color="error"
                                                variant="outlined"
                                                disabled={loading}
                                                onClick={() => cancelBooking(booking)}
                                            >
                                                Cancel
                                            </Button>
                                        )}
                                    </Stack>
                                </CardContent>
                            </Card>
                        );
                    })}
                </Stack>
            )}
            {loading && bookings.length > 0 && (
                <Typography color="text.secondary" sx={{ mt: 2 }}>
                    Updating booking...
                </Typography>
            )}
        </Container>
    );
}

export default MyBookings;
