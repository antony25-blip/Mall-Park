import { useEffect, useMemo, useState } from "react";
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
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import LocalParkingOutlinedIcon from "@mui/icons-material/LocalParkingOutlined";
import ConfirmationNumberOutlinedIcon from "@mui/icons-material/ConfirmationNumberOutlined";
import CurrencyRupeeOutlinedIcon from "@mui/icons-material/CurrencyRupeeOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import { toast } from "react-toastify";
import { editBooking, fetchBookings } from "../redux/slice/bookingSlice";

const formatDate = (date) => {
  if (!date) return "Date not available";
  const parsedDate = new Date(`${date}T00:00:00`);
  return Number.isNaN(parsedDate.getTime())
    ? date
    : parsedDate.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const formatTime = (time) => {
  if (!time) return "Time not available";
  const [hours, minutes] = time.split(":");
  const parsedTime = new Date();
  parsedTime.setHours(Number(hours), Number(minutes), 0, 0);
  return parsedTime.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
};

function MyBookings() {
  const dispatch = useDispatch();
  const { bookings = [], loading, error } = useSelector(
    (state) => state.bookingSlice
  );
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    dispatch(fetchBookings());
  }, [dispatch]);

  const sortedBookings = useMemo(
    () =>
      [...bookings].sort((a, b) => {
        const dateA = new Date(`${a.date || "1970-01-01"}T${a.startTime || "00:00"}`);
        const dateB = new Date(`${b.date || "1970-01-01"}T${b.startTime || "00:00"}`);
        return dateB - dateA;
      }),
    [bookings]
  );

  const handleCancel = async (booking) => {
    if (booking.status?.toLowerCase() === "cancelled") return;

    const confirmed = window.confirm(
      `Are you sure you want to cancel booking #${booking.id}?`
    );
    if (!confirmed) return;

    setCancellingId(booking.id);
    try {
      // Keep the booking in the database as a record, but mark it cancelled.
      await dispatch(
        editBooking({
          id: booking.id,
          bookingData: { ...booking, status: "cancelled" },
        })
      ).unwrap();

      // The Redux reducer updates the local booking; fetch again to confirm server state.
      await dispatch(fetchBookings()).unwrap();
      toast.success(`Booking #${booking.id} cancelled successfully.`);
    } catch (cancelError) {
      toast.error(
        typeof cancelError === "string"
          ? cancelError
          : "Could not cancel this booking. Please try again."
      );
    } finally {
      setCancellingId(null);
    }
  };

  const activeCount = bookings.filter(
    (booking) => booking.status?.toLowerCase() !== "cancelled"
  ).length;

  return (
    <Box sx={{ minHeight: "70vh", bgcolor: "#f4f7fb", py: { xs: 4, md: 6 } }}>
      <Container maxWidth="lg">
        <Box
          sx={{
            display: "flex",
            alignItems: { xs: "flex-start", sm: "center" },
            justifyContent: "space-between",
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
            mb: 4,
          }}
        >
          <Box>
            <Typography variant="overline" sx={{ color: "#168b83", fontWeight: 800, letterSpacing: 2 }}>
              MALLPARK ACCOUNT
            </Typography>
            <Typography variant="h4" component="h1" sx={{ color: "#10243a", fontWeight: 800 }}>
              My Bookings
            </Typography>
            <Typography sx={{ mt: 1, color: "text.secondary" }}>
              View your parking reservations and manage your plans.
            </Typography>
          </Box>
          <Box sx={{ bgcolor: "white", px: 2.5, py: 1.5, borderRadius: 3, boxShadow: "0 5px 20px rgba(16,36,58,0.06)" }}>
            <Typography variant="body2" color="text.secondary">Active reservations</Typography>
            <Typography variant="h5" sx={{ color: "#10243a", fontWeight: 800 }}>{activeCount}</Typography>
          </Box>
        </Box>

        {loading && bookings.length === 0 && (
          <Stack alignItems="center" spacing={2} sx={{ py: 8 }}>
            <CircularProgress sx={{ color: "#168b83" }} />
            <Typography color="text.secondary">Loading your reservations...</Typography>
          </Stack>
        )}

        {error && bookings.length === 0 && (
          <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
        )}

        {!loading && !error && sortedBookings.length === 0 && (
          <Card sx={{ borderRadius: 4, textAlign: "center", py: 7, px: 3, boxShadow: "0 8px 30px rgba(16,36,58,0.06)" }}>
            <Box sx={{ width: 72, height: 72, borderRadius: "50%", bgcolor: "#e6f6f4", color: "#168b83", display: "grid", placeItems: "center", mx: "auto", mb: 2 }}>
              <EventAvailableOutlinedIcon sx={{ fontSize: 36 }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: "#10243a" }}>No bookings yet</Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              Your parking reservations will appear here after you book a slot.
            </Typography>
            <Button href="/parking" variant="contained" sx={{ mt: 3, bgcolor: "#168b83", "&:hover": { bgcolor: "#11736d" } }}>
              Find Parking
            </Button>
          </Card>
        )}

        <Stack spacing={2.5}>
          {sortedBookings.map((booking) => {
            const isCancelled = booking.status?.toLowerCase() === "cancelled";
            const fee = Number(booking.totalFee ?? (Number(booking.pricePerHour || 0) * Number(booking.duration || 1)));
            const statusLabel = booking.status || "confirmed";

            return (
              <Card key={booking.id} sx={{ borderRadius: 4, overflow: "hidden", boxShadow: "0 8px 28px rgba(16,36,58,0.07)", border: "1px solid #e7edf3" }}>
                <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
                  <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2}>
                    <Box>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                        <ConfirmationNumberOutlinedIcon sx={{ color: "#168b83" }} />
                        <Typography variant="body2" color="text.secondary">Booking ID</Typography>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#10243a" }}>#{booking.id ?? "N/A"}</Typography>
                      </Stack>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: "#10243a" }}>
                        {booking.areaName || "Parking Area"}
                      </Typography>
                      <Typography color="text.secondary" variant="body2">
                        {booking.slotName || (booking.slotId ? `Slot ${booking.slotId}` : "Parking slot not specified")}
                      </Typography>
                    </Box>
                    <Chip
                      label={statusLabel.charAt(0).toUpperCase() + statusLabel.slice(1)}
                      color={isCancelled ? "default" : statusLabel.toLowerCase() === "confirmed" ? "success" : "primary"}
                      sx={{ fontWeight: 700, textTransform: "capitalize" }}
                    />
                  </Stack>

                  <Divider sx={{ my: 2.5 }} />

                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2.5 }}>
                    <Stack direction="row" spacing={1.5} alignItems="flex-start">
                      <EventAvailableOutlinedIcon sx={{ color: "#168b83", mt: 0.3 }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary">Date & start time</Typography>
                        <Typography sx={{ fontWeight: 700 }}>{formatDate(booking.date)}</Typography>
                        <Typography variant="body2" color="text.secondary">{formatTime(booking.startTime)}</Typography>
                      </Box>
                    </Stack>
                    <Stack direction="row" spacing={1.5} alignItems="flex-start">
                      <LocalParkingOutlinedIcon sx={{ color: "#168b83", mt: 0.3 }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary">Duration</Typography>
                        <Typography sx={{ fontWeight: 700 }}>{booking.duration ? `${booking.duration} hour${Number(booking.duration) === 1 ? "" : "s"}` : "Not specified"}</Typography>
                        <Typography variant="body2" color="text.secondary">{booking.pricePerHour != null ? `₹${booking.pricePerHour} per hour` : "Hourly rate unavailable"}</Typography>
                      </Box>
                    </Stack>
                    <Stack direction="row" spacing={1.5} alignItems="flex-start">
                      <CurrencyRupeeOutlinedIcon sx={{ color: "#168b83", mt: 0.3 }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary">Total parking fee</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: "#10243a" }}>₹{Number.isFinite(fee) ? fee.toLocaleString("en-IN") : "—"}</Typography>
                      </Box>
                    </Stack>
                  </Box>

                  <Stack direction={{ xs: "column-reverse", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} spacing={1.5} sx={{ mt: 3 }}>
                    <Typography variant="caption" color="text.secondary">
                      {isCancelled ? "This reservation has been cancelled." : "Need to change your plans? You can cancel this reservation."}
                    </Typography>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={cancellingId === booking.id ? <CircularProgress size={16} /> : <CancelOutlinedIcon />}
                      disabled={isCancelled || cancellingId !== null}
                      onClick={() => handleCancel(booking)}
                      sx={{ alignSelf: { xs: "stretch", sm: "auto" }, whiteSpace: "nowrap" }}
                    >
                      {isCancelled ? "Cancelled" : cancellingId === booking.id ? "Cancelling..." : "Cancel booking"}
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      </Container>
    </Box>
  );
}

export default MyBookings;
