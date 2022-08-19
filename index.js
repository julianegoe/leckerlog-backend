require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const pool = require('./database');
var logger = require('morgan');
const admin = require('firebase-admin');

admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FB_SERVICE_ACCOUNT_KEY)),
    databaseURL: "https://leckerlog-default-rtdb.europe-west1.firebasedatabase.app"
});

// middleware
app.use(cors());
app.use(express.json());
app.use(logger('dev'));

const checkAuth = (req, res, next) => {
    if (req.headers.authtoken) {
        admin.auth().verifyIdToken(req.headers.authtoken)
            .then(() => {
                next();
            }).catch((error) => {
                console.log(error);
                res.status(403).send('Unauthorized')
            });
    } else {
        res.status(403).send('Unauthorized')
    }
};

app.use('/', checkAuth);
app.use('/cuisines', checkAuth);
app.use('/restaurants', checkAuth);
app.use('/food', checkAuth);

// routes
app.get('/', (_, res) => {
    res.json({
        message: 'hallo welt',
    })
})

// get all cuisines
app.get('/cuisines', async (req, res) => {
    try {
        const restaurants = await pool.query('SELECT * from cuisines');
        res.json(restaurants.rows);
    } catch (error) {
        console.log(error)
        res.status(500).send({
            message: error.message || "Some error occurred.",
        });
    }
})

// create a restaurant record
app.post('/restaurants/:id', async (req, res) => {
    try {
        const { name, cuisine } = req.body;
        const { id } = req.params;
        const cuisine_Id = await pool.query('SELECT cuisine_id from cuisines where name = $1', [cuisine]);
        const date_created = new Date().toISOString().split('T')[0];
        const date_updated = new Date().toISOString().split('T')[0];
        const existingRestaurant = await pool.query('SELECT * from restaurants where name = $1 and user_id = $2', [name, id])
        if (!existingRestaurant) {
            const addedRestaurant = await pool.query("INSERT INTO restaurants(name, cuisine, cuisine_Id, date_created, date_updated, user_id) VALUES($1, $2, $3, $4, $5, $6) RETURNING *", [name, cuisine, cuisine_Id, date_created, date_updated, id]);
            res.json(addedRestaurant.rows);
        }
    } catch (error) {
        console.log(error)
        res.status(500).send({
            message: error.message || "Some error occurred.",
        });
    }
})

// create a food record
app.post('/food/:id', async (req, res) => {
    try {
        const { name, cuisine, restaurant_id, comment, rating, ordered_at, image_path } = req.body;
        const { id } = req.params;
        const cuisine_id = await pool.query('SELECT cuisine_id from cuisines where name = $1', [cuisine]);
        const date_created = new Date().toISOString().split('T')[0];
        const date_updated = new Date().toISOString().split('T')[0];
        const restaurants = await pool.query("INSERT INTO food_ordered(name, user_id, cuisine_id, restaurant_id, comment, rating, ordered_at, image_path, date_created, date_updated) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *",
            [name, id, cuisine_id, restaurant_id, comment, rating, ordered_at, image_path, date_created, date_updated]);
        res.json(restaurants.rows);
    } catch (error) {
        console.log(error)
        res.status(500).send({
            message: error.message || "Some error occurred.",
        });
    }
})

// get all restaurants and food for user
app.get('/restaurants/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const restaurants = await pool.query('SELECT * from restaurants where user_id = $1', [id]);
        res.json(restaurants.rows);
    } catch (error) {
        console.log(error)
        res.status(500).send({
            message: error.message || "Some error occurred.",
        });
    }
})

// get all food for user
app.get('/food/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const foodOrdered = await pool.query('SELECT * from food_ordered where user_id = $1', [id]);
        res.json(foodOrdered.rows);
    } catch (error) {
        console.log(error)
        res.status(500).send({
            message: error.message || "Some error occurred.",
        });
    }
})

// delete food for restaurant for user
app.delete('/food/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const restaurants = await pool.query('DELETE from food_ordered WHERE food_id = $1', [id]);
        res.send('Food was successfully deleted');
    } catch (error) {
        console.log(error)
        res.status(500).send({
            message: error.message || "Some error occurred.",
        });
    }
})

// delete restaurant for user

app.listen(process.env.PORT || 8080, () => console.log('listening to Port' + process.env.PORT));
