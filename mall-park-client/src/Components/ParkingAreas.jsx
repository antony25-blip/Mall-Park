import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
    Box,
    Container,
    Typography,
    Card,
    CardContent,
    Button,
    Chip,
    CircularProgress,
    Alert,
} from "@mui/material";

import {
    LuCircleParking,
    LuArrowRight,
} from "react-icons/lu";

import { Link } from "react-router-dom";

import { fetchParkingSlots } from "../redux/slice/parkingSlice";
import AvailabilityFilters from "./AvailabilityFilters";
import { useParkingAvailability } from "../hooks/useParkingAvailability";
import { useAuth } from "../context/AuthContext";


function ParkingAreas() {
    const dispatch = useDispatch();
    const { user } = useAuth();

    // Get parking areas from Redux
    const {
        parking: areas = [],
        loading,
        error,
    } = useSelector((state) => state.parkingSlice);

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


    // Fetch parking areas and public, PII-free availability
    useEffect(() => {
        dispatch(fetchParkingSlots());
    }, [dispatch]);

    if (loading && areas.length === 0) {
        return (
            <Container
                sx={{
                    py: 5,
                    textAlign: "center",
                }}
            >
                <CircularProgress />

                <Typography sx={{ mt: 2 }}>
                    Loading parking areas...
                </Typography>
            </Container>
        );
    }


    // Error screen
    if (error && areas.length === 0) {
        return (
            <Container sx={{ py: 5 }}>
                <Alert severity="error">
                    {typeof error === "string"
                        ? error
                        : "Unable to load parking areas. Please try again."}
                </Alert>
            </Container>
        );
    }

    return (
        <Container
            maxWidth="lg"
            sx={{ py: 5 }}
        >
            <Typography
                variant="h4"
                fontWeight="bold"
                sx={{ textAlign: "center" }}
            >
                Available Parking Areas
            </Typography>

            <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mt: 1, mb: 4, textAlign: "center" }}
            >
                Check which slots are free now or for your planned visit.
            </Typography>

            <AvailabilityFilters
                date={date}
                duration={duration}
                setDate={setDate}
                setDuration={setDuration}
                setStartTime={setStartTime}
                startTime={startTime}
                today={today}
            />

            {availabilityError && (
                <Alert
                    severity={availabilityError.startsWith("Choose ") ? "info" : "error"}
                    sx={{ mb: 3 }}
                >
                    {availabilityError}
                </Alert>
            )}


            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: {
                        xs: "1fr",
                        sm: "repeat(2, 1fr)",
                        md: "repeat(3, 1fr)",
                    },
                    gap: 3,
                }}
            >
                {areas.map((area) => {
                    const slots = area.slots || [];


                    const areaAvailability = availability.find(
                        (entry) => String(entry.areaId) === String(area.id)
                    );
                    const availableSlotIds = new Set(
                        (areaAvailability?.availableSlotIds || []).map(String)
                    );
                    const availableSlotNames = slots
                        .filter((slot) => availableSlotIds.has(String(slot.id)))
                        .map((slot) => slot.name);
                    const availableSlots = areaAvailability?.availableCount ?? 0;


                    // Find the lowest hourly price
                    const pricePerHour =
                        slots.length > 0
                            ? Math.min(
                                ...slots.map((slot) =>
                                    Number(slot.pricePerHour)
                                )
                            )
                            : 0;


                    return (
                        <Card
                            key={area.id}
                            sx={{
                                borderRadius: 3,
                                height: "100%",
                                display: "flex",
                                flexDirection: "column",
                            }}
                        >
                            <CardContent
                                sx={{
                                    p: 3,
                                    flexGrow: 1,
                                    display: "flex",
                                    flexDirection: "column",
                                }}
                            >
                                <LuCircleParking
                                    size={40}
                                    color="#0D9488"
                                />


                                <Typography
                                    variant="h6"
                                    fontWeight="bold"
                                    sx={{ mt: 2 }}
                                >
                                    {area.name}
                                </Typography>


                                <Typography
                                    color="text.secondary"
                                    sx={{ mt: 1 }}
                                >
                                    Total slots: {slots.length}
                                </Typography>


                                <Chip
                                    label={areaAvailability
                                        ? `${availableSlots} of ${areaAvailability.totalSlots} slots available`
                                        : availabilityLoading
                                            ? "Checking availability..."
                                            : availabilityError?.startsWith("Choose ")
                                                ? "Complete time selection"
                                            : "Availability unavailable"}
                                    color={
                                        availableSlots > 0
                                            ? "success"
                                            : "error"
                                    }
                                    sx={{
                                        mt: 2,
                                        alignSelf: "flex-start",
                                    }}
                                />

                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    {availableSlotNames.length
                                        ? `Available: ${availableSlotNames.join(", ")}`
                                        : availabilityLoading
                                            ? "Checking available slot names..."
                                            : availabilityError?.startsWith("Choose ")
                                                ? "Select a date and time to see available slots."
                                            : "No slots available for this time."}
                                </Typography>


                                <Typography
                                    variant="h6"
                                    sx={{ mt: 2 }}
                                >
                                    ₹{pricePerHour} / hour
                                </Typography>


                                <Box sx={{ flexGrow: 1 }} />


                                <Button
                                    component={Link}
                                    to={user?.role === "admin" ? "/admin" : "/book"}
                                    state={{
                                        area,
                                        availabilityFilters: { date, startTime, duration },
                                    }}
                                    variant="contained"
                                    fullWidth
                                    disabled={
                                        availabilityLoading ||
                                        availableSlots === 0 ||
                                        Boolean(availabilityError)
                                    }
                                    endIcon={<LuArrowRight />}
                                    sx={{ mt: 3 }}
                                >
                                    {user?.role === "admin"
                                        ? "View Availability"
                                        : availabilityError
                                        ? "Availability unavailable"
                                        : availableSlots > 0
                                        ? "Select Parking"
                                        : "Fully Booked"}
                                </Button>
                            </CardContent>
                        </Card>
                    );
                })}
            </Box>
        </Container>
    );
}

export default ParkingAreas;