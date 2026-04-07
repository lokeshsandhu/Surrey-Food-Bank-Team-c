const request = require('supertest');
const app = require('../../src/app').default;
const pool = require('../../src/db/postgres').default;
const { hashPassword } = require('../../src/shared/crypto/password');

const CLIENT_USER = 'fm_testuser';
const CLIENT_PASS = 'password123';
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'password123';

let clientToken;
let adminToken;

beforeAll(async () => {
    await pool.query('DELETE FROM appointment_booking WHERE username IN ($1, $2)', [CLIENT_USER, ADMIN_USER]);
    await pool.query('DELETE FROM familymember WHERE username IN ($1, $2)', [CLIENT_USER, ADMIN_USER]);
    await pool.query('DELETE FROM account WHERE username IN ($1, $2)', [CLIENT_USER, ADMIN_USER]);

    const hashed = await hashPassword(CLIENT_PASS);

    await pool.query(
        `INSERT INTO account (username, user_password, canada_status, household_size, addr, baby_or_pregnant, language_spoken, account_notes)
         VALUES ($1, $2, 'citizen', 1, '456 Admin St', false, 'English', 'admin')`,
        [ADMIN_USER, hashed]
    );

    await pool.query(
        `INSERT INTO account (username, user_password, canada_status, household_size, addr, baby_or_pregnant, language_spoken, account_notes)
         VALUES ($1, $2, 'citizen', 2, '123 Main St', false, 'English', 'client')`,
        [CLIENT_USER, hashed]
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
    await pool.query('DELETE FROM familymember WHERE username IN ($1, $2)', [CLIENT_USER, ADMIN_USER]);
    await pool.query('DELETE FROM account WHERE username IN ($1, $2)', [CLIENT_USER, ADMIN_USER]);
    await pool.end();
});

beforeEach(async () => {
    await pool.query('DELETE FROM familymember WHERE username = $1', [CLIENT_USER]);
});

// ─── Create Family Member ────────────────────────────────────────────
describe('POST /api/family-members', () => {
    it('should return 401 without auth', async () => {
        const res = await request(app)
            .post('/api/family-members')
            .send({ username: CLIENT_USER, f_name: 'John', l_name: 'Doe' });

        expect(res.status).toBe(401);
    });

    it('should create a family member', async () => {
        const res = await request(app)
            .post('/api/family-members')
            .set('Authorization', `Bearer ${clientToken}`)
            .send({
                username: CLIENT_USER,
                f_name: 'John',
                l_name: 'Doe',
                dob: '1990-01-15',
                phone: '555-1234',
                email: 'john@example.com',
                relationship: 'owner'
            });

        expect(res.status).toBe(201);
        expect(res.body.f_name).toBe('John');
        expect(res.body.l_name).toBe('Doe');
        expect(res.body.username).toBe(CLIENT_USER);
    });
});

// ─── Get Family Members by Username ──────────────────────────────────
describe('GET /api/family-members/:username', () => {
    beforeEach(async () => {
        await pool.query('DELETE FROM familymember WHERE username = $1', [CLIENT_USER]);
        await request(app)
            .post('/api/family-members')
            .set('Authorization', `Bearer ${clientToken}`)
            .send({ username: CLIENT_USER, f_name: 'Alice', l_name: 'Smith', relationship: 'child' });
        await request(app)
            .post('/api/family-members')
            .set('Authorization', `Bearer ${clientToken}`)
            .send({ username: CLIENT_USER, f_name: 'Bob', l_name: 'Smith', relationship: 'spouse' });
    });

    it('should return 401 without auth', async () => {
        const res = await request(app)
            .get(`/api/family-members/${CLIENT_USER}`);

        expect(res.status).toBe(401);
    });

    it('should return all family members for a username', async () => {
        const res = await request(app)
            .get(`/api/family-members/${CLIENT_USER}`)
            .set('Authorization', `Bearer ${clientToken}`);

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(2);
    });

    it('should return empty array for user with no family members', async () => {
        const res = await request(app)
            .get(`/api/family-members/${ADMIN_USER}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(0);
    });
});

// ─── Update Family Member ────────────────────────────────────────────
describe('PUT /api/family-members/:username/:f_name', () => {
    beforeEach(async () => {
        await pool.query('DELETE FROM familymember WHERE username = $1', [CLIENT_USER]);
        await request(app)
            .post('/api/family-members')
            .set('Authorization', `Bearer ${clientToken}`)
            .send({ username: CLIENT_USER, f_name: 'Alice', l_name: 'Smith', phone: '555-0000', relationship: 'child' });
    });

    it('should return 401 without auth', async () => {
        const res = await request(app)
            .put(`/api/family-members/${CLIENT_USER}/alice`)
            .send({ phone: '555-9999' });

        expect(res.status).toBe(401);
    });

    it('should update family member fields', async () => {
        const res = await request(app)
            .put(`/api/family-members/${CLIENT_USER}/alice`)
            .set('Authorization', `Bearer ${clientToken}`)
            .send({ phone: '555-9999', email: 'alice@new.com' });

        expect(res.status).toBe(200);
        expect(res.body.phone).toBe('555-9999');
        expect(res.body.email).toBe('alice@new.com');
    });

    it('should return 404 for non-existent family member', async () => {
        const res = await request(app)
            .put(`/api/family-members/${CLIENT_USER}/nonexistent`)
            .set('Authorization', `Bearer ${clientToken}`)
            .send({ phone: '555-9999' });

        expect(res.status).toBe(404);
    });
});

// ─── Delete Family Member ────────────────────────────────────────────
describe('DELETE /api/family-members/:username/:f_name', () => {
    beforeEach(async () => {
        await pool.query('DELETE FROM familymember WHERE username = $1', [CLIENT_USER]);
        await request(app)
            .post('/api/family-members')
            .set('Authorization', `Bearer ${clientToken}`)
            .send({ username: CLIENT_USER, f_name: 'Alice', l_name: 'Smith', relationship: 'child' });
    });

    it('should return 401 without auth', async () => {
        const res = await request(app)
            .delete(`/api/family-members/${CLIENT_USER}/alice`);

        expect(res.status).toBe(401);
    });

    it('should delete a family member', async () => {
        const res = await request(app)
            .delete(`/api/family-members/${CLIENT_USER}/alice`)
            .set('Authorization', `Bearer ${clientToken}`);

        expect(res.status).toBe(200);
        expect(res.body.f_name).toBe('Alice');
    });

    it('should return 404 for non-existent family member', async () => {
        const res = await request(app)
            .delete(`/api/family-members/${CLIENT_USER}/nonexistent`)
            .set('Authorization', `Bearer ${clientToken}`);

        expect(res.status).toBe(404);
    });
});

// ─── Get Owner Family Members ────────────────────────────────────────
describe('GET /api/family-members/owners', () => {
    beforeEach(async () => {
        await pool.query('DELETE FROM familymember WHERE username = $1', [CLIENT_USER]);
        await request(app)
            .post('/api/family-members')
            .set('Authorization', `Bearer ${clientToken}`)
            .send({ username: CLIENT_USER, f_name: 'Owner1', l_name: 'Test', relationship: 'owner' });
        await request(app)
            .post('/api/family-members')
            .set('Authorization', `Bearer ${clientToken}`)
            .send({ username: CLIENT_USER, f_name: 'Child1', l_name: 'Test', relationship: 'child' });
    });

    it('should return only family members with relationship = owner', async () => {
        const res = await request(app)
            .get('/api/family-members/owners')
            .set('Authorization', `Bearer ${clientToken}`);

        expect(res.status).toBe(200);
        const ours = res.body.filter(m => m.username === CLIENT_USER);
        expect(ours.length).toBe(1);
        expect(ours[0].relationship).toBe('owner');
    });
});


// ─── Search by First/Last Name (admin only) ──────────────────────────
describe('GET /api/family-members/search/* (admin search)', () => {
    beforeEach(async () => {
        await pool.query('DELETE FROM familymember WHERE username = $1', [CLIENT_USER]);
        await request(app)
            .post('/api/family-members')
            .set('Authorization', `Bearer ${clientToken}`)
            .send({ username: CLIENT_USER, f_name: 'SearchFirst', l_name: 'SearchLast', relationship: 'child' });
    });

    it('should return 403 for non-admin searching by first name', async () => {
        const res = await request(app)
            .get('/api/family-members/search/by-fname')
            .query({ f_name: 'searchfirst' })
            .set('Authorization', `Bearer ${clientToken}`);

        expect(res.status).toBe(403);
    });

    it('should find family members by first name (admin)', async () => {
        const res = await request(app)
            .get('/api/family-members/search/by-fname')
            .query({ f_name: 'searchfirst' })
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.length).toBeGreaterThanOrEqual(1);
        expect(res.body[0].f_name).toBe('SearchFirst');
    });

    it('should find family members by last name (admin)', async () => {
        const res = await request(app)
            .get('/api/family-members/search/by-lname')
            .query({ l_name: 'searchlast' })
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.length).toBeGreaterThanOrEqual(1);
        expect(res.body[0].l_name).toBe('SearchLast');
    });

    it('should return 400 if f_name query param missing', async () => {
        const res = await request(app)
            .get('/api/family-members/search/by-fname')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(400);
    });

    it('should return 400 if l_name query param missing', async () => {
        const res = await request(app)
            .get('/api/family-members/search/by-lname')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(400);
    });
});
