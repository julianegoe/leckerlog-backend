require('dotenv').config();
const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const Minio = require('minio')
const multer = require('multer');
const db = require('./database');
let logger = require('morgan');
const morgan = require('morgan');
const passport = require('passport');
const sendEmail = require('./email');
require('./passport');

const app = express();
app.use(cors({
    origin: ['https://prod.leckerlog.dwk.li', 'http://localhost:5173'],
}));


const client = new Minio.Client({
    endPoint: process.env.MINIO_STORANGE_ENDPOINT,
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY
});

var upload = multer({
    limits: { fileSize: 10 * 1000 * 1000 }, // now allowing user uploads up to 10MB
    fileFilter: function (req, file, callback) {
        let fileExtension = (file.originalname.split('.')[file.originalname.split('.').length - 1]).toLowerCase(); // convert extension to lower case
        if (["png", "jpg", "jpeg"].indexOf(fileExtension) === -1) {
            return callback('Wrong file type', false);
        }
        file.extension = fileExtension.replace(/jpeg/i, 'jpg'); // all jpeg images to end .jpg
        callback(null, true);
    },
    storage: multer.diskStorage({
        destination: '/tmp', // store in local filesystem
        filename: function (req, file, cb) {
            cb(null, `${uuidv4()}.${file.extension}`) // uuid
        }
    })
});

// middleware
app.use(morgan('common'));
app.use(logger('dev'));
app.use(express.json());

app.use('/cuisines', passport.authenticate('jwt', { session: false }));
app.use('/leckerlog', passport.authenticate('jwt', { session: false }));
app.use('/food', passport.authenticate('jwt', { session: false }));
app.use('/download', passport.authenticate('jwt', { session: false }));
app.use('/upload', passport.authenticate('jwt', { session: false }));

// routes
require('./auth')(app);

app.get('/', async (_, res) => {
    res.status(200).json({
        message: 'Wilkommen in der Leckerlog API'
    })
});

app.post('/register',
    body('email').isEmail()
        .withMessage('Das ist keine valide E-mail'),
    body('password').isLength({ min: 5 })
        .withMessage('Dein Passwort muss mindestens 5 Zeichen haben.'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { email, password } = req.body;
        const user = await db.findUserByEmail(email);
        if (user.rows[0]) {
            res.status(401).json({
                info: 'Nutzer existiert schon.',
                user: user.rows[0],
            })
        }
        else {
            bcrypt.hash(password, 10, function (err, hash) {
                if (err) {
                    res.status(500).json(err);
                } else {
                    db.registerUser(email, hash).then((user) => {
                        const verifyLink = `${process.env.API_URL}/verify/${user.rows[0].verify_token}/${user.rows[0].user_id}`;
                        const emailTemplate = `
                        <div>
                            <h3>Hi ${user.rows[0].email}!</h3>
                            <p>Danke, dass du dich bei Leckerlog registriert hast. Bitte klicke den Button, um deine E-Mail-Adresse zu bestätigen.</p>
                            <button style="
                            background-color: #c68aff;
                            padding: 0.5rem;
                            box-shadow: 2px 2px 0px 1px #000000;
                            font-size: 1.25rem;
                            ">
                                <a style="text-decoration: none; color: white" href="${verifyLink}">Bestätige E-Mail-Adresse</a>
                            </button>
                        </div>`;
                        sendEmail('goersch.juliane@gmail.com', 'Bitte bestätige deine E-Mail', emailTemplate)
                        res.status(200).json({
                            message: 'Registrierung erfolgreich. Bitte bestätige deine E-Mail-Adresse.',
                            user: user.rows[0],
                        })
                    });
                }
            });
        }
    });

app.get('/verify/:token/:user_id', async (req, res) => {
    const { token, user_id } = req.params;
    try {
        const user = await db.findUserById(user_id);
        if (user.rows[0].is_verified) {
            res.status(304).send('User alread verified.')
            return;
        }
        if (user.rows[0].verify_token === token) {
            const user = await db.verifyUser(user_id);
            if (user.rows[0]) {
                res.status(301).redirect(process.env.CLIENT_URL)
            } else {
                res.send('There was a probelem verifying this email.')
            }
        }
    } catch (error) {
        res.status(500).json(error)
    }
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
        const { restaurant_name, food_name, cuisine_id, address, comment, rating, ordered_at, image_path, tags } = req.body;
        const { id } = req.params;
        const date_created = new Date().toISOString().split('T')[0];
        const date_updated = new Date().toISOString().split('T')[0];
        const restaurant = await db.addOrUpdateRestaurant(restaurant_name, cuisine_id, date_created, date_updated, id, address)
        const food = await db.addFoodOrdered(food_name, id, cuisine_id, restaurant_name, comment, rating, ordered_at, image_path, date_created, date_updated, tags)
        res.status(200).json({
            message: 'upload successful',
            data: {
                ...restaurant.rows[0],
                food_ordered: food.rows,
            }
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
app.delete('/food/delete', async (req, res) => {
    try {
        const { foodId, imagePath } = req.query;
        client.removeObject(process.env.MINIO_IMAGE_BUCKET, imagePath, function (err) {
            if (err) {
                logger('Unable to remove object', err)
                res.status(500).json(err)
            }
        })
        const restaurants = await db.deleteFoodOrdered(foodId);
        res.status(200).json({
            message: 'Record deleted',
            data: restaurants.rows
        });
    } catch (error) {
        console.log(error)
        res.status(500).send({
            message: error.message || "Some error occurred.",
        });
    }
});

// get one food ordered for id
app.get('/food/details', async (req, res) => {
    const { foodId } = req.query;
    try {
        const record = await db.getFoodOrdered(foodId);
        res.status(200).json(record.rows[0]);
    } catch (error) {
        console.log(error)
        res.status(500).send({
            message: error.message || "Some error occurred.",
        });
    }
});

// get all food ordered for user
app.get('/food/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const record = await db.getAllFoodOrdered(id);
        res.status(200).json([...record.food.rows]);
    } catch (error) {
        console.log(error)
        res.status(500).json({
            message: error.message || "Some error occurred.",
        });
    }
});

//update food ordered
app.post('/food/update/:foodId', async (req, res) => {
    try {
        const { name, rating, comment, cuisine_id, tags, restaurantName } = req.body;
        const { foodId } = req.params;
        const date_updated = new Date().toISOString().split('T')[0];
        const foodOrdered = await db.updateFoodOrdered(name, cuisine_id, rating, comment, tags, foodId, date_updated);
        await db.updateRestaurantCuisine(cuisine_id, restaurantName, date_updated);
        res.status(200).json({
            ...foodOrdered.restaurant.rows[0],
            foodOrdered: foodOrdered.updatedFood.rows,
        });
    } catch (error) {
        console.log(error)
        res.status(500).json({
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
        } catch (error) {
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
        } catch (error) {
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
    var stream = client.listObjects(process.env.MINIO_IMAGE_BUCKET, '', true)
    stream.on('data', function (obj) { data.push(obj) })
    stream.on("end", function () {
        res.status(200).json(data)
    })
    stream.on('error', function (err) {
        res.status(404).send(err.toString())
    })
})

app.post('/upload', upload.single("file"), async (req, res) => {
    const { file } = req;
    if (file) {
        const image = sharp(file.path);
        image
            .rotate()
            .resize(1500, 1500, {
                fit: 'outside',
            })
            .toBuffer((err, data, info) => {
                if (err) res.status(500).json(err);
                client.putObject(process.env.MINIO_IMAGE_BUCKET, file.originalname, data, info.size, function (err, objInfo) {
                    if (err) {
                        return res.status(500).json(err);
                    }
                    res.status(200).json(objInfo)
                });
            })
    };
});

app.get("/download", function (req, res) {
    client.getObject(process.env.MINIO_IMAGE_BUCKET, req.query.filename, (err, dataStream) => {
        if (err) {
            res.status(404).send(err.toString())
        } else {
            dataStream.pipe(res)
        }
    });
});

app.get('/create/bucket', async (req, res) => {
    const { bucketname } = req.query;
    client.makeBucket(bucketname, 'eu-east-1', function (err) {
        if (err) return console.log('Error creating bucket.', err)
        console.log('Bucket created successfully in "eu-east-1".')
        res.status(200).json({
            message: 'Bucket successfully created.'
        })
    })
})

app.listen(process.env.PORT || 8080, () => console.log('listening to Port ' + process.env.PORT));
