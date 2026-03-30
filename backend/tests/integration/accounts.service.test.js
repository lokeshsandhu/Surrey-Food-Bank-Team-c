const { createAccount, getAccountByUsername, usernameExists, emailExists, getAccountWithPassword, updateAccount, deleteAccount } = require('../../src/modules/accounts/accounts.service');
const pool = require('../../src/db/postgres').default;

describe('accounts.service', () => {
    beforeEach(async () => {
        await pool.query('DELETE FROM familymember WHERE username = $1', ['testuser']);
        await pool.query('DELETE FROM account WHERE username = $1', ['testuser']);
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

        const exists = await emailExists('email@email.com');
        expect(exists).toBe(true);
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

        const exists = await emailExists('  email@email.com  ');
        expect(exists).toBe(true);
    });

    it('emailExists should return false for a non-existing registration email', async () => {
        const exists = await emailExists('missing@email.com');
        expect(exists).toBe(false);
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

    it('updateAccount should update account fields', async () => {
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

    it('deleteAccount should remove the account', async () => {
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
        const deleted = await deleteAccount('testuser');
        expect(deleted).not.toBeNull();
        expect(deleted.username).toBe('testuser');
        const account = await getAccountByUsername('testuser');
        expect(account).toBeNull();
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

    it('deleteAccount should return null for non-existing username', async () => {
        const deleted = await deleteAccount('nonexistentuser');
        expect(deleted).toBeNull();
    });
});
