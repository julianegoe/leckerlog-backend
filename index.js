require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const db = require('./database');
var logger = require('morgan');
const admin = require('firebase-admin');
const morgan = require('morgan');

const corsOptions = {
    origin: ['http://localhost:5173', 'https://main--lecker-log.netlify.app/'],
  }

admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FB_SERVICE_ACCOUNT_KEY)),
    databaseURL: process.env.FB_DATABASE_URL,
    storageBucket: process.env.FB_STORAGE_NAME,
});

// middleware
app.use(cors(corsOptions));
app.use(morgan('common'));
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

app.use('/leckerlog', checkAuth);
app.use('/restaurants', checkAuth);
app.use('/cuisines/:id', checkAuth);
app.use('/food', checkAuth);

// routes
app.get('/', (_, res) => {
    res.json({
        message: 'hallo welt',
    })
})

// get all cuisines for user
app.get('/cuisines/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const cuisines = await db.getCuisinesForUser(id);
        res.json(cuisines.rows);
    } catch (error) {
        console.log(error)
        res.status(500).send({
            message: error.message || "Some error occurred.",
        });
    }
})

// get all cuisines
app.get('/cuisines', async (req, res) => {
    try {
        const cuisines = await db.getAllCuisines()
        res.json(cuisines.rows);
    } catch (error) {
        console.log(error)
        res.status(500).send({
            message: error.message || "Some error occurred.",
        });
    }
})

// add a cuisine
app.put('/cuisines/:name', async (req, res) => {
    const { name } = req.params;
    try {
        const addedCuisine = await db.addNewCuisine(name);
        res.json(addedCuisine.rows);
    } catch (error) {
        console.log(error)
        res.status(500).send({
            message: error.message || "Some error occurred.",
        });
    }
})

// create a leckerlog record
app.post('/leckerlog/:id', async (req, res) => {
    try {
        const { restaurantName, foodName, cuisine, cuisine_id, comment, rating, ordered_at, image_path } = req.body;
        const { id } = req.params;
        const date_created = new Date().toISOString().split('T')[0];
        const date_updated = new Date().toISOString().split('T')[0];
        const updatedRestaurant = await db.addOrUpdateRestaurant(restaurantName, cuisine, cuisine_id, date_created, date_updated, id)
        if (updatedRestaurant.rows[0].restaurant_id) {
            const foodOrdered = await db.addFoodOrdered(foodName, userId, cuisine_id, updatedRestaurant.rows[0].restaurant_id, comment, rating, ordered_at, image_path, date_created, date_updated)
            res.json([updatedRestaurant.rows, foodOrdered.rows]);
        }
    } catch (error) {
        console.log(error)
        res.status(500).send({
            message: error.message || "Some error occurred.",
        });
    }
})

// get all leckerlogs for user
app.get('/leckerlog/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const restaurants = await db.getLeckerlog(id);
        res.json(restaurants.rows);
    } catch (error) {
        console.log(error)
        res.status(500).send({
            message: error.message || "Some error occurred.",
        });
    }
})

// delete food for user
app.delete('/food/:id/:foodId', async (req, res) => {
    try {
        const { id, foodId } = req.params;
        const restaurants = await db.deleteFoodOrdered(id, foodId);
        res.send(restaurants.rows);
    } catch (error) {
        console.log(error)
        res.status(500).send({
            message: error.message || "Some error occurred.",
        });
    }
})

app.listen(process.env.PORT || 8080, () => console.log('listening to Port' + process.env.PORT));
