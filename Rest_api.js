//Will setup and handle the REST api endpoint for the app, sends a json payload back
//Will handle POST, GET and PATCH
/*  POST: /signup and /login
*   GET /user retrieving a user's profile, /verify a users account
*   PUT /user for creating workouts, exercises, ingredients and meals
*   PATCH /user userId updating a user's profile, workout, ingredients or meals
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

const server = app.listen(PORT, () => {
    console.log("Server Listening on PORT:", PORT);
});

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
            return res.status(400).send({
                status: 'HTTP/1.1 400 Bad Request',
                message: "user already exists"
            });
        }

        //insert new user
        await userConn.insertUser(username, password, email);

        const token = jwt.sign({ email }, 'key', { expiresIn: '10d' });

        const sender = process.env.EMAIL_USERNAME;
        const receiver = email;
        tokenSender.sendMail(sender, receiver, token);
    }
    catch(error)
    {
        return res.status(500).send({
            status: 'HTTP/1.1 500 Internal Server Error',
            message: error.message
        });
    }
    finally{
        if(userConn && typeof userConn.destruct === 'function')
        {
            userConn.destruct();
        }
    }

    res.status(200).send({
        status: 'HTTP/1.1 200 OK',
        message: 'User successfully created'
    });


});

app.post('/login', async (req, res) => {
    const user = req.body;

    let username = "";
    let email = "";
    
    if(!user || Object.keys(user).length === 0)
    {
        return res.status(400).send({
            status: 'HTTP/1.1 400 Bad Request',
            message: 'JSON body empty'
        });
    }
    
    if(!user.password && (!user.username || !user.email))
    {
        return res.status(400).send({
            staus: 'HTTP/1.1 400 Bad Request',
            message: 'username, email or password not included'
        });
    }
    else if(!user.username || !user.email)
    {
        if(!user.username)
        {
            email = user.email;
        }
        else if(!user.email)
        {
            username = user.username
        }

        return res.status(400).send({
            staus: 'HTTP/1.1 400 Bad Request',
            message: 'username or email not included'
        });
    }
    else
    {
        email = user.email;
        username = user.username;
    }
            
    const password = user.password;
    //check if user exists in the database
    const userConn = new UserDatabase();
    var loggedUser_id;

    try{
        if(!await userConn.verifyUser(username, email, password))
        {
            return res.status(400).send({
                status: 'HTTP/1.1 400 Bad Request',
                message: "user doesnt exists"
            });
        }
        loggedUser_id = userConn.getUserID(username, email);
        userConn.updateLastLogin(loggedUser_id);
    }
    catch(error)
    {
        return res.status(500).send({
            status: "HTTP/1.1 500 Internal Server Error",
            message: error.message
        });
    }
    finally{
        if(userConn && typeof userConn.destruct === 'function')
        {
            userConn.destruct();
        }
    }

    res.status(200).send({
        status: "HTTP/1.1 200 OK",
        message: "User succefully logged in",
        user_id: loggedUser_id
    });
})


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
            return res.status(400).send({
                status: 'HTTP/1.1 400 Bad Request',
                message: 'user doesnt exist'
            });
        }

        //check what type of GET request they want
        if(user.type === 'profile')
        {
            var username = userConn.getUsername(user_id);
            var lastLogin = userConn.getLastLogin(user_id);

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
                var workout = workoutConn.getWorkout(user_id);

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
            finally
            {
                if(workoutConn && typeof workoutConn.destruct === 'function')
                {
                    workoutConn.destruct();
                }
            }
        }
        else if(user.type === 'meals')
        {
            try{
                var nutritionConn = new NutritionDatabase();
                var meal = nutritionConn.getMeal(user_id);

                return res.status(200).send({
                    status: 'HTTP/1.1 200 OK',
                    message: 'All user Meals',
                    meal: meal
                });
            }
            catch(error)
            {
                return res.status(500).send({
                    status: 'HTTP/1.1 500 Internal Server Error',
                    message: error.message
                });
            }
            finally
            {
                if(nutritionConn && typeof nutritionConn.destruct === 'function')
                {
                    nutritionConn.destruct();
                }
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
                    message: error.message
                });
            }
            finally
            {
                if(nutritionConn && typeof nutritionConn.destruct === 'function')
                {
                    nutritionConn.destruct();
                }
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
    finally
    {
        if(userConn && typeof userConn.destruct === 'function')
        {
            userConn.destruct();
        }
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
            return res.status(400).send({
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
    finally{
        if(userConn && typeof userConn.destruct === 'function')
        {
            userConn.destruct();
        }
    }
});
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
    finally
    {
        if(userConn && typeof userConn.destruct === 'function')
        {
            userConn.destruct();
        }
    }

    if(user.type === 'workout')
    {
        const workoutConn = new WorkoutDatabase();
    
        if(!user.workout_name)
        {
            if(workoutConn && typeof workoutConn.destruct === 'function')
            {
                workoutConn.destruct();
            }

            return res.status(400).send({
                status: 'HTTP/1.1 400 Bad Request',
                message: 'Workout name not included'
            });
        }

        try
        {
            if(workoutConn.createWorkout(user.workout_name, user.user_id))
            {
                const workout_id = workoutConn.getWorkout(user.user_id).workout_id;
                const new_date = new Date();
                workoutConn.updateWorkoutDate(new_date, workout_id);

                return res.status(200).send({
                    status: "HTTP/1.1 200 OK",
                    message: "Workout successfully created"
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
        finally
        {
            if(workoutConn && typeof workoutConn.destruct === 'function')
            {
                workoutConn.destruct();
            }
        }
    }
    else if(user.type === 'exercise')
    {
        const exerciseConn = new ExerciseDatabase();

        //check if the workout_id is correct first
        try
        {
            const getWorkout = await exerciseConn.getFullWorkout(user.workout_id);
            if(!getWorkout)
            {
                return res.status(400).send({
                    status: 'HTTP/1.1 400 Bad Request',
                    message: 'workout doesnt exist'
                });
            }
        }
        catch(error)
        {
            if(exerciseConn && typeof exerciseConn.destruct === 'function')
            {
                exerciseConn.destruct();
            }

            return res.status(500).send({
                status: 'HTTP/1.1 500 Internal Server Error',
                message: error.message
            });
        }

        if(user.exercise_name === undefined || user.rep_range === undefined || user.sets === undefined || user.current_weight === undefined || user.goal_weight === undefined)
        {
            if(exerciseConn && typeof exerciseConn.destruct === 'function')
            {
                exerciseConn.destruct();
            }

            return res.status(400).send({
                status: 'HTTP/1.1 400 Bad Request',
                message: 'Invalid exercise'
            });
        }

        try
        {
            await exerciseConn.createExercise(user.exercise_name, user.rep_range, user.sets, user.current_weight, user.goal_weight, user.workout_id, user.notes);
            return res.status(200).send({
                status: "HTTP/1.1 200 OK",
                message: "Exercise successfully created"
            });
        }
        catch(error)
        {
            return res.status(500).send({
                status: "HTTP/1.1 500 Internal Server Error",
                message: error.message
            });
        }
        finally
        {
            if(exerciseConn && typeof exerciseConn.destruct === 'function')
            {
                exerciseConn.destruct();
            }
        }
    }
    else if(user.type === 'meal')
    {
        const nutritionConn = new NutritionDatabase();

        if(!user.meal_name)
        {
            if(nutritionConn && typeof nutritionConn.destruct === 'function')
            {
                nutritionConn.destruct();
            }

            return res.status(400).send({
                status: 'HTTP/1.1 400 Bad Request',
                message: 'Meal name not included'
            });
        }

        try
        {
            if(nutritionConn.createMeal(user.meal_name, user.user_id))
            {
                return res.status(200).send({
                    status: "HTTP/1.1 200 OK",
                    message: "Meal successfully created"
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
        finally
        {
            if(nutritionConn && typeof nutritionConn.destruct === 'function')
            {
                nutritionConn.destruct();
            }
        }
    }
    else if(user.type === 'ingredient')
    {
        const mealConn = new NutritionDatabase();

        //check if the meal_id is correct first
        try
        {
            if(!mealConn.getMeal(user.meal_id))
            {
                return res.status(400).send({
                    status: 'HTTP/1.1 400 Bad Request',
                    message: 'meal doesnt exist'
                });
            }
        }
        catch(error)
        {
            if(mealConn && typeof mealConn.destruct === 'function')
            {
                mealConn.destruct();
            }

            return res.status(500).send({
                status: 'HTTP/1.1 500 Internal Server Error',
                message: error.message
            });
        }

        if(user.ingredient_name  === undefined || user.calories  === undefined || user.protein  === undefined || user.carbs  === undefined || user.fat === undefined)
        {
            if(mealConn && typeof mealConn.destruct === 'function')
            {
                mealConn.destruct();
            }

            return res.status(400).send({
                status: 'HTTP/1.1 400 Bad Request',
                message: 'Invalid ingredient'
            });
        }

        if(mealConn && typeof mealConn.destruct === 'function')
        {
            mealConn.destruct();
        }

        //create ingredient
        const ingredientConn = new IngredientDatabase();
        try
        {
            await ingredientConn.createIngredient(user.ingredient_name, user.calories, user.protein, user.carbs, user.fat, user.meal_id);

            return res.status(200).send({
                status: "HTTP/1.1 200 OK",
                message: "Ingredient successfully created"
            });
        }
        catch(error)
        {
            return res.status(500).send({
                status: "HTTP/1.1 500 Internal Server Error",
                message: error.message
            });
        }
        finally
        {
            if(ingredientConn && typeof ingredientConn.destruct === 'function')
            {
                ingredientConn.destruct();
            }
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
    finally
    {
        if(userConn && typeof userConn.destruct === 'function')
        {
            userConn.destruct();
        }
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
        finally
        {
            if(workoutConn && typeof workoutConn.destruct === 'function')
            {
                workoutConn.destruct();
            }
        }
    }
    else if(user.type === 'exercise')
    {
        const exerciseConn = new ExerciseDatabase();
        try
        {
            if(user.update === 'name')
            {
                exerciseConn.updateName(user.name, user.exercise_id);
            }
            else if(user.update === 'rep_range')
            {
                exerciseConn.updateRepRange(user.rep_range, user.exercise_id);
            }
            else if(user.update === 'sets')
            {
                exerciseConn.updateSets(user.sets, user.exercise_id);
            }
            else if(user.update === 'current_weight')
            {
                exerciseConn.updateCurrentWeight(user.current_weight, user.exercise_id);
            }
            else if(user.update === 'goal_weight')
            {
                exerciseConn.updateGoalWeight(user.goal_weight, user.exercise_id);
            }
            else if(user.update === 'update notes')
            {
                exerciseConn.updateNotes(user.notes, user.exercise_id);
            }
            else if(user.update === 'append notes')
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
        finally
        {
            if(exerciseConn && typeof exerciseConn.destruct === 'function')
            {
                exerciseConn.destruct();
            }
        }
    }
    else if(user.type === 'meals')
    {
        const nutritionConn = new NutritionDatabase();
        try
        {
            if(user.update === 'name')
            {
                nutritionConn.updateName(user.name, user.meal_id);
            }
            else if(user.update === 'stats')
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
        finally
        {
            if(nutritionConn && typeof nutritionConn.destruct === 'function')
            {
                nutritionConn.destruct();
            }
        }
    }
    else if(user.type === 'ingredient')
    {
        const ingredientConn = new IngredientDatabase();
        try
        {
            if(user.update === 'name')
            {
                await ingredientConn.updateName(user.name, user.ingredient_id);
            }
            else if(user.update === 'calories')
            {
                await ingredientConn.updateCalories(user.calories, user.ingredient_id);
            }
            else if(user.update === 'joules')
            {
                await ingredientConn.updateJoules(user.kilojoules, user.ingredient_id);
            }
            else if(user.update === 'protein')
            {
                await ingredientConn.updateProtein(user.protein, user.ingredient_id);
            }
            else if(user.update === 'carbs')
            {
                await ingredientConn.updateCarbs(user.carbs, user.ingredient_id);
            }
            else if(user.update === 'fat')
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
        finally
        {
            if(ingredientConn && typeof ingredientConn.destruct === 'function')
            {
                ingredientConn.destruct();
            }
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
            return res.status(400).send({
                status: 'HTTP/1.1 400 Bad Request',
                message: 'user doesnt exist'
            });
        }

        if(user.type === 'profile')
        {
            await userConn.deleteUser(user.user_id);
            return res.status(200).send({
                status: 'HTTP/1.1 200 OK',
                message: 'User successfully deleted'
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
    finally
    {
        if(userConn && typeof userConn.destruct === 'function')
        {
            userConn.destruct();
        }
    }

    if(user.type === 'workout')
    {
        const workoutConn = new WorkoutDatabase();

        try
        {
            const getWorkout = await workoutConn.getWorkout(user.workout_id);
            if(!getWorkout)
            {
                return res.status(400).send({
                    status: 'HTTP/1.1 400 Bad Request',
                    message: 'workout doesnt exist'
                });
            }
            else
            {
                workoutConn.deleteWorkout(user.workout_id);
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
                message: error.message
            });
        }
        finally
        {
            if(workoutConn && typeof workoutConn.destruct === 'function')
            {
                workoutConn.destruct();
            }
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
                exerciseConn.deleteExercise(user.exercise_id);
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
                message: error.message
            });
        }
        finally
        {
            if(exerciseConn && typeof exerciseConn.destruct === 'function')
            {
                exerciseConn.destruct();
            }
        }
    }
    else if(user.type === 'meals')
    {
        const nutritionConn = new NutritionDatabase();

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
                nutritionConn.deleteMeal(user.meal_id);
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
        finally
        {
            if(nutritionConn && typeof nutritionConn.destruct === 'function')
            {
                nutritionConn.destruct();
            }
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
        finally
        {
            if(ingredientConn && typeof ingredientConn.destruct === 'function')
            {
                ingredientConn.destruct();
            }
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

module.exports = {app, server};