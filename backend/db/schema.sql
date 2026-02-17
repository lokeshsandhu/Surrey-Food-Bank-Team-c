-- Database schema (scaffold only).
-- Define tables for: accounts, family_members, appointments, appointment_attendees, etc.

DROP TABLE IF EXISTS public.familymember;
DROP TABLE IF EXISTS public.appointment;
DROP TABLE IF EXISTS public.account;

CREATE TABLE IF NOT EXISTS public.account
(
    username character varying(100)[] NOT NULL PRIMARY KEY,
    user_password character varying NOT NULL,
    canada_status character varying(100)[],
    household_size integer,
    addr character varying,
    baby_or_pregnant boolean
);

CREATE TABLE IF NOT EXISTS public.familymember
(
    username character varying(100)[] NOT NULL,
    f_name character varying NOT NULL,
    l_name character varying,
    dob date,
    phone character varying(12)[],
    email character varying,
    relationship character varying,
    CONSTRAINT familymember_pkey PRIMARY KEY (username, f_name),
    CONSTRAINT familymember_fkey_username FOREIGN KEY (username)
        REFERENCES public.account (username) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.appointment
(
    appt_date date NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    appt_notes character varying,
    username character varying(100)[],
    CONSTRAINT appointment_pkey PRIMARY KEY (appt_date, start_time),
    CONSTRAINT appointment_fkey_user FOREIGN KEY (username)
        REFERENCES public.account (username) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
);