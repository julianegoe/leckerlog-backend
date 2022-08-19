const Pool = require('pg').Pool;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
}); 

pool.on('connect', () => console.log('connected to db'));

const client = async () => await pool.connect()();


module.exports = client;