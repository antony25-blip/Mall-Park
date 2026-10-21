import { useEffect, useState } from "react";
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
import { parkingAvailabilityAPI } from "../Services/allApi";


function ParkingAreas() {
    const dispatch = useDispatch();

    // Get parking areas from Redux
    const {
        parking: areas = [],
        loading,
        error,
    } = useSelector((state) => state.parkingSlice);

    const [availability, setAvailability] = useState([]);
    const [availabilityError, setAvailabilityError] = useState("");


    // Fetch parking areas and public, PII-free availability
    useEffect(() => {
        dispatch(fetchParkingSlots());
    }, [dispatch]);

    useEffect(() => {
        let mounted = true;
        const loadAvailability = async () => {
            try {
                const response = await parkingAvailabilityAPI();
                if (mounted) {
                    setAvailability(response.data);
                    setAvailabilityError("");
                }
            } catch (error) {
                if (mounted) {
                    setAvailabilityError(
                        error.response?.data?.message ||
                        "Unable to load current parking availability."
                    );
                }
            }
        };

        loadAvailability();
        const timer = window.setInterval(loadAvailability, 60_000);
        return () => {
            mounted = false;
            window.clearInterval(timer);
        };
    }, []);

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
                Choose a parking area that suits your needs.
            </Typography>

            {availabilityError && (
                <Alert
                    severity="error"
                    action={
                        <Button
                            color="inherit"
                            onClick={() => {
                                setAvailabilityError("");
                                parkingAvailabilityAPI()
                                    .then((response) => setAvailability(response.data))
                                    .catch((error) => setAvailabilityError(
                                        error.response?.data?.message ||
                                        "Unable to load current parking availability."
                                    ));
                            }}
                        >
                            Retry
                        </Button>
                    }
                    sx={{ mb: 3 }}
                >
                    Current availability is unavailable: {availabilityError}
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
                                    label={`${availableSlots} slots available`}
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


                                <Typography
                                    variant="h6"
                                    sx={{ mt: 2 }}
                                >
                                    ₹{pricePerHour} / hour
                                </Typography>


                                <Box sx={{ flexGrow: 1 }} />


                                <Button
                                    component={Link}
                                    to="/book"
                                    state={{ area }}
                                    variant="contained"
                                    fullWidth
                                    disabled={availableSlots === 0 || Boolean(availabilityError)}
                                    endIcon={<LuArrowRight />}
                                    sx={{ mt: 3 }}
                                >
                                    {availabilityError
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