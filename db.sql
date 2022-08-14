CREATE TABLE restaurants(
    restaurant_id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    cuisine TEXT NOT NULL,
    date_created DATE NOT NULL,
    date_updated DATE NOT NULL,
    user_id TEXT,

    CONSTRAINT FK_restaurants_cuisines FOREIGN KEY(cuisine_id)
        REFERENCES cuisines(cuisine_id)
)

CREATE TABLE cuisines(
    cuisine_id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
)

CREATE TABLE food_ordered(
    food_id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    date_created DATE NOT NULL,
    date_updated DATE NOT NUll,
    comment TEXT,
    rating INTEGER,
    ordered_at DATE,
    image_path TEXT,
    user_id TEXT,


    CONSTRAINT FK_foodordered_cuisines FOREIGN KEY(cuisine_id)
        REFERENCES cuisines(cuisine_id)

    CONSTRAINT FK_foodordered_restaurants FOREIGN KEY(restaurant_id)
        REFERENCES restaurants(restaurant_id)
)