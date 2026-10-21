import { useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Container,
    Link as MuiLink,
    TextField,
    Typography,
} from "@mui/material";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function AuthPage({ mode }) {
    const isRegister = mode === "register";
    const { user, loading: authLoading, authError, login, register } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const requestedDestination = location.state?.from;
    const destination = requestedDestination?.pathname?.startsWith("/") &&
        !requestedDestination.pathname.startsWith("//")
        ? requestedDestination
        : { pathname: "/my-bookings" };
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    if (user) {
        return <Container maxWidth="sm" sx={{ py: 6 }}>
            <Alert severity="info">You are already signed in.</Alert>
            <Button component={Link} to="/parking" sx={{ mt: 2 }}>View parking</Button>
        </Container>;
    }

    if (authLoading) {
        return (
            <Container maxWidth="sm" sx={{ py: 6, textAlign: "center" }}>
                <CircularProgress />
            </Container>
        );
    }

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setSubmitting(true);

        try {
            let signedInUser;
            if (isRegister) {
                signedInUser = await register({ name, email, password });
            } else {
                signedInUser = await login({ email, password });
            }
            const nextDestination = signedInUser.role === "admin" &&
                (!requestedDestination || requestedDestination.pathname === "/my-bookings")
                ? "/admin"
                : destination;
            navigate(nextDestination, { replace: true });
        } catch (requestError) {
            setError(
                requestError.response?.data?.message ||
                "Unable to sign in right now. Please try again."
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Container maxWidth="sm" sx={{ py: 6 }}>
            <Card variant="outlined">
                <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                    <Typography variant="h4" fontWeight="bold">
                        {isRegister ? "Create your account" : "Welcome back"}
                    </Typography>
                    <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
                        {isRegister
                            ? "Register to reserve a parking slot and manage your bookings."
                            : "Sign in to continue with your MallPark booking."}
                    </Typography>

                    {(error || authError) && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error || authError}
                        </Alert>
                    )}

                    <Box
                        component="form"
                        onSubmit={handleSubmit}
                        sx={{ display: "grid", gap: 2 }}
                    >
                        {isRegister && (
                            <TextField
                                label="Name"
                                autoComplete="name"
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                slotProps={{ htmlInput: { maxLength: 80 } }}
                                required
                            />
                        )}
                        <TextField
                            label="Email"
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            required
                        />
                        <TextField
                            label="Password"
                            type="password"
                            autoComplete={isRegister ? "new-password" : "current-password"}
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            slotProps={{ htmlInput: { minLength: 8, maxLength: 128 } }}
                            required
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={submitting}
                            sx={{ minHeight: 44 }}
                        >
                            {submitting
                                ? <CircularProgress size={22} color="inherit" />
                                : isRegister ? "Create account" : "Sign in"}
                        </Button>
                    </Box>

                    <Typography sx={{ mt: 3 }}>
                        {isRegister ? "Already have an account? " : "New to MallPark? "}
                        <MuiLink
                            component={Link}
                            to={isRegister ? "/login" : "/register"}
                            underline="hover"
                        >
                            {isRegister ? "Sign in" : "Register"}
                        </MuiLink>
                    </Typography>
                </CardContent>
            </Card>
        </Container>
    );
}

export default AuthPage;
