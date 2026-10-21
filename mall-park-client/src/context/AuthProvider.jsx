import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import axiosInstance from "../api/axiosInstance";
import { clearBookings } from "../redux/slice/bookingSlice";
import { AuthContext } from "./AuthContext";

export function AuthProvider({ children }) {
    const dispatch = useDispatch();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState("");

    useEffect(() => {
        let active = true;
        const clearSession = () => {
            dispatch(clearBookings());
            setUser(null);
        };

        window.addEventListener("mallpark:session-expired", clearSession);
        axiosInstance.get("/auth/session")
            .then((response) => {
                if (active) {
                    setUser(response.data.user);
                }
            })
            .catch((error) => {
                if (active) {
                    setAuthError(error.response?.status === 401
                        ? ""
                        : error.response?.data?.message ||
                            "Unable to verify your sign-in session.");
                }
            })
            .finally(() => {
                if (active) {
                    setLoading(false);
                }
            });

        return () => {
            active = false;
            window.removeEventListener("mallpark:session-expired", clearSession);
        };
    }, [dispatch]);

    const register = useCallback(async (details) => {
        const response = await axiosInstance.post("/auth/register", details);
        dispatch(clearBookings());
        setUser(response.data.user);
        setAuthError("");
        return response.data.user;
    }, [dispatch]);

    const login = useCallback(async (credentials) => {
        const response = await axiosInstance.post("/auth/login", credentials);
        dispatch(clearBookings());
        setUser(response.data.user);
        setAuthError("");
        return response.data.user;
    }, [dispatch]);

    const logout = useCallback(() => {
        return axiosInstance.post("/auth/logout")
            .then(() => {
                dispatch(clearBookings());
                setUser(null);
            });
    }, [dispatch]);

    const value = useMemo(() => ({
        user,
        loading,
        authError,
        register,
        login,
        logout,
    }), [user, loading, authError, register, login, logout]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
