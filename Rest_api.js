//Will setup and handle the REST api endpoint for the app, sends a json payload back
//Will handle POST, GET and PATCH
/*  POST: /signup and /login
*   GET /user retrieving a user's profile, /verify a users account, /reset a users password
*   PUT /user for creating workouts, exercises, ingredients and meals
*   PATCH /user userId updating a user's profile, workout, ingredients or meals, /forgot-password send an email to reset a users password
*   DELETE /user userId deleting a user's profile, workout or meals
*/

require('dotenv').config({path: 'config.env'});
const express = require('express');
const jwt = require('jsonwebtoken');
const {UserDatabase, WorkoutDatabase, ExerciseDatabase, NutritionDatabase, IngredientDatabase} = require('./db_connection');
const tokenSender = require('./tokenSender');

const PORT = process.env.PORT || 3000;
const app = express();
app.use(express.json());

if(require.main === module){
    app.listen(PORT, () => {
        console.log("Server listening on PORT:", PORT);
    });
}

app.post('/signup', async (req, res) => {
    
    const newUser = req.body;

    if(!newUser || Object.keys(newUser).length === 0)
    {
        return res.status(400).send({
            status: 'HTTP/1.1 400 Bad Request',
            message: 'JSON body empty'
        });
    }
    if(!newUser.username || !newUser.email || !newUser.password)
    {
        return res.status(400).send({
            staus: 'HTTP/1.1 400 Bad Request',
            message: 'username, email or password not included'
        });
    }
            
    const username = newUser.username;
    const email = newUser.email;
    const password = newUser.password;

    //Check if username, email and password is valid
    //Username will be valid if the length of the string is > 5
    //Password will require to be at least 8 characters, including numbers, special character and upper and lower case letters
    //email will have to be a valid email

    if(username.length <= 5)
    {
        return res.status(400).send({
            status: 'HTTP/1.1 400 Bad Request',
            message: 'username invalid'
        });
    }

    if(!validateEmail(email))
    {
        return res.status(400).send({
            status: 'HTTP/1.1 400 Bad Request',
            message: 'email address invalid'
        });
    }

    if(password.length < 8 || !validPassword(password))
    {
        return res.status(400).send({
            status : 'HTTP/1.1 400 Bad Request',
            message : 'invalid password'
        });
    }

    //username, email and password are now valid

    const userConn = new UserDatabase();
    
    try{
        //Check for duplicate user
        if(await userConn.checkUserExists(username, email))
        {
            return res.status(403).send({
                status: 'HTTP/1.1 403 Bad Request',
                message: "user already exists"
            });
        }

        //insert new user
        const response = await userConn.insertUser(username, password, email);

        //get new user id
        const loggedUser_id = response.insertId;

        // const sender = process.env.EMAIL_USERNAME;
        // const receiver = email;
        // tokenSender.sendMail(sender, receiver);

        
        return res.status(200).send({
            status: 'HTTP/1.1 200 OK',
            message: 'User successfully created',
            user_id: loggedUser_id
        });
    }
    catch(error)
    {
        return res.status(500).send({
            status: 'HTTP/1.1 500 Internal Server Error',
            message: error.message
        });
    }
});

app.post('/login', async (req, res) => {
    const user = req.body;

    let username = user.username || "";
    let email = user.email || "";
    
    if(!user || Object.keys(user).length === 0)
    {
        return res.status(400).send({
            status: 'HTTP/1.1 400 Bad Request',
            message: 'JSON body empty'
        });
    }
    
    if(!user.password || (!user.username && !user.email))
    {
        return res.status(400).send({
            staus: 'HTTP/1.1 400 Bad Request',
            message: 'username or email and password must be included'
        });
    }
            
    const password = user.password;
    //check if user exists in the database
    const userConn = new UserDatabase();
    let loggedUser_id;

    try{
        if(!await userConn.verifyUser(username, email, password))
        {
            return res.status(400).send({
                status: 'HTTP/1.1 400 Bad Request',
                message: "user doesnt exists"
            });
        }
        loggedUser_id = await userConn.getUserID(username, email, password);
        await userConn.updateLastLogin(loggedUser_id);

        return res.status(200).send({
            status: "HTTP/1.1 200 OK",
            message: "User succefully logged in",
            user_id: loggedUser_id
        });
    }
    catch(error)
    {
        return res.status(500).send({
            status: "HTTP/1.1 500 Internal Server Error",
            message: error
        });
    }
});

//user profile retrieval
app.get('/user', async (req, res) => {
    const user = req.body;

    if(!user || Object.keys(user).length === 0)
    {
        return res.status(400).send({
            status: 'HTTP/1.1 400 Bad Request',
            message: 'JSON body empty'
        });
    }

    //verify that the user_id is included in the request and correct
    const userConn = new UserDatabase();
    const user_id = user.user_id;

    try
    {
        const userExists = await userConn.verifyUserID(user_id);

        if(!userExists)
        {
            return res.status(403).send({
                status: 'HTTP/1.1 403 Forbidden',
                message: 'user doesnt exist'
            });
        }

        //check what type of GET request they want
        if(user.type === 'profile')
        {
            var username = await userConn.getUsername(user_id);
            var lastLogin = await userConn.getLastLogin(user_id);

            return res.status(200).send({
                status: 'HTTP/1.1 200 OK',
                message: 'User Profile',
                username: username,
                lastLogin: lastLogin
            });
        }
        else if(user.type === 'workout')
        {
            try{
                var workoutConn = new WorkoutDatabase();
                var workout = await workoutConn.getWorkout(user_id);
                workout.last_workout = convertDateTime(new Date(workout.last_workout));

                return res.status(200).send({
                    status: 'HTTP/1.1 200 OK',
                    message: 'User Workout',
                    workout: workout
                });
            }
            catch(error)
            {
                return res.status(500).send({
                    status: 'HTTP/1.1 500 Internal Server Error',
                    message: error.message
                });
            }
        }
        else if(user.type == 'exercise')
        {
            try{
                var exerciseConn = new ExerciseDatabase();
                var exercise = await exerciseConn.getFullWorkout(user.workout_id);
                
                return res.status(200).send({
                    status: 'HTTP/1.1 500 Internal Server Error',
                    message: "Successfully retrived workout exercises",
                    data: exercise
                });
            }
            catch(error)
            {
                return res.status(500).send({
                    status: 'HTTP/1.1 500 Internal Server Error',
                    message: error
                });
            }
        }
        else if(user.type === 'meals')
        {
            try{
                var nutritionConn = new NutritionDatabase();
                var meal = await nutritionConn.getAllMeal(user_id);

                return res.status(200).send({
                    status: 'HTTP/1.1 200 OK',
                    message: 'All user meals',
                    meal: meal
                });
            }
            catch(error)
            {
                return res.status(500).send({
                    status: 'HTTP/1.1 500 Internal Server Error',
                    message: error
                });
            }
        }
        else if(user.type === 'meal-stats')
        {
            try{
                var nutritionConn = new NutritionDatabase();
                var meal = nutritionConn.getStats(user.meal_id);

                return res.status(200).send({
                    status: 'HTTP/1.1 200 OK',
                    message: 'Meal Stats',
                    meal: meal
                });
            }
            catch(error)
            {
                return res.status(500).send({
                    status: 'HTTP/1.1 500 Internal Server Error',
                    message: error
                });
            }
        }
        else if(user.type === "All-Ingredients")
        {
            try{
                var ingredientConn = new IngredientDatabase();
                const ingredients = await ingredientConn.getAllIngredients(user.meal_id);
                
                return res.status(200).send({
                    status: 'HTTP/1.1 200 OK',
                    message: 'Succesfully retrieved all ingredients',
                    meal_ingredients: ingredients
                });
            }
            catch(error)
            {
                return res.status(500).send({
                    status: 'HTTP/1.1 500 Internal Server Error',
                    message: error
                });
            }
        }
        else if(user.type === 'ingredient')
        {
            try{
                var ingredientConn = new IngredientDatabase();
                const ingredient = await ingredientConn.getIngredient(user.ingredient_id);

                return res.status(200).send({
                    status: 'HTTP/1.1 200 OK',
                    message: 'Succesfully retrieved ingredient',
                    ingredient: ingredient
                });
            }
            catch(error)
            {
                return res.status(500).send({
                    status: 'HTTP/1.1 500 Internal Server Error',
                    message: error
                });
            }
        }
        else
        {
            return res.status(400).send({
                status: 'HTTP/1.1 400 Bad Request',
                message: 'Invalid get type'
            });
        }
    }
    catch(error)
    {
        return res.status(500).send({
            status: "HTTP/1.1 500 Internal Server Error",
            message: error.message
        });
    }
});
app.get('/verify', async (req, res) => {

    const token = req.query.token;

    if(!token)
    {
        return res.status(400).send({
            status: 'HTTP/1.1 400 Bad Request',
            message: 'Token not found'
        });
    }

    const userConn = new UserDatabase();
    try{
        const decode = jwt.verify(token, 'ourSecretKey');
        const email = decode.email;

        if(!await userConn.verifyEmail(email))
        {
            return res.status(403).send({
                status: 'HTTP/1.1 400 Bad Request',
                message: 'user doesnt exist'
            });
        }

        res.status(200).send({
            status: 'HTTP/1.1 200 OK',
            message: 'Email successfully verified'
        });
    }
    catch(error)
    {
        return res.status(500).send({
            status: "HTTP/1.1 500 Internal Server Error",
            message: error.message
        });
    }
});
app.get('/reset', async(req, res) => {
    const token = req.query.token;

    if(!token)
    {
        return res.status(400).send({
            status: 'HTTP/1.1 400 Bad Request',
            message: 'Token not found'
        });
    }

    const userConn = new UserDatabase();
    try{
        const decode = jwt.verify(token, 'ourSecretKey');
        const email = decode.email;

        if(!await userConn.verifyEmail(email))
        {
            return res.status(403).send({
                status: 'HTTP/1.1 400 Bad Request',
                message: 'user doesnt exist'
            });
        }

        if(await userConn.updatePassword(email))
        {
            res.status(200).send({
                status: 'HTTP/1.1 200 OK',
                message: 'Email successfully verified'
            });
        }
        else
        {
            return res.status(500).send({
                status: "HTTP/1.1 500 Internal Server Error",
                message: error.message
            });
        }
    }
    catch(error)
    {
        return res.status(500).send({
            status: "HTTP/1.1 500 Internal Server Error",
            message: error.message
        });
    }
})
app.put('/user', async (req, res) => {
    const user = req.body;

    if(!user || Object.keys(user).length === 0)
    {
        return res.status(400).send({
            status: 'HTTP/1.1 400 Bad Request',
            message: 'JSON body empty'
        });
    }

    const userConn = new UserDatabase();

    try{
        const userExists = await userConn.verifyUserID(user.user_id);
        if(!userExists)
        {
            return res.status(400).send({
                status: 'HTTP/1.1 400 Bad Request',
                message: 'user doesnt exist'
            });
        }
    }
    catch(error)
    {
        return res.status(500).send({
            status: "HTTP/1.1 500 Internal Server Error",
            message: error.message
        });
    }

    if(user.type === 'workout')
    {
        const workoutConn = new WorkoutDatabase();
    
        if(!user.workout_name)
        {
            return res.status(400).send({
                status: 'HTTP/1.1 400 Bad Request',
                message: 'Workout name not included'
            });
        }

        try
        {
            if(workoutConn.createWorkout(user.workout_name, user.user_id))
            {
                const workoutReq = await workoutConn.getWorkout(user.user_id);
                
                let workoutId;
                if(Array.isArray(workoutReq))
                {
                    workoutId = workoutReq[workoutReq.length-1].workout_id;
                }
                else
                {
                    workoutId = workoutReq.workout_id;
                }
                const new_date = new Date();
                await workoutConn.updateWorkoutDate(new_date, workoutId);

                return res.status(200).send({
                    status: "HTTP/1.1 200 OK",
                    message: "Workout successfully created",
                    workout_id: workoutId
                });
            }
        }
        catch(error)
        {
            return res.status(500).send({
                status: "HTTP/1.1 500 Internal Server Error",
                message: error.message
            });
        }
    }
    else if(user.type === 'exercise')
    {
        const exerciseConn = new ExerciseDatabase();

        //check if the workout_id is correct first
        try
        {
            if(!await exerciseConn.workoutExists(user.workout_id))
            {
                return res.status(400).send({
                    status: 'HTTP/1.1 400 Bad Request',
                    message: 'workout doesnt exist'
                });
            }
        }
        catch(error)
        {
            return res.status(500).send({
                status: 'HTTP/1.1 500 Internal Server Error',
                message: error
            });
        }

        if(user.exercise_name === undefined || user.rep_range === undefined || user.sets === undefined || user.current_weight === undefined || user.goal_weight === undefined)
        {

            return res.status(400).send({
                status: 'HTTP/1.1 400 Bad Request',
                message: 'Invalid exercise'
            });
        }

        try
        {
            const exerciseReq = await exerciseConn.createExercise(user.exercise_name, user.rep_range, user.sets, user.current_weight, user.goal_weight, user.workout_id, user.notes);
            return res.status(200).send({
                status: "HTTP/1.1 200 OK",
                message: "Exercise successfully created",
                exercise_id: exerciseReq.insertId
            });
        }
        catch(error)
        {
            return res.status(500).send({
                status: "HTTP/1.1 500 Internal Server Error",
                message: error
            });
        }
    }
    else if(user.type === 'meal')
    {
        const nutritionConn = new NutritionDatabase();

        if(!user.meal_name)
        {
            return res.status(400).send({
                status: 'HTTP/1.1 400 Bad Request',
                message: 'Meal name not included'
            });
        }

        try
        {
            const mealCreate = await nutritionConn.createMeal(user.meal_name, user.user_id);
            if(mealCreate)
            {
                return res.status(200).send({
                    status: "HTTP/1.1 200 OK",
                    message: "Meal successfully created",
                    meal_id: mealCreate.insertId
                });
            }
        }
        catch(error)
        {
            return res.status(500).send({
                status: "HTTP/1.1 500 Internal Server Error",
                message: error
            });
        }
    }
    else if(user.type === 'ingredient')
    {
        const mealConn = new NutritionDatabase();

        //check if the meal_id is correct first
        try
        {
            if(!await mealConn.getMeal(user.meal_id))
            {
                return res.status(400).send({
                    status: 'HTTP/1.1 400 Bad Request',
                    message: 'meal doesnt exist'
                });
            }
        }
        catch(error)
        {
            return res.status(500).send({
                status: 'HTTP/1.1 500 Internal Server Error',
                message: error
            });
        }

        if(user.ingredient_name  === undefined || user.calories  === undefined || user.protein  === undefined || user.carbs  === undefined || user.fat === undefined)
        {
            return res.status(400).send({
                status: 'HTTP/1.1 400 Bad Request',
                message: 'Invalid ingredient'
            });
        }

        //create ingredient
        const ingredientConn = new IngredientDatabase();
        let ingredientId;
        try
        {
            if(!user.calories)
            {
                ingredientId = await ingredientConn.createIngredient(
                    user.ingredient_name, 
                    0,
                    user.kilojoules, 
                    user.protein, 
                    user.carbs, 
                    user.fat, 
                    user.meal_id).insertId;
            }
            else if(!user.kilojoules)
            {
                ingredientId = await ingredientConn.createIngredient(
                    user.ingredient_name, 
                    user.calories,
                    0, 
                    user.protein, 
                    user.carbs, 
                    user.fat, 
                    user.meal_id);
            }
            else
            {
                return res.status(400).send({
                    status: "HTTP/1.1 400 Bad Request",
                    message: "Please provide either calories or kilojoules"
                });
            }

            ingredientId = ingredientId.insertId;

            return res.status(200).send({
                status: "HTTP/1.1 200 OK",
                message: "Ingredient successfully created",
                ingredient_id: ingredientId
            });
        }
        catch(error)
        {
            return res.status(500).send({
                status: "HTTP/1.1 500 Internal Server Error",
                message: error
            });
        }
    }
    else
    {
        return res.status(400).send({
            status: 'HTTP/1.1 400 Bad Request',
            message: 'Invalid put type'
        });
    }
});
app.patch('/user', async (req, res) => {

    const user = req.body;

    if(!user || Object.keys(user).length === 0)
    {
        return res.status(400).send({
            status: 'HTTP/1.1 400 Bad Request',
            message: 'JSON body empty'
        });
    }
    const userConn = new UserDatabase();

    try{
        if(!await userConn.verifyUserID(user.user_id))
        {
            return res.status(400).send({
                status: 'HTTP/1.1 400 Bad Request',
                message: 'user doesnt exist'
            });
        }
    }
    catch(error)
    {
        return res.status(500).send({
            status: "HTTP/1.1 500 Internal Server Error",
            message: error.message
        });
    }

    if(user.type === 'workout')
    {
        const workoutConn = new WorkoutDatabase();
        try
        {
            if(user.update === 'date')
            {
                const new_date = new Date();
                await workoutConn.updateWorkoutDate(new_date, user.workout_id);
            }
            else if(user.update === 'name')
            {
                await workoutConn.updateName(user.name, user.workout_id);
            }
            else
            {
                return res.status(400).send({
                    status: 'HTTP/1.1 400 Bad Request',
                    message: 'Invalid workout update'
                });
            }

            return res.status(200).send({
                status: 'HTTP/1.1 200 OK',
                message: 'Update successful'
            });
        }
        catch(error)
        {
            return res.status(500).send({
                status: "HTTP/1.1 500 Internal Server Error",
                message: error.message
            });
        }
    }
    else if(user.type === 'exercise')
    {
        if(!user.exercise_id)
        {
            return res.status(400).send({
                status: 'HTTP/1.1 400 Bad Request',
                message: 'exercise_id missing'
            });
        }
        
        const exerciseConn = new ExerciseDatabase();
        try
        {
            for(let i = 0; i < user.update.length; i++)
            {
                if(user.update[i] === 'name')
                {
                    exerciseConn.updateName(user.name, user.exercise_id);
                }
                else if(user.update[i] === 'rep_range')
                {
                    exerciseConn.updateRepRange(user.rep_range, user.exercise_id);
                }
                else if(user.update[i] === 'sets')
                {
                    exerciseConn.updateSets(user.sets, user.exercise_id);
                }
                else if(user.update[i] === 'current_weight')
                {
                    exerciseConn.updateCurrentWeight(user.current_weight, user.exercise_id);
                }
                else if(user.update[i] === 'goal_weight')
                {
                    exerciseConn.updateGoalWeight(user.goal_weight, user.exercise_id);
                }
                else if(user.update[i] === 'update notes')
                {
                    exerciseConn.updateNotes(user.notes, user.exercise_id);
                }
                else if(user.update[i] === 'append notes')
                {
                    exerciseConn.appendNotes(user.notes, user.exercise_id);
                }
                else
                {
                    return res.status(400).send({
                        status: 'HTTP/1.1 400 Bad Request',
                        message: 'Invalid exercise update'
                    });
                }
            }

            return res.status(200).send({
                status: 'HTTP/1.1 200 OK',
                message: 'Update successful'
            });
        }
        catch(error)
        {
            return res.status(500).send({
                status: "HTTP/1.1 500 Internal Server Error",
                message: error.message
            });
        }
    }
    else if(user.type === 'meals')
    {
        const nutritionConn = new NutritionDatabase();
        try
        {
            for(let i = 0; i < user.update.length; i++)
            {
                if(user.update[i] === 'name')
                {
                    nutritionConn.updateName(user.name, user.meal_id);
                }
                else if(user.update[i] === 'stats')
                {
                    nutritionConn.updateStats(user.meal_id, stats);
                }
                else
                {
                    return res.status(400).send({
                        status: 'HTTP/1.1 400 Bad Request',
                        message: 'Invalid meal update'
                    });
                }
            }

            return res.status(200).send({
                status: 'HTTP/1.1 200 OK',
                message: 'Update successful'
            });
        }
        catch(error)
        {
            return res.status(500).send({
                status: "HTTP/1.1 500 Internal Server Error",
                message: error.message
            });
        }
    }
    else if(user.type === 'ingredient')
    {
        const ingredientConn = new IngredientDatabase();
        try
        {
            for(let i = 0; i < user.update.length; i++)
            {

                if(user.update[i] === 'name')
                {
                    await ingredientConn.updateName(user.name, user.ingredient_id);
                }
                else if(user.update[i] === 'calories')
                {
                    await ingredientConn.updateCalories(user.calories, user.ingredient_id);
                }
                else if(user.update[i] === 'joules')
                {
                    await ingredientConn.updateJoules(user.kilojoules, user.ingredient_id);
                }
                else if(user.update[i] === 'protein')
                {
                    await ingredientConn.updateProtein(user.protein, user.ingredient_id);
                }
                else if(user.update[i] === 'carbs')
                {
                    await ingredientConn.updateCarbs(user.carbs, user.ingredient_id);
                }
                else if(user.update[i] === 'fat')
                {
                    await ingredientConn.updateFat(user.fat, user.ingredient_id);
                }
                else
                {
                    return res.status(400).send({
                        status: 'HTTP/1.1 400 Bad Request',
                        message: 'Invalid ingredient update'
                    });
                }
            }

            return res.status(200).send({
                status: 'HTTP/1.1 200 OK',
                message: 'Update successful'
            });
        }
        catch(error)
        {
            return res.status(500).send({
                status: "HTTP/1.1 500 Internal Server Error",
                message: error.message
            });
        }
    }
    else
    {
        return res.status(400).send({
            status: 'HTTP/1.1 400 Bad Request',
            message: 'Invalid patch type'
        });
    }
});
app.patch('/forgot-password', async(req, res) => {
    const user = req.body;

    if(!user || Object.keys(user).length === 0)
    {
        return res.status(400).send({
            status: 'HTTP/1.1 400 Bad Request',
            message: 'JSON body empty'
        });
    }
    else if(!user.email)
    {
        return res.status(400).send({
            status: 'HTTP/1.1 400 Bad Request', 
            message: 'email not provided'
        });
    }

    const userConn = new UserDatabase();

    try{
        const verifyUser = await userConn.verifyEmail(user.email);
        if(!verifyUser)
        {
            return res.status(403).send({
                status: 'HTTP/1.1 403 Bad Request',
                message: 'user doesnt exist'
            });
        }
        else
        {
            const sender = process.env.EMAIL_USERNAME;
            const receiver = user.email;
            tokenSender.sendResetMail(sender, receiver);

            return res.status(200).send({
                status: 'HTTP/1.1 200 OK',
                message: 'Reset email sent successfully'
            });
        }
    }
    catch(error)
    {
        return res.status(500).send({
            status: 'HTTP/1.1 500 Internal Server Error',
            message: error.message
        });
    }
})
app.delete('/user', async (req, res) => {
    const user = req.body;

    if(!user || Object.keys(user).length === 0)
    {
        return res.status(400).send({
            status: 'HTTP/1.1 400 Bad Request',
            message: 'JSON body empty'
        });
    }

    const userConn = new UserDatabase();

    try{
        const verifyUser = await userConn.verifyUserID(user.user_id);
        if(!verifyUser)
        {
            return res.status(403).send({
                status: 'HTTP/1.1 403 Bad Request',
                message: 'user doesnt exist'
            });
        }
    }
    catch(error)
    {
        return res.status(500).send({
            status: "HTTP/1.1 500 Internal Server Error",
            message: error.message
        });
    }

    if(user.type === 'workout')
    {
        const workoutConn = new WorkoutDatabase();
        const exerciseConn = new ExerciseDatabase();

        try
        {
            if(!await workoutConn.getWorkout(user.user_id))
            {
                return res.status(400).send({
                    status: 'HTTP/1.1 400 Bad Request',
                    message: 'workout doesnt exist'
                });
            }
            else
            {
                const allExercises = await exerciseConn.getFullWorkout(user.workout_id);

                if(allExercises !== false)
                {
                    for(const exercise of allExercises)
                    {
                        await exerciseConn.deleteExercise(exercise.exercise_id);
                    }
                }

                await workoutConn.deleteWorkout(user.workout_id);
                return res.status(200).send({
                    status: 'HTTP/1.1 200 OK',
                    message: 'Workout successfully deleted'
                });
            }
        }
        catch(error)
        {
            return res.status(500).send({
                status: "HTTP/1.1 500 Internal Server Error",
                message: error
            });
        }
    }
    else if(user.type === 'exercise')
    {
        const exerciseConn = new ExerciseDatabase();

        try
        {
            const getExercise = await exerciseConn.getExercise(user.exercise_id);
            if(!getExercise)
            {
                return res.status(400).send({
                    status: 'HTTP/1.1 400 Bad Request',
                    message: 'exercise doesnt exist'
                });
            }
            else
            {
                await exerciseConn.deleteExercise(user.exercise_id);
                return res.status(200).send({
                    status: 'HTTP/1.1 200 OK',
                    message: 'Exercise successfully deleted'
                });
            }
        }
        catch(error)
        {
            return res.status(500).send({
                status: "HTTP/1.1 500 Internal Server Error",
                message: error
            });
        }
    }
    else if(user.type === 'meals')
    {
        const nutritionConn = new NutritionDatabase();
        const ingredientConn = new IngredientDatabase();

        try
        {
            const getMeal = await nutritionConn.getMeal(user.meal_id);
            if(!getMeal)
            {
                return res.status(400).send({
                    status: 'HTTP/1.1 400 Bad Request',
                    message: 'meal doesnt exist'
                });
            }
            else
            {
                const getIngredient = await ingredientConn.getAllIngredients(user.meal_id);

                if(getIngredient !== false)
                {
                    for(const ingredient of getIngredient)
                    {
                        await ingredientConn.deleteIngredient(ingredient.ingredient_id);
                    }
                }

                await nutritionConn.deleteMeal(user.meal_id);
                return res.status(200).send({
                    status: 'HTTP/1.1 200 OK',
                    message: 'Meal successfully deleted'
                });
            }
        }
        catch(error)
        {
            return res.status(500).send({
                status: "HTTP/1.1 500 Internal Server Error",
                message: error.message
            });
        }
    }
    else if(user.type === 'ingredient')
    {
        const ingredientConn = new IngredientDatabase();

        try
        {
            const getIngredient = await ingredientConn.getIngredient(user.ingredient_id);
            if(!getIngredient)
            {
                return res.status(400).send({
                    status: 'HTTP/1.1 400 Bad Request',
                    message: 'ingredient doesnt exist'
                });
            }
            else
            {
                ingredientConn.deleteIngredient(user.ingredient_id);
                return res.status(200).send({
                    status: 'HTTP/1.1 200 OK',
                    message: 'Ingredient successfully deleted'
                });
            }
        }
        catch(error)
        {
            return res.status(500).send({
                status: "HTTP/1.1 500 Internal Server Error",
                message: error.message
            });
        }
    }
    else
    {
        return res.status(400).send({
            status: 'HTTP/1.1 400 Bad Request',
            message: 'Invalid delete type'
        });
    }
})
function validPassword(password)
{
    let specialChars =/[`!@#$%^&*()_\-+=\[\]{};':"\\|,.<>\/?~ ]/;

    return (/\d/.test(password) && specialChars.test(password) && /[A-Z]/.test(password) && /[a-z]/.test(password));
}
function validateEmail(email)
{
    return String(email)
        .toLowerCase()
        .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        );
}
function convertDateTime(date) {
    const pad = (n) => n < 10 ? '0' + n : n;
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}


process.on("SIGINT", async() => {
    console.log("Shutting down server");
    await UserDatabase.destruct();
    await WorkoutDatabase.destruct();
    await ExerciseDatabase.destruct();
    await NutritionDatabase.destruct();
    await IngredientDatabase.destruct();
    process.exit(0);
});
module.exports = app;