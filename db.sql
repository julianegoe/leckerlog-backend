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

SELECT *
FROM restaurants
FULL OUTER JOIN food_ordered ON restaurants.cuisine_Id=food_ordered.cuisine_Id
WHERE food_ordered.user_id = $1 and restaurants.user_id = $1;

SELECT * from cuisines where cuisine_Id in (SELECT cuisine_id
FROM restaurants
WHERE user_id = $!);

UPDATE restaurants SET cuisine = $1, cuisine_id = $2, date_updated = $3 where user_id = $4 AND name = $5 RETURNING *;

INSERT INTO restaurants (name, cuisine, cuisine_Id, date_created, date_updated) values ($1, $2, $3, $4, $5) ON DUPLICATE KEY UPDATE cuisine = $1, cuisine_id = $2, date_updated = $3 where user_id = $4 AND name = $5 RETURNING *;

DELIMITER $$;
     CREATE PROCEDURE addRestaurant(
IN
name TEXT,
cuisine TEXT,
cuisine_Id INTEGER,
date_created DATE,
date_updated DATE
user_id TEXT)

    BEGIN
    DECLARE exist int;

      SELECT count(*) into exist FROM restaurants --count because i will
      WHERE name =name and user_id = user_id;  --this will check if exist or not

        IF (vexist >= 1) then  --if exist then update
        UPDATE restaurants
            SET cuisine = cuisine, cuisine_Id = cuisine_Id, date_updated = date_updated
            WHERE name =name and user_id = user_id;
        ELSE
          INSERT INTO restaurants (`name`, `cuisine`, `cuisine_id`, `date_created`,`dte_updated`,`user_id`) values (name, cuisine, cuisine_Id, date_created, date_updated, user_id);
    END IF;
    END $$
    DELIMITER ;

INSERT INTO food_ordered (name, user_id, cuisine_id, restaurant_id, comment, rating, ordered_at, image_path, date_created, date_updated) VALUES($1, $2, $3, (SELECT restaurant_id from restaurants where user_id = $2 and name = $4), $5, $6, $7, $8, $9, $10) RETURNING *

