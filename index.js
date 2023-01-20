require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const cors = require('cors');
const Minio = require('minio')
const multer = require('multer');
const db = require('./database');
let logger = require('morgan');
const morgan = require('morgan');
const passport = require('passport');
require('./passport');

const app = express();
app.use(cors({
    origin: '*',
}));


const client = new Minio.Client({
    endPoint: process.env.MINIO_STORANGE_ENDPOINT,
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY
});

const upload = multer({ dest: 'uploads/' })

// middleware
app.use(morgan('common'));
app.use(logger('dev'));
app.use(express.json());

app.use('/cuisines', passport.authenticate('jwt', { session: false }));
/* app.use('/cuisines', passport.authenticate('jwt', { session: false }));
app.use('/leckerlog', passport.authenticate('jwt', { session: false }));
app.use('/download', passport.authenticate('jwt', { session: false }));
app.use('/upload', passport.authenticate('jwt', { session: false })); */

// routes
require('./auth')(app);

app.get('/', (_, res) => {
    res.json({
        message: 'Welcome to Leckerlog REST API',
    })
})

app.post('/register', async (req, res) => {
    const { email, password } = req.body;
    const user = await db.findUserByEmail(email);
    if (user.rows[0]) {
        console.log(user.rows[0]);
        res.status(200).json({
            message: 'User already exists.',
            user: user.rows[0],
        })
    }
    else {
        bcrypt.hash(password, 10, function(err, hash) {
            if (err) {
                res.status(500).json(err);
            } else {
                db.registerUser(email, hash).then((user) => {
                    res.status(200).json(user)
                });
            }
        });
    }
});

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
        const { restaurantName, foodName, cuisine_id, address, comment, rating, ordered_at, image_path, tags } = req.body;
        const { id } = req.params;
        const date_created = new Date().toISOString().split('T')[0];
        const date_updated = new Date().toISOString().split('T')[0];
        const restaurant = await db.addOrUpdateRestaurant(restaurantName, cuisine_id, date_created, date_updated, id, address)
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
});

// query food by name
app.get('/food/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { food } = req.query;
        let foods = []
        try {
            foods = food.map((oneFood) => {
                return `%${oneFood}%`;
            })
        } catch(error) {
            foods.push(`%${food}%`)
        }
        console.log(foods);
        const record = await db.queryFoods(id, foods);
        res.send(record.rows);
    } catch (error) {
        console.log(error)
        res.status(500).send({
            message: error.message || "Some error occurred.",
        });
    }
});

// query food by tag
app.get('/tag/:id', async (req, res) => {
    try {
        let tags = [];
        const { id } = req.params;
        const { tag } = req.query;
        try {
            tags = tag.map((oneTag) => {
                return oneTag
            })
        } catch(error) {
            tags.push(tag)
        }
        const record = await db.queryTags(id, tags);
        res.send(record.rows);
    } catch (error) {
        console.log(error)
        res.status(500).send({
            message: error.message || "Some error occurred.",
        });
    }
});


app.get('/list', async (_, res) => {
    let data = []
    var stream = client.listObjects('images', '', true)
    stream.on('data', function (obj) { data.push(obj) })
    stream.on("end", function () {
        res.status(200).json(data)
    })
    stream.on('error', function (err) {
        res.status(404).send(err.toString())
    })
})

app.post('/upload', upload.single("file"), async (req, res) => {
    var metaData = {
        'Content-Type': 'application/octet-stream',
    }
    const { file } = req;
    if (file) {
        const path = file.path;
        const fileName = file.originalname;
        client.fPutObject("images", fileName, path, metaData, function (error, objInfo) {
            if (error) res.status(500).json(error)
            res.status(200).json(objInfo)
        });
    }
});

app.get("/download", function (req, res) {
    client.getObject('images', req.query.filename, (err, dataStream) => {
        if (err) {
            res.status(404).send(err.toString())
        } else {
            dataStream.pipe(res)
        }
    });
});

app.get('/create/bucket', async (req, res) => {
    const { bucketname } = req.query;
    client.makeBucket(bucketname, 'eu-east-1', function(err) {
        if (err) return console.log('Error creating bucket.', err)
        console.log('Bucket created successfully in "eu-east-1".')
        res.status(200).json({
            message: 'Bucket successfully created.'
        })
      })
})

app.listen(process.env.PORT || 8080, () => console.log('listening to Port ' + process.env.PORT));
