const db = require("./db_connection");

const select_food_categories_sql = "SELECT * FROM food_categories";

db.execute(select_food_categories_sql,
    (error, results) => {
        if (error)
            throw error;
        console.log("Table 'food_categories' contents:")
        console.log(results);
    }
);

const select_meals_sql = "SELECT * FROM meals";

db.execute(select_meals_sql,
    (error, results) => {
        if (error)
            throw error;
        console.log("Table 'meals' contents:")
        console.log(results);
    }
);

const select_fridge_sql = `
SELECT *
FROM fridge
JOIN food_categories
    ON fridge.category_id = food_categories.food_category_id
JOIN meals
    ON fridge.meal_id = meals.meal_id
ORDER BY
    fridge.food_item_id;
`;

db.execute(select_fridge_sql,
    (error, results) => {
        if (error)
            throw error;
        console.log("Table 'fridge' contents:")
        console.log(results);
    }
);

db.end();