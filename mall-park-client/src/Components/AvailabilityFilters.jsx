import { Box, MenuItem, TextField, Typography } from "@mui/material";

function AvailabilityFilters({
    date,
    duration,
    setDate,
    setDuration,
    setStartTime,
    startTime,
    today,
}) {
    return (
        <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
                Check availability for a time
            </Typography>
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
                    gap: 2,
                }}
            >
                <TextField
                    label="Date"
                    type="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: today } }}
                />
                <TextField
                    label="Start time"
                    type="time"
                    value={startTime}
                    onChange={(event) => setStartTime(event.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                    select
                    label="Duration"
                    value={duration}
                    onChange={(event) => setDuration(event.target.value)}
                >
                    {[1, 2, 3, 4, 5, 6, 8, 12, 24].map((hours) => (
                        <MenuItem key={hours} value={String(hours)}>
                            {hours} hour{hours === 1 ? "" : "s"}
                        </MenuItem>
                    ))}
                </TextField>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Leave date and start time blank to see slots available right now.
            </Typography>
        </Box>
    );
}

export default AvailabilityFilters;
