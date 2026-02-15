// import { Client } from 'pg'
// const client = await new Client().connect()
 
// const res = await client.query('SELECT $1::text as message', ['Hello world!'])
// console.log(res.rows[0].message) // Hello world!
// await client.end()

const path = require('path');
require('dotenv').config({
    override: true,
    path: path.join(__dirname, 'dev.env')
});

const {Pool, Client} = require('pg');

const pool = new Pool({
    user: process.env.USER,
    host: process.env.HOST,
    database: process.env.DATABASE,
    password: process.env.PASSWORD,
    port: process.env.PORT
});

(async () => {
    try {
        const {rows} = await pool.query('SELECT tablename FROM pg_catalog.pg_tables');
        console.log(rows);
    } catch(err) {
        console.log(err);
    } 
})();

module.exports = pool;