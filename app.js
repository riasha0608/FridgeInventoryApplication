const DEBUG = true;

//set up the server
const express = require( "express" );
const logger = require("morgan");
const { auth } = require('express-openid-connect');
const { requiresAuth } = require('express-openid-connect');
const dotenv = require('dotenv');
dotenv.config();

const helmet = require("helmet"); //add this
const db = require('./db/db_pool');
const app = express();
const port = process.env.PORT || 8080;

app.set("views", __dirname + "/views");
app.set("view engine", "ejs");

app.use( express.urlencoded({ extended: false }) );

app.use(logger("dev"));
app.use(express.static(__dirname + '/public'));

app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'cdnjs.cloudflare.com']
      }
    }
})); 

const config = {
    authRequired: false,
    auth0Logout: true,
    secret: process.env.AUTH0_SECRET,
    baseURL: process.env.AUTH0_BASE_URL,
    clientID: process.env.AUTH0_CLIENT_ID,
    issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL
};
  
  // auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(auth(config));

app.use((req, res, next) => {
    res.locals.isLoggedIn = req.oidc.isAuthenticated();
    res.locals.user = req.oidc.user;
    next();
})

app.get('/authtest', (req, res) => {
    res.send(req.oidc.isAuthenticated() ? 'Logged in' : 'Logged out');
  });

app.get('/profile', requiresAuth(), (req, res) => {
    res.send(JSON.stringify(req.oidc.user));
  });

app.get( "/", ( req, res ) => {
    //console.log("GET /");
    //console.log(`${req.method} ${req.url}`);
    res.render('index');
} );

const read_food_categories_all_sql = `
    SELECT
        food_category_id, food_category_name
    FROM 
        food_categories
    WHERE
        userid = ?
`

const read_meals_all_sql = `
    SELECT
        meal_id, meal_name
    FROM
        meals
    WHERE
        userID = ?
`

const read_fridge_all_sql = `
    SELECT
        food_item_id, food_item_name, food_category_name, meal_name,
        fridge.category_id as category_id,
        fridge.meal_id as meal_id,
        DATE_FORMAT(expiration_date, "%m/%d/%Y (%W)") as expiration_date_formatted,
        DATE_FORMAT(expiration_date, "%Y%m%d") as expiration_date_YMD,
        quantity_and_unit
    FROM fridge
    JOIN food_categories
        ON fridge.category_id = food_categories.food_category_id
    JOIN meals
        ON fridge.meal_id = meals.meal_id
    WHERE fridge.userId = ?
    ORDER BY
        fridge.food_item_id
`

// define a route for the assignment list page
app.get( "/fridge", requiresAuth(), ( req, res ) => {
    db.execute(read_fridge_all_sql, [req.oidc.user.email], (error, results) => {
        if (DEBUG)
            console.log(error ? error : results);
        if (error)
            res.status(500).send(error);
        else {
            db.execute(read_food_categories_all_sql, [req.oidc.user.email], (error2, results2) => {
                if (DEBUG)
                    console.log(error2 ? error2 : results2);
                if (error2)
                    res.status(500).send(error2);
                else {
                    db.execute(read_meals_all_sql, [req.oidc.user.email], (error3, results3) => {
                        if (DEBUG)
                            console.log(error3 ? error3 : results3);
                        if (error3)
                            res.status(500).send(error3);
                        else {
                            let data = {fridgelist: results, foodCategoriesList: results2, mealsList: results3};
                            res.render('fridge', data);
                        }
                    });
                }
            });
        }
    });
});

const read_fridge_detail_sql = `
    SELECT
        food_item_id, food_item_name, food_category_name, meal_name,
        fridge.category_id as category_id,
        fridge.meal_id as meal_id,
        DATE_FORMAT(expiration_date, "%m/%d/%Y (%W)") as expiration_date_formatted,
        DATE_FORMAT(expiration_date, "%Y-%m-%d") as expiration_date_YMD,
        quantity_and_unit
    FROM fridge
    JOIN food_categories
        ON fridge.category_id = food_categories.food_category_id
    JOIN meals
        ON fridge.meal_id = meals.meal_id
    WHERE food_item_id = ?    
    AND fridge.userId = ?
`

// define a route for the assignment detail page
app.get("/fridge/:id", requiresAuth(), ( req, res, next ) => {
    db.execute(read_fridge_detail_sql, [req.params.id, req.oidc.user.email], (error, results) => {
        if (DEBUG)
            console.log(error ? error : results);
        if (error)
            res.status(500).send(error); //Internal Server Error
        else if (results.length == 0) {
            res.status(404).send(`No food item found with id = "${req.params.id}"`);
        }
        else {
            db.execute(read_food_categories_all_sql,[req.oidc.user.email], (error2, results2) => {
                if (DEBUG)
                    console.log(error2 ? error2 : results2);
                if (error2)
                    res.status(500).send(error2);
                else {
                    db.execute(read_meals_all_sql, [req.oidc.user.email], (error3, results3) => {
                        if (DEBUG)
                            console.log(error3 ? error3 : results3);
                        if (error3)
                            res.status(500).send(error3);
                        else {
                            let data = {fridge: results[0], foodCategoriesList: results2, mealsList: results3};
                            res.render('details', data);
                        }
                    });
                }
            });
        }     
    });
});

const create_fridge_sql = `
    INSERT INTO fridge
        (food_item_name, category_id, meal_id, expiration_date, quantity_and_unit, userId)
    VALUES
        (?, ?, ?, ?, ?, ?)
`

app.post("/fridge", requiresAuth(), ( req, res ) => {
    db.execute(create_fridge_sql, [req.body.food_item_name, req.body.category_id, req.body.meal_id, req.body.expiration_date, req.body.quantity_and_unit, req.oidc.user.email], (error, results) => {
        console.log(req.body.expiration_date);
        if (DEBUG)
            console.log(error ? error : results);
        if (error)
            res.status(500).send(error); //Internal Server Error
        else {
            //results.insertId has the primary key (assignmentId) of the newly inserted row.
            res.redirect(`/fridge/${results.insertId}`);
        }
    });
});

const update_fridge_sql = `
    UPDATE
        fridge
    SET
        food_item_name = ?,
        category_id = ?,
        meal_id = ?,
        expiration_date = ?,
        quantity_and_unit = ?
    WHERE
        food_item_id = ?
    AND userId = ?
`
app.post("/fridge/:id", requiresAuth(), ( req, res ) => {
    db.execute(update_fridge_sql, [req.body.food_item_name, req.body.category_id, req.body.meal_id, req.body.expiration_date, req.body.quantity_and_unit, req.params.id, req.oidc.user.email], (error, results) => {
        if (DEBUG)
            console.log(error ? error : results);
        if (error)
            res.status(500).send(error); //Internal Server Error
        else {
            res.redirect(`/fridge/${req.params.id}`);
        }
    });
});

const delete_fridge_sql = `
    DELETE
    FROM
        fridge
    WHERE
        food_item_id = ?
    AND userId = ?
`

app.get("/fridge/:id/delete", requiresAuth(), ( req, res ) => {
    db.execute(delete_fridge_sql, [req.params.id, req.oidc.user.email], (error, results) => {
        if (DEBUG)
            console.log(error ? error : results);
        if (error)
            res.status(500).send(error); //Internal Server Error
        else {
            res.redirect("/fridge");
        }
    });
});

const read_food_categories_all_alphabetical_sql = `
    SELECT 
        food_category_id, food_category_name
    FROM
        food_categories
    WHERE 
        userid = ?
    ORDER BY
        food_category_name ASC
`

app.get('/categories', requiresAuth(), (req, res) => {
    db.execute(read_food_categories_all_alphabetical_sql, [req.oidc.user.email], (error, results) => {
        if (DEBUG)
            console.log(error ? error : results);
        if (error)
            res.status(500).send(error);
        else {
            res.render("categories", {foodCategoriesList: results});
        }
    });
});

app.get('/categorySearch', requiresAuth(), (req, res) => {
    db.execute(read_food_categories_all_alphabetical_sql, [req.oidc.user.email], (error, results) => {
        if (DEBUG)
            console.log(error ? error : results);
        if (error)
            res.status(500).send(error);
        else {
            res.render("categorySearch", {foodCategoriesList: results});
        }
    });
});

const create_based_on_search_sql = `
    SELECT
        food_item_name, 
        DATE_FORMAT(expiration_date, "%m/%d/%Y (%W)") as expiration_date_formatted,
        quantity_and_unit
    FROM
        fridge
    JOIN food_categories
        ON fridge.category_id = food_categories.food_category_id
    WHERE
        category_id = ?
        AND fridge.userId = ?
`

app.post('/categorySearchResults', requiresAuth(), (req, res) => {
    db.execute(create_based_on_search_sql, [req.body.category_id, req.oidc.user.email], (error, results) => {
        if (DEBUG)
            console.log(error ? error: results);
        if (error)
            res.status(500).send(error);
        else {
            let data = {fridgelist: results};
            res.render('categorySearchResults', data);
        }
    });
});

// const read_date_being_searched_sql = `
//     SELECT 
//         expiration_date
//     FROM 
//         fridge
//     WHERE
//         userId = ?
// `

// app.get('/dateSearch', requiresAuth(), (req, res) => {
//     db.execute(read_fridge_all_sql, [req.oidc.user.email], (error, results) => {
//         if (DEBUG)
//             console.log(error ? error : results);
//         if (error)
//             res.status(500).send(error);
//         else {
//             res.render("dateSearch", {fridge: results});
//         }
//     });
// });

// const date_based_search_sql = `
//     SELECT
//         food_item_name, 
//         DATE_FORMAT(expiration_date, "%m/%d/%Y (%W)") as expiration_date_formatted,
//         quantity_and_unit
//     FROM
//         fridge
//     WHERE
//         expiration_date <= ?
//         AND fridge.userId = ?
// `

// app.post('/dateSearchResults', requiresAuth(), (req, res) => {
//     db.execute(date_based_search_sql, [req.body.expiration_date, req.oidc.user.email], (error, results) => {
//         if (DEBUG)
//             console.log(error ? error: results);
//         if (error)
//             res.status(500).send(error);
//         else {
//             res.render('dateSearchResults', {fridgelist: results});
//         }
//     });
// });

const create_food_category_sql = `
    INSERT INTO food_categories
        (food_category_name, userid)
    VALUES
        (?, ?)
`

app.post('/categories', requiresAuth(), (req, res) => {
    db.execute(create_food_category_sql, [req.body.food_category_name, req.oidc.user.email], (error, results) => {
        if (DEBUG)
            console.log(error ? error: results);
        if (error)
            res.status(500).send(error);
        else {
            res.redirect("/categories");
        }
    });
});

const delete_food_category_sql = `
    DELETE
    FROM
        food_categories
    WHERE
        food_category_id = ?
        AND userid = ?
`

app.get("/categories/:id/delete", requiresAuth(), (req, res) => {
    db.execute(delete_food_category_sql, [req.params.id, req.oidc.user.email], (error, results) => {
        if (DEBUG)
            console.log(error ? error : results);
        if (error) {
            if (error.code == "ER_ROW_IS_REFERENCED_2") {
                res.status(500).send("There are food items still associated with that food category!")
            }
            else
                res.status(500).send(error);
        }
        else {
            res.redirect("/categories");
        }
    })
})



const read_meals_all_alphabetical_sql = `
    SELECT
        meal_id, meal_name
    FROM
        meals
    WHERE 
        userID = ?
    ORDER BY 
        meal_name ASC
`

app.get('/meals', requiresAuth(), (req, res) => {
    db.execute(read_meals_all_alphabetical_sql, [req.oidc.user.email], (error, results) => {
        if (DEBUG)
            console.log(error ? error : results);
        if (error)
            res.status(500).send(error);
        else {
            res.render("meals", {mealsList: results});
        }
    });
});

const create_meal_sql = `
    INSERT INTO meals
        (meal_name, userID)
    VALUES
        (?, ?)
`

app.post('/meals', requiresAuth(), (req, res) => {
    db.execute(create_meal_sql, [req.body.meal_name, req.oidc.user.email], (error, results) => {
        if (DEBUG)
            console.log(error ? error: results);
        if (error)
            res.status(500).send(error);
        else {
            res.redirect("/meals");
        }
    });
});

const delete_meal_sql = `
    DELETE
    FROM 
        meals
    WHERE
        meal_id = ?
        AND userID = ?
`

app.get("/meals/:id/delete", requiresAuth(), (req, res) => {
    db.execute(delete_meal_sql, [req.params.id, req.oidc.user.email], (error, results) => {
        if (DEBUG)
            console.log(error ? error : results);
        if (error) {
            if (error.code == "ER_ROW_IS_REFERENCED_2") {
                res.status(500).send("There are food items still associated with that meal!")
            }
            else
                res.status(500).send(error);
        }
        else {
            res.redirect("/meals");
        }
    })
})

// start the server
app.listen( port, () => {
    console.log(`App server listening on ${ port }. (Go to http://localhost:${ port })` );
} );