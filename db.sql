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

CREATE TABLE cuisines(
    cuisine_id SERIAL PRIMARY KEY,
    name TEXT NOT NULL
);

CREATE TABLE restaurants(
    restaurant_id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    cuisine TEXT NOT NULL,
    date_created DATE NOT NULL,
    date_updated DATE NOT NULL,
    user_id TEXT,
    cuisine_Id INTEGER NOT NULL,

    CONSTRAINT FK_restaurants_cuisines FOREIGN KEY(cuisine_id)
        REFERENCES cuisines(cuisine_id)
);

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
    cuisine_id INTEGER NOT NULL,
    restaurant_id INTEGER NOT NULL,


    CONSTRAINT FK_food_ordered_cuisines FOREIGN KEY(cuisine_id)
        REFERENCES cuisines(cuisine_id),

    CONSTRAINT FK_food_ordered_restaurants FOREIGN KEY(restaurant_id)
        REFERENCES restaurants(restaurant_id)
);

INSERT INTO cuisines (name)
VALUES ('Italienisch');

INSERT INTO restaurants (name, cuisine, cuisine_Id, date_created, date_updated)
VALUES ('Osmans Töchter', 'Türkisch', 1, DATE '2022-08-14', DATE '2022-08-14');

SELECT * from cuisines;
SELECT * from restaurants;
SELECT * from food_ordered;