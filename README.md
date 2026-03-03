# Surrey-Food-Bank-Team-C
CPSC 319, Winter Term 2 2026

## About
A scheduling application that allows clients to create accounts, add family members, and book appointments at the Surrey Food Bank. Admin are able to view all client information, view all bookings, and add new available time slots for booking.

This application has been created using React, [Mantine](https://mantine.dev/), Node.js, and PostgreSQL.

# Basic Setup Instructions
The following instructions will go over initial setup for first time users.

Please ensure you have the following software installed:
- [Node.js](https://nodejs.org/en) 
- [npm](https://www.w3schools.com/whatis/whatis_npm.asp)
- [PostgreSQL](https://www.postgresql.org/)
- An IDE

Example images below were taken in this environment: 
- Node.js Version v24.13.1
- npm Version 10.8.3
- PostgreSQL Version 18.2
- [VSCode](https://code.visualstudio.com/) Version 1.100.3
- Windows 11

We recommend using the latest versions and cannot guarantee functionality on older versions.


## Setup PostgreSQL Database
1. Install **Postgres** on your local machine following [these instructions](https://www.w3schools.com/postgresql/postgresql_install.php)
    - The default superuser username is `postgres`. Do not change this.
    - Set the password to `cpsc319`.
    - Set the port to `5432`.

2. Once installed, open either the command-line **psql** or user-interface **pgAdmin** to [create the database](https://www.geeksforgeeks.org/postgresql/postgresql-create-database/) with the following information:
    - Name: `sfb_db`
    - OWNER = `postgres`
    - ENCODING = `'UTF8'`
    - LC_COLLATE = `'English_United States.1252'`
    - LC_CTYPE = `'English_United States.1252'`
    - LOCALE_PROVIDER = `'libc'`
    - TABLESPACE = `pg_default`
    - CONNECTION LIMIT = `-1`
    - IS_TEMPLATE = `False`

    Example with **pgAdmin**:
> Right-click on Databases and create a new database.

> ![Right-click on Databases and create a new database](/setup-images/pgAdmin1.png)

> Enter `sfb_db` as the name and click save.

> ![Enter sfb_db as the name and click save](/setup-images/pgAdmin2.png)

> The database should now be initialized.

> ![Database initialized](/setup-images/pgAdmin3.png)


## Initialize Database Schema
1. In your **IDE** of choice, [clone this repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/cloning-a-repository).

2. Open a new terminal and cd into the backend: `cd backend`.

3. Install all needed dependencies by running: `npm install`.

4. Once the dependencies have been installed, cd into the db folder: `cd db`.

5. Run the setup script: `node resetDB.js`.

    This message will print to console if successful: `Database initialized: 6 successful, 0 errors`.

    Example:
    ![DB init example](/setup-images/vscode1.png)


6. You can confirm the database schema has been initialized properly by opening the database in **psql** or **pgAdmin** and running the following queries.
    ```
    SELECT * FROM account;
    SELECT * FROM familymember;
    SELECT * FROM appointment;
    ```

    If using **pgAdmin**, open the [QueryTool](https://www.w3schools.com/postgresql/postgresql_pgadmin4.php) to run the above queries. 

    Example:
> Right-click sfb_db and open the Query Tool.

> ![Right-click sfb_db and open the Query Tool](/setup-images/pgAdmin4.png)

> Write your queries and click the play button to execute. The Data Output section below will show the result of the queries, which for now should be empty tables with column names.

> ![Write your queries and click the execute query button to execute](/setup-images/pgAdmin5.png)



# Running the Application
The following instructions will go over how to run the application.

1. Ensure you are signed into **Postgres** with the proper credentials and the `sfb_db` database server is running. 
    
    Ex. if using **pgAdmin**, ensure the application is open and responding to queries.

2. In your **IDE**, open a new terminal and cd into the backend folder: `cd backend`

    If this is your first time running the application, install all needed dependencies by running: `npm install`.

3. Start the backend server by running: `npm run dev`.

    This message will print to console if successful: `Server running on http://localhost:3000`.

    Example:

    ![Backend server example](/setup-images/vscode2.png)

4. Open a new terminal and cd into the frontend folder: `cd frontend`.
    
    If this is your first time running the application, install all needed dependencies by running: `npm install`.

5. Start the frontend by running: `npm run dev`.

    This message will print to console if successful: `➜  Local:   http://localhost:5173/`

    Example:

    ![Frontend example](/setup-images/vscode3.png)

6. Click on the localhost link to access the frontend interface.


# Testing Instructions
The following instructions go over reseting the database, initializing sample data, and accessing sample data accounts for testing purposes. 

## Reset the Database to Blank
To remove all data in the database and reset it to a blank slate:

1. In a terminal, cd into the db folder: `cd backend\db`.

2. Run the reset script: `node resetDB.js`.

    This message will print to console if successful: `Database initialized: 6 successful, 0 errors`.

    You can confirm the database had been emptied in **psql** or **pgAdmin** by running:
    ```
    SELECT * FROM account;
    SELECT * FROM familymember;
    SELECT * FROM appointment;
    ```
    The returned output should show only the table's column name with no rows.

## Initialize Sample Data
To add sample data for testing:

1. Ensure you have reset the database to blank to avoid any issues with duplicate data.

2. In a terminal, cd into the db folder: `cd backend\db`.

3. Run the sample data script: `ts-node sampleDB.ts`.

    This message will print to console if successful: `Sample data successfully initialized.`.

    You can confirm the database had been initialzed in **psql** or **pgAdmin** by running:
    ```
    SELECT * FROM account;
    SELECT * FROM familymember;
    SELECT * FROM appointment ORDER BY appt_date, start_time;
    ```
    The returned output should show the newly added sample data.

### Sample Data Overview
For additional details, please refer to the sampleDB.ts script.

Admin Account
- Username: admin
- Password: adminPassword#123

Client Account with 4 Family Members
- Username: jane123
- Password: Password1!
- Family Member Names: Jane Doe (account owner), Jim Doe, Jill Doe, Jess Doe
- Appointment: Feb 25, 2026 from 10:00 to 10:30

Client Account with 1 Family Member
- Username: big_jeff
- Password: big_J3ff
- Family Member Names: Jeff Smith (account owner)
- Appointment: Feb 28, 2026 from 08:00 to 08:20

Available Appointment Time Slots
- Feb 25 from 08:00 to 16:00 in 15 minute time slots
- March 1 to 31 from 08:00 to 16:00 in 15 minute time slots

# Common Issues
### Postgres Database & Sample Data

If the resetDB.js script is unable to run:
- Ensure all dependencies are installed (`npm install`).
- Ensure your **Postgres** credentials are correct and the database is running and responsive to queries.

If the sampleDB.ts script is unable to run:
- Ensure all dependencies are installed (`npm install`).
- Ensure you have typescript installed (`npm install -D typescript`).
- Ensure you have ts-node installed (`npm install -D ts-node`).
- Ensure your **Postgres** credentials are correct and the database is running and responsive to queries.
- Ensure you have reset the database to blank.

If you recieve a timeout error and are unable to log in to Postgres:
- Ensure the Postgres server is running

Example in **pgAdmin**:

![Postgres timeout error](/setup-images/pgadmin_error1.png)

Example [solution](https://stackoverflow.com/questions/60532791/timeout-expired-pgadmin-unable-to-connect-to-server) for Windows:
1. Click Win+R keys to open **Windows Run**
2. Type `services.msc` and click enter
3. In the **Services** window, find the Postgres server (ex.`postgresql-x64-16 - PostgreSQL Server 16`) and ensure it is running.

![Postgres timeout error solution](/setup-images/pgadmin_error2.png)

### Running Application

If the backend or frontend server fail to start or are unresponsive:
- Ensure all dependencies are installed (`npm install`).
- Ensure your software versions are up to date.
- Ensure you are using separate terminals to run the backend and frontend at the same time.
- Ensure your **Postgres** credentials are correct and the database is running and responsive to queries.
- Ensure you have cloned the proper commit. 

If the frontend interface is not loading/taking a while to load:
- Close the localhost window, quit out of the frontend server (ex. ctrl+c), re-install dependencies (`npm install`), and re-start the server (`npm run dev`).