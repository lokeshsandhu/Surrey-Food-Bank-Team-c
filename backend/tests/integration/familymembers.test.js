const { findFamilyMembersByFName, findFamilyMembersByLName, createFamilyMember, getFamilyMembers, updateFamilyMember, deleteFamilyMember, getOwnerFamilyMembers } = require('../../src/modules/familyMembers/familyMembers.service');
const pool = require('../../src/db/postgres').default;

function normalizeDateOnly(value) {
    if (value == null) return value;
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    if (typeof value === 'string') return value.slice(0, 10);
    return String(value);
}

function expectDobEqual(actualDob, expectedIsoDate) {
    expect(normalizeDateOnly(actualDob)).toBe(expectedIsoDate);
}

describe('familyMembers.service', () => {

    beforeEach(async () => {
        await pool.query('DELETE FROM account WHERE username = $1 OR username = $2', ['testuser', 'otheruser']);
        await pool.query(`INSERT INTO account VALUES ($1, 'password', NULL, NULL, NULL, NULL, NULL, NULL)`, [`testuser`]);
        await pool.query(`INSERT INTO account VALUES ($1, 'password', NULL, NULL, NULL, NULL, NULL, NULL)`, [`otheruser`]);
    });

    afterEach(async () => {
        await pool.query('DELETE FROM account WHERE username = $1 OR username = $2', ['testuser', 'otheruser']);
    })


    afterAll(async () => {
        await pool.end();
    });

    // createFamilyMembers should add a new FM, returns new FM info
    // notes: f_name and l_name are automatically cast to all lowercase
    it('createFamilyMembers should add a new FM', async () => {
        const fmData = {
            username: 'testuser',
            f_name: 'TEST',
            l_name: 'uSeR',
            dob: '1990/01/01',
            phone: '(111) 111-111',
            email: 'email@email.com',
            relationship: 'owner'
        };
        const newMember = await createFamilyMember(fmData);

        expect(newMember).not.toBeNull();
        expect(newMember.username).toBe('testuser');
        expect(newMember.f_name).toBe('test');
        expect(newMember.l_name).toBe('user');
        expectDobEqual(newMember.dob, '1990-01-01');
        expect(newMember.phone).toBe('(111) 111-111');
        expect(newMember.email).toBe('email@email.com');
        expect(newMember.relationship).toBe('owner');
    });

    // createFamilyMembers should add multiple FMs under an account with differing first names, return each new FM info
    it('createFamilyMembers should add multiple family members with differing first names', async () => {
        const fm1Data = {
            username: 'testuser',
            f_name: 'first',
            l_name: 'User',
            dob: '1990/01/01',
            phone: '(111) 111-111',
            email: 'email@email.com',
            relationship: 'owner'
        };
        const fm2Data = {
            username: 'testuser',
            f_name: 'Second',
            l_name: 'User',
            dob: '1990/01/01',
            phone: '(111) 111-111',
            email: 'email@email.com',
            relationship: 'owner'
        };
        const fm3Data = {
            username: 'testuser',
            f_name: 'THIRD',
            l_name: 'User',
            dob: '1990/01/01',
            phone: '(111) 111-111',
            email: 'email@email.com',
            relationship: 'owner'
        };
        const newMember1 = await createFamilyMember(fm1Data);
        const newMember2 = await createFamilyMember(fm2Data);
        const newMember3 = await createFamilyMember(fm3Data);

        expect(newMember1).not.toBeNull();
        expect(newMember1.username).toBe('testuser');
        expect(newMember1.f_name).toBe('first');
        expect(newMember1.l_name).toBe('user');
        expect(newMember2).not.toBeNull();
        expect(newMember2.username).toBe('testuser');
        expect(newMember2.f_name).toBe('second');
        expect(newMember2.l_name).toBe('user');
        expect(newMember3).not.toBeNull();
        expect(newMember3.username).toBe('testuser');
        expect(newMember3.f_name).toBe('third');
        expect(newMember3.l_name).toBe('user');
    });

    // createFamilyMembers should throw an error if adding a FM to account that does not exist
    it('createFamilyMembers should throw an error if adding a FM to account that does not exist', async () => {
        const fmData = {
            username: 'doesnotexist',
            f_name: 'TEST',
            l_name: 'uSeR',
            dob: '1990/01/01',
            phone: '(111) 111-111',
            email: 'email@email.com',
            relationship: 'owner'
        };
    
        await expect(createFamilyMember(fmData)).rejects.toThrow();
    });

    // findFamilyMembersByfName should return all FMs with f_name
    it('findFamilyMembersByFName should find any existing FM by f_name', async () => {
        const fm1Data = {
            username: 'testuser',
            f_name: 'first',
            l_name: 'User',
            dob: '1990/01/01',
            phone: '(111) 111-111',
            email: 'email@email.com',
            relationship: 'owner'
        };
        const fm2Data = {
            username: 'otheruser',
            f_name: 'first',
            l_name: 'Lastname',
            dob: '2000/01/01',
            phone: '(222) 222-222',
            email: 'email@email.com',
            relationship: 'owner'
        };
        const fm3Data = {
            username: 'testuser',
            f_name: 'Third',
            l_name: 'Last',
            dob: '1985/12/12',
            phone: '(333) 333-333',
            email: '123@email.com',
            relationship: 'owner'
        };

        await createFamilyMember(fm1Data);
        await createFamilyMember(fm2Data);
        await createFamilyMember(fm3Data);
        const result = await findFamilyMembersByFName('First');

        expect(result).not.toBeNull();
        expect(result).toHaveLength(2);
        expect(result).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    'username':'testuser', 
                    'f_name':'first'
                })
            ])
        );
        expect(result).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    'username':'otheruser', 
                    'f_name':'first'
                })
            ])
        );
    });

    // findFamilyMembersByFName should return [] if no FM with given first name in any account
    it('findFamilyMembersByFName should return [] if no FM with given f_name', async () => {
        const result = await findFamilyMembersByFName('randomname');

        expect(result).not.toBeNull();
        expect(result).toHaveLength(0);
    });

    // findFamilyMembersByLName should return all FMs with l_name
    it('findFamilyMembersByLName should find any existing FM by l_name', async () => {
        const fm1Data = {
            username: 'testuser',
            f_name: 'first',
            l_name: 'lastname',
            dob: '1990/01/01',
            phone: '(111) 111-111',
            email: 'email@email.com',
            relationship: 'owner'
        };
        const fm2Data = {
            username: 'otheruser',
            f_name: 'second',
            l_name: 'lastname',
            dob: '2000/01/01',
            phone: '(222) 222-222',
            email: 'email@email.com',
            relationship: 'owner'
        };
        const fm3Data = {
            username: 'testuser',
            f_name: 'Third',
            l_name: 'Last',
            dob: '1985/12/12',
            phone: '(333) 333-333',
            email: '123@email.com',
            relationship: 'owner'
        };

        await createFamilyMember(fm1Data);
        await createFamilyMember(fm2Data);
        await createFamilyMember(fm3Data);
        const result = await findFamilyMembersByLName('lastname');

        expect(result).not.toBeNull();
        expect(result).toHaveLength(2);
        expect(result).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    'username':'testuser',
                    'f_name': 'first', 
                    'l_name':'lastname'
                })
            ])
        );
        expect(result).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    'username':'otheruser', 
                    'f_name': 'second',
                    'l_name':'lastname'
                })
            ])
        );
    });

    // findFamilyMembersByLName should return [] if no FM with given last name in any account
    it('findFamilyMembersByLName should return [] if no FM with given l_name', async () => {
        const result = await findFamilyMembersByLName('randomname');

        expect(result).not.toBeNull();
        expect(result).toHaveLength(0);
    });

    
    // getFamilyMembers should return all FMs under given account
    it('getFamilyMembers should return all FMs under given account', async () => {
        const fm1Data = {
            username: 'testuser',
            f_name: 'First',
            l_name: 'User',
            dob: '1990/01/01',
            phone: '(111) 111-111',
            email: 'email@email.com',
            relationship: 'owner'
        };
        const fm2Data = {
            username: 'testuser',
            f_name: 'Second',
            l_name: 'Lastname',
            dob: '2000/11/11',
            phone: '(222) 222-222',
            email: 'abc@def.com',
            relationship: 'owner'
        };
        const fm3Data = {
            username: 'otheruser',
            f_name: 'Third',
            l_name: 'Last',
            dob: '1985/12/12',
            phone: '(333) 333-333',
            email: '123@email.com',
            relationship: 'owner'
        };

        await createFamilyMember(fm1Data);
        await createFamilyMember(fm2Data);
        await createFamilyMember(fm3Data);
        const result = await getFamilyMembers('testuser');

        expect(result).not.toBeNull();
        expect(result).toHaveLength(2);
        expect(result).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    'username': 'testuser',
                    'f_name': 'first',
                    'l_name': 'user',
                })
            ])
        );
        expect(result).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    'username':'testuser', 
                    'f_name': 'second',
                    'l_name':'lastname'
                })
            ])
        );
    });

    // getFamilyMembers should return [] if no FM under given account
    it('getFamilyMembers should return [] if no FM under given account', async () => {
        const result = await getFamilyMembers('testuser');

        expect(result).not.toBeNull();
        expect(result).toHaveLength(0);
    });

    // getFamilyMembers should return [] if account does not exist
    it('getFamilyMembers should return [] if account does not exist', async () => {
        const result = await getFamilyMembers('doesnotexist');

        expect(result).not.toBeNull();
        expect(result).toHaveLength(0);
    });

    // updateFamilyMember should update all fields (except for username) of given FM, return updated FM
    it('updateFamilyMember shoukd update all fields of given FM', async () => {
        const fmData = {
            username: 'testuser',
            f_name: 'First',
            l_name: 'User',
            dob: '1990/01/01',
            phone: '(111) 111-111',
            email: 'email@email.com',
            relationship: 'owner'
        };

        const updateData = {
            f_name: 'NewFirst',
            l_name: 'NewUser',
            dob: '2000/12/12',
            phone: '(222) 222-222',
            email: 'newemail@email.com',
            relationship: 'newRelation'
        };
        
        const initial = await createFamilyMember(fmData);
        expect(initial.username).toBe('testuser');
        expect(initial.f_name).toBe('first');
        expect(initial.l_name).toBe('user');
        expectDobEqual(initial.dob, '1990-01-01');
        expect(initial.phone).toBe('(111) 111-111');
        expect(initial.email).toBe('email@email.com');
        expect(initial.relationship).toBe('owner');

        const result = await updateFamilyMember('testuser', 'first', updateData);
        expect(result).not.toBeNull();
        expect(result.username).toBe('testuser');
        expect(result.f_name).toBe('newfirst');
        expect(result.l_name).toBe('newuser');
        expectDobEqual(result.dob, '2000-12-12');
        expect(result.phone).toBe('(222) 222-222');
        expect(result.email).toBe('newemail@email.com');
        expect(result.relationship).toBe('newRelation');
    });

    // updateFamilyMember should update some fields (except for username) of given FM, return updated FM
    it('updateFamilyMember should update some fields of given FM', async () => {
        const fmData = {
            username: 'testuser',
            f_name: 'First',
            l_name: 'User',
            dob: '1990/01/01',
            phone: '(111) 111-111',
            email: 'email@email.com',
            relationship: 'owner'
        };

        const updateData = {
            l_name: 'NewUser',
            phone: '(222) 222-222',
            relationship: 'newRelation'
        };
        
        const initial = await createFamilyMember(fmData);
        expect(initial.username).toBe('testuser');
        expect(initial.f_name).toBe('first');
        expect(initial.l_name).toBe('user');
        expectDobEqual(initial.dob, '1990-01-01');
        expect(initial.phone).toBe('(111) 111-111');
        expect(initial.email).toBe('email@email.com');
        expect(initial.relationship).toBe('owner');

        const result = await updateFamilyMember('testuser', 'first', updateData);
        expect(result).not.toBeNull();
        expect(initial.username).toBe('testuser');
        expect(initial.f_name).toBe('first');
        expect(result.l_name).toBe('newuser');
        expectDobEqual(initial.dob, '1990-01-01');
        expect(result.phone).toBe('(222) 222-222');
        expect(initial.email).toBe('email@email.com');
        expect(result.relationship).toBe('newRelation');
    });

    // updateFamilyMember should update no fields if updateData is empty, return given FM
    it('updateFamilyMember should update no fields if updateData is empty', async () => {
        const fmData = {
            username: 'testuser',
            f_name: 'First',
            l_name: 'User',
            dob: '1990/01/01',
            phone: '(111) 111-111',
            email: 'email@email.com',
            relationship: 'owner'
        };

        const updateData = {
        };
        
        const initial = await createFamilyMember(fmData);
        expect(initial.username).toBe('testuser');
        expect(initial.f_name).toBe('first');
        expect(initial.l_name).toBe('user');
        expectDobEqual(initial.dob, '1990-01-01');
        expect(initial.phone).toBe('(111) 111-111');
        expect(initial.email).toBe('email@email.com');
        expect(initial.relationship).toBe('owner');

        const result = await updateFamilyMember('testuser', 'first', updateData);
        expect(result).not.toBeNull();
        expect(initial.username).toBe('testuser');
        expect(initial.f_name).toBe('first');
        expect(initial.l_name).toBe('user');
        expectDobEqual(initial.dob, '1990-01-01');
        expect(initial.phone).toBe('(111) 111-111');
        expect(initial.email).toBe('email@email.com');
        expect(initial.relationship).toBe('owner');
    });

    // updateFamilyMember should return null if given FM does not exist
    it('updateFamilyMember should return null if given FM does not exist', async () => {
        const fmData = {
            username: 'testuser',
            f_name: 'First',
            l_name: 'User',
            dob: '1990/01/01',
            phone: '(111) 111-111',
            email: 'email@email.com',
            relationship: 'owner'
        };

        const update = await updateFamilyMember('testuser', 'doesnotexist', fmData);
        expect(update).toBeNull();
    });

    // updateFamilyMember should return null if given account does not exist
    it('updateFamilyMember should return null if given account does not exist', async () => {
        const fmData = {
            username: 'testuser',
            f_name: 'First',
            l_name: 'User',
            dob: '1990/01/01',
            phone: '(111) 111-111',
            email: 'email@email.com',
            relationship: 'owner'
        };

        const update = await updateFamilyMember('doesnotexist', 'first', fmData);
        expect(update).toBeNull();
    });

    // deleteFamilyMember should delete given FM by f_name from given account, return deleted FM info
    it('deleteFamilyMember should delete given FM', async () => {
        const fm1Data = {
            username: 'testuser',
            f_name: 'First',
            l_name: 'User',
            dob: '1990/01/01',
            phone: '(111) 111-111',
            email: 'email@email.com',
            relationship: 'owner'
        };
        const fm2Data = {
            username: 'testuser',
            f_name: 'Second',
            l_name: 'Lastname',
            dob: '2000/11/11',
            phone: '(222) 222-222',
            email: 'abc@def.com',
            relationship: undefined
        };

        await createFamilyMember(fm1Data);
        await createFamilyMember(fm2Data);

        const initial = await getFamilyMembers('testuser');
        expect(initial).toHaveLength(2);
        expect(initial).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    'username': 'testuser',
                    'f_name': 'first',
                    'l_name': 'user',
                })
            ])
        );
        expect(initial).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    'username':'testuser', 
                    'f_name': 'second',
                    'l_name':'lastname'
                })
            ])
        );
        
        const remove = await deleteFamilyMember('testuser', 'first');
        expect(remove).toEqual(expect.objectContaining({
                    'username':'testuser', 
                    'f_name': 'first',
                    'l_name':'user'
                })
            );
    });

    // deleteFamilyMember should return null if given FM does not exist
    it('deleteFamilyMember should return null if given FM does not exist', async () => {
        const remove = await deleteFamilyMember('testuser', 'doesnotexist');
        expect(remove).toBeNull();
    });

    // deleteFamilyMember should return null if given account does not exist
    it('deleteFamilyMember should return null if given account does not exist', async () => {
        const remove = await deleteFamilyMember('doesnotexist', 'first');
        expect(remove).toBeNull();
    });

    // getOwnerFamilyMembers should return all FMs with owner relationship
    it('getOwnerFamilyMembers should return all FMs with owner relationship', async () => {
        const fm1Data = {
            username: 'testuser',
            f_name: 'First',
            l_name: 'User',
            dob: '1990/01/01',
            phone: '(111) 111-111',
            email: 'email@email.com',
            relationship: 'owner'
        };
        const fm2Data = {
            username: 'testuser',
            f_name: 'Second',
            l_name: 'Lastname',
            dob: '2000/11/11',
            phone: '(222) 222-222',
            email: 'abc@def.com',
            relationship: 'Son'
        };
        const fm3Data = {
            username: 'otheruser',
            f_name: 'Third',
            l_name: 'Last',
            dob: '1985/12/12',
            phone: '(333) 333-333',
            email: '123@email.com',
            relationship: 'owner'
        };

        await createFamilyMember(fm1Data);
        await createFamilyMember(fm2Data);
        await createFamilyMember(fm3Data);
        const result = await getOwnerFamilyMembers();
        expect(result).not.toBeNull();
        const ours = result.filter(r => r.username === 'testuser' || r.username === 'otheruser');
        expect(ours).toHaveLength(2);
        expect(ours).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    'username': 'testuser',
                    'f_name': 'first',
                    'l_name': 'user',
                })
            ])
        );
        expect(ours).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    'username':'otheruser', 
                    'f_name': 'third',
                    'l_name':'last'
                })
            ])
        );
    });

    // getOwnerFamilyMembers should return [] if no FMs with owner relationship
    it('getOwnerFamilyMembers should return [] if no FMs with owner relationship', async () => {
        const fm1Data = {
            username: 'testuser',
            f_name: 'First',
            l_name: 'User',
            dob: '1990/01/01',
            phone: '(111) 111-111',
            email: 'email@email.com',
            relationship: 'Main'
        };
        const fm2Data = {
            username: 'testuser',
            f_name: 'Second',
            l_name: 'Lastname',
            dob: '2000/11/11',
            phone: '(222) 222-222',
            email: 'abc@def.com',
            relationship: 'Son'
        };
        const fm3Data = {
            username: 'otheruser',
            f_name: 'Third',
            l_name: 'Last',
            dob: '1985/12/12',
            phone: '(333) 333-333',
            email: '123@email.com',
            relationship: 'other'
        };

        await createFamilyMember(fm1Data);
        await createFamilyMember(fm2Data);
        await createFamilyMember(fm3Data);
        const result = await getOwnerFamilyMembers();

        expect(result).not.toBeNull();
        const ours = result.filter(r => r.username === 'testuser' || r.username === 'otheruser');
        expect(ours).toHaveLength(0);
    });

    // getOwnerFamilyMembers should return [] if no FMs
    it('getOwnerFamilyMembers should return null if no FMs', async () => {
        const result = await getOwnerFamilyMembers();
        expect(result).not.toBeNull();
        const ours = result.filter(r => r.username === 'testuser' || r.username === 'otheruser');
        expect(ours).toHaveLength(0);
    });

    // NOT USED
    // // usernameFamilyMemberExists should return true if FM is in account
    // it('usernameFamilyMemberExists should return true if FM is in account', async () => {
    //     const fm1Data = {
    //         username: 'testuser',
    //         f_name: 'First',
    //         l_name: 'User',
    //         dob: '1990/01/01',
    //         phone: '(111) 111-111',
    //         email: 'email@email.com',
    //         relationship: 'Main'
    //     };

    //     await createFamilyMember(fm1Data);
    //     const result = await usernameFamilyMemberExists('testuser', 'first');
    //     expect(result).toBe(true);
    // });

    // // usernameFamilyMemberExists should return false if FM is not in account
    // it('usernameFamilyMemberExists should return false if FM is not in account', async () => {
    //     const fm1Data = {
    //         username: 'testuser',
    //         f_name: 'First',
    //         l_name: 'User',
    //         dob: '1990/01/01',
    //         phone: '(111) 111-111',
    //         email: 'email@email.com',
    //         relationship: 'Main'
    //     };

    //     await createFamilyMember(fm1Data);
    //     const result = await usernameFamilyMemberExists('otheruser', 'first');
    //     expect(result).toBe(false);
    // });

    // // usernameFamilyMemberExists should return false if FM does not exist
    // it('usernameFamilyMemberExists should return false if FM does not exist', async () => {
    //     const result = await usernameFamilyMemberExists('testuser', 'doesnotexist');
    //     expect(result).toBe(false);
    // });

    // // usernameFamilyMemberExists should return false if account does not exist
    // it('usernameFamilyMemberExists should return false if account does not exist', async () => {
    //     const result = await usernameFamilyMemberExists('doesnotexist', 'first');
    //     expect(result).toBe(false);
    // });
});
