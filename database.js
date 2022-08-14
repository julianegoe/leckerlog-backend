const Pool = require('pg').Pool;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
    /* user: process.env.USER,
    password: process.env.PASSWORD,
    host: process.env.HOST,
    port: process.env.DB_POST,
    databse: process.env.DATABASE,
    dialect: "postgres", */
}); 

pool.on('connect', () => console.log('connected to db'));

module.exports = pool;