CREATE TABLE IF NOT EXISTS public.account
(
    username varchar NOT NULL PRIMARY KEY,
    user_password varchar NOT NULL,
    canada_status varchar,
    household_size integer,
    addr varchar,
    baby_or_pregnant boolean,
    language_spoken varchar,
    account_notes varchar
);

CREATE TABLE IF NOT EXISTS public.familymember
(
    id integer GENERATED ALWAYS AS IDENTITY,
    username varchar NOT NULL,
    f_name varchar NOT NULL,
    l_name varchar,
    dob date,
    phone varchar,
    email varchar,
    relationship varchar,
    CONSTRAINT familymember_pkey PRIMARY KEY (username, id),
    CONSTRAINT familymember_fkey_username FOREIGN KEY (username)
        REFERENCES public.account (username) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.appointment_slot
(
    appt_date date NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    capacity integer NOT NULL DEFAULT 1,
    appt_notes varchar,
    CONSTRAINT appointment_slot_pkey PRIMARY KEY (appt_date, start_time),
    CONSTRAINT appointment_slot_capacity_check CHECK (capacity >= 1)
);

CREATE TABLE IF NOT EXISTS public.appointment_booking
(
    appt_date date NOT NULL,
    start_time time without time zone NOT NULL,
    username varchar NOT NULL,
    booking_status varchar NOT NULL DEFAULT 'upcoming',
    booking_notes varchar,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT appointment_booking_pkey PRIMARY KEY (appt_date, start_time, username),
    CONSTRAINT appointment_booking_status_check CHECK (booking_status IN ('upcoming', 'arrived', 'did_not_show')),
    CONSTRAINT appointment_booking_fkey_user FOREIGN KEY (username)
        REFERENCES public.account (username) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

ALTER TABLE IF EXISTS public.appointment_booking
    ADD COLUMN IF NOT EXISTS booking_notes varchar;

ALTER TABLE IF EXISTS public.appointment_booking
    DROP CONSTRAINT IF EXISTS appointment_booking_fkey_slot;

CREATE INDEX IF NOT EXISTS idx_appointment_booking_username_date
    ON public.appointment_booking (username, appt_date, start_time);

CREATE INDEX IF NOT EXISTS idx_appointment_booking_status
    ON public.appointment_booking (booking_status);
