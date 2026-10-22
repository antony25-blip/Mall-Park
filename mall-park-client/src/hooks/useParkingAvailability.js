import { useCallback, useEffect, useRef, useState } from "react";
import { parkingAvailabilityAPI } from "../Services/allApi";

function getLocalDate() {
    const date = new Date();
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 10);
}

export function useParkingAvailability() {
    const [date, setDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [duration, setDuration] = useState("1");
    const [result, setResult] = useState({ key: "", data: [] });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const requestId = useRef(0);
    const key = JSON.stringify([date, startTime, duration]);

    const refresh = useCallback(async () => {
        const currentRequest = ++requestId.current;
        const filtersKey = JSON.stringify([date, startTime, duration]);

        if (Boolean(date) !== Boolean(startTime)) {
            setResult({ key: filtersKey, data: [] });
            setError("Choose both a date and start time to check availability.");
            setLoading(false);
            return;
        }

        const filters = {};
        if (date && startTime) {
            const requestedStart = new Date(`${date}T${startTime}`);
            if (Number.isNaN(requestedStart.getTime()) || requestedStart <= new Date()) {
                setResult({ key: filtersKey, data: [] });
                setError("Choose a future date and start time.");
                setLoading(false);
                return;
            }
            filters.date = date;
            filters.startTime = startTime;
            filters.duration = Number(duration);
            filters.timeZoneOffsetMinutes = requestedStart.getTimezoneOffset();
        }

        setLoading(true);
        setError("");
        try {
            const response = await parkingAvailabilityAPI(filters);
            if (currentRequest === requestId.current) {
                setResult({ key: filtersKey, data: response.data });
            }
        } catch (requestError) {
            if (currentRequest === requestId.current) {
                setResult({ key: filtersKey, data: [] });
                setError(
                    requestError.response?.data?.message ||
                    "Unable to load parking availability."
                );
            }
        } finally {
            if (currentRequest === requestId.current) {
                setLoading(false);
            }
        }
    }, [date, duration, startTime]);

    useEffect(() => {
        const initialRefresh = window.setTimeout(refresh, 0);
        const timer = window.setInterval(refresh, 60_000);
        return () => {
            window.clearTimeout(initialRefresh);
            window.clearInterval(timer);
            requestId.current += 1;
        };
    }, [refresh]);

    return {
        availability: result.key === key ? result.data : [],
        date,
        duration,
        error,
        loading,
        refresh,
        setDate,
        setDuration,
        setStartTime,
        startTime,
        today: getLocalDate(),
    };
}
