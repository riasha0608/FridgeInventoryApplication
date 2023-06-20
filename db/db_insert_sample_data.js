const db = require ("./db_connection");

const delete_fridge_table_sql = "DELETE FROM fridge;"

db.execute(delete_fridge_table_sql);

const delete_meals_table_sql = "DELETE FROM meals;"

db.execute(delete_meals_table_sql);

const delete_food_categories_table_sql = "DELETE FROM food_categories;"

db.execute(delete_food_categories_table_sql);

const insert_meals_sql = `
    INSERT INTO meals
        (meal_id, meal_name)
    VALUES
        (?, ?);
`

db.execute(insert_meals_sql, [1, 'French Toast']);
db.execute(insert_meals_sql, [2, 'Spaghetti and Meatballs']);
db.execute(insert_meals_sql, [3, 'Macaroni and Cheese']);
db.execute(insert_meals_sql, [4, 'Pizza']);
db.execute(insert_meals_sql, [5, 'Fajitas']);
db.execute(insert_meals_sql, [6, 'Oatmeal']);
db.execute(insert_meals_sql, [7, 'Chicken Nuggets']);

const insert_food_categories_sql = `
    INSERT INTO food_categories
        (food_category_id, food_category_name)
    VALUES
        (?, ?);
`

db.execute(insert_food_categories_sql, [1, 'Fruits']);
db.execute(insert_food_categories_sql, [2, 'Vegetables']);
db.execute(insert_food_categories_sql, [3, 'Grain']);
db.execute(insert_food_categories_sql, [4, 'Protein']);
db.execute(insert_food_categories_sql, [5, 'Dairy']);

const insert_fridge_sql = `
    INSERT INTO fridge
        (food_item_id, category_id, meal_id, food_item_name, expiration_date, quantity_and_unit)
    VALUES
        (?, ?, ?, ?, ?, ?);
`

db.execute(insert_fridge_sql, [1, 5, 3, 'Mozzarella Cheese', '2023-06-25 00:00:00', '16 oz.']);
db.execute(insert_fridge_sql, [2, 2, 5, 'Green Pepper', '2023-07-04 00:00:00', '6 peppers']);
db.execute(insert_fridge_sql, [3, 5, 1, 'Butter', '2023-09-01 00:00:00', '12 oz.']);
db.execute(insert_fridge_sql, [4, 1, null, 'Strawberries', '2023-06-27 00:00:00', '16 oz.']);
db.execute(insert_fridge_sql, [5, 3, 6, 'Oats', '2025-06-10 00:00:00', '42 oz.']);
db.execute(insert_fridge_sql, [6, 4, 7, 'Chicken', '2023-06-30 00:00:00', '6.5 lbs.']);
db.execute(insert_fridge_sql, [7, 3, 2, 'Spaghetti Noodles', '2024-07-10 00:00:00', '2 lbs.']);

db.end();