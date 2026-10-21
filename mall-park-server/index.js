const crypto = require('crypto')
const { promisify } = require('util')
const jsonServer = require('json-server')

const scrypt = promisify(crypto.scrypt)
const app = jsonServer.create()
const router = jsonServer.router('db.json')
const PORT = Number(process.env.PORT) || 3000
const TOKEN_LIFETIME_SECONDS = 8 * 60 * 60
const DUMMY_PASSWORD_RECORD = {
    salt: '00000000000000000000000000000000',
    passwordHash: '00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
}
const TOKEN_SECRET = process.env.MALLPARK_JWT_SECRET ||
    (process.env.NODE_ENV === 'production'
        ? null
        : crypto.randomBytes(32).toString('hex'))

if (!TOKEN_SECRET || Buffer.byteLength(TOKEN_SECRET) < 32) {
    throw new Error('Set MALLPARK_JWT_SECRET to a value of at least 32 bytes.')
}

if (!process.env.MALLPARK_JWT_SECRET) {
    console.warn('Using a temporary development token secret; set MALLPARK_JWT_SECRET for stable sessions.')
}

const allowedOrigin = process.env.MALLPARK_CLIENT_ORIGIN || 'http://localhost:5173'

app.use(jsonServer.defaults({ bodyParser: true, noCors: true }))
app.use((req, res, next) => {
    const origin = req.get('origin')
    if (origin && origin !== allowedOrigin) {
        return res.status(403).json({ message: 'This browser origin is not allowed.' })
    }
    if (origin) {
        res.set('Access-Control-Allow-Origin', origin)
        res.set('Vary', 'Origin')
        res.set('Access-Control-Allow-Credentials', 'true')
    }
    res.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
    res.set('Access-Control-Allow-Headers', 'Authorization,Content-Type')
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204)
    }
    next()
})

function toBase64Url(value) {
    return Buffer.from(value).toString('base64url')
}

function signToken(user) {
    const now = Math.floor(Date.now() / 1000)
    const header = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    const payload = toBase64Url(JSON.stringify({
        sub: String(user.id),
        email: user.email,
        name: user.name,
        role: user.role,
        iat: now,
        exp: now + TOKEN_LIFETIME_SECONDS,
    }))
    const content = `${header}.${payload}`
    const signature = crypto
        .createHmac('sha256', TOKEN_SECRET)
        .update(content)
        .digest('base64url')

    return `${content}.${signature}`
}

function verifyToken(token) {
    const parts = token.split('.')

    if (parts.length !== 3) {
        return null
    }

    const content = `${parts[0]}.${parts[1]}`
    const expected = crypto
        .createHmac('sha256', TOKEN_SECRET)
        .update(content)
        .digest()
    const actual = Buffer.from(parts[2], 'base64url')

    if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) {
        return null
    }

    try {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString())
        if (!payload.sub || !payload.exp || payload.exp <= Date.now() / 1000) {
            return null
        }
        return payload
    } catch {
        return null
    }
}

function publicUser(user) {
    return {
        id: String(user.id),
        name: user.name,
        email: user.email,
        role: user.role,
    }
}

async function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex')
    const derivedKey = await scrypt(password, salt, 64)
    return { salt, passwordHash: derivedKey.toString('hex') }
}

async function passwordMatches(password, user) {
    const derivedKey = await scrypt(password, user.salt, 64)
    const storedKey = Buffer.from(user.passwordHash, 'hex')
    return storedKey.length === derivedKey.length &&
        crypto.timingSafeEqual(storedKey, derivedKey)
}

function setSessionCookie(res, user) {
    res.cookie('mallpark_session', signToken(user), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: TOKEN_LIFETIME_SECONDS * 1000,
        path: '/',
    })
}

function getRequestToken(req) {
    const authorization = req.get('authorization') || ''
    const bearerToken = authorization.startsWith('Bearer ')
        ? authorization.slice(7)
        : ''
    const cookie = (req.get('cookie') || '')
        .split(';')
        .map((part) => part.trim())
        .find((part) => part.startsWith('mallpark_session='))
    const token = cookie
        ? cookie.slice('mallpark_session='.length)
        : bearerToken
    return { token, hasCookie: Boolean(cookie) }
}

function authenticate(req, res, next) {
    const { token } = getRequestToken(req)
    const user = verifyToken(token)

    if (!user) {
        return res.status(401).json({ message: 'Please sign in to continue.' })
    }

    req.user = user
    next()
}

function bookingOverlapsInterval(booking, intervalStart, intervalEnd) {
    if (booking.status === 'cancelled' || booking.status === 'checked-out') {
        return false
    }

    const scheduledStart = getScheduledStart(
        booking.date,
        booking.startTime,
        booking.timeZoneOffsetMinutes
    )
    if (!scheduledStart) {
        return false
    }

    if (booking.status === 'checked-in') {
        const activeStart = booking.checkedInAt
            ? new Date(booking.checkedInAt).getTime()
            : scheduledStart.getTime()
        return intervalEnd > activeStart
    }

    const duration = Number(booking.duration)
    if (!Number.isFinite(duration) || duration <= 0) {
        return false
    }

    const scheduledEnd = scheduledStart.getTime() + duration * 60 * 60 * 1000
    return intervalStart < scheduledEnd && intervalEnd > scheduledStart.getTime()
}

function getScheduledStart(date, time, timeZoneOffsetMinutes) {
    if (
        typeof date !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        typeof time !== 'string' ||
        !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)
    ) {
        return null
    }

    const utcStart = new Date(`${date}T${time}:00Z`)
    if (
        Number.isNaN(utcStart.getTime()) ||
        utcStart.toISOString().slice(0, 16) !== `${date}T${time}`
    ) {
        return null
    }

    if (timeZoneOffsetMinutes === undefined) {
        const localStart = new Date(`${date}T${time}`)
        return Number.isNaN(localStart.getTime()) ? null : localStart
    }

    const offset = Number(timeZoneOffsetMinutes)
    if (!Number.isInteger(offset) || offset < -840 || offset > 840) {
        return null
    }
    return new Date(utcStart.getTime() + offset * 60 * 1000)
}

function matchingArea(areaId) {
    return router.db.get('parking').find((area) =>
        String(area.id) === String(areaId)
    ).value()
}

function matchingBooking(bookingId) {
    return router.db.get('booking').find((booking) =>
        String(booking.id) === String(bookingId)
    ).value()
}

async function provisionAdmin() {
    const email = process.env.MALLPARK_ADMIN_EMAIL?.trim().toLowerCase()
    const password = process.env.MALLPARK_ADMIN_PASSWORD

    if (!email && !password) {
        return
    }
    if (!email || !password || password.length < 8) {
        throw new Error('Set both MALLPARK_ADMIN_EMAIL and MALLPARK_ADMIN_PASSWORD (at least 8 characters).')
    }

    const users = router.db.get('users')
    let admin = users.find((user) => user.email === email).value()

    if (admin) {
        const credentials = await hashPassword(password)
        admin = { ...admin, role: 'admin', ...credentials }
        users.find({ id: admin.id }).assign(admin).write()
    } else {
        const credentials = await hashPassword(password)
        admin = {
            id: crypto.randomUUID(),
            name: 'MallPark Admin',
            email,
            role: 'admin',
            ...credentials,
        }
        users.push(admin).write()
    }
}

app.post('/auth/register', async (req, res) => {
    const body = req.body || {}
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const email = typeof body.email === 'string'
        ? body.email.trim().toLowerCase()
        : ''
    const password = typeof body.password === 'string' ? body.password : ''

    if (name.length < 1 || name.length > 80) {
        return res.status(400).json({ message: 'Enter a name between 1 and 80 characters.' })
    }
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ message: 'Enter a valid email address.' })
    }
    if (password.length < 8 || password.length > 128) {
        return res.status(400).json({ message: 'Password must be between 8 and 128 characters.' })
    }

    const users = router.db.get('users')
    if (users.find((user) => user.email === email).value()) {
        return res.status(409).json({ message: 'An account with this email already exists.' })
    }

    try {
        const credentials = await hashPassword(password)
        if (users.find((user) => user.email === email).value()) {
            return res.status(409).json({ message: 'An account with this email already exists.' })
        }
        const user = {
            id: crypto.randomUUID(),
            name,
            email,
            role: 'customer',
            ...credentials,
        }
        users.push(user).write()
        setSessionCookie(res, user)
        return res.status(201).json({ user: publicUser(user) })
    } catch (error) {
        console.error('Unable to register customer:', error)
        return res.status(500).json({ message: 'Unable to create your account.' })
    }
})

app.post('/auth/login', async (req, res) => {
    const body = req.body || {}
    const email = typeof body.email === 'string'
        ? body.email.trim().toLowerCase()
        : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const user = router.db.get('users').find((entry) => entry.email === email).value()
    const passwordRecord = user || DUMMY_PASSWORD_RECORD
    const matches = password.length <= 128 && await passwordMatches(password, passwordRecord)

    if (!user || !password || !matches) {
        return res.status(401).json({ message: 'Email or password is incorrect.' })
    }

    setSessionCookie(res, user)
    return res.json({ user: publicUser(user) })
})

app.get('/auth/session', (req, res) => {
    const { token, hasCookie } = getRequestToken(req)
    const user = verifyToken(token)

    if (!user) {
        if (hasCookie) {
            res.clearCookie('mallpark_session', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                path: '/',
            })
        }
        return res.json({ user: null })
    }

    return res.json({
        user: {
            id: user.sub,
            name: user.name,
            email: user.email,
            role: user.role,
        },
    })
})

app.post('/auth/logout', (req, res) => {
    res.clearCookie('mallpark_session', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
    })
    return res.json({ message: 'Signed out.' })
})

app.get('/availability', (req, res) => {
    const { date, startTime, duration } = req.query
    const hasInterval = date !== undefined || startTime !== undefined || duration !== undefined

    let intervalStart = Date.now()
    let intervalEnd = intervalStart + 1

    if (hasInterval) {
        const hours = Number(duration)
        const start = getScheduledStart(date, startTime, req.query.timeZoneOffsetMinutes)
        if (
            !date ||
            !startTime ||
            !Number.isFinite(hours) ||
            hours < 1 ||
            hours > 24 ||
            !Number.isInteger(hours) ||
            !start
        ) {
            return res.status(400).json({ message: 'Choose a valid date, time, and duration.' })
        }
        intervalStart = start.getTime()
        intervalEnd = intervalStart + hours * 60 * 60 * 1000
    }

    const bookings = router.db.get('booking').value()
    const areas = router.db.get('parking').value()
        .filter((area) => !req.query.areaId || String(area.id) === String(req.query.areaId))
        .map((area) => {
            const occupiedSlotIds = new Set(
                bookings
                    .filter((booking) =>
                        String(booking.areaId) === String(area.id) &&
                        bookingOverlapsInterval(booking, intervalStart, intervalEnd)
                    )
                    .map((booking) => String(booking.slotId))
            )
            const availableSlotIds = (area.slots || [])
                .filter((slot) =>
                    slot.status === 'available' &&
                    !occupiedSlotIds.has(String(slot.id))
                )
                .map((slot) => String(slot.id))

            return {
                areaId: String(area.id),
                totalSlots: (area.slots || []).length,
                availableCount: availableSlotIds.length,
                availableSlotIds,
            }
        })

    return res.json(areas)
})

app.use((req, res, next) => {
    if (/^\/users(?:\/|$)/.test(req.path)) {
        return res.status(404).json({ message: 'Not found.' })
    }

    if (/^\/booking(?:\/|$)/.test(req.path)) {
        return authenticate(req, res, next)
    }

    if (/^\/parking(?:\/|$)/.test(req.path) && req.method !== 'GET') {
        return authenticate(req, res, (authError) => {
            if (authError) return next(authError)
            if (req.user.role !== 'admin') {
                return res.status(403).json({ message: 'Admin access is required.' })
            }
            next()
        })
    }

    next()
})

app.use((req, res, next) => {
    if (!/^\/booking(?:\/|$)/.test(req.path)) {
        return next()
    }

    const bookingId = req.path.split('/')[2]
    const booking = bookingId ? matchingBooking(bookingId) : null

    if (req.method === 'GET') {
        if (bookingId) {
            if (!booking || (req.user.role !== 'admin' && String(booking.userId) !== req.user.sub)) {
                return res.status(404).json({ message: 'Booking not found.' })
            }
        } else if (req.user.role !== 'admin') {
            req.query.userId = req.user.sub
        }
        return next()
    }

    if (req.method === 'POST') {
        if (req.user.role !== 'customer') {
            return res.status(403).json({ message: 'Booking creation is reserved for customers.' })
        }

        const body = req.body || {}
        const { areaId, slotId, date, startTime } = body
        const duration = Number(body.duration)
        const area = matchingArea(areaId)
        const slot = area?.slots?.find((entry) => String(entry.id) === String(slotId))
        const timeZoneOffsetMinutes = body.timeZoneOffsetMinutes === undefined
            ? undefined
            : Number(body.timeZoneOffsetMinutes)
        const start = getScheduledStart(date, startTime, timeZoneOffsetMinutes)

        if (
            !area ||
            !slot ||
            slot.status !== 'available' ||
            !date ||
            !startTime ||
            !Number.isInteger(duration) ||
            duration < 1 ||
            duration > 24 ||
            !start ||
            start.getTime() <= Date.now()
        ) {
            return res.status(400).json({ message: 'Please provide valid booking details.' })
        }

        const end = new Date(start.getTime() + duration * 60 * 60 * 1000)
        const overlap = router.db.get('booking').value().some((entry) =>
            String(entry.areaId) === String(area.id) &&
            String(entry.slotId) === String(slot.id) &&
            bookingOverlapsInterval(entry, start.getTime(), end.getTime())
        )
        if (overlap) {
            return res.status(409).json({ message: 'This slot is already booked during the selected time.' })
        }

        const pricePerHour = Number(slot.pricePerHour)
        if (!Number.isFinite(pricePerHour) || pricePerHour < 0) {
            return res.status(500).json({ message: 'The selected parking slot has an invalid price.' })
        }
        req.body = {
            userId: req.user.sub,
            areaId: area.id,
            areaName: area.name,
            slotId: slot.id,
            slotName: slot.name,
            date,
            startTime,
            ...(timeZoneOffsetMinutes !== undefined ? { timeZoneOffsetMinutes } : {}),
            duration,
            pricePerHour,
            totalFee: pricePerHour * duration,
            status: 'confirmed',
        }
        return next()
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
        const body = req.body || {}
        if (!bookingId || !booking) {
            return res.status(404).json({ message: 'Booking not found.' })
        }
        if (req.user.role !== 'admin' && String(booking.userId) !== req.user.sub) {
            return res.status(404).json({ message: 'Booking not found.' })
        }

        if (req.user.role === 'customer') {
            const start = getScheduledStart(
                booking.date,
                booking.startTime,
                booking.timeZoneOffsetMinutes
            )
            if (
                booking.status !== 'confirmed' ||
                body.status !== 'cancelled' ||
                !start ||
                start.getTime() <= Date.now()
            ) {
                return res.status(400).json({ message: 'Only future confirmed bookings can be cancelled.' })
            }
            req.body = { ...booking, status: 'cancelled' }
            return next()
        }

        const validTransition =
            (booking.status === 'confirmed' && body.status === 'checked-in') ||
            (booking.status === 'checked-in' && body.status === 'checked-out')
        if (!validTransition) {
            return res.status(400).json({ message: 'Invalid booking status transition.' })
        }
        req.body = {
            ...booking,
            status: body.status,
            ...(body.status === 'checked-in' ? { checkedInAt: new Date().toISOString() } : {}),
            ...(body.status === 'checked-out' ? { checkedOutAt: new Date().toISOString() } : {}),
        }
        return next()
    }

    if (req.method === 'DELETE') {
        return res.status(403).json({ message: 'Bookings cannot be deleted.' })
    }

    return res.status(405).json({ message: 'Method not allowed.' })
})

app.use(router)

provisionAdmin()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`MallPark API is running at port ${PORT}.`)
        })
    })
    .catch((error) => {
        console.error('Unable to initialize MallPark API:', error.message)
        process.exitCode = 1
    })
