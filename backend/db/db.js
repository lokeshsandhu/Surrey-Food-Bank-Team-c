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

// example query with paramaterized inputs
(async () => {
    try {
        const text = 'INSERT INTO account VALUES ($1, $2, $3, $4, $5, $6)';
        const values = ['pia', 'password', 'wow', 10, 'please work', 'f'];
 
        const res = await pool.query(text, values);
        //const {rows} = await pool.query('SELECT tablename FROM pg_catalog.pg_tables');
        console.log(res);
    } catch(err) {
        console.log(err);
    } 
})();

module.exports = pool;