require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const db = require('./database');
let logger = require('morgan');
const admin = require('firebase-admin');
const morgan = require('morgan');

admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FB_SERVICE_ACCOUNT_KEY)),
    databaseURL: process.env.FB_DATABASE_URL,
});

// middleware
app.use(cors({
    origin: '*',
    allowedHeaders: ['AuthToken', 'Content-Type'],
}));
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
        const { restaurantName, foodName, cuisine, cuisine_id, address, comment, rating, ordered_at, image_path, tags } = req.body;
        const { id } = req.params;
        const date_created = new Date().toISOString().split('T')[0];
        const date_updated = new Date().toISOString().split('T')[0];
        const restaurant = await db.addOrUpdateRestaurant(restaurantName, cuisine, cuisine_id, date_created, date_updated, id, address)
        const food = await db.addFoodOrdered(foodName, id, cuisine_id, restaurantName, comment, rating, ordered_at, image_path, date_created, date_updated, tags)
        res.json({
            ...restaurant.rows[0],
            food_ordered: food.rows,
        });
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
});

// get food ordered
app.get('/food/:foodId/:id', async (req, res) => {
    try {
        const { id, foodId } = req.params;
        const record = await db.getFoodOrdered(id, foodId);
        res.send({
            ...record.restaurant.rows[0],
            food_ordered: record.food.rows,
        });
    } catch (error) {
        console.log(error)
        res.status(500).send({
            message: error.message || "Some error occurred.",
        });
    }
});

//update food ordered
app.post('/food/:foodId/:userId', async (req, res) => {
    try {
        const { name, rating, comment, cuisine_id, tags, restaurantName } = req.body;
        const { userId, foodId } = req.params;
        const date_updated = new Date().toISOString().split('T')[0];
        const foodOrdered = await db.updateFoodOrdered(name, cuisine_id, rating, comment, tags, foodId, userId, date_updated);
        await db.updateRestaurantCuisine(cuisine_id, restaurantName, userId, date_updated);
        res.send({
            ...foodOrdered.restaurant.rows[0],
            foodOrdered: foodOrdered.updatedFood.rows,
        });
    } catch (error) {
        console.log(error)
        res.status(500).send({
            message: error.message || "Some error occurred.",
        });
    }
})

app.listen(process.env.PORT || 8080, () => console.log('listening to Port ' + process.env.PORT));
