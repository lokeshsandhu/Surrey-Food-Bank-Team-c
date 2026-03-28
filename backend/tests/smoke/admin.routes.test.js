const request = require('supertest');
const app = require('../../src/app').default;
const pool = require('../../src/db/postgres').default;
const { hashPassword } = require('../../src/shared/crypto/password');

const CLIENT_USER = 'admin_test_client';
const CLIENT_PASS = 'password123';
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'password123';
const APPT_DATE = '2026-03-11';

let clientToken;
let adminToken;

beforeAll(async () => {
    await pool.query('DELETE FROM appointment_booking WHERE username IN ($1, $2)', [CLIENT_USER, ADMIN_USER]);
    await pool.query('DELETE FROM appointment_slot WHERE appt_date = $1', [APPT_DATE]);
    await pool.query('DELETE FROM familymember WHERE username IN ($1, $2)', [CLIENT_USER, ADMIN_USER]);
    await pool.query('DELETE FROM account WHERE username IN ($1, $2)', [CLIENT_USER, ADMIN_USER]);

    const hashed = await hashPassword(ADMIN_PASS);

    await pool.query(
        `INSERT INTO account (username, user_password, canada_status, household_size, addr, baby_or_pregnant, language_spoken, account_notes)
         VALUES ($1, $2, 'citizen', 1, '456 Admin St', false, 'English', 'admin')`,
        [ADMIN_USER, hashed]
    );

    await pool.query(
        `INSERT INTO account (username, user_password, canada_status, household_size, addr, baby_or_pregnant, language_spoken, account_notes)
         VALUES ($1, $2, 'citizen', 3, '123 Client St', false, 'English', 'client notes')`,
        [CLIENT_USER, hashed]
    );

    // Add family members for the client
    await pool.query(
        `INSERT INTO familymember (username, f_name, l_name, dob, phone, email, relationship)
         VALUES ($1, 'jane', 'doe', '1985-05-20', '555-1111', 'jane@test.com', 'owner')`,
        [CLIENT_USER]
    );
    await pool.query(
        `INSERT INTO familymember (username, f_name, l_name, dob, phone, email, relationship)
         VALUES ($1, 'kid', 'doe', '2015-09-10', '555-2222', null, 'child')`,
        [CLIENT_USER]
    );

    // Create and book an appointment for the client
    await pool.query(
        `INSERT INTO appointment_slot (appt_date, start_time, end_time, appt_notes)
         VALUES ($1, '10:00', '10:15', 'client appt')`,
        [APPT_DATE]
    );
    await pool.query(
        `INSERT INTO appointment_booking (appt_date, start_time, username)
         VALUES ($1, '10:00', $2)`,
        [APPT_DATE, CLIENT_USER]
    );

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
    await pool.query('DELETE FROM appointment_slot WHERE appt_date = $1', [APPT_DATE]);
    await pool.query('DELETE FROM familymember WHERE username IN ($1, $2)', [CLIENT_USER, ADMIN_USER]);
    await pool.query('DELETE FROM account WHERE username IN ($1, $2)', [CLIENT_USER, ADMIN_USER]);
    await pool.end();
});

// ─── GET /api/admin/clients ──────────────────────────────────────────
describe('GET /api/admin/clients', () => {
    it('should return 401 without auth', async () => {
        const res = await request(app).get('/api/admin/clients');
        expect(res.status).toBe(401);
    });

    it('should return 403 for non-admin', async () => {
        const res = await request(app)
            .get('/api/admin/clients')
            .set('Authorization', `Bearer ${clientToken}`);
        expect(res.status).toBe(403);
    });

    it('should return all clients for admin', async () => {
        const res = await request(app)
            .get('/api/admin/clients')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        const usernames = res.body.map(c => c.username);
        expect(usernames).toContain(CLIENT_USER);
    });
});

// ─── GET /api/admin/clients/:username ────────────────────────────────
describe('GET /api/admin/clients/:username', () => {
    it('should return 401 without auth', async () => {
        const res = await request(app).get(`/api/admin/clients/${CLIENT_USER}`);
        expect(res.status).toBe(401);
    });

    it('should return 403 for non-admin', async () => {
        const res = await request(app)
            .get(`/api/admin/clients/${CLIENT_USER}`)
            .set('Authorization', `Bearer ${clientToken}`);
        expect(res.status).toBe(403);
    });

    it('should return client details with family members and appointments', async () => {
        const res = await request(app)
            .get(`/api/admin/clients/${CLIENT_USER}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.username).toBe(CLIENT_USER);
        expect(res.body.household_size).toBe(3);
        expect(Array.isArray(res.body.family_members)).toBe(true);
        expect(res.body.family_members.length).toBe(2);
        expect(Array.isArray(res.body.appointments)).toBe(true);
        expect(res.body.appointments.length).toBeGreaterThanOrEqual(1);
    });

    it('should return 404 for non-existent client', async () => {
        const res = await request(app)
            .get('/api/admin/clients/nonexistent_user_xyz')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(404);
    });
});

// ─── GET /api/admin/appointments ─────────────────────────────────────
describe('GET /api/admin/appointments', () => {
    it('should return 401 without auth', async () => {
        const res = await request(app).get('/api/admin/appointments');
        expect(res.status).toBe(401);
    });

    it('should return 403 for non-admin', async () => {
        const res = await request(app)
            .get('/api/admin/appointments')
            .set('Authorization', `Bearer ${clientToken}`);
        expect(res.status).toBe(403);
    });

    it('should return all appointments for admin', async () => {
        const res = await request(app)
            .get('/api/admin/appointments')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThanOrEqual(1);
    });
});
