const request = require('supertest');
const app = require('../../src/app').default;
const pool = require('../../src/db/postgres').default;
const { hashPassword } = require('../../src/shared/crypto/password');

const CLIENT_USER = 'appt_client';
const CLIENT_PASS = 'password123';
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'password123';
// Use a Wednesday for baby_or_pregnant bookings (2026-03-11 is a Wednesday)
const APPT_DATE = '2026-03-11';
const APPT_DATE_NON_WED = '2026-03-12'; // Thursday

let clientToken;
let adminToken;

beforeAll(async () => {
    // Clean slate
    await pool.query('DELETE FROM appointment_booking WHERE username IN ($1, $2)', [CLIENT_USER, ADMIN_USER]);
    await pool.query('DELETE FROM familymember WHERE username IN ($1, $2)', [CLIENT_USER, ADMIN_USER]);
    await pool.query('DELETE FROM account WHERE username IN ($1, $2)', [CLIENT_USER, ADMIN_USER]);
    await pool.query('DELETE FROM appointment_slot WHERE appt_date IN ($1, $2)', [APPT_DATE, APPT_DATE_NON_WED]);

    const hashed = await hashPassword(CLIENT_PASS);

    // Create admin account
    await pool.query(
        `INSERT INTO account (username, user_password, canada_status, household_size, addr, baby_or_pregnant, language_spoken, account_notes)
         VALUES ($1, $2, 'citizen', 1, '456 Admin St', false, 'English', 'admin')`,
        [ADMIN_USER, hashed]
    );

    // Create client account (household_size=2, not pregnant)
    await pool.query(
        `INSERT INTO account (username, user_password, canada_status, household_size, addr, baby_or_pregnant, language_spoken, account_notes)
         VALUES ($1, $2, 'citizen', 2, '123 Main St', false, 'English', 'client')`,
        [CLIENT_USER, hashed]
    );

    // Get tokens
    const adminRes = await request(app)
        .post('/api/auth/login')
        .send({ username: ADMIN_USER, password: ADMIN_PASS });
    adminToken = adminRes.body.token;

    const clientRes = await request(app)
        .post('/api/auth/login')
        .send({ username: CLIENT_USER, password: CLIENT_PASS });
    clientToken = clientRes.body.token;
});

afterAll(async () => {
    await pool.query('DELETE FROM appointment_booking WHERE username IN ($1, $2)', [CLIENT_USER, ADMIN_USER]);
    await pool.query('DELETE FROM appointment_slot WHERE appt_date IN ($1, $2)', [APPT_DATE, APPT_DATE_NON_WED]);
    await pool.query('DELETE FROM familymember WHERE username IN ($1, $2)', [CLIENT_USER, ADMIN_USER]);
    await pool.query('DELETE FROM account WHERE username IN ($1, $2)', [CLIENT_USER, ADMIN_USER]);
    await pool.end();
});

beforeEach(async () => {
    // Clear appointments before each test
    await pool.query('DELETE FROM appointment_slot WHERE appt_date IN ($1, $2)', [APPT_DATE, APPT_DATE_NON_WED]);
});

// ─── Admin: Create Single Appointment ────────────────────────────────
describe('POST /api/appointments/appointment (admin create)', () => {
    it('should return 401 without auth', async () => {
        const res = await request(app)
            .post('/api/appointments/appointment')
            .send({ appt_date: APPT_DATE, start_time: '09:00', end_time: '09:15' });

        expect(res.status).toBe(401);
    });

    it('should return 403 for non-admin', async () => {
        const res = await request(app)
            .post('/api/appointments/appointment')
            .set('Authorization', `Bearer ${clientToken}`)
            .send({ appt_date: APPT_DATE, start_time: '09:00', end_time: '09:15' });

        expect(res.status).toBe(403);
    });

    it('should create an appointment slot', async () => {
        const res = await request(app)
            .post('/api/appointments/appointment')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ appt_date: APPT_DATE, start_time: '09:00', end_time: '09:15', appt_notes: 'test slot' });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.appointment.appt_notes).toBe('test slot');
    });

    it('should reject overlapping appointment', async () => {
        await request(app)
            .post('/api/appointments/appointment')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ appt_date: APPT_DATE, start_time: '09:00', end_time: '09:15' });

        const res = await request(app)
            .post('/api/appointments/appointment')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ appt_date: APPT_DATE, start_time: '09:00', end_time: '09:15' });

        expect(res.status).toBe(500);
    });
});

// ─── Admin: Create Appointments in Time Range ────────────────────────
describe('POST /api/appointments/appointments-in-range (admin batch create)', () => {
    it('should create multiple 15-min slots', async () => {
        const res = await request(app)
            .post('/api/appointments/appointments-in-range')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ appt_date: APPT_DATE, start_time: '10:00', end_time: '11:00' });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        // 10:00-11:00 = four 15-min slots
        expect(res.body.appointments.length).toBe(4);
    });

    it('should reject non-15-min-aligned times', async () => {
        const res = await request(app)
            .post('/api/appointments/appointments-in-range')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ appt_date: APPT_DATE, start_time: '10:07', end_time: '11:00' });

        expect(res.status).toBe(500);
    });

    it('should reject times outside 08:00-16:00', async () => {
        const res = await request(app)
            .post('/api/appointments/appointments-in-range')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ appt_date: APPT_DATE, start_time: '07:00', end_time: '08:00' });

        expect(res.status).toBe(500);
    });
});

// ─── Admin: Get All Appointments ─────────────────────────────────────
describe('GET /api/appointments/all (admin view)', () => {
    it('should return 403 for non-admin', async () => {
        const res = await request(app)
            .get('/api/appointments/all')
            .set('Authorization', `Bearer ${clientToken}`);

        expect(res.status).toBe(403);
    });

    it('should return all appointments', async () => {
        // Create a slot first
        await request(app)
            .post('/api/appointments/appointment')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ appt_date: APPT_DATE, start_time: '08:00', end_time: '08:15' });

        const res = await request(app)
            .get('/api/appointments/all')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThanOrEqual(1);
    });
});

// ─── Admin: Delete Appointment ───────────────────────────────────────
describe('DELETE /api/appointments/appointment (admin delete)', () => {
    it('should delete an existing appointment', async () => {
        await request(app)
            .post('/api/appointments/appointment')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ appt_date: APPT_DATE, start_time: '12:00', end_time: '12:15' });

        const res = await request(app)
            .delete('/api/appointments/appointment')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ appt_date: APPT_DATE, start_time: '12:00' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('should return 404 for non-existent appointment', async () => {
        const res = await request(app)
            .delete('/api/appointments/appointment')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ appt_date: '2099-01-01', start_time: '12:00' });

        expect(res.status).toBe(404);
    });
});

// ─── Admin: Update Appointment ───────────────────────────────────────
describe('PATCH /api/appointments/update (admin update)', () => {
    it('should update appointment notes', async () => {
        await request(app)
            .post('/api/appointments/appointment')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ appt_date: APPT_DATE, start_time: '13:00', end_time: '13:15', appt_notes: 'original' });

        const res = await request(app)
            .patch('/api/appointments/update')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ appt_date: APPT_DATE, start_time: '13:00', updateData: { appt_notes: 'updated' } });

        expect(res.status).toBe(200);
        expect(res.body.appt_notes).toBe('updated');
    });

    it('should return 404 for non-existent appointment', async () => {
        const res = await request(app)
            .patch('/api/appointments/update')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ appt_date: '2099-01-01', start_time: '08:00', updateData: { appt_notes: 'nope' } });

        expect(res.status).toBe(404);
    });
});

// ─── Admin: Search Endpoints ─────────────────────────────────────────
describe('GET /api/appointments/search/* (admin search)', () => {
    beforeEach(async () => {
        await pool.query('DELETE FROM appointment_slot WHERE appt_date IN ($1, $2)', [APPT_DATE, APPT_DATE_NON_WED]);
        await request(app)
            .post('/api/appointments/appointments-in-range')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ appt_date: APPT_DATE, start_time: '09:00', end_time: '10:00' });
    });

    it('should find appointments in date range', async () => {
        const res = await request(app)
            .get('/api/appointments/search/date-range')
            .query({ start: APPT_DATE, end: APPT_DATE })
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('should find appointments in time range', async () => {
        const res = await request(app)
            .get('/api/appointments/search/time-range')
            .query({ start: '09:00', end: '10:00' })
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('should find appointments in date-time range', async () => {
        const res = await request(app)
            .get('/api/appointments/search/date-time-range')
            .query({ date: APPT_DATE, start: '09:00', end: '10:00' })
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('should return 400 if query params missing for date-range', async () => {
        const res = await request(app)
            .get('/api/appointments/search/date-range')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(400);
    });
});

// ─── Admin: Delete by Date / Username ────────────────────────────────
describe('DELETE /api/appointments/delete/* (admin bulk delete)', () => {
    it('should delete appointments by date', async () => {
        await request(app)
            .post('/api/appointments/appointment')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ appt_date: APPT_DATE, start_time: '14:00', end_time: '14:15' });

        const res = await request(app)
            .delete('/api/appointments/delete/date')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ appt_date: APPT_DATE });

        expect(res.status).toBe(200);
        expect(res.body.deleted.length).toBeGreaterThanOrEqual(1);
    });

    it('should delete appointments by username', async () => {
        // Create and book a slot
        await request(app)
            .post('/api/appointments/appointment')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ appt_date: APPT_DATE, start_time: '14:00', end_time: '14:15' });

        await request(app)
            .post('/api/appointments/book')
            .set('Authorization', `Bearer ${clientToken}`)
            .send({ appt_date: APPT_DATE, start_time: '14:00' });

        const res = await request(app)
            .delete('/api/appointments/delete/username')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ username: CLIENT_USER });

        expect(res.status).toBe(200);
    });
});

// ─── Admin: Find by date and start_time ──────────────────────────────
describe('GET /api/appointments/find/date-start (admin find)', () => {
    it('should find appointment by date and start_time', async () => {
        await request(app)
            .post('/api/appointments/appointment')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ appt_date: APPT_DATE, start_time: '15:00', end_time: '15:15' });

        const res = await request(app)
            .get('/api/appointments/find/date-start')
            .query({ appt_date: APPT_DATE, start_time: '15:00' })
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.start_time).toContain('15:00');
    });

    it('should return 404 for non-existent slot', async () => {
        const res = await request(app)
            .get('/api/appointments/find/date-start')
            .query({ appt_date: '2099-01-01', start_time: '08:00' })
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(404);
    });
});

// ─── Client: Get Available Appointments ──────────────────────────────
describe('GET /api/appointments/available (client)', () => {
    it('should return 401 without auth', async () => {
        const res = await request(app)
            .get('/api/appointments/available');

        expect(res.status).toBe(401);
    });

    it('should return available (unbooked) appointments', async () => {
        await request(app)
            .post('/api/appointments/appointments-in-range')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ appt_date: APPT_DATE, start_time: '08:00', end_time: '09:00' });

        const res = await request(app)
            .get('/api/appointments/available')
            .set('Authorization', `Bearer ${clientToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThanOrEqual(1);
    });
});

// ─── Client: Book Appointment ────────────────────────────────────────
describe('POST /api/appointments/book (client)', () => {
    beforeEach(async () => {
        await pool.query('DELETE FROM appointment_slot WHERE appt_date IN ($1, $2)', [APPT_DATE, APPT_DATE_NON_WED]);
        // Create slots
        await request(app)
            .post('/api/appointments/appointments-in-range')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ appt_date: APPT_DATE, start_time: '08:00', end_time: '09:00' });
    });

    it('should book an available slot (15 min for household < 4)', async () => {
        const res = await request(app)
            .post('/api/appointments/book')
            .set('Authorization', `Bearer ${clientToken}`)
            .send({ appt_date: APPT_DATE, start_time: '08:00', booking_notes: 'Need a quiet room' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.duration).toBe(15);
    });

    it('should return 401 without auth', async () => {
        const res = await request(app)
            .post('/api/appointments/book')
            .send({ appt_date: APPT_DATE, start_time: '08:00' });

        expect(res.status).toBe(401);
    });

    it('should return 500 when booking an already-booked slot', async () => {
        // Book the slot first
        await request(app)
            .post('/api/appointments/book')
            .set('Authorization', `Bearer ${clientToken}`)
            .send({ appt_date: APPT_DATE, start_time: '08:00' });

        // Try to book same slot again
        const res = await request(app)
            .post('/api/appointments/book')
            .set('Authorization', `Bearer ${clientToken}`)
            .send({ appt_date: APPT_DATE, start_time: '08:00' });

        expect(res.status).toBe(500);
        expect(res.body.success).toBe(false);
    });
});

// ─── Client: Get My Appointments ─────────────────────────────────────
describe('GET /api/appointments/mine (client)', () => {
    it('should return booked appointments for authenticated user', async () => {
        // Create and book a slot
        await request(app)
            .post('/api/appointments/appointment')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ appt_date: APPT_DATE, start_time: '10:00', end_time: '10:15' });

        await request(app)
            .post('/api/appointments/book')
            .set('Authorization', `Bearer ${clientToken}`)
            .send({ appt_date: APPT_DATE, start_time: '10:00', booking_notes: 'Need a quiet room' });

        const res = await request(app)
            .get('/api/appointments/mine')
            .set('Authorization', `Bearer ${clientToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThanOrEqual(1);
        expect(res.body[0].username).toBe(CLIENT_USER);
        expect(res.body[0].booking_notes).toBe('Need a quiet room');
    });
});

// ─── Client: Cancel Booking ──────────────────────────────────────────
describe('POST /api/appointments/cancel (client)', () => {
    it('should cancel a booked appointment', async () => {
        await request(app)
            .post('/api/appointments/appointment')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ appt_date: APPT_DATE, start_time: '11:00', end_time: '11:15' });

        await request(app)
            .post('/api/appointments/book')
            .set('Authorization', `Bearer ${clientToken}`)
            .send({ appt_date: APPT_DATE, start_time: '11:00' });

        const res = await request(app)
            .post('/api/appointments/cancel')
            .set('Authorization', `Bearer ${clientToken}`)
            .send({ appt_date: APPT_DATE, start_time: '11:00' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('should return 200 when cancelling with no booking (no-op)', async () => {
        const res = await request(app)
            .post('/api/appointments/cancel')
            .set('Authorization', `Bearer ${clientToken}`)
            .send({ appt_date: '2099-01-01', start_time: '08:00' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('should return 401 without auth', async () => {
        const res = await request(app)
            .post('/api/appointments/cancel')
            .send({ appt_date: APPT_DATE, start_time: '11:00' });

        expect(res.status).toBe(401);
    });
});

// ─── Client: Update Own Appointment (cancel + rebook) ────────────────
describe('POST /api/appointments/update-mine (client)', () => {
    it('should cancel old booking and rebook a new slot', async () => {
        // Create two slots
        await request(app)
            .post('/api/appointments/appointment')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ appt_date: APPT_DATE, start_time: '08:00', end_time: '08:15' });
        await request(app)
            .post('/api/appointments/appointment')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ appt_date: APPT_DATE, start_time: '08:15', end_time: '08:30' });

        // Book first slot
        await request(app)
            .post('/api/appointments/book')
            .set('Authorization', `Bearer ${clientToken}`)
            .send({ appt_date: APPT_DATE, start_time: '08:00' });

        // Update to second slot
        const res = await request(app)
            .post('/api/appointments/update-mine')
            .set('Authorization', `Bearer ${clientToken}`)
            .send({
                appt_date: APPT_DATE,
                start_time: '08:00',
                newAppointment: { appt_date: APPT_DATE, start_time: '08:15' }
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('should return 500 when user has no current booking to update', async () => {
        const res = await request(app)
            .post('/api/appointments/update-mine')
            .set('Authorization', `Bearer ${clientToken}`)
            .send({
                appt_date: APPT_DATE,
                start_time: '08:00',
                newAppointment: { appt_date: APPT_DATE, start_time: '08:15' }
            });

        expect(res.status).toBe(500);
        expect(res.body.success).toBe(false);
    });

    it('should return 401 without auth', async () => {
        const res = await request(app)
            .post('/api/appointments/update-mine')
            .send({
                appt_date: APPT_DATE,
                start_time: '08:00',
                newAppointment: { appt_date: APPT_DATE, start_time: '08:15' }
            });

        expect(res.status).toBe(401);
    });
});

// ─── Client: Large Household (30-min booking) ────────────────────────
describe('Booking for household_size >= 4', () => {
    const LARGE_USER = 'appt_large_hh';
    let largeToken;

    beforeAll(async () => {
        await pool.query('DELETE FROM appointment_booking WHERE username = $1', [LARGE_USER]);
        await pool.query('DELETE FROM familymember WHERE username = $1', [LARGE_USER]);
        await pool.query('DELETE FROM account WHERE username = $1', [LARGE_USER]);

        const hashed = await hashPassword(CLIENT_PASS);
        await pool.query(
            `INSERT INTO account (username, user_password, canada_status, household_size, addr, baby_or_pregnant, language_spoken, account_notes)
             VALUES ($1, $2, 'citizen', 5, '789 Large St', false, 'English', 'large household')`,
            [LARGE_USER, hashed]
        );

        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({ username: LARGE_USER, password: CLIENT_PASS });
        largeToken = loginRes.body.token;
    });

    afterAll(async () => {
        await pool.query('DELETE FROM appointment_booking WHERE username = $1', [LARGE_USER]);
        await pool.query('DELETE FROM familymember WHERE username = $1', [LARGE_USER]);
        await pool.query('DELETE FROM account WHERE username = $1', [LARGE_USER]);
    });

    it('should book two consecutive slots (30 min) for large household', async () => {
        // Create two consecutive slots
        await request(app)
            .post('/api/appointments/appointment')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ appt_date: APPT_DATE, start_time: '09:00', end_time: '09:15' });
        await request(app)
            .post('/api/appointments/appointment')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ appt_date: APPT_DATE, start_time: '09:15', end_time: '09:30' });

        const res = await request(app)
            .post('/api/appointments/book')
            .set('Authorization', `Bearer ${largeToken}`)
            .send({ appt_date: APPT_DATE, start_time: '09:00' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.duration).toBe(30);
        expect(res.body.appointment.length).toBe(2);
    });
});
