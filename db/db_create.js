const db = require("./db_connection");

/**** Drop existing tables, if any ****/

const drop_fridge_table_sql = "DROP TABLE IF EXISTS fridge;"

db.execute(drop_fridge_table_sql);

const drop_meals_table_sql = "DROP TABLE IF EXISTS meals;"

db.execute(drop_meals_table_sql);

const drop_food_categories_table_sql = "DROP TABLE IF EXISTS food_categories;"

db.execute(drop_food_categories_table_sql);







const create_food_categories_table_sql = `
    CREATE TABLE food_categories (
        food_category_id int(100) NOT NULL AUTO_INCREMENT,
        food_category_name varchar(150) NOT NULL,
        userid VARCHAR (255) NULL,
        PRIMARY KEY (food_category_id)
    );
`
db.execute(create_food_categories_table_sql);

const create_meals_table_sql = `
    CREATE TABLE meals (
        meal_id int(100) NOT NULL AUTO_INCREMENT,
        meal_name varchar(150) NOT NULL,
        userID VARCHAR (255) NULL,
        PRIMARY KEY (meal_id)
    );
`
db.execute(create_meals_table_sql);


const create_fridge_table_sql = `
    CREATE TABLE fridge (
        food_item_id int(100) NOT NULL AUTO_INCREMENT,
        category_id int(100) NOT NULL,
        meal_id int(100) NOT NULL,
        food_item_name varchar(150) NOT NULL,
        expiration_date date NOT NULL,
        quantity_and_unit mediumtext NOT NULL,
        userId VARCHAR(255) NULL,
        PRIMARY KEY (food_item_id),
        KEY category_connection_idx (category_id),
        CONSTRAINT category_connection FOREIGN KEY (category_id) REFERENCES food_categories (food_category_id) ON UPDATE CASCADE ON DELETE RESTRICT,
        CONSTRAINT meal_connection FOREIGN KEY (meal_id) REFERENCES meals (meal_id) ON UPDATE CASCADE ON DELETE RESTRICT
    );
`
db.execute(create_fridge_table_sql);

db.end();
