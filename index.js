require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const pool = require('./database');

// middleware
app.use(cors());
app.use(express.json());

// routes
app.get('/', (_, res) => {
    res.send('Hello World')
})

// get all cuisines
app.get('/cuisines', async (req, res) => {
    try {
        const client = await pool.connect();
        const restaurants = await client.query('SELECT * from cuisines');
        res.json(restaurants.rows);
    } catch(error) {
        console.log(error)
        res.status(500).send({
            message: error.message || "Some error occurred.",
          });
    }
})

// create a restaurant record
app.post('/restaurants', async (req, res) => {
    try {
        const client = await pool.connect();
        const { name, cuisine, cuisine_id} = req.body;
        const date_created = new Date().toISOString().split('T')[0];
        const date_updated = new Date().toISOString().split('T')[0];
        const restaurants = await client.query("INSERT INTO restaurants(name, cuisine, cuisine_Id, date_created, date_updated) VALUES($1, $2, $3, $4, $5) RETURNING *",
        [name, cuisine, cuisine_id, date_created, date_updated]);
        res.json(restaurants.rows);
    } catch(error) {
        console.log(error)
        res.status(500).send({
            message: error.message || "Some error occurred.",
          });
    }
})

// create a food record
app.post('/food', async (req, res) => {
    try {
        const client = await pool.connect();
        const { name, cuisine_id, restaurant_id, comment, rating, ordered_at, image_path} = req.body;
        const date_created = new Date().toISOString().split('T')[0];
        const date_updated = new Date().toISOString().split('T')[0];
        const restaurants = await client.query("INSERT INTO food_ordered(name, cuisine_Id, restaurant_id, comment, rating, ordered_at, image_path, date_created, date_updated) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
        [name, cuisine_id, restaurant_id, comment, rating, ordered_at, image_path, date_created, date_updated]);
        res.json(restaurants.rows);
    } catch(error) {
        console.log(error)
        res.status(500).send({
            message: error.message || "Some error occurred.",
          });
    }
})

// get all restaurants and food for user
app.get('/restaurants', async (req, res) => {
    try {
        const client = await pool.connect();
        const restaurants = await client.query('SELECT * from restaurants');
        res.json(restaurants.rows);
    } catch(error) {
        console.log(error)
        res.status(500).send({
            message: error.message || "Some error occurred.",
          });
    }
})

// get all food for user
app.get('/food', async (req, res) => {
    try {
        const client = await pool.connect();
        const foodOrdered = await client.query('SELECT * from food_ordered');
        res.json(foodOrdered.rows);
    } catch(error) {
        console.log(error)
        res.status(500).send({
            message: error.message || "Some error occurred.",
          });
    }
})

// get single restaurant and foods for user
app.get('/restaurants/:id', async (req, res) => {
    try {
        const client = await pool.connect();
        const { id } = req.params;
        const restaurants = await client.query('SELECT * from restaurants WHERE restaurant_id = $1', [id]);
        res.json(restaurants.rows);
    } catch(error) {
        console.log(error)
        res.status(500).send({
            message: error.message || "Some error occurred.",
          });
    }
})

// delete food for restaurant for user
app.delete('/food/:id', async (req, res) => {
    try {
        const client = await pool.connect();
        const { id } = req.params;
        const restaurants = await client.query('DELETE from food_ordered WHERE food_id = $1', [id]);
        res.send('Food was successfully deleted');
    } catch(error) {
        console.log(error)
        res.status(500).send({
            message: error.message || "Some error occurred.",
          });
    }
})

// delete restaurant for user

app.listen(process.env.PORT || 8080, () => console.log('listening to Port' + process.env.PORT));
