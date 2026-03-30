const { createAccount, getAccountByUsername, usernameExists, emailExists, getAccountWithPassword, updateAccount } = require('../../src/modules/accounts/accounts.service');
const pool = require('../../src/db/postgres').default;

describe('accounts.service', () => {
    beforeEach(async () => {
        await pool.query('DELETE FROM account WHERE username = $1 OR username = $2', ['testuser', 'updatedtestuser']);
        await pool.query('DELETE FROM familymember WHERE username = $1', ['testuser']);
    });

    afterAll(async () => {
        await pool.end();
    });

    it('createAccount should throw an error if username is already taken', async () => {
        const accountData = {
            username: 'testuser',
            user_password: 'password123',
            canada_status: 'citizen',
            household_size: 1,
            addr: '123 Main St',
            baby_or_pregnant: false,
            language_spoken: 'English',
            account_notes: 'none'
        };
        await createAccount(accountData);
        await expect(createAccount(accountData)).rejects.toThrow();
    });

    it('getAccountByUsername should return account data', async () => {
        const accountData = {
            username: 'testuser',
            user_password: 'password123',
            canada_status: 'citizen',
            household_size: 1,
            addr: '123 Main St',
            baby_or_pregnant: false,
            language_spoken: 'English',
            account_notes: 'none'
        };
        await createAccount(accountData);
        const account = await getAccountByUsername('testuser');
        expect(account).not.toBeNull();
        expect(account.username).toBe('testuser');
    });

    it('usernameExists should return true for existing username', async () => {
        const accountData = {
            username: 'testuser',
            user_password: 'password123',
            canada_status: 'citizen',
            household_size: 1,
            addr: '123 Main St',
            baby_or_pregnant: false,
            language_spoken: 'English',
            account_notes: 'none'
        };
        await createAccount(accountData);
        const exists = await usernameExists('testuser');
        expect(exists).toBe(true);
    });

    it('usernameExists should return false for non-existing username', async () => {
        const exists = await usernameExists('nonexistentuser');
        expect(exists).toBe(false);
    });

    it('emailExists should return true for an existing registration email', async () => {
        const accountData = {
            username: 'testuser',
            user_password: 'password123',
            canada_status: 'citizen',
            household_size: 1,
            addr: '123 Main St',
            baby_or_pregnant: false,
            language_spoken: 'English',
            account_notes: 'none'
        };
        await createAccount(accountData);
        await pool.query(
            `INSERT INTO familymember (username, f_name, l_name, email, relationship)
             VALUES ($1, 'owner', 'user', 'email@email.com', 'owner')`,
            ['testuser']
        );

        const result = await emailExists('email@email.com');
        expect(result).toEqual({ exists: true, is_family_member: null });
    });

    it('emailExists should return true for a case-insensitive trimmed match', async () => {
        const accountData = {
            username: 'testuser',
            user_password: 'password123',
            canada_status: 'citizen',
            household_size: 1,
            addr: '123 Main St',
            baby_or_pregnant: false,
            language_spoken: 'English',
            account_notes: 'none'
        };
        await createAccount(accountData);
        await pool.query(
            `INSERT INTO familymember (username, f_name, l_name, email, relationship)
             VALUES ($1, 'owner', 'user', 'Email@Email.com', 'owner')`,
            ['testuser']
        );

        const result = await emailExists('  email@email.com  ');
        expect(result).toEqual({ exists: true, is_family_member: null });
    });

    it('emailExists should return false for a non-existing registration email', async () => {
        const result = await emailExists('missing@email.com');
        expect(result).toEqual({ exists: false, is_family_member: null });
    });

    it('emailExists should identify the same family member when username and id match', async () => {
        const accountData = {
            username: 'testuser',
            user_password: 'password123',
            canada_status: 'citizen',
            household_size: 1,
            addr: '123 Main St',
            baby_or_pregnant: false,
            language_spoken: 'English',
            account_notes: 'none'
        };
        await createAccount(accountData);
        const insertResult = await pool.query(
            `INSERT INTO familymember (username, f_name, l_name, email, relationship)
             VALUES ($1, 'owner', 'user', 'email@email.com', 'owner')
             RETURNING id`,
            ['testuser']
        );

        const result = await emailExists('email@email.com', 'testuser', insertResult.rows[0].id);
        expect(result).toEqual({ exists: true, is_family_member: true });
    });

    it('emailExists should identify a different family member when username and id do not match', async () => {
        const accountData = {
            username: 'testuser',
            user_password: 'password123',
            canada_status: 'citizen',
            household_size: 1,
            addr: '123 Main St',
            baby_or_pregnant: false,
            language_spoken: 'English',
            account_notes: 'none'
        };
        await createAccount(accountData);
        await pool.query(
            `INSERT INTO familymember (username, f_name, l_name, email, relationship)
             VALUES ($1, 'owner', 'user', 'email@email.com', 'owner')`,
            ['testuser']
        );

        const result = await emailExists('email@email.com', 'otheruser', 999);
        expect(result).toEqual({ exists: true, is_family_member: false });
    });

    it('getAccountWithPassword should return username and password', async () => {
        const accountData = {
            username: 'testuser',
            user_password: 'password123',
            canada_status: 'citizen',
            household_size: 1,
            addr: '123 Main St',
            baby_or_pregnant: false,
            language_spoken: 'English',
            account_notes: 'none'
        };
        await createAccount(accountData);
        const account = await getAccountWithPassword('testuser');
        expect(account).not.toBeNull();
        expect(account.username).toBe('testuser');
        expect(account.user_password).toBeDefined();
    });

    it('updateAccount should update all account fields', async () => {
        const accountData = {
            username: 'testuser',
            user_password: 'password123',
            canada_status: 'citizen',
            household_size: 1,
            addr: '123 Main St',
            baby_or_pregnant: false,
            language_spoken: 'English',
            account_notes: 'none'
        };
        const original = await createAccount(accountData);
        expect(original.username).toBe('testuser');
        expect(original.canada_status).toBe('citizen');
        expect(original.household_size).toBe(1);
        expect(original.addr).toBe('123 Main St');
        expect(original.baby_or_pregnant).toBe(false);
        expect(original.language_spoken).toBe('English');
        expect(original.account_notes).toBe('none');

        const updateData = {
            username: 'updatedtestuser',
            canada_status: 'Permanent Resident',
            household_size: 4,
            addr: 'abc',
            baby_or_pregnant: true,
            language_spoken: 'Spanish',
            account_notes: 'updated'
        }
        const updated = await updateAccount('testuser', updateData);
        expect(updated.username).toBe('updatedtestuser');
        expect(updated.canada_status).toBe('Permanent Resident');
        expect(updated.household_size).toBe(4);
        expect(updated.addr).toBe('abc');
        expect(updated.baby_or_pregnant).toBe(true);
        expect(updated.language_spoken).toBe('Spanish');
        expect(updated.account_notes).toBe('updated');
    });

    it('updateAccount should update select account fields', async () => {
        const accountData = {
            username: 'testuser',
            user_password: 'password123',
            canada_status: 'citizen',
            household_size: 1,
            addr: '123 Main St',
            baby_or_pregnant: false,
            language_spoken: 'English',
            account_notes: 'none'
        };
        await createAccount(accountData);
        const updated = await updateAccount('testuser', { household_size: 4, account_notes: 'updated' });
        expect(updated.household_size).toBe(4);
        expect(updated.account_notes).toBe('updated');
    });

    it('getAccountByUsername should return null for non-existing username', async () => {
        const account = await getAccountByUsername('nonexistentuser');
        expect(account).toBeNull();
    });

    it('getAccountWithPassword should return null for non-existing username', async () => {
        const account = await getAccountWithPassword('nonexistentuser');
        expect(account).toBeNull();
    });

    it('updateAccount should return null for non-existing username', async () => {
        const updated = await updateAccount('nonexistentuser', { household_size: 5 });
        expect(updated).toBeNull();
    });

});
