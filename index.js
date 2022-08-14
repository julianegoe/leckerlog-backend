require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const pool = require('./database');
/* const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
  });

client.connect();

client.query('SELECT table_schema,table_name FROM information_schema.tables;', (err, res) => {
  if (err) throw err;
  for (let row of res.rows) {
    console.log(JSON.stringify(row));
  }
  client.end();
}); */

// middleware
app.use(cors());
app.use(express.json());

// routes
app.get('/', (_, res) => {
    res.send('Hello World')
})
// create a restaurant and food

// get alle restaurants and food for user
app.get('/restaurants', async (req, res) => {
    try {
        const restaurants = await pool.query('SELECT * from restaurants');
        res.json(restaurants.rows);
    } catch(error) {
        console.log(error)
        res.status(500).send({
            message: error.message || "Some error occurred.",
          });
    }
})

// get single restaurant and foods for user

// delete food for restaurant for user

// delete restaurant for user

app.listen(process.env.PORT || 8080, () => console.log('listening to Port' + process.env.PORT));
