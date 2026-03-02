# Surrey-Food-Bank-Team-C
CPSC 319, Winter Term 2 2026

## About
A scheduling website that allows clients to create accounts with family members and book appointments at the Surrey Food Bank. Admin are able to view all client information and bookings.

# Basic Setup Instructions
Please ensure you have the following software installed:
- [Node.js](https://nodejs.org/en) 
- [npm](https://www.w3schools.com/whatis/whatis_npm.asp)
- [PostgreSQL](https://www.postgresql.org/)
- An IDE

Example images below will be shown with the following: 
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

Example with pgAdmin:
> Right-click on Databases and create a new database.
> ![Right-click on Databases and create a new database](/setup-images/pgAdmin1.png)

> Enter `sfb_db` as the name and click save.
> ![Enter sfb_db as the name and click save](/setup-images/pgAdmin2.png)

> The database should now be initialized.
> ![Database initialized](/setup-images/pgAdmin3.png)



## Initialize Database Schema
1. In your IDE of choice, [clone this repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/cloning-a-repository).

2. Open a new terminal and cd into the backend: `cd backend`.

3. Install all needed dependencies by running: `npm install`.

4. Once the dependencies have been installed, cd into the db folder: `cd db`.

5. Run the initialization script: `node resetDB.js`.

    This message will print to console if successful: `Database initialized: 6 successful, 0 errors`.

    Example:
    ![DB init example](/setup-images/vscode1.png)


6. You can confirm the database schema has been initialized properly by opening the database in psql or pgAdmin and running the following queries.
    ```
    SELECT * FROM account;
    SELECT * FROM familymember;
    SELECT * FROM appointment;
    ```

If using pgAdmin, open the [QueryTool](https://www.w3schools.com/postgresql/postgresql_pgadmin4.php) to run the above queries. 

Example:
> Right-click sfb_db and open the Query Tool.
> ![Right-click sfb_db and open the Query Tool](/setup-images/pgAdmin4.png)

> Write your queries and click the play button to execute. The *Data Output* section below will show the result of the queries, which for now should be empty tables with column names.
> ![Write your queries and click the execute query button to execute](/setup-images/pgAdmin5.png)

## Run Server
1. 