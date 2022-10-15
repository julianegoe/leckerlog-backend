const Pool = require('pg').Pool;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

const getCuisinesForUser = async (userId) => {
    return await pool.query(`
    SELECT * from cuisines where cuisine_Id in (SELECT cuisine_id
    FROM restaurants
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

const addOrUpdateRestaurant = async (restaurantName, cuisine, cuisine_id, date_created, date_updated, userId, address) => {
    await pool.query(`
        INSERT INTO restaurants (name, cuisine, cuisine_Id, date_created, date_updated, user_id, address)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (name, user_id) DO UPDATE
        SET 
        name = $1,
        cuisine = $2,
        cuisine_Id = $3,
        address = $7,
        date_updated = $5 
        RETURNING *;`,
        [
            restaurantName, cuisine, cuisine_id, date_created, date_updated, userId, address
        ]);
};

const addFoodOrdered = async (foodName, userId, cuisine_id, restaurantName, comment, rating, ordered_at, image_path, date_created, date_updated, tags) => {
    return await pool.query("INSERT INTO food_ordered (name, user_id, cuisine_id, restaurant_id, comment, rating, ordered_at, image_path, date_created, date_updated, tags) VALUES($1, $2, $3, (SELECT restaurant_id from restaurants where user_id = $2 and name = $4), $5, $6, $7, $8, $9, $10, $11) RETURNING *",
    [foodName, userId, cuisine_id,restaurantName, comment, rating, ordered_at, image_path, date_created, date_updated, tags]);
}

const deleteFoodOrdered = async (userId, foodId) => {
    return await pool.query('DELETE from food_ordered WHERE user_id = $1 and food_id = $2 RETURNING *', [userId, foodId]);
}

const getFoodOrdered = async (userId, foodId) => {
    return await pool.query('SELECT * from food_ordered WHERE user_id = $1 and food_id = $2', [userId, foodId]);
}

const updateFoodOrdered = async (name, cuisines_id, rating, comment, tags, food_id, user_id) => {
    return await pool.query('UPDATE food_ordered SET name = $1, cuisine_id = $2, rating = $3, comment = $4, tags = $5 WHERE food_id = $6 and user_id = $7 RETURNING *;',
        [name, cuisines_id, rating, comment, tags, food_id, user_id]);
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
    updateFoodOrdered,
};
