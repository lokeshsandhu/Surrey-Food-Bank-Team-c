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

CREATE TABLE IF NOT EXISTS public.appointment
(
    appt_date date NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    appt_notes varchar,
    username varchar,
    CONSTRAINT appointment_pkey PRIMARY KEY (appt_date, start_time),
    CONSTRAINT appointment_fkey_user FOREIGN KEY (username)
        REFERENCES public.account (username) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
);
