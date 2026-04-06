import { Button, SimpleGrid, LoadingOverlay, Grid, ScrollArea, Modal, Group, TextInput, Select, useModalsStack, Popover } from '@mantine/core';
import { getTimeRange, DatePicker, TimeGrid, Calendar } from '@mantine/dates';
import React, { useEffect } from 'react';
import '../styles/styles.css';

import { ClientNavBar } from '../components/navBar.jsx';
import { useState } from 'react';
import { notifications, Notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router';
import { bookAppointment, deleteAppointmentFromUsername, getAppointmentsInDateRange, getMyAppointments } from '../../api/appointments.js';
import { me } from '../../api/auth.js';
import dayjs from 'dayjs';
import customParseFormat from "dayjs/plugin/customParseFormat";
import { useDisclosure } from '@mantine/hooks';
import { getAccount, getAccountEmail } from '../../api/accounts.js';
import { sendConfirmationEmail } from '../../api/email.js';

import arabic_img from '../assets/arabic.png';

const excludedDays = [5, 6]; // Exclude specific days (0 = Monday, ..., 6 = Sunday)

export default function ClientDashboard() {
    const [allTimeslots, setAllTimeslots] = useState([{}]);
    const [currentMonth, setCurrentMonth] = useState(dayjs().format('YYYY-MM'));
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedTime, setSelectedTime] = useState(null);
    const [processingBooking, setProcessingBooking] = useState(false);
    const [loadingTimeGrid, setLoadingTimeGrid] = useState(false);
    const [availableTimes, setAvailableTimes] = useState([]);
    const [bookedTimes, setBookedTimes] = useState([]);
    const [myAppointment, setMyAppointment] = useState({});
    const [successModalState, {open: openSuccessModal, close: closeSuccessModal}] = useDisclosure(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [tinyBundles, setTinyBundles] = useState(false);
    const [bookingNote, setBookingNote] = useState('');
    const [currLanguage, setCurrLanguage] = useState("English");
    const [tutorialState, setTutorialState] = useState(sessionStorage.getItem('firstTime') ? 1 : 0);

    const username = sessionStorage.getItem('username');
    const token = sessionStorage.getItem('token');
    const role = sessionStorage.getItem('role');
    const navigate = useNavigate();

    dayjs.extend(customParseFormat);

    const stack = useModalsStack(['base-page', 'calendar-page', 'confirm-page']);
    const [modalSelectedDate, setModalSelectedDate] = useState(null);
    const [modalSelectedTime, setModalSelectedTime] = useState(null);
    const [modalCurrentMonth, setModalCurrentMonth] = useState(dayjs().format('YYYY-MM'));
    const [modalAllTimeslots, setModalAllTimeslots] = useState([{}]);
    const [modalAvailableTimes, setModalAvailableTimes] = useState([]);
    const [modalBookedTimes, setModalBookedTimes] = useState([]);
    const [processingEdit, setProcessingEdit] = useState(false);
    const [modalLoadingEdit, setModalLoadingEdit] = useState(false);
    const [modalBookingNote, setModalBookingNote] = useState('');

    if (!token) {
        navigate('/');
        return null;
    }

    if (role === 'admin') {
        navigate('/adminDashboard')
    }

    const normalizeApptDate = (apptDate) => {
        if (!apptDate) return apptDate;
        if (typeof apptDate === 'string') return apptDate.includes('T') ? apptDate.slice(0, 10) : apptDate;
        if (apptDate instanceof Date) return apptDate.toISOString().slice(0, 10);
        const asString = String(apptDate);
        return asString.includes('T') ? asString.slice(0, 10) : asString;
    };

    const parseApptDate = (apptDate) => dayjs(normalizeApptDate(apptDate), 'YYYY-MM-DD', true);

    const handleBooking = async () => {
        if (myAppointment && myAppointment.appt_date) {
            notifications.show({
                title: 'Error',
                message: 'You already have an appointment booked, please cancel or edit your existing appointment before booking a new one.',
                color: 'red',
            });
            return;
        }

        if (selectedDate && selectedTime) {
            setProcessingBooking(true);

            const data = { appt_date: selectedDate, start_time: selectedTime, booking_notes: bookingNote };
            const res = await bookAppointment(token, data);

            if (res && res.success) {
                const effectiveUsername = username || (await me(token))?.username || '';

                const userEmail = await getAccountEmail(token, effectiveUsername);
                if (!userEmail?.email) {
                    notifications.show({
                        title: 'Email not sent',
                        message: 'Appointment was booked but no account email was found.',
                        color: 'yellow',
                    });
                    handleAvailableTimes(selectedDate);
                    fetchMyAppointment();
                    setProcessingBooking(false);
                    return;
                }

                const confirmationEmail = {
                    date: selectedDate,
                    time: selectedTime,
                    username: effectiveUsername,
                    email: userEmail.email
                }

                const emailRes = await sendConfirmationEmail(token, confirmationEmail);
                if (!emailRes?.success) {
                    notifications.show({
                        title: 'Email not sent',
                        message: emailRes?.error || 'Appointment was booked but confirmation email failed.',
                        color: 'yellow',
                    });
                }
                openSuccessModal();
                handleAvailableTimes(selectedDate); // Refresh available times after booking
                fetchMyAppointment();
            } else {
                notifications.show({
                    title: 'Error',
                    message: res?.error || 'Failed to book appointment',
                    color: 'red',
                });
            }

            setProcessingBooking(false);
            if (tutorialState === 2) {
                setTutorialState(3);
                sessionStorage.removeItem('firstTime');
            }

        }
    };

    const handleEdit = async () => {
        await handleCancelBooking(myAppointment); // Cancel existing appointment before booking new one
        if (modalSelectedDate && modalSelectedTime) {
            setProcessingEdit(true);

            const data = { appt_date: modalSelectedDate, start_time: modalSelectedTime, booking_notes: modalBookingNote };
            const res = await bookAppointment(token, data);

            if (res && res.success) {
                const effectiveUsername = username || (await me(token))?.username || '';

                const userEmail = await getAccountEmail(token, effectiveUsername);
                if (!userEmail?.email) {
                    notifications.show({
                        title: 'Email not sent',
                        message: 'Appointment was booked but no account email was found.',
                        color: 'yellow',
                    });
                    handleAvailableTimesModal(modalSelectedDate);
                    fetchMyAppointment();
                    setProcessingEdit(false);
                    return;
                }

                const confirmationEmail = {
                    date: modalSelectedDate,
                    time: modalSelectedTime,
                    username: effectiveUsername,
                    email: userEmail.email
                }

                const emailRes = await sendConfirmationEmail(token, confirmationEmail);
                if (!emailRes?.success) {
                    notifications.show({
                        title: 'Email not sent',
                        message: emailRes?.error || 'Appointment was booked but confirmation email failed.',
                        color: 'yellow',
                    });
                }
                openSuccessModal();
                handleAvailableTimesModal(modalSelectedDate); // Refresh available times after booking
                fetchMyAppointment();
            } else {
                notifications.show({
                    title: 'Error',
                    message: res?.error || 'Failed to book appointment',
                    color: 'red',
                });
            }

            setProcessingEdit(false);

        }
    };

    const handleAvailableTimes = async (date) => {
        setSelectedTime(null);
        setSelectedDate(date);
        setBookingNote('');
        setLoadingTimeGrid(true);

        try {
            const timeslots = await getAppointmentsInDateRange(token, date, date);
            const takenTimes = timeslots.filter(slot => slot.username !== null);
            setAvailableTimes(timeslots.map(appointment => appointment.start_time));
            setBookedTimes(takenTimes.map(appointment => appointment.start_time));
        } catch (error) {
            console.error('Error fetching booked times:', error);
        } finally {
            setLoadingTimeGrid(false);
            if (tutorialState === 1) {
                setTutorialState(2);
            }
        }
    }

    const handleAvailableTimesModal = async (date) => {
        setModalSelectedTime(null);
        setModalSelectedDate(date);
        setModalBookingNote('');
        setModalLoadingEdit(true);
        try {
            
            const timeslots = await getAppointmentsInDateRange(token, date, date);
            const takenTimes = timeslots.filter(slot => slot.username !== null);
            setModalAvailableTimes(timeslots.map(appointment => appointment.start_time));
            setModalBookedTimes(takenTimes.map(appointment => appointment.start_time));
        } catch (error) {
            console.error('Error fetching booked times:', error);
        } finally {
            setModalLoadingEdit(false);
        }
    }

    const handleCancelBooking = async (appointment) => {
        setModalLoading(true);
        const res = await deleteAppointmentFromUsername(token, appointment?.username);
        const cancelSucceeded = Array.isArray(res?.deleted);
        if (cancelSucceeded) {
            if (!stack.state['calendar-page']) {

                notifications.show({
                    title: 'Success',
                    message: 'Appointment cancelled successfully',
                    color: 'var(--mantine-color-green-6)',
                    autoClose: 5000,
                    withCloseButton: true,
                    withBorder: true,
                    style: {
                        border: '3px solid',
                        borderColor: 'var(--mantine-color-green-6)',
                        borderRadius: '8px',
                    }
                });
            }
        } else {
            notifications.show({
                title: 'Error',
                message: res?.error || 'Failed to cancel appointment',
                color: 'red',
            });
        }
        setModalLoading(false);
        stack.closeAll();
        if (selectedDate) {
            handleAvailableTimes(selectedDate); // Refresh available times after cancellation
        }
        fetchMyAppointment(); // Refresh user's appointment information after cancellation
        setBookingNote(''); // Reset booking note after cancellation
    }

    const fetchMyAppointment = async () => {
        const myAppointment = await getMyAppointments(token);
        const earliestAppointment = myAppointment.filter(
            appointment => appointment.end_time && normalizeApptDate(appointment.appt_date) >= dayjs().format('YYYY-MM-DD')
        );

        if (earliestAppointment.length > 0) {
            if (earliestAppointment[0].appt_date === earliestAppointment[1].appt_date) {
                 if (earliestAppointment[0].end_time == earliestAppointment[1].start_time) {
                    const appt = earliestAppointment[0];
                    appt.end_time = earliestAppointment[1].end_time;
                    setMyAppointment(appt);
                 }
            }
        } else {
            setMyAppointment(earliestAppointment[0]);
        }
        
    };

    const fetchModalTimeslots = async () => {
        const timeslots = await getAppointmentsInDateRange(
            token,
            dayjs(modalCurrentMonth).startOf('month').format('YYYY-MM-DD'),
            dayjs(modalCurrentMonth).endOf('month').format('YYYY-MM-DD')
        );
        setModalAllTimeslots(timeslots);
        console.log("check2");
    };

    const openStackPage = (page) => {
        fetchModalTimeslots();
        stack.open(page);
    };

    useEffect(() => {
        
        fetchMyAppointment();

        const checkTinyBundles = async () => {
            const userInfo = await getAccount(token, username);
            return userInfo;
        }

        checkTinyBundles().then(result => {
            console.log("check ", result.baby_or_pregnant);
            if (result.baby_or_pregnant) {
                setTinyBundles(true);
            }
        });


    }, []);

    useEffect(() => {
        const fetchTimeslots = async () => {
            const timeslots = await getAppointmentsInDateRange(token, dayjs(currentMonth).startOf('month').format('YYYY-MM-DD'), dayjs(currentMonth).endOf('month').format('YYYY-MM-DD'))
            setAllTimeslots(timeslots);
            console.log("check1 ");
        };

        fetchTimeslots();
    }, [currentMonth, token]);

    useEffect(() => {
        fetchModalTimeslots();
    }, [modalCurrentMonth, token]);

    return (
        <div className="page">
            <ClientNavBar />
            <SimpleGrid cols={3} spacing="xs" verticalSpacing="xs" style={{marginLeft: '20px', marginRight: '20px', marginTop: '20px'}}>
                <div className="box">
                    <h3 style={{marginBottom: '10px', marginTop: '0px'}}>Booking Information</h3>
                    {myAppointment && myAppointment.appt_date ? `You have a booking on ${parseApptDate(myAppointment.appt_date).format('MMMM D, YYYY')} from ${dayjs(myAppointment.start_time, 'HH:mm:ss').format('h:mm A')} to ${dayjs(myAppointment.end_time, 'HH:mm:ss').format('h:mm A')}, ` : `Welcome back ${username}! You do not have any upcoming bookings.`}
                    {myAppointment && myAppointment.appt_date && (
                        <button type="button" className="text-link-button" onClick={() => openStackPage('base-page')}>
                            click here to edit/cancel your booking.
                        </button>
                    )}
                </div>
                <div className="box" style={{display: 'flex', justifyContent: 'center'}}>
                    
                    <Button justify='center' size='lg' mt={20} onClick={(event) => openSuccessModal()}>
                        Check required documents
                    </Button>

                </div>
                <div className="box">
                    <Group justify='space-between'>
                        <div>
                            <b>Contact Information</b>
                            <br />
                            Tel: 604.581.5443
                            <br />
                            Fax: 604.588.8697
                            <br />
                            Email: info@surreyfoodbank.org
                            <br />
                            <br />
                            <b>Address</b>
                            <br />
                            Unit 1 – 13478 78th Ave
                            <br />
                            Surrey, BC, V3W 8J6
                        </div>
                        <div>
                            <b>Office Hours</b>
                            <br />
                            Mon – Fri 8:00 a.m. – 4:00 p.m.
                            <br />
                            <br />
                            <b>Food Distribution Hours</b>
                            <br />
                            Mon: 9:00 a.m. – 1:00 p.m.
                            <br />
                            Tue: 9:00 a.m. – 1:00 p.m.
                            <br />
                            Thu: 9:00 a.m. – 1:00 p.m.
                            <br />
                            Fri: 9:00 a.m. – 1:00 p.m.
                        </div>
                    </Group>
                </div>
            </SimpleGrid>
            <Grid verticalspacing="xs" style={{ height: '60vh', alignItems: 'stretch' }}>

                <Grid.Col span={6} style={{height: "500px"}}>
                    <Popover opened={tutorialState === 1} position="right" withArrow>
                        <Popover.Target>
                            <div className="calendar" style={{ flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'stretch' }}>
                                <h3 style={{marginBottom: '10px', marginTop: '0px'}}>Booking Calendar</h3>
                                <DatePicker
                                    size="xl"
                                    value={selectedDate}
                                    onChange={handleAvailableTimes}
                                    onMonthSelect={setCurrentMonth}
                                    onNextMonth={setCurrentMonth}
                                    onPreviousMonth={setCurrentMonth}
                                    firstDayOfWeek={0}
                                    excludeDate={(date) =>{
                                        if (excludedDays.includes(new Date(date).getDay())) {
                                            return true;
                                        } else if (!allTimeslots.some(timeslot => normalizeApptDate(timeslot.appt_date) === dayjs(date).format('YYYY-MM-DD') && timeslot.username === null)) {
                                            return true;
                                        } else if (dayjs(date).format('YYYY-MM-DD') < dayjs().format('YYYY-MM-DD')) { // Disable past dates
                                            return true;
                                        } else if (tinyBundles) { // If tiny bundles, only allow Wednesdays
                                            return dayjs(date).day() !== 3;
                                        } else {
                                            return dayjs(date).day() === 3; // If not tiny bundles, disable Wednesdays
                                        }
                                    }}
                                    hideOutsideDates
                                    style={{alignSelf: 'center', marginTop: '15px'}}
                                />
                            </div>
                        </Popover.Target>
                        <Popover.Dropdown>
                            <p>Welcome to the Surrey Food Bank booking system {username}!</p>
                            <p>Here is a quick tutorial on how to use the system.</p>
                            <p>To start, please select an available date from the calendar on the left here.</p>
                        </Popover.Dropdown>
                    </Popover>
                </Grid.Col>

                <Grid.Col span={6} style={{height: "500px"}}>
                    <Popover opened={tutorialState === 2} position="top" withArrow>
                        <Popover.Target>
                            <div className="time-grid">
                                <h3 style={{marginBottom: '0px', marginTop: '0px'}}>Available Time Slots</h3>
                                <ScrollArea style={{ marginBottom: '60px', height: '100%' }}>
                                    <LoadingOverlay visible={loadingTimeGrid} overlayProps={{ radius: "sm", blur: 2 }} />
                                    
                                    <TimeGrid
                                        data={availableTimes}
                                        simpleGridProps={{
                                            type: 'container',
                                            cols: { base: 3 },
                                            spacing: 'lg',
                                        }}
                                        format="12h"
                                        withSeconds={false}
                                        size="lg"
                                        disableTime={(time) =>
                                            bookedTimes.includes(time) || (dayjs(time, 'HH:mm:ss').isBefore(dayjs()) && selectedDate === dayjs().format('YYYY-MM-DD'))
                                        }
                                        value={selectedTime}
                                        onChange={setSelectedTime}
                                        disabled={selectedDate === null}
                                        style={{ padding: '15px' }}
                                    />
                                </ScrollArea>
                                <TextInput
                                    size="lg"
                                    placeholder="Add booking note"
                                    value={bookingNote}
                                    onChange={(event) => setBookingNote(event.currentTarget.value)}
                                    w="50%"
                                    style={{ position: 'absolute', bottom: '30px', left: '35px' }}
                                />
                                <div className="booking-button">
                                    <Button size="lg" w="100%" onClick={handleBooking} loading={processingBooking} disabled={!selectedDate || !selectedTime}>
                                        Book Appointment
                                    </Button>
                                </div>
                            </div>
                        </Popover.Target>
                        <Popover.Dropdown>
                            <p>Great! Now please select an available time slot on the right to book your appointment.</p>
                            <p>You can also add any notes regarding your booking in the text box below the time slots.</p>
                            <p>Once you have selected a time and added any notes, click the "Book Appointment" button to confirm your booking.</p>
                        </Popover.Dropdown>
                    </Popover>
                </Grid.Col>
            </Grid>

            <Modal.Stack>
                <Modal {...stack.register('base-page')} title="Booking Information" transitionProps={{ transition: 'slide-left' }} centered>
                    <LoadingOverlay visible={modalLoading}/>
                    <div className="modal-content">
                        <p><strong>Date:</strong> {myAppointment && myAppointment.appt_date ? parseApptDate(myAppointment.appt_date).format('MMMM D, YYYY') : 'N/A'}</p>
                        <p><strong>Time:</strong> {myAppointment && myAppointment.start_time ? `${dayjs(myAppointment.start_time, 'HH:mm').format('h:mm A')} - ${dayjs(myAppointment.end_time, 'HH:mm').format('h:mm A')}` : 'N/A'}</p>
                        <p><strong>Notes:</strong> {myAppointment && myAppointment.booking_notes ? myAppointment.booking_notes : '(Empty)'}</p>
                        <div>
                            <Button mr={10} onClick={() => openStackPage("calendar-page")}>
                                Edit Booking
                            </Button>

                            <Button ml={10} onClick={() => handleCancelBooking(myAppointment)}>
                                Cancel Booking
                            </Button>
                        </div>
                    </div>
                </Modal>

                <Modal {...stack.register('calendar-page')} title="Choose date" size="70%" transitionProps={{ transition: 'slide-left' }} centered>
                    <LoadingOverlay visible={modalLoadingEdit} overlayProps={{ radius: "sm", blur: 2 }}/>
                    <Group grow style={{ position: 'relative', paddingBottom: '80px'}}>
                        <DatePicker
                            size="xl"
                            value={modalSelectedDate}
                            onChange={handleAvailableTimesModal}
                            onMonthSelect={setModalCurrentMonth}
                            onNextMonth={setModalCurrentMonth}
                            onPreviousMonth={setModalCurrentMonth}
                            firstDayOfWeek={0}
                            excludeDate={(date) =>{
                                if (excludedDays.includes(new Date(date).getDay())) {
                                    return true;
                                } else if (!modalAllTimeslots.some(timeslot => normalizeApptDate(timeslot.appt_date) === dayjs(date).format('YYYY-MM-DD') && timeslot.username === null)) {
                                    return true;
                                } else if (dayjs(date).format('YYYY-MM-DD') < dayjs().format('YYYY-MM-DD')) { // Disable past dates
                                    return true;
                                } else if (tinyBundles) { // If tiny bundles, only allow Wednesdays
                                    return dayjs(date).day() !== 3;
                                } else {
                                    return dayjs(date).day() === 3; // If not tiny bundles, disable Wednesdays
                                }
                            }}
                            hideOutsideDates
                        />

                        <TimeGrid
                            data={modalAvailableTimes}
                            simpleGridProps={{
                                type: 'container',
                                cols: { base: 3 },
                                spacing: 'lg',
                            }}
                            format="12h"
                            withSeconds={false}
                            size="lg"
                            disableTime={(time) =>
                                modalBookedTimes.includes(time) || (dayjs(time, 'HH:mm:ss').isBefore(dayjs()) && modalSelectedDate === dayjs().format('YYYY-MM-DD'))
                            }
                            value={modalSelectedTime}
                            onChange={setModalSelectedTime}
                            disabled={modalSelectedDate === null}
                            style={{marginBottom: '20px', padding: '15px'}}
                        />
                    </Group>
                    <TextInput
                        size="lg"
                        placeholder="Add booking note"
                        value={modalBookingNote}
                        onChange={(event) => setModalBookingNote(event.currentTarget.value)}
                        w={240}
                        style={{ position: 'absolute', bottom: '30px', left: '30px' }}
                    />

                    <div className="booking-button">
                        <Button size="lg" onClick={handleEdit} loading={processingEdit} disabled={!modalSelectedDate || !modalSelectedTime}>
                            Book Appointment
                        </Button>
                    </div>
                </Modal>
{/* 
                <Modal {...stack.register('confirm-page')} title="Booking Confirmation"  centered >
                    <LoadingOverlay visible={modalLoading}/>
                    <div className="modal-content">
                        <p><strong>Date:</strong> {myAppointment && myAppointment.appt_date ? parseApptDate(myAppointment.appt_date).format('MMMM D, YYYY') : 'N/A'}</p>
                        <p><strong>Time:</strong> {myAppointment && myAppointment.start_time ? dayjs(myAppointment.start_time, 'HH:mm').format('h:mm A') : 'N/A'}</p>
                        <p><strong>Notes:</strong> {myAppointment && myAppointment.appt_notes ? myAppointment.appt_notes : 'N/A'}</p>
                        <div>
                            <Button mr={10}>
                                Edit Booking
                            </Button>

                            <Button ml={10} onClick={() => handleCancelBooking(myAppointment)}>
                                Cancel Booking
                            </Button>
                        </div>
                    </div>
                </Modal> */}
            </Modal.Stack>

            
            <Modal
                opened={successModalState}
                onClose={closeSuccessModal}
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span>Booking Confirmed</span>
                        <Select
                            size="xs"
                            w={180}
                            placeholder="Language"
                            data={["English", "Español (Spanish)", "پښتو (Pashto)", "درى (Dari)", "العربية (Arabic)"]}
                            value={currLanguage}
                            onChange={setCurrLanguage}
                        />
                    </div>
                }
                centered
                size="70%"
            >
                <div className="modal-content">
                    {currLanguage === "English" && (
                        <div>
                            <h3>WHAT YOU NEED TO REGISTER OR UPDATE YOUR INFORMATION</h3>
                            <p>SFB customers must update their information every six months (between 9:00 a.m. and 11:00 a.m.). New customers must register by appointment only. To schedule your appointment, please email registration@surreyfoodbank.org.</p>
                            <p>The documents you need to bring with you are:</p>
                            <p>For each adult in the household:</p>
                            <ul>
                                <li>Physical government-issued photo ID: Driver's license, BCID, passport, PR/Refugee document, etc.</li>
                                <li>Proof of address: A current rental/lease agreement, bank statement, phone/BChydro/cable bill, or other official document with your name and address. A handwritten rent receipt will not be accepted.</li>
                                <li>Proof of dependents: Physical BC Services (Care Card/MSP) card for each child under 19 years of age living in your household.</li>
                                <li>If you are pregnant—Proof of pregnancy: Original ultrasound photograph or letter signed by your doctor.</li>
                            </ul>
                            <p>Please be prepared to stand and answer questions related to your monthly income.</p>
                            <p>Food distribution hours:</p>
                            <p>General distribution – for everyone: Monday, Tuesday, Thursday, Friday, 9:00 AM to 1:00 PM.</p>
                            <p>Tiny Bundles—pregnant women and/or families with babies under 1 year old: Wednesday, 9:00 AM to 1:00 PM.</p>
                            <p>(English - 2026)</p>
                        </div>
                    )}

                    {currLanguage === "Español (Spanish)" && (
                        <div>
                            <h3>LO QUE NECESITA PARA REGISTRARSE O ACTUALIZAR SU INFORMACIÓN</h3>
                            <p>Los clientes de SFB deben actualizar su información cada seis meses (entre las 9:00 a.m. y las 11 a.m.). Los nuevos clientes deben registrarse únicamente con cita previa. Para agendar su cita, envíe un correo electrónico a:  registration@surreyfoodbank.org</p>
                            <p>Los documentos que necesita traer con usted son:</p>
                            <p>Para cada adulto en el hogar:</p>
                            <ul>
                                <li>Identificación oficial física con foto emitida por el gobierno: Licencia de conducir, BCID, pasaporte, documento de PR/Refugio, etc.</li>
                                <li>Comprobante de domicilio: Un contrato de renta/arrendamiento vigente, estado de cuenta bancario, recibo de teléfono/BChydro/cable u otro documento oficial con su nombre y dirección. No se aceptará un recibo de alquiler escrito a mano.</li>
                                <li>Constancia de dependientes: Tarjeta física de BC Services (Care Card/MSP) para cada menor de 19 años que viva en su hogar.</li>
                                <li>Si está embarazada—Comprobante de embarazo: Fotografía original de ultrasonido o carta firmada por su médico.</li>
                            </ul>
                            <p>Por favor esté preparado parado (a) para responder peguntas relacionadas con su ingreso mensual.</p>
                            <p>Horas de distribución de alimentos:</p>
                            <p>Distribución general – para todos: Lunes, Martes, Jueves, Viernes                                                                     9:00AM a 1:00PM.</p>
                            <p>Tiny Bundles— mujeres embarazadas y/o las familias con bebés menores de 1 año: Miércoles                   9:00AM a 1:00PM.</p>
                            <p>(Spanish - 2026)</p>
                        </div>
                    )}

                    {currLanguage === "پښتو (Pashto)" && (
                        <div style={{ textAlign: "right" }}>
                            <h3>پوهاوی</h3>
                            <p>د نوم لیکنې لپاره اړین اسناد</p>

                            <p>نوی مشتریان د نوم لیکنی (ثبت نام) لپاره دغه    ۶۰۴۵۸۱۵۴۴۳   تیلفون شمیره سره اریکه ونیسی او د ملاقات وخت واخلی.</p>
                            <p>تول مشتریان باید هرو شپږو میاشتو کې راجستر شي. د نوم لیکنې (ثبت نام) وخت له 9:00 څخه تر 11:00 بجو پورې دی.</p>

                            <p>د نوم لیکنې  (ثبت نام) لپاره اړین اسناد </p>

                            <p>په کورنۍ کې هر بالغ:</p>
                            <p>د شناسای کارت(د عکس سره): رسمي شناختي کارت لکه د موټر چلولو جواز، د BC شناختي کارت، پاسپورټ او داسې نور.</p>
                            <p>د استوګنې پته تایید: ستاسو د استوګنې پته مشخص کولو لپاره، لاندې اسنادو څخه یو ته اړتیا ده.</p>
                            <ul>
                                <li>د تلیفون بل</li>
                                <li>د بریښنا بل</li>
                                <li>بانکي بیان (د بانک صورت حساب)</li>
                                <li>د کور قرارداد او نور رسمي اسناد چې د مشتری په نوم ثبت شوي</li>
                            </ul>
                            <p>دا باید په یاد ولرئ چې غیر رسمي یا لاس لیکل شوي اسناد نه منل کیږي.</p>
                            <p>د کورنۍ د نورو غړو لپاره:</p>
                            <p>مشتری کله چې نوم لیکنه (ثبت نام) کوي، باید د خپلو ماشومانو روغتیا کارت (18 کلنۍ څخه کم) ولري.</p>
                            <p>د خوراکي توکو د ویش ساعتونه:</p>
                            <p>عمومي توزیع - په دوشنبه، سه شنبه، پنجشنبه او جمعه د سهار له 9:00 بجو څخه تر 1:00 بجو پورې.</p>
                            <p>کوچني کڅوړې د امیدوارو(حامله) میرمنو او کورنیو لپاره چې د یو کال څخه کم عمر لرونکي ماشومان لري: د چهارشنبه په ورځ د سهار له 9:00 بجو څخه تر 1:00 بجو پورې.</p>
                            <p>د لا زیاتو معلوماتو او راجستر کولو لپاره په ۶۰۴۵۸۱۵۴۴۳ شمیره اړیکه ونیسئ.</p>

                            <p>(Registration instructions in Pashto - 2026)</p>

                        </div>
                    )}

                    {currLanguage === "درى (Dari)" && (
                        <div style={{ textAlign: "right" }}>
                           <h3>اگاهی</h3>

                            <p>اسناد ضروری برای ثبت نام و تازه سازی دوسیه ها </p>

                            <p>    مشتریان جدید بخاطر ثبت نام با این شماره تیلیفون  ۶۰۴۵۸۱۵۴۴۳ در تماس شده و قرار ملاقات اخذ نمایند. </p>
                            <p>    مشتریان باید هر شش ماه بعد خود را ثبت نام نمایند. زمان ثبت نام ساعت 9:00 الی 11:00 صبح. </p>

                            <p>    اسناد ضروری برای ثبت نام: </p>
                            <p>    هر فرد بزرگ سال در خانواده:  </p>
                            <p>    کارت شناسای (تصویردار):  اصل کارت شناسای رسمی مانند لایسنس رانندگی، کارت هویت بی سی، پاسپورت و غیره.   </p>
                            <p>    تثبیت آدرس محل زندگی: برای مشخص ساختن ادرس محل زندگی تان به یکی از اسناد ذیل ضرورت است. </p>
                            <p>    ۱- بل تیلیفون ۲- بل برق ۳- حساب بانکی ۴- قرارداد خانه و سایر اسناد رسمی که به اسم مشتری ثبت باشد.  </p>
                            <p>    قابل یاداوریست که اسناد غیررسمی و یا دست نویس پذیرفته نمی شود. </p>
                            <p>    برای بقیه اعضای خانواده:</p>
                            <p>    مشتری هنگام ثبت نام باید اصل کارت صحی اطفال شان (پاینراز سن ۱۸) را باخود داشته باشد.</p>
                            <p>    ساعات توزیع مواد غذایی:</p>
                            <p>    توزیع عمومی– به روزهای دوشنبه، ٰسه شنه  پنحشنبه  و جمعه از ساعت۹:۰۰ صبح الی ۱:۰۰ بعد از ظهر.</p>
                            <p>    بسته های کوچک برای خانم های باردار (حامله) و فامیلهای که اطفال کوچکتراز یک سال دارند: به روز های چهارشنبه از ساعت ۹:۰۰ الی ۱:۰۰ بعد از ظهر.</p>

                            <p>    برای اخذ معلومات بیشتر و یا ثبت نام با این شماره  ۶۰۴۵۸۱۵۴۴۳  در تماس شوید.</p>


                            <p>   (Registration instructions in Dari - 2026)</p>

                        </div>
                    )}

                    {currLanguage === "العربية (Arabic)" && (
                        <img src={arabic_img} alt="Arabic Instructions" style={{ maxWidth: '100%', height: 'auto' }} />
                    )}
                    <Button onClick={closeSuccessModal}>Close</Button>
                </div>
            </Modal>
        </div>
    );

}
