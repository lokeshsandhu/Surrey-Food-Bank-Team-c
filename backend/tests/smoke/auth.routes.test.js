const request = require('supertest');
const app = require('../../src/app').default;
const pool = require('../../src/db/postgres').default;
const { hashPassword } = require('../../src/shared/crypto/password');
const { encryptForDb } = require('../../src/shared/crypto/dbFieldEncryption');
const { hashEmailForLookup } = require('../../src/shared/crypto/emailLookup');

const TEST_USER = 'auth_testuser';
const TEST_PASS = 'password123';
const ADMIN_USER = 'admin';
const TEST_EMAIL = 'auth_testuser@example.com';
const ADMIN_EMAIL = 'admin@surreyfoodbank.com';

beforeAll(async () => {
    await pool.query('DELETE FROM appointment_booking WHERE username IN ($1, $2)', [TEST_USER, ADMIN_USER]);
    await pool.query('DELETE FROM familymember WHERE username IN ($1, $2)', [TEST_USER, ADMIN_USER]);
    await pool.query('DELETE FROM account WHERE username IN ($1, $2)', [TEST_USER, ADMIN_USER]);

    const hashed = await hashPassword(TEST_PASS);
    await pool.query(
        `INSERT INTO account (username, user_password, canada_status, household_size, addr, baby_or_pregnant, language_spoken, account_notes)
         VALUES ($1, $2, 'citizen', 1, '123 Main St', false, 'English', 'none')`,
        [TEST_USER, hashed]
    );
    await pool.query(
        `INSERT INTO familymember (username, f_name, l_name, dob, phone, email, relationship, email_lookup_hash)
         VALUES ($1, 'Auth', 'Tester', '1990-01-01', $2, $3, 'owner', $4)`,
        [
            TEST_USER,
            encryptForDb('familymember', 'phone', '111-111-1111'),
            encryptForDb('familymember', 'email', TEST_EMAIL),
            hashEmailForLookup(TEST_EMAIL)
        ]
    );
    await pool.query(
        `INSERT INTO account (username, user_password, canada_status, household_size, addr, baby_or_pregnant, language_spoken, account_notes)
         VALUES ($1, $2, 'citizen', 1, '456 Admin St', false, 'English', 'admin account')`,
        [ADMIN_USER, hashed]
    );
    await pool.query(
        `INSERT INTO familymember (username, f_name, l_name, dob, phone, email, relationship, email_lookup_hash)
         VALUES ($1, 'Admin', 'Account', '1990-01-01', $2, $3, 'owner', $4)`,
        [
            ADMIN_USER,
            encryptForDb('familymember', 'phone', '222-222-2222'),
            encryptForDb('familymember', 'email', ADMIN_EMAIL),
            hashEmailForLookup(ADMIN_EMAIL)
        ]
    );
});

afterAll(async () => {
    await pool.query('DELETE FROM appointment_booking WHERE username IN ($1, $2)', [TEST_USER, ADMIN_USER]);
    await pool.query('DELETE FROM familymember WHERE username IN ($1, $2)', [TEST_USER, ADMIN_USER]);
    await pool.query('DELETE FROM account WHERE username IN ($1, $2)', [TEST_USER, ADMIN_USER]);
    await pool.end();
});

describe('POST /api/auth/login', () => {
    it('should return 400 if username or password is missing', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ username: TEST_USER });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('should return 401 for invalid credentials', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ username: TEST_USER, password: 'wrongpassword' });

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
    });

    it('should return 401 for non-existent user', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ username: 'nonexistent_user', password: TEST_PASS });

        expect(res.status).toBe(401);
    });

    it('should return 200 with token for valid client credentials', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ username: TEST_USER, password: TEST_PASS });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.role).toBe('client');
        expect(res.body.token).toBeDefined();
    });

    it('should return 200 when logging in with client email', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ identifier: TEST_EMAIL, password: TEST_PASS });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.role).toBe('client');
        expect(res.body.username).toBe(TEST_USER);
        expect(res.body.token).toBeDefined();
    });

    it('should return 200 with admin role for admin user', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ username: ADMIN_USER, password: TEST_PASS });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.role).toBe('admin');
        expect(res.body.token).toBeDefined();
    });

    it('should return 200 when logging in with admin email', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ identifier: ADMIN_EMAIL, password: TEST_PASS });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.role).toBe('admin');
        expect(res.body.username).toBe(ADMIN_USER);
        expect(res.body.token).toBeDefined();
    });
});

describe('POST /api/auth/me', () => {
    let clientToken;
    let adminToken;

    beforeAll(async () => {
        const clientRes = await request(app)
            .post('/api/auth/login')
            .send({ username: TEST_USER, password: TEST_PASS });
        clientToken = clientRes.body.token;

        const adminRes = await request(app)
            .post('/api/auth/login')
            .send({ username: ADMIN_USER, password: TEST_PASS });
        adminToken = adminRes.body.token;
    });

    it('should return 401 without token', async () => {
        const res = await request(app).post('/api/auth/me');
        expect(res.status).toBe(401);
    });

    it('should return 401 with invalid token', async () => {
        const res = await request(app)
            .post('/api/auth/me')
            .set('Authorization', 'Bearer invalidtoken');
        expect(res.status).toBe(401);
    });

    it('should return user info for valid client token', async () => {
        const res = await request(app)
            .post('/api/auth/me')
            .set('Authorization', `Bearer ${clientToken}`);

        expect(res.status).toBe(200);
        expect(res.body.username).toBe(TEST_USER);
        expect(res.body.role).toBe('client');
    });

    it('should return admin info for valid admin token', async () => {
        const res = await request(app)
            .post('/api/auth/me')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.username).toBe(ADMIN_USER);
        expect(res.body.role).toBe('admin');
    });
});
