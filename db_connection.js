/*This file will be used to connect to the database itself, using the singleton design pattern*/

require('dotenv').config({ path : 'config.env' });

const mysql = require('mysql');
const bcrypt = require('bcryptjs');
const { TokenSender } = require('./tokenSender');
const { resolveHostname } = require('nodemailer/lib/shared');

//Gloabl function that is used throughout classes
function formatDate(datetime)
{
    const year = datetime.getFullYear();
    const month = String(datetime.getMonth() + 1).padStart(2, '0');
    const day = String(datetime.getDate()).padStart(2, '0');
    const hours = String(datetime.getHours()).padStart(2, '0');
    const minutes = String(datetime.getMinutes()).padStart(2, '0');
    const seconds = String(datetime.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

class UserDatabase{

    constructor(){

        if(UserDatabase.instance){
            return UserDatabase.instance;
        }

        this.conn = mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_DATABASE,
            port: process.env.DB_PORT
        });

        this.conn.connect((error) => {
            if(error) throw error;
            console.log("Database connected successfully");
        });

        UserDatabase.instance = this;
    }
    async verifyUser(username, email, password)
    {
        try{
            const sql = "SELECT username, email, password FROM users where username = ? OR email = ?";
            const results = await new Promise((resolve, reject) => {
                this.conn.query(sql, [username, email], (error, results) => {
                    if (error) return reject(error);
                    resolve(results);
                });
            });
            
            if(results.length === 0)
            {
                return false;
            }
            else if(username !== "" && username !== results[0].username)
            {
                return false;
            }
            else if(email !== "" && email !== results[0].email)
            {
                return false;
            }                

            const match = await bcrypt.compare(password, results[0].password);
            if(!match)
            {
                return false;
            }

            // const sql_update = "UPDATE users SET Last_Login = ? WHERE id = ?";
            // await new Promise((resolve, reject) => {
            //     this.conn.query(sql_update, [formatDate(new Date()), results[0].id], (error) => {
            //         if (error) return reject(error);
            //         resolve();
            //     });
            // });
            return true;
        }
        catch(error)
        {
            throw error;
        }
    }
    verifyUserID(id)
    {
        return new Promise((resolve, reject) => {
            const sql = "SELECT ID FROM users where ID = ?";

            this.conn.query(sql, [id], (error, results) => {
                if(error)
                {
                    return reject(error);
                }
                if(results.length === 0)
                {
                    return resolve(false);
                }

                return resolve(true);
            });
        });
    }
    checkUserExists(username, email)
    {
        return new Promise((resolve, reject) => {
            const sql = "SELECT * FROM users WHERE username = ? OR email = ?";
    
            this.conn.query(sql, [username, email], (error, results) =>{
                if(error)
                {
                    reject(error);
                }
                if(results.length > 0)
                {
                    return resolve(true);
                }

                return resolve(false);
            });
        });
    }
    insertUser(username, password, email)
    {
        return new Promise((resolve, reject) => {

            //Encrypt password
            bcrypt.genSalt(10, (error, Salt) => {
                if(error) return reject(error);

                bcrypt.hash(password, Salt, (error, hash) => {
                    if(error) return reject(error);

                    const sql = "INSERT INTO users (username, email, password, Last_Login, verified) VALUES (?, ?, ?, ?, ?)" ;

                    this.conn.query(sql, [username, email, hash, formatDate(new Date()), false], (error, results) => {
                        if(error) {
                            return reject(error);
                        }

                        //Temp email
                        // const senderEmail = 'seanmaritz1304@gmail.com';
                        
                        // const emailSender = new TokenSender();
                        // emailSender.sendEmail(senderEmail, email);

                        resolve(results);
                    });
                });
            });
        });
    }
    async getUserID(username, email)
    {
        return new Promise((resolve, reject) => {
            const sql = "SELECT ID FROM users where username = ? OR email = ?";

            this.conn.query(sql, [username, email], (error, results) => {
                if(error){
                    return reject(error);
                }
                if(results.length === 0)
                {
                    return reject(false);
                }
                return resolve(results[0].ID);
            });
        })
    }
    getUsername(id)
    {
        return new Promise((resolve, reject) => {
            const sql = "SELECT username FROM users WHERE id = ?";

            this.conn.query(sql, [id], (error, results) => {
                if(error)
                {
                    return reject(error);
                }
                if(results.length === 0)
                {
                    return reject(false);
                }
                return resolve(results[0].username);
            });
        });
    }
    verifyEmail(email)
    {
        return new Promise((resolve, reject) => {

            const sql = "SELECT verified FROM users where email = ?";

            this.conn.query(sql, [email], (error, results) => {
                if(error)
                {
                    return reject(error);
                }
                if(results.length === 0)
                {
                    return reject(false);
                }

                if(results[0].verified === null || results[0].verified === false)
                {
                    const verifyUser = "UPDATE users SET verified = true WHERE email = ?";

                    this.conn.query(verifyUser, [id], (error) => {
                        if(error)
                        {
                            return reject(error);
                        }

                        resolve(true);
                    });
                }
                return resolve(true);
            });
        });
    }
    updateLastLogin(id)
    {
        return new Promise((resolve, reject) => {
            const sql = "UPDATE users SET Last_Login = ? WHERE id = ?";
            const date = new Date();
            
            this.conn.query(sql, [date, id], (error) => {
                if(error)
                {
                    reject(error);
                }

                resolve(true);
            })
        })
    }
    updatePassword(email)
    {
        return new Promise((resolve, reject) => {
            const sql = "UPDATE users SET password = ? WHERE email = ?";
            
            this.conn.query(sql, [email], (error) => {
                if(error)
                {
                    reject(error);
                }
                resolve(true);
            })
        })
    }
    getLastLogin(id)
    {
        return new Promise((resolve, reject) => {
            const sql = "SELECT Last_Login FROM users WHERE id = ?";

            this.conn.query(sql, [id], (error, results) => {
                if(error)
                {
                    return reject(error);
                }
                
                if(results.length == 0)
                {
                    return reject(error);
                }
                
                return resolve(results[0].Last_Login);
            });
        });
    }
    deleteUser(id)
    {
        return new Promise((resolve, reject) => {
            const sql = "DELETE FROM users WHERE id = ?";

            this.conn.query(sql, [id], (error) => {
                if(error)
                {
                    return reject(error);
                }

                return resolve(true);
            });
        });
    }
    destruct()
    {
        return new Promise((resolve, reject) => {
            if(!this.conn)
            {
                resolve(true);
                return;
            }

            this.conn.end((error) => {
                if(error)
                {
                    reject(error);
                    return;
                }

                this.conn = null;
                resolve(true);
            });
        });
    }
}

class WorkoutDatabase{

    constructor()
    {
        if(WorkoutDatabase.instance)
        {
            return WorkoutDatabase.instance;
        }

        this.conn = mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_DATABASE,
            port: process.env.DB_PORT
        });

        this.conn.connect(function(error){
            if(error) throw error;
            console.log("Database connected successfully");
        });

        WorkoutDatabase.instance = this;
    }
    getWorkout(user_id)
    {
        return new Promise((resolve, reject) => {
            const sql = "SELECT * FROM workouts WHERE user_id = ?";

            this.conn.query(sql, [user_id], (error, results) => {
                if(error){
                    return reject(error);
                }

                console.log(results);
                console.log(results.length);
                

                if(results.length === 0)
                {
                    return resolve(false);
                }
                return resolve(results);
            });
        });
    }
    createWorkout(name, user_id)
    {
        return new Promise((resolve, reject) => {
            const sql = "INSERT INTO workouts (workout_name, user_id) VALUES (?, ?)";

            this.conn.query(sql, [name, user_id], (error, results) => {
                if(error)
                {
                    return reject(error);
                }

                resolve(results);
            });
        })
    }
    updateWorkoutDate(date, workout_id)
    {

        return new Promise((resolve, reject) => {
            const sql = "UPDATE workouts SET last_workout = ? WHERE workout_id = ?";
            const formattedDate = formatDate(date);

            this.conn.query(sql, [formattedDate, workout_id], (error) =>{
                if(error)
                {
                    return reject(error);
                }
                resolve(true);
            });
        });
    }
    updateName(new_name, workout_id)
    {
        return new Promise((resolve, reject) =>{
            const sql = "UPDATE workouts SET workout_name = ? WHERE workout_id = ?";

            this.conn.query(sql, [new_name, workout_id], (error) =>{
                if(error)
                {
                    reject(error);
                }

                resolve(true);
            });
        });
    }
    deleteWorkout(workout_id)
    {
        return new Promise((resolve, reject) =>{
            const sql = "DELETE FROM workouts WHERE workout_id = ?";

            this.conn.query(sql, [workout_id], (error) =>{
                if(error)
                {
                    reject(error);
                }

                resolve(true);
            });
        });
    }
    destruct()
    {
        return new Promise((resolve, reject) => {
            if(!this.conn)
            {
                resolve(true);
                return;
            }

            this.conn.end((error) => {
                if(error)
                {
                    reject(error);
                    return;
                }

                resolve(true);
            });
        });
    }
}

class ExerciseDatabase{
    constructor()
    {

        if(ExerciseDatabase.instance)
        {
            return ExerciseDatabase.instance;
        }

        this.conn = mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_DATABASE,
            port: process.env.DB_PORT
        });

        this.conn.connect(function(error){
            if(error) throw error;
            console.log("Database connected successfully");
        });

        ExerciseDatabase.instance = this;
    }
    createExercise(name, rep_range, sets, currentWeight, goalWeight, workoutID, notes)
    {
        return new Promise((resolve, reject) => {
            const sql = "INSERT INTO exercises (name, rep_start, rep_end, sets, current_weight, goal_weight, notes, workout_id) VALUES (?,?,?,?,?,?,?,?)";

            this.conn.query(sql, [name, rep_range[0], rep_range[1], sets, currentWeight, goalWeight, notes, workoutID], (error, results) =>{
                if(error){
                    return reject(error);
                }
                resolve(results);
            });
        });
    }
    workoutExists(workout_id)
    {
        return new Promise((resolve, reject) => {
            const sql = "SELECT * FROM workouts WHERE workout_id = ?";
            
            this.conn.query(sql, [workout_id], (error, results) =>{
                if(error)
                {
                    return reject(error);
                }
                if(results.length === 0)
                {
                    return resolve(false);
                }

                return resolve(true);
            })
        })
    }
    getFullWorkout(workout_id)
    {
        return new Promise((resolve, reject) => {
            const sql = "SELECT * FROM exercises WHERE workout_id = ?";

            this.conn.query(sql, [workout_id], (error, results) => {
                if(error)
                {
                    return reject(error);
                }
                if(results.length === 0)
                {
                    return resolve(false);
                }

                return resolve(results);
            })
        })
    }
    getExercise(exercise_id)
    {
        return new Promise((resolve, reject) => {
            const sql = "SELECT * FROM exercises WHERE exercise_id = ?";

            this.conn.query(sql, [exercise_id], (error, results) => {
                if(error)
                {
                    return reject(error);
                }
                if(results.length === 0)
                {
                    return resolve(false);
                }

                return resolve(results);
            })
        });
    }
    updateName(new_name, exercise_id)
    {
        return new Promise((resolve, reject) =>{
            const sql = "UPDATE exercises SET name = ? WHERE exercise_id = ?";

            this.conn.query(sql, [new_name, exercise_id], (error) =>{
                if(error)
                {
                    return reject(error);
                }

                resolve(true);
            });
        });
    }
    updateRepRange(range, exercise_id)
    {
        return new Promise((resolve, reject) =>{
            const sql = "UPDATE exercises SET rep_start = ?, rep_end = ? WHERE exercise_id = ?";

            this.conn.query(sql, [range[0], range[1], exercise_id], (error) =>{
                if(error)
                {
                    return reject(error);
                }

                resolve(true);
            });
        });
    }
    updateSets(sets, exercise_id)
    {
        return new Promise((resolve, reject) =>{
            const sql = "UPDATE exercises SET sets = ? WHERE exercise_id = ?";

            this.conn.query(sql, [sets, exercise_id], (error) =>{
                if(error)
                {
                    return reject(error);
                }

                resolve(true);
            });
        });
    }
    updateCurrentWeight(new_cW, exercise_id)
    {
        return new Promise((resolve, reject) =>{
            const sql = "UPDATE exercises SET current_weight = ? WHERE exercise_id = ?";

            this.conn.query(sql, [new_cW, exercise_id], (error) =>{
                if(error)
                {
                    return reject(error);
                }

                resolve(true);
            });
        });
    }
    updateGoalWeight(new_gW, exercise_id)
    {
        return new Promise((resolve, reject) =>{
            const sql = "UPDATE exercises SET goal_weight = ? WHERE exercise_id = ?";

            this.conn.query(sql, [new_gW, exercise_id], (error) =>{
                if(error)
                {
                    return reject(error);
                }

                resolve(true);
            });
        });
    }
    updateNotes(new_notes, exercise_id)
    {
        return new Promise((resolve, reject) =>{
            const sql = "UPDATE exercises SET notes = ? WHERE exercise_id = ?";

            this.conn.query(sql, [new_notes, exercise_id], (error) =>{
                if(error)
                {
                    return reject(error);
                }

                resolve(true);
            });
        });
    }
    appendNotes(added_notes, exercise_id)
    {
        return new Promise((resolve, reject) => {
            const sql = "UPDATE exercises SET notes = CONCAT(notes, ?) WHERE exercise_id = ?";

            this.conn.query(sql, [added_notes, exercise_id], (error) =>{
                if(error)
                {
                    reject(error);
                }

                resolve(true);
            });
        })
    }
    deleteExercise(exercise_id)
    {
        return new Promise((resolve, reject) =>{
            const sql = "DELETE FROM exercises WHERE exercise_id = ?";

            this.conn.query(sql, [exercise_id], (error) => {
                if(error)
                {
                    reject(error);
                }

                resolve(true);
            });
        });
    }
    destruct()
    {
        return new Promise((resolve, reject) => {
            if(!this.conn)
            {
                resolve(true);
                return;
            }

            this.conn.end((error) => {
                if(error)
                {
                    reject(error);
                    return;
                }

                resolve(true);
            });
        });
    }
}

class NutritionDatabase{
    constructor()
    {
        if(NutritionDatabase.instance)
        {
            return NutritionDatabase.instance;
        }

        this.conn = mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_DATABASE,
            port: process.env.DB_PORT
        });

        this.conn.connect(function(error){
            if(error) throw error;
            console.log("Database connected successfully");
        });

        NutritionDatabase.instance = this;
    }
    async createMeal(name, user_id)
    {
        return new Promise((resolve, reject) => {
            const sql = "INSERT INTO nutrition (name, user_id) VALUES (?,?)";

            this.conn.query(sql, [name, user_id], async (error, results) =>{
                if(error){
                    return reject(error);
                }

                try{
                    // const stats = await this.getStats(results.id);

                    // if(stats > 0)
                    // {
                    //     await this.updateStats(results.id, stats);
                    // }

                    resolve(results);
                }
                catch(error)
                {
                    reject(error);
                }
            }); 

        });
    }
    getAllMeal(user_id)
    {
        return new Promise((resolve, reject) => {
            const sql = "SELECT * FROM nutrition WHERE user_id = ?";

            this.conn.query(sql, [user_id], (error, results) => {
                if(error)
                {
                    return reject(error);
                }

                if(results.length === 0)
                {
                    return reject(false);
                }

                return resolve(results);
            });
        });
    }
    getMeal(meal_id)
    {
        return new Promise((resolve, reject) => {
            const sql = "SELECT * FROM nutrition WHERE id = ?";

            this.conn.query(sql, [meal_id], (error, results) => {
                if(error)
                {
                    return reject(error);
                }
                if(results.length === 0)
                {
                    return resolve(false);
                }
                
                return resolve(results);
            });
        });
    }
    getStats(id)
    {
        return new Promise((resolve, reject) => {
            const sql = `SELECT 
                            SUM(ingredients.calories), 
                            SUM(ingredients.kilojoules), 
                            SUM(ingredients.protein), 
                            SUM(ingredients.carbohydrates), 
                            SUM(ingredients.fat) 
            FROM ingredients 
            LEFT JOIN nutrition ON nutrition.id = ingredients.meal_id
            WHERE ingredients.meal_id = ?`;

            this.conn.query(sql, [id], (error, results) => {
                if(error)
                {
                    return reject(error);
                }

                resolve(results);
            })
        })
    }
    updateStats(id, stats)
    {
        return new Promise((resolve, reject) => {
            const sql = "UPDATE nutrition SET calories = ?, kilojoules = ?, protein = ?, carbohydrates = ?, fat = ? WHERE id = ?";
            
            this.conn.query(sql, [stats[0]['SUM(ingredients.calories'], stats[0]['SUM(ingredients.kilojoules'], stats[0]['SUM(ingredients.protein)'], stats[0]['SUM(ingredients.carbohydrates)'], stats[0]['SUM(ingredients.fat)'], id], (error, results) =>{
                if(error){
                    reject(error);
                }

                resolve(results);
            });
        });
    }
    updateName(nutrition_name, id)
    {
        return new Promise((resolve, reject) => {
            const sql = "UPDATE nutrition SET name = ? WHERE id = ?";
            
            this.conn.query(sql, [nutrition_name, id], (error, results) =>{
                if(error)
                {
                    reject(error);
                }

                resolve(results);
            });
        });
    }
    deleteMeal(meal_id)
    {
        return new Promise((resolve, reject) => {
            const sql = "DELETE FROM nutrition WHERE id = ?";

            this.conn.query(sql, [meal_id], (error, results) =>{
                if(error)
                {
                    reject(error);
                }

                resolve(results);
            });
        });
    }
    destruct()
    {
        return new Promise((resolve, reject) => {
            if(!this.conn)
            {
                resolve(true);
                return;
            }

            this.conn.end((error) => {
                if(error)
                {
                    reject(error);
                    return;
                }

                resolve(true);
            });
        });
    }
}

class IngredientDatabase{
    constructor(){

        if(IngredientDatabase.instance){
            return IngredientDatabase.instance;
        }

        this.conn = mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_DATABASE,
            port: process.env.DB_PORT
        });

        this.conn.connect(function(error){
            if(error) throw error;
            console.log("Database connected successfully");
        });

        IngredientDatabase.instance = this;
    }
    createIngredient(name, calories, kilojoules, protein, carbohydrates, fat, meal_id)
    {
        //Assuming the protein, carbohydrates and fat will be in grams
        if(calories === false || calories === 0)
        {
            calories = 4.184*kilojoules;
        }
        else if(kilojoules === false || kilojoules === 0)
        {
            kilojoules = 0.239*calories;
        }

        return new Promise((resolve, reject) => {
            const sql = "INSERT INTO ingredients(name, calories, kilojoules, protein, carbohydrates, fat, meal_id) VALUES(?,?,?,?,?,?,?)";

            this.conn.query(sql, [name, calories, kilojoules, protein, carbohydrates, fat, meal_id], (error, results) =>{
                if(error)
                {
                    reject(error);
                }

                resolve(results);
            });
        });
    }
    getAllIngredients(meal_id)
    {
        return new Promise((resolve, reject) => {
            const sql = "SELECT * FROM ingredients WHERE meal_id = ?";

            this.conn.query(sql, [meal_id], (error, results) => {
                if(error)
                    {
                        reject(error);
                    }
    
                    if(results.length === 0)
                    {
                        resolve(false);
                    }
    
                    resolve(results);
            });
        });
    }
    getIngredient(id)
    {
        return new Promise((resolve, reject) => {
            const sql = "SELECT * FROM ingredients WHERE ingredient_id = ?";

            this.conn.query(sql, [id], (error, results) => {
                if(error)
                {
                    reject(error);
                }

                if(results.length === 0)
                {
                    resolve(false);
                }

                resolve(results);
            });
        });
    }
    updateName(name, id)
    {
        return new Promise((resolve, reject) =>{
            const sql = "UPDATE ingredients SET name = ? WHERE ingredient_id = ?";

            this.conn.query(sql, [name, id], (error) =>{
                if(error)
                {
                    reject(error);
                }

                resolve(true);
            });
        });
    }
    updateCalories(calories, id)
    {
        return new Promise((resolve, reject) =>{

            const joules = 0.239006*calories;
            const sql = "UPDATE ingredients SET calories = ?, kilojoules = ? WHERE ingredient_id = ?";

            this.conn.query(sql, [calories, joules, id], (error) =>{
                if(error)
                {
                    reject(error);
                }

                resolve(true);
            });
        });
    }
    updateJoules(kilojoules, id)
    {
        return new Promise((resolve, reject) =>{

            const calories = 4.184*kilojoules;
            const sql = "UPDATE ingredients SET calories = ?, kilojoules = ? WHERE ingredient_id = ?";

            this.conn.query(sql, [calories, kilojoules, id], (error) =>{
                if(error)
                {
                    reject(error);
                }

                resolve(true);
            });
        });
    }
    updateProtein(protein, id)
    {
        return new Promise((resolve, reject) =>{
            const sql = "UPDATE ingredients SET protein = ? WHERE ingredient_id = ?";

            this.conn.query(sql, [protein, id], (error) =>{
                if(error)
                {
                    reject(error);
                }

                resolve(true);
            });
        });
    }
    updateCarbs(carbohydrates, id)
    {
        return new Promise((resolve, reject) =>{
            const sql = "UPDATE ingredients SET carbohydrates = ? WHERE ingredient_id = ?";

            this.conn.query(sql, [carbohydrates, id], (error) =>{
                if(error)
                {
                    reject(error);
                }

                resolve(true);
            });
        });
    }
    updateFat(fat, id)
    {
        return new Promise((resolve, reject) =>{
            const sql = "UPDATE ingredients SET fat = ? WHERE ingredient_id = ?";

            this.conn.query(sql, [fat, id], (error) =>{
                if(error)
                {
                    reject(error);
                }

                resolve(true);
            });
        });
    }
    deleteIngredient(ingredient_id)
    {
        return new Promise((resolve, reject) =>{
            const sql = "DELETE FROM ingredients WHERE ingredient_id = ?";

            this.conn.query(sql, [ingredient_id], (error) => {
                if(error)
                {
                    reject(error);
                }

                resolve(true);
            });
        });
    }
    destruct()
    {
        return new Promise((resolve, reject) => {
            if(!this.conn)
            {
                resolve(true);
                return;
            }

            this.conn.end((error) => {
                if(error)
                {
                    reject(error);
                    return;
                }

                resolve(true);
            });
        });
    }
}

module.exports = {
    UserDatabase,
    WorkoutDatabase,
    ExerciseDatabase,
    NutritionDatabase,
    IngredientDatabase
};