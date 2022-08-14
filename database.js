const Pool = require('pg').Pool;

const pool = new Pool({
    user: process.env.USER,
    password: process.env.PASSWORD,
    host: process.env.HOST,
    port: process.env.DB_POST,
    databse: process.env.DATABASE,
    dialect: "postgres",
}); 

module.exports = pool;