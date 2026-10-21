const TERMINAL_BOOKING_STATUSES = new Set(["cancelled", "checked-out"]);

export function bookingOverlapsInterval(booking, intervalStart, intervalEnd) {
    if (TERMINAL_BOOKING_STATUSES.has(booking.status)) {
        return false;
    }

    const scheduledStart = new Date(
        `${booking.date}T${booking.startTime}`
    );

    if (Number.isNaN(scheduledStart.getTime())) {
        return false;
    }

    const activeStart = booking.status === "checked-in" && booking.checkedInAt
        ? new Date(booking.checkedInAt)
        : scheduledStart;

    if (Number.isNaN(activeStart.getTime())) {
        return false;
    }

    if (booking.status === "checked-in") {
        return intervalEnd > activeStart;
    }

    const duration = Number(booking.duration);

    if (!Number.isFinite(duration) || duration <= 0) {
        return false;
    }

    const scheduledEnd = scheduledStart.getTime() + duration * 60 * 60 * 1000;

    return intervalStart < scheduledEnd && intervalEnd > scheduledStart.getTime();
}

export function isBookingOccupyingAt(booking, timestamp) {
    return bookingOverlapsInterval(booking, timestamp, timestamp + 1);
}

export function getBookingStart(booking) {
    const utcStart = new Date(`${booking.date}T${booking.startTime}:00Z`);
    if (
        Number.isInteger(Number(booking.timeZoneOffsetMinutes)) &&
        booking.timeZoneOffsetMinutes !== undefined
    ) {
        const offset = Number(booking.timeZoneOffsetMinutes);
        if (offset < -840 || offset > 840 || Number.isNaN(utcStart.getTime())) {
            return null;
        }
        return new Date(utcStart.getTime() + offset * 60 * 1000);
    }

    const start = new Date(`${booking.date}T${booking.startTime}`);
    return Number.isNaN(start.getTime()) ? null : start;
}

export function getBookingEnd(booking) {
    const start = getBookingStart(booking);
    const duration = Number(booking.duration);

    if (!start || !Number.isFinite(duration) || duration <= 0) {
        return null;
    }

    return new Date(start.getTime() + duration * 60 * 60 * 1000);
}
