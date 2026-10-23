import { useDispatch, useSelector } from "react-redux";
import { useCallback, useEffect, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Container,
    Typography,
} from "@mui/material";
import { Link } from "react-router-dom";
import { fetchParkingSlots } from "../redux/slice/parkingSlice";
import AvailabilityFilters from "../Components/AvailabilityFilters";
import { useParkingAvailability } from "../hooks/useParkingAvailability";
import { parkingAvailabilityAPI } from "../Services/allApi";

function AdminDashboard() {
    const dispatch = useDispatch();
    const { parking = [], loading, error } = useSelector(
        (state) => state.parkingSlice
    );
    const [currentAvailability, setCurrentAvailability] = useState([]);
    const [currentAvailabilityError, setCurrentAvailabilityError] = useState("");
    const [currentAvailabilityLoading, setCurrentAvailabilityLoading] = useState(true);
    const {
        availability,
        date,
        duration,
        error: availabilityError,
        loading: availabilityLoading,
        setDate,
        setDuration,
        setStartTime,
        startTime,
        today,
    } = useParkingAvailability();

    const refreshCurrentAvailability = useCallback(async () => {
        setCurrentAvailabilityLoading(true);
        try {
            const response = await parkingAvailabilityAPI();
            setCurrentAvailability(response.data);
            setCurrentAvailabilityError("");
        } catch (requestError) {
            setCurrentAvailabilityError(
                requestError.response?.data?.message ||
                "Unable to load currently occupied slots."
            );
        } finally {
            setCurrentAvailabilityLoading(false);
        }
    }, []);

    useEffect(() => {
        dispatch(fetchParkingSlots());
    }, [dispatch]);

    useEffect(() => {
        const initialRefresh = window.setTimeout(refreshCurrentAvailability, 0);
        const timer = window.setInterval(refreshCurrentAvailability, 60_000);
        return () => {
            window.clearTimeout(initialRefresh);
            window.clearInterval(timer);
        };
    }, [refreshCurrentAvailability]);

    return (
        <Container maxWidth="lg" sx={{ py: 5 }}>
            <Typography variant="h4" fontWeight="bold">
                Admin Dashboard
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
                Check available parking slots for now or a selected date and time.
            </Typography>

            <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
                <Button component={Link} to="/admin" variant="outlined">
                    Booking management
                </Button>
                <Button component={Link} to="/admin/availability" variant="contained">
                    Slot availability
                </Button>
            </Box>

            <AvailabilityFilters
                date={date}
                duration={duration}
                setDate={setDate}
                setDuration={setDuration}
                setStartTime={setStartTime}
                startTime={startTime}
                today={today}
            />

            <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
                Currently occupied
            </Typography>
            {currentAvailabilityError ? (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {currentAvailabilityError}
                </Alert>
            ) : currentAvailabilityLoading && currentAvailability.length === 0 ? (
                <Alert severity="info" sx={{ mb: 3 }}>
                    Checking currently occupied slots...
                </Alert>
            ) : (
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
                        gap: 2,
                        mb: 4,
                    }}
                >
                    {parking.map((area) => {
                        const areaAvailability = currentAvailability.find(
                            (entry) => String(entry.areaId) === String(area.id)
                        );
                        const occupiedSlotIds = new Set(
                            (areaAvailability?.occupiedSlotIds || []).map(String)
                        );
                        const occupiedSlotNames = (area.slots || [])
                            .filter((slot) => occupiedSlotIds.has(String(slot.id)))
                            .map((slot) => slot.name);

                        return (
                            <Card key={area.id} variant="outlined">
                                <CardContent>
                                    <Typography variant="h6" fontWeight="bold">
                                        {area.name}
                                    </Typography>
                                    <Typography color="text.secondary">
                                        {areaAvailability
                                            ? `${occupiedSlotNames.length} of ${areaAvailability.totalSlots} slots occupied now`
                                            : "Current occupancy loading..."}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                        {occupiedSlotNames.length
                                            ? `Occupied: ${occupiedSlotNames.join(", ")}`
                                            : currentAvailabilityLoading
                                                ? "Checking occupied slot names..."
                                                : "No slots are currently occupied."}
                                    </Typography>
                                </CardContent>
                            </Card>
                        );
                    })}
                </Box>
            )}

            <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
                Availability for selected time
            </Typography>
            {error && parking.length === 0 ? (
                <Alert severity="error">{error}</Alert>
            ) : availabilityError ? (
                <Alert
                    severity={availabilityError.startsWith("Choose ") ? "info" : "error"}
                    sx={{ mb: 3 }}
                >
                    {availabilityError}
                </Alert>
            ) : loading && parking.length === 0 ? (
                <Alert severity="info">Loading parking areas...</Alert>
            ) : (
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
                        gap: 2,
                    }}
                >
                    {parking.map((area) => {
                        const areaAvailability = availability.find(
                            (entry) => String(entry.areaId) === String(area.id)
                        );
                        const availableSlotIds = new Set(
                            (areaAvailability?.availableSlotIds || []).map(String)
                        );
                        const availableSlotNames = (area.slots || [])
                            .filter((slot) => availableSlotIds.has(String(slot.id)))
                            .map((slot) => slot.name);

                        return (
                            <Card key={area.id} variant="outlined">
                                <CardContent>
                                    <Typography variant="h6" fontWeight="bold">
                                        {area.name}
                                    </Typography>
                                    <Typography color="text.secondary">
                                        {areaAvailability
                                            ? `${areaAvailability.availableCount} of ${areaAvailability.totalSlots} slots available`
                                            : availabilityLoading
                                                ? "Availability loading..."
                                                : "Availability unavailable"}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                        {availableSlotNames.length
                                            ? `Available: ${availableSlotNames.join(", ")}`
                                            : availabilityLoading
                                                ? "Checking available slot names..."
                                                : availabilityError?.startsWith("Choose ")
                                                    ? "Select a date and time to see available slots."
                                                    : "No slots available for this time."}
                                    </Typography>
                                </CardContent>
                            </Card>
                        );
                    })}
                </Box>
            )}
        </Container>
    );
}

export default AdminDashboard;
