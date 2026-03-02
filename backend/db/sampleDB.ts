// initializes database with sample data set
// run with 'ts-node sampleDB.ts'

import * as account from "../src/modules/accounts/accounts.service";
import * as familymember from "../src/modules/familyMembers/familyMembers.service";
import * as appointment from "../src/modules/appointments/appointments.service";

// sample admin account
async function sampleAdminData(){
    const adminAccount = {
        username: 'admin',
        user_password: 'adminPassword#123',
        canada_status: undefined,
        household_size: undefined,
        addr: undefined,
        baby_or_pregnant: undefined,
        language_spoken: undefined,
        account_notes: 'Admin account'
    }

    await account.createAccount(adminAccount);
}

// sample account and family members for Jane Doe user persona
async function sampleJaneData(){
    const janeAccount = {
        username: 'jane123',
        user_password: 'Password1!',
        canada_status: 'Canadian Citizen',
        household_size: 4,
        addr: '123 ave, , surrey, BC, V1M 3B5',
        baby_or_pregnant: true,
        language_spoken: 'English and Spanish',
        account_notes: 'Sample account for Jane Doe'
    }

    const janeFM = {
        username: 'jane123',
        f_name: 'Jane',
        l_name: 'Doe',
        dob: '1990/01/01',
        phone: '(111) 111-1111',
        email: 'jane@email.com',
        relationship: 'owner',
    }

    const jimFM = {
        username: 'jane123',
        f_name: 'Jim',
        l_name: 'Doe',
        dob: '2010/01/01',
        phone: '(111) 111-1111',
        email: 'jim@email.com',
        relationship: 'Son',
    }

    const jillFM = {
        username: 'jane123',
        f_name: 'Jill',
        l_name: 'Doe',
        dob: '2012/12/01',
        phone: '(111) 111-1111',
        email: 'jill@email.com',
        relationship: 'Daughter',
    }

    const jessFM = {
        username: 'jane123',
        f_name: 'Jess',
        l_name: 'Doe',
        dob: '2026/01/01',
        phone: '(111) 111-1111',
        email: 'jane@email.com',
        relationship: 'Daughter',
    }

    await account.createAccount(janeAccount); 
    await familymember.createFamilyMember(janeFM);
    await familymember.createFamilyMember(jimFM);
    await familymember.createFamilyMember(jillFM);
    await familymember.createFamilyMember(jessFM);
}

// sample account and family member data for Jeff Smith user persona
async function sampleJeffData(){
    const jeffAccount = {
        username: 'big_jeff',
        user_password: 'big_J3ff',
        canada_status: 'Permanent Resident',
        household_size: 1,
        addr: 'Jeff RD, Surrey, BC, V1M 3B5',
        baby_or_pregnant: false,
        language_spoken: `English`,
        account_notes: `Sample account for Jeff Smith`,
    }

    const jeffFM = {
        username: 'big_jeff',
        f_name: 'Jeff',
        l_name: 'Smith',
        dob: '1980/12/30',
        phone: '(222) 222-2222',
        email: 'bigjeff@email.com',
        relationship: 'owner',
    }

    await account.createAccount(jeffAccount);
    await familymember.createFamilyMember(jeffFM);
}

// sample appointment slots and bookings for Feb 25 and 28
async function sampleApptData() {
    const feb25Slots = {
        appt_date: '2026-02-25',
        start_time: '08:00',
        end_time: '16:00',
        appt_notes: undefined
    }

    const feb28FullSlot = {
        appt_date: '2026-02-28',
        start_time: '08:00',
        end_time: '08:20',
        appt_notes: undefined
    }

    const janeBookingFeb25 = {
        appt_date: '2026-02-25',
        start_time: '10:00',
    }

    const jeffBookingFeb28 = {
        appt_date: '2026-02-28',
        start_time: '08:00',
    }

    await appointment.createAppointmentsInTimeRange(feb25Slots);
    await appointment.createAppointment(feb28FullSlot);
    await appointment.bookAppointment(janeBookingFeb25, 'jane123');
    await appointment.bookAppointment(jeffBookingFeb28, 'big_jeff');
}

// create available time slots for the month of March 2026
async function marchTimeSlots() {
    for(let i=1; i<32; i++) {
        const date = '2026-03-' + String(i).padStart(2, '0');;
        const slot = {
            appt_date: date,
            start_time: '08:00',
            end_time: '16:00',
            appt_notes: undefined
        }
        appointment.createAppointmentsInTimeRange(slot);
    }
}

async function testUpdate() {
    const janeFM = {
        f_name: 'New Jane',
        l_name: 'New Doe',
        dob: '2000/01/01',
        phone: 'new phone',
        email: 'new email',
        relationship: 'owner',
    }

    const janeAccount = {
        username: 'newjaneaccount',
        canada_status: 'new status',
        household_size: 8,
        addr: 'new addr',
        baby_or_pregnant: false,
        language_spoken: 'new lang',
        account_notes: 'new info'
    }

    const jillFM = {
        f_name: 'evil jill',
        l_name: 'evil last name',
        dob: '1000/01/01',
        phone: 'evil phone',
        email: 'evil email',
        relationship: 'evil daughter',
    }

    await familymember.updateFamilyMember('jane123', 'Jane', janeFM);
    await account.updateAccount('jane123', janeAccount);
    await familymember.updateFamilyMember('newjaneaccount', 'Jill', jillFM);
}

// run init functions
async function runSample() {
    try {
        await sampleAdminData();
        await sampleJaneData();
        await sampleJeffData();
        sampleApptData();
        marchTimeSlots();
        console.log('Sample data successfully initialized.')
    } catch (err) {
        console.log('Unable to initialize sample data: ', err);
    }
    
}

runSample();
//testUpdate();
