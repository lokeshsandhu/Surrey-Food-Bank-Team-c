const request = require('supertest');
const app = require('../../src/app').default;
const pool = require('../../src/db/postgres').default;
const { hashPassword } = require('../../src/shared/crypto/password');

const TEST_USER = 'acct_testuser';
const TEST_PASS = 'password123';
const ADMIN_USER = 'admin';

let clientToken;
let adminToken;

beforeAll(async () => {
    // Clean slate
    await pool.query('DELETE FROM appointment_booking WHERE username IN ($1, $2)', [TEST_USER, ADMIN_USER]);
    await pool.query('DELETE FROM familymember WHERE username IN ($1, $2)', [TEST_USER, ADMIN_USER]);
    await pool.query('DELETE FROM account WHERE username IN ($1, $2)', [TEST_USER, ADMIN_USER]);

    // Create admin account for auth
    const hashed = await hashPassword(TEST_PASS);
    await pool.query(
        `INSERT INTO account (username, user_password, canada_status, household_size, addr, baby_or_pregnant, language_spoken, account_notes)
         VALUES ($1, $2, 'citizen', 1, '456 Admin St', false, 'English', 'admin')`,
        [ADMIN_USER, hashed]
    );

    // Get admin token
    const adminRes = await request(app)
        .post('/api/auth/login')
        .send({ username: ADMIN_USER, password: TEST_PASS });
    adminToken = adminRes.body.token;
});

afterAll(async () => {
    await pool.query('DELETE FROM appointment_booking WHERE username IN ($1, $2)', [TEST_USER, ADMIN_USER]);
    await pool.query('DELETE FROM familymember WHERE username IN ($1, $2)', [TEST_USER, ADMIN_USER]);
    await pool.query('DELETE FROM account WHERE username IN ($1, $2)', [TEST_USER, ADMIN_USER]);
    await pool.end();
});

describe('POST /api/accounts', () => {
    afterEach(async () => {
        await pool.query('DELETE FROM account WHERE username = $1', [TEST_USER]);
    });

    it('should create a new account and return 201', async () => {
        const res = await request(app)
            .post('/api/accounts')
            .send({
                username: TEST_USER,
                user_password: TEST_PASS,
                canada_status: 'citizen',
                household_size: 2,
                addr: '123 Main St',
                baby_or_pregnant: false,
                language_spoken: 'English',
                account_notes: 'test'
            });

        expect(res.status).toBe(201);
        expect(res.body.username).toBe(TEST_USER);
        expect(res.body.user_password).toBeUndefined(); // password should not be in RETURNING
    });

    it('should return 500 when creating duplicate username', async () => {
        await request(app)
            .post('/api/accounts')
            .send({
                username: TEST_USER,
                user_password: TEST_PASS,
                canada_status: 'citizen',
                household_size: 1,
                addr: '123 Main St',
                baby_or_pregnant: false,
                language_spoken: 'English',
                account_notes: 'test'
            });

        const res = await request(app)
            .post('/api/accounts')
            .send({
                username: TEST_USER,
                user_password: TEST_PASS,
                canada_status: 'citizen',
                household_size: 1,
                addr: '123 Main St',
                baby_or_pregnant: false,
                language_spoken: 'English',
                account_notes: 'test'
            });

        expect(res.status).toBe(500);
    });
});

describe('GET /api/accounts/exists/:username', () => {
    beforeAll(async () => {
        await pool.query('DELETE FROM account WHERE username = $1', [TEST_USER]);
        const hashed = await hashPassword(TEST_PASS);
        await pool.query(
            `INSERT INTO account (username, user_password, canada_status, household_size, addr, baby_or_pregnant, language_spoken, account_notes)
             VALUES ($1, $2, 'citizen', 1, '123 Main St', false, 'English', 'test')`,
            [TEST_USER, hashed]
        );
    });

    afterAll(async () => {
        await pool.query('DELETE FROM account WHERE username = $1', [TEST_USER]);
    });

    it('should return exists: true for existing username', async () => {
        const res = await request(app)
            .get(`/api/accounts/exists/${TEST_USER}`);

        expect(res.status).toBe(200);
        expect(res.body.exists).toBe(true);
    });

    it('should return exists: false for non-existing username', async () => {
        const res = await request(app)
            .get('/api/accounts/exists/nonexistent_user_xyz');

        expect(res.status).toBe(200);
        expect(res.body.exists).toBe(false);
    });
});

describe('GET /api/accounts/:username', () => {
    beforeAll(async () => {
        await pool.query('DELETE FROM account WHERE username = $1', [TEST_USER]);
        const hashed = await hashPassword(TEST_PASS);
        await pool.query(
            `INSERT INTO account (username, user_password, canada_status, household_size, addr, baby_or_pregnant, language_spoken, account_notes)
             VALUES ($1, $2, 'citizen', 2, '123 Main St', false, 'English', 'test')`,
            [TEST_USER, hashed]
        );

        // Get client token
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({ username: TEST_USER, password: TEST_PASS });
        clientToken = loginRes.body.token;
    });

    afterAll(async () => {
        await pool.query('DELETE FROM account WHERE username = $1', [TEST_USER]);
    });

    it('should return 401 without authentication', async () => {
        const res = await request(app)
            .get(`/api/accounts/${TEST_USER}`);

        expect(res.status).toBe(401);
    });

    it('should return account data with valid token', async () => {
        const res = await request(app)
            .get(`/api/accounts/${TEST_USER}`)
            .set('Authorization', `Bearer ${clientToken}`);

        expect(res.status).toBe(200);
        expect(res.body.username).toBe(TEST_USER);
        expect(res.body.household_size).toBe(2);
    });

    it('should return 404 for non-existent account', async () => {
        const res = await request(app)
            .get('/api/accounts/nonexistent_user_xyz')
            .set('Authorization', `Bearer ${clientToken}`);

        expect(res.status).toBe(404);
    });
});

describe('PATCH /api/accounts/:username', () => {
    beforeAll(async () => {
        await pool.query('DELETE FROM account WHERE username = $1', [TEST_USER]);
        const hashed = await hashPassword(TEST_PASS);
        await pool.query(
            `INSERT INTO account (username, user_password, canada_status, household_size, addr, baby_or_pregnant, language_spoken, account_notes)
             VALUES ($1, $2, 'citizen', 2, '123 Main St', false, 'English', 'test')`,
            [TEST_USER, hashed]
        );
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({ username: TEST_USER, password: TEST_PASS });
        clientToken = loginRes.body.token;
    });

    afterAll(async () => {
        await pool.query('DELETE FROM account WHERE username = $1', [TEST_USER]);
    });

    it('should return 401 without authentication', async () => {
        const res = await request(app)
            .patch(`/api/accounts/${TEST_USER}`)
            .send({ household_size: 5 });

        expect(res.status).toBe(401);
    });

    it('should update account fields', async () => {
        const res = await request(app)
            .patch(`/api/accounts/${TEST_USER}`)
            .set('Authorization', `Bearer ${clientToken}`)
            .send({ household_size: 5, account_notes: 'updated' });

        expect(res.status).toBe(200);
        expect(res.body.household_size).toBe(5);
        expect(res.body.account_notes).toBe('updated');
    });

    it('should return 404 for non-existent account', async () => {
        const res = await request(app)
            .patch('/api/accounts/nonexistent_user_xyz')
            .set('Authorization', `Bearer ${clientToken}`)
            .send({ household_size: 5 });

        expect(res.status).toBe(404);
    });
});

// NOT USED
// describe('DELETE /api/accounts/:username', () => {
//     beforeEach(async () => {
//         await pool.query('DELETE FROM account WHERE username = $1', [TEST_USER]);
//         const hashed = await hashPassword(TEST_PASS);
//         await pool.query(
//             `INSERT INTO account (username, user_password, canada_status, household_size, addr, baby_or_pregnant, language_spoken, account_notes)
//              VALUES ($1, $2, 'citizen', 1, '123 Main St', false, 'English', 'test')`,
//             [TEST_USER, hashed]
//         );
//         const loginRes = await request(app)
//             .post('/api/auth/login')
//             .send({ username: TEST_USER, password: TEST_PASS });
//         clientToken = loginRes.body.token;
//     });

//     afterEach(async () => {
//         await pool.query('DELETE FROM account WHERE username = $1', [TEST_USER]);
//     });

//     it('should return 401 without authentication', async () => {
//         const res = await request(app)
//             .delete(`/api/accounts/${TEST_USER}`);

//         expect(res.status).toBe(401);
//     });

//     it('should return 403 for non-admin users', async () => {
//         const res = await request(app)
//             .delete(`/api/accounts/${TEST_USER}`)
//             .set('Authorization', `Bearer ${clientToken}`);

//         expect(res.status).toBe(403);
//     });

//     it('should delete account when admin', async () => {
//         const res = await request(app)
//             .delete(`/api/accounts/${TEST_USER}`)
//             .set('Authorization', `Bearer ${adminToken}`);

//         expect(res.status).toBe(200);
//         expect(res.body.message).toBe('Account deleted');
//         expect(res.body.username).toBe(TEST_USER);
//     });

//     it('should return 404 when deleting non-existent account', async () => {
//         const res = await request(app)
//             .delete('/api/accounts/nonexistent_user_xyz')
//             .set('Authorization', `Bearer ${adminToken}`);

//         expect(res.status).toBe(404);
//     });
// });
