const express = require('express');
const app = express();
const cors = require('cors');
const pool = require('./database');
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

client.connect();

client.query('SELECT table_schema,table_name FROM information_schema.tables;', (err, res) => {
  if (err) throw err;
  for (let row of res.rows) {
    console.log(JSON.stringify(row));
  }
  client.end();
});

// middleware
app.use(cors());
app.use(express.json());

// routes

// create a restaurant and food

// get alle restaurants and food for user
app.get('/restaurants', async (req, res) => {
    const restaurants = await pool.query('SELECT * FROM restaurants');
    res.json(restaurants.rows);
})

// get single restaurant and foods for user

// delete food for restaurant for user

// delete restaurant for user

app.listen(5000, () => console.log('listening to Port 5000'));
