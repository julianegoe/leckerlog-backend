const Pool = require('pg').Pool;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // ssl: { rejectUnauthorized: false },
});

const findUserByEmail = async (email) => {
    return await pool.query(`SELECT * from users WHERE email = $1;`, [email])
}

const findUserById = async (user_id) => {
    return await pool.query(`SELECT * from users WHERE user_id = $1;`, [user_id])
}

const registerUser = async (email, password) => {
    return await pool.query(`
    INSERT INTO users (email, password) 
    VALUES ($1, $2) RETURNING *;
    `, [email, password]);
}

const getCuisinesForUser = async (userId) => {
    return await pool.query(`
    SELECT * from cuisines where cuisine_Id in (SELECT distinct cuisine_id
    FROM food_ordered
    WHERE user_id = $1);
    `, [userId]);
}

const getAllCuisines = async () => {
    return await pool.query(`
    SELECT * from cuisines
    `);
}

const addNewCuisine = async (cuisineName) => {
    return await pool.query("INSERT INTO cuisines(name) VALUES($1) RETURNING *", [cuisineName]);
}

const getLeckerlog = async (userId) => {
    return await pool.query(`
    SELECT restaurants.*, subVirt.food_ordered
    FROM restaurants 
    LEFT JOIN (SELECT restaurant_id, json_agg(row_to_json(food_ordered)) AS food_ordered FROM food_ordered WHERE user_id = $1                                                                                           
    GROUP  BY 1
    ) subVirt ON subVirt.restaurant_id = restaurants.restaurant_id where user_id = $1;`, [userId]);
}

const addOrUpdateRestaurant = async (restaurant_name, cuisine_id, date_created, date_updated, user_id, address) => {
    return await pool.query(`
        INSERT INTO restaurants (name, cuisine_id, date_created, date_updated, user_id, address)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (name, user_id) DO UPDATE
        SET 
        name = $1,
        cuisine_id = $2,
        address = $6,
        date_updated = $4
        RETURNING *`,
        [
            restaurant_name, cuisine_id, date_created, date_updated, user_id, address
        ]);
};

const addFoodOrdered = async (food_name, userId, cuisine_id, restaurant_name, comment, rating, ordered_at, image_path, date_created, date_updated, tags) => {
    return await pool.query("INSERT INTO food_ordered (name, user_id, cuisine_id, restaurant_id, comment, rating, ordered_at, image_path, date_created, date_updated, tags) VALUES($1, $2, $3, (SELECT restaurant_id from restaurants where user_id = $2 and name = $4), $5, $6, $7, $8, $9, $10, $11) RETURNING *;",
        [food_name, userId, cuisine_id, restaurant_name, comment, rating, ordered_at, image_path, date_created, date_updated, tags]);
}

const deleteFoodOrdered = async (foodId) => {
    return await pool.query('DELETE from food_ordered WHERE food_id = $1 RETURNING *', [foodId]);
}

const getFoodOrdered = async (foodId) => {
    return await pool.query(`SELECT food_ordered.*, restaurants.name as restaurant_name, cuisines.name as cuisine
    FROM food_ordered
    JOIN restaurants ON restaurants.restaurant_id = food_ordered.restaurant_id
    JOIN cuisines ON cuisines.cuisine_id = food_ordered.cuisine_id
    WHERE food_ordered.food_id = $1
    `, [foodId]);
}

const getAllFoodOrdered = async (userId) => {
    const food = await pool.query(`SELECT food_ordered.*, restaurants.name as restaurant_name, cuisines.name as cuisine
    FROM food_ordered
    JOIN restaurants ON restaurants.restaurant_id = food_ordered.restaurant_id
    JOIN cuisines ON cuisines.cuisine_id = food_ordered.cuisine_id
    WHERE food_ordered.user_id = $1
    ORDER BY food_ordered.ordered_at DESC;
    `, [userId]);
    return { food }
}

const updateFoodOrdered = async (name, cuisines_id, rating, comment, tags, food_id, date_updated) => {
    const updatedFood = await pool.query('UPDATE food_ordered SET name = $1, cuisine_id = $2, rating = $3, comment = $4, tags = $5, date_updated = $7 WHERE food_id = $6 RETURNING *;',
        [name, cuisines_id, rating, comment, tags, food_id, date_updated]);
    const restaurant = await pool.query('SELECT * from restaurants WHERE restaurant_id = (SELECT restaurant_id from food_ordered WHERE food_id = $1)', [food_id]);
    return {
        updatedFood,
        restaurant,
    }
}

const updateRestaurantCuisine = async (cuisine_id, restaurantName, user_id, date_updated) => {
    return await pool.query('UPDATE restaurants SET cuisine_id = $1, date_updated = $4 WHERE name = $2 and user_id = $3 RETURNING *',
        [cuisine_id, restaurantName, user_id, date_updated]);
}

const queryFoods = async (userId, searchQuery) => {
    return await pool.query(`SELECT restaurants.*, foodArray.food_ordered
    FROM restaurants
    LEFT JOIN (SELECT restaurant_id, json_agg(row_to_json(food_ordered)) AS food_ordered FROM food_ordered WHERE user_id = $1 AND food_ordered.name ILIKE ANY($2)
    GROUP BY 1
    ) foodArray ON foodArray.restaurant_id = restaurants.restaurant_id WHERE user_id = $1 AND restaurants.restaurant_id IN (SELECT restaurant_id FROM food_ordered WHERE food_ordered.name ILIKE ANY($2))`, [userId, searchQuery]);
}

const queryTags = async (userId, searchQuery) => {
    return await pool.query(`SELECT restaurants.*, foodArray.food_ordered
    FROM restaurants
    LEFT JOIN (SELECT restaurant_id, json_agg(row_to_json(food_ordered)) AS food_ordered FROM food_ordered WHERE user_id = $1 AND lower(food_ordered.tags::text)::text[] && $2
    GROUP BY 1
    ) foodArray ON foodArray.restaurant_id = restaurants.restaurant_id WHERE user_id = $1 AND restaurants.restaurant_id IN (SELECT restaurant_id FROM food_ordered WHERE lower(food_ordered.tags::text)::text[] && $2)`, [userId, searchQuery]);
}

pool.on('connect', () => console.log('connected to db'));

module.exports = {
    pool,
    getLeckerlog,
    getAllCuisines,
    addNewCuisine,
    getCuisinesForUser,
    addOrUpdateRestaurant,
    addFoodOrdered,
    deleteFoodOrdered,
    getFoodOrdered,
    getAllFoodOrdered,
    updateFoodOrdered,
    updateRestaurantCuisine,
    queryFoods,
    queryTags,
    registerUser,
    findUserByEmail,
    findUserById,
};
