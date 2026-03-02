import { Pool } from "pg";
import path from "path";
import dotenv from "dotenv";

dotenv.config({
    override: true,
    path: path.join(__dirname, "../../db/dev.env"),
});

// create a pool connection to postgres database using login info from dev.env file
const pool = new Pool({
    user: process.env.USER,
    host: process.env.HOST,
    database: process.env.DATABASE,
    password: process.env.PASSWORD,
    port: Number(process.env.DB_PORT) || 5432,
});

export default pool;
