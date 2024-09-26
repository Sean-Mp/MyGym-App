/*This file will be used to connect to the database itself, using the singleton design pattern*/

require('dotenv').config({ path : 'config.env' });

var mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const { TokenSender } = require('./tokenSender');

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
    static #newInstance = null;

    static instance()
    {
        if(this.#newInstance === null)
        {
            this.#newInstance = new UserDatabase();
        }
        return this.#newInstance;
    }
    constructor(){
        if(UserDatabase.#newInstance){
            throw new Error("Use UserDatabase.instance()");
        }

        this.conn = mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_DATABASE,
            port: process.env.DB_PORT
        });

        this.conn.connect(function(error) {
            if(error) throw error;
            console.log("Database connected successfully");
        })
    }
    async verifyUser(username, email, password)
    {
        try{
            const sql = "SELECT username, email, password FROM users where username = ? OR email = ?";
            const [results] = await this.conn.promise().query(sql, [username, email]);
            
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

            const sql2 = "UPDATE users SET Last_Login = ? WHERE id = ?";
            await this.conn.promise().query(sql2, [formatDate(new Date()), results[0].id]);

            return true;
        }
        catch(error)
        {
            throw error;
        }
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
                    return reject(false);
                }

                return resolve(true);
            });
        })
    }
    insertUser(username, password, email)
    {
        return new Promise((resolve, reject) => {

            //Encrypt password
            bcrypt.genSalt(15, (error, Salt) => {
                if(error) return reject(error);

                bcrypt.hash(password, Salt, (error, hash) => {
                    if(error) return reject(error);

                    const sql = "INSERT INTO users (username, email, password, Last_Login, verified) VALUES (?, ?, ?, ?, ?)" ;

                    this.conn.query(sql, [username, email, hash, formatDate(new Date()), false], (error, results) => {
                        if(error) {
                            return reject(error);
                        }

                        //Temp email
                        const senderEmail = 'seanmaritz1304@gmail.com';
                        
                        const emailSender = new TokenSender();
                        emailSender.sendEmail(senderEmail, email);

                        resolve(results);
                    });
                });
            });
        });
    }
    getUserID(username, email, password)
    {
        return new Promise((resolve, reject) => {

            if(this.verifyUser(username, email, password) === true)
            {
                const sql = "SELECT ID FROM users where username = ? OR email = ?";

                this.conn.query(sql, [username, email], (error, results) => {
                    if(error){
                        return reject(error);
                    }
                    if(results.length === 0)
                    {
                        return reject(false);
                    }

                    return resolve(results[0].id);
                });
            }
            return reject(false);
        });
    }
    verifyEmail()
    {
        
    }
    destruct()
    {
        this.conn.end((error) => {
            if(error)
            {
                return;
            }
            console.log("Successfully disconnected");
        });
    }
}

class WorkoutDatabase{
    static #newInstance = null;

    static instance()
    {
        if(this.#newInstance === null)
        {
            this.#newInstance = new WorkoutDatabase();
        }
        return this.#newInstance;
    }
    constructor()
    {
        if(WorkoutDatabase.#newInstance)
        {
            throw new Error("Use WorkoutDatabase.instance()");
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
        })
    }
    getWorkout(user_id)
    {
        return new Promise((resolve, reject) => {
            const sql = "SELECT * FROM workouts WHERE user_id = ?";

            this.conn.query(sql, [user_id], (error, results) => {
                if(error){
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
    updateDate(date, workout_id)
    {
        return new Promise((resolve, reject) => {

            const sql = "UPDATE workouts SET last_workout = ? WHERE workout_id = ?";

            this.conn.query(sql, [formatDate(date), workout_id], (error, results) =>{
                if(error)
                {
                    return reject(error);
                }
 
                resolve(results);
            });
        });
    }
    updateName(new_name, workout_id)
    {
        return new Promise((resolve, reject) =>{
            const sql = "UPDATE workouts SET name = ? WHERE workout_id = ?";

            this.conn.query(sql, [new_name, workout_id], (error, results) =>{
                if(error)
                {
                    reject(error);
                }

                resolve(results);
            });
        });
    }
    deleteWorkout(workout_id)
    {
        return new Promise((resolve, reject) =>{
            const sql = "DELETE FROM workouts WHERE workout_id = ?";

            this.conn.query(sql, [workout_id], (error, results) =>{
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
        this.conn.end((error) => {
            if(error)
            {
                return;
            }
            console.log("Successfully disconnected");
        });
    }
}

class ExerciseDatabase{
    static #newInstance = null;

    static instance()
    {
        if(this.#newInstance === null)
        {
            this.#newInstance = new ExerciseDatabase();
        }
        return this.#newInstance;
    }
    constructor()
    {
        if(ExerciseDatabase.#newInstance)
        {
            throw new Error("Use ExerciseDatabase.instance()");
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
        })
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
                    return reject(false);
                }

                return resolve(results);
            })
        })
    }
    updateName(new_name, exercise_id)
    {
        return new Promise((resolve, reject) =>{
            const sql = "UPDATE exercises SET name = ? WHERE exercise_id = ?";

            this.conn.query(sql, [new_name, exercise_id], (error, results) =>{
                if(error)
                {
                    return reject(error);
                }

                resolve(results);
            });
        });
    }
    updateRepRange(range, exercise_id)
    {
        return new Promise((resolve, reject) =>{
            const sql = "UPDATE exercises SET rep_start = ?, rep_end = ? WHERE exercise_id = ?";

            this.conn.query(sql, [range[0], range[1], exercise_id], (error, results) =>{
                if(error)
                {
                    return reject(error);
                }

                resolve(results);
            });
        });
    }
    updateSets(sets, exercise_id)
    {
        return new Promise((resolve, reject) =>{
            const sql = "UPDATE exercises SET sets = ? WHERE exercise_id = ?";

            this.conn.query(sql, [sets, exercise_id], (error, results) =>{
                if(error)
                {
                    return reject(error);
                }

                resolve(results);
            });
        });
    }
    updateCurrentWeight(new_cW, exercise_id)
    {
        return new Promise((resolve, reject) =>{
            const sql = "UPDATE exercises SET current_weight = ? WHERE exercise_id = ?";

            this.conn.query(sql, [new_cW, exercise_id], (error, results) =>{
                if(error)
                {
                    return reject(error);
                }

                resolve(results);
            });
        });
    }
    updateGoalWeight(new_gW, exercise_id)
    {
        return new Promise((resolve, reject) =>{
            const sql = "UPDATE exercises SET goal_weight = ? WHERE exercise_id = ?";

            this.conn.query(sql, [new_gW, exercise_id], (error, results) =>{
                if(error)
                {
                    return reject(error);
                }

                resolve(results);
            });
        });
    }
    updateNotes(new_notes, exercise_id)
    {
        return new Promise((resolve, reject) =>{
            const sql = "UPDATE exercises SET notes = ? WHERE exercise_id = ?";

            this.conn.query(sql, [new_notes, exercise_id], (error, results) =>{
                if(error)
                {
                    return reject(error);
                }

                resolve(results);
            });
        });
    }
    appendNotes(added_notes, exercise_id)
    {
        return new Promise((resolve, reject) => {
            const sql = "UPDATE exercises SET notes = CONCAT(notes, ?) WHERE exercise_id = ?";

            this.conn.query(sql, [added_notes, exercise_id], (error, results) =>{
                if(error)
                {
                    reject(error);
                }

                resolve(results);
            });
        })
    }
    deleteExercise(exercise_id)
    {
        return new Promise((resolve, reject) =>{
            const sql = "DELETE FROM exercises WHERE exercise_id = ?";

            this.conn.query(sql, [exercise_id], (error, results) => {
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
        this.conn.end((error) => {
            if(error)
            {
                return;
            }
            console.log("Successfully disconnected");
        });
    }
}

class NutritionDatabase{
    static #newInstance = null;

    static instance(){
        if(this.#newInstance === null)
        {
            this.#newInstance = new NutritionDatabase();
        }
        return this.#newInstance;
    }
    constructor()
    {
        if(NutritionDatabase.#newInstance)
        {
            throw new Error("Use NutritionDatabase.instance()");
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
        })
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
                    const stats = await this.getStats(results.id);
                    await this.updateStats(results.id, stats);

                    resolve(results);
                }
                catch(error)
                {
                    reject(error);
                }
            }); 

        });
    }
    getStats(id)
    {
        return new Promise((resolve, reject) => {
            const sql = `SELECT sum(ingredients.calories), sum(ingredients.kilojoules) sum(ingredients.protein), sum(ingredients.carbohydrates), sum(ingredients.fat) 
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
            
            this.conn.query(sql, [stats[0]['sum(ingredients.calories'], stats[0]['sum(ingredients.kilojoules'], stats[0]['sum(ingredients.protein)'], stats[0]['sum(ingredients.carbohydrates)'], stats[0]['sum(ingredients.fat)'], id], (error, results) =>{
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
        this.conn.end((error) => {
            if(error)
            {
                return;
            }
            console.log("Successfully disconnected");
        });
    }
}

class IngredientDatabase{
    static #newInstance = null;

    static instance()
    {
        if(this.#newInstance === null)
        {
            this.#newInstance = new IngredientDatabase();
        }
        return this.#newInstance;
    }
    constructor(){
        if(IngredientDatabase.#newInstance)
        {
            throw new Error("Use ExerciseDatabase.instance()");
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
        })
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
    updateName(name, id)
    {
        return new Promise((resolve, reject) =>{
            const sql = "UPDATE ingredients SET name = ? WHERE ingredient_id = ?";

            this.conn.query(sql, [name, id], (error, results) =>{
                if(error)
                {
                    reject(error);
                }

                resolve(results);
            });
        });
    }
    updateCalories(calories, id)
    {
        return new Promise((resolve, reject) =>{

            const joules = 0.239006*calories;
            const sql = "UPDATE ingredients SET calories = ?, kilojoules = ? WHERE ingredient_id = ?";

            this.conn.query(sql, [calories, joules, id], (error, results) =>{
                if(error)
                {
                    reject(error);
                }

                resolve(results);
            });
        });
    }
    updateJoules(kilojoules, id)
    {
        return new Promise((resolve, reject) =>{

            const calories = 4.184*kilojoules;
            const sql = "UPDATE ingredients SET calories = ?, kilojoules = ? WHERE ingredient_id = ?";

            this.conn.query(sql, [calories, kilojoules, id], (error, results) =>{
                if(error)
                {
                    reject(error);
                }

                resolve(results);
            });
        });
    }
    updateProtein(protein, id)
    {
        return new Promise((resolve, reject) =>{
            const sql = "UPDATE ingredients SET protein = ? WHERE ingredient_id = ?";

            this.conn.query(sql, [protein, id], (error, results) =>{
                if(error)
                {
                    reject(error);
                }

                resolve(results);
            });
        });
    }
    updateCarbs(carbohydrates, id)
    {
        return new Promise((resolve, reject) =>{
            const sql = "UPDATE ingredients SET carbohydrates = ? WHERE ingredient_id = ?";

            this.conn.query(sql, [carbohydrates, id], (error, results) =>{
                if(error)
                {
                    reject(error);
                }

                resolve(results);
            });
        });
    }
    updateFat(fat, id)
    {
        return new Promise((resolve, reject) =>{
            const sql = "UPDATE ingredients SET fat = ? WHERE ingredient_id = ?";

            this.conn.query(sql, [fat, id], (error, results) =>{
                if(error)
                {
                    reject(error);
                }

                resolve(results);
            });
        });
    }
    deleteIngredient(ingredient_id)
    {
        return new Promise((resolve, reject) =>{
            const sql = "DELETE FROM ingredients WHERE ingredient_id = ?";

            this.conn.query(sql, [ingredient_id], (error, results) => {
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
        this.conn.end((error) => {
            if(error)
            {
                return;
            }
            console.log("Successfully disconnected");
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