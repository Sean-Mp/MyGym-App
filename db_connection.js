/*This file will be used to connect to the database itself, using the singleton design pattern*/

require('dotenv').config({ path : 'config.env' });

var mysql = require('mysql');
const bcrypt = require('bcryptjs');

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
    verifyUser(username, email, password)
    {
        return new Promise((resolve, reject) => {

            const sql = "SELECT username, email, password FROM users where username = ? OR email = ?";

            this.conn.query(sql, [username, email], (error, results) => {
                if(error){
                    return reject(error);
                }
                if(results.length === 0)
                {
                    return reject(false);
                }
                else if(username !== "" && username !== results[0].username)
                {
                    return resolve(false);
                }
                else if(email !== "" && email !== results[0].email)
                {
                    return resolve(false);
                }                

                bcrypt.compare(password, results[0].password, 
                    function (error, isMatch) {
                        if(error)
                        {
                            return reject(error);
                        }

                        if(isMatch)
                        {
                            return resolve(true);
                        }
                        return resolve(false);
                    });
                });
        });
    }
    insertUser(username, password, email)
    {
        return new Promise((resolve, reject) => {

            //Check if username or email already exists
            const sql = "SELECT * FROM users WHERE username = ? OR email = ?";
            this.conn.query(sql, [username, email], (error, results) => {
                if(error){
                    return reject(error);
                }

                if(results.length !== 0)
                {
                    return reject(false);
                }
            });

            //Encrypt password
            bcrypt.genSalt(15, (error, Salt) => {
                if(error) return reject(error);

                bcrypt.hash(password, Salt, (error, hash) => {
                    if(error) return reject(error);

                    sql = "INSERT INTO users (username, email, password) VALUES (?, ?, ?)" ;

                    this.conn.query(sql, [username, email, hash], (error, results) => {
                        if(error) {
                            return reject(error);
                        }
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
                    return reject(error);
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
                    return reject(error);
                }

                resolve(results);
            });
        })
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
            const sql = `SELECT sum(ingredients.protein), sum(ingredients.carbohydrates), sum(ingredients.fat) 
            FROM ingredients 
            JOIN nutrition ON nutrition.id = ingredients.meal_id
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
            const sql = "UPDATE nutrition SET protein = ?, carbohydrates = ?, fat = ? WHERE id = ?";
            
            this.conn.query(sql, [stats[0]['sum(ingredients.protein)'], stats[0]['sum(ingredients.carbohydrates)'], stats[0]['sum(ingredients.fat)'], id], (error, results) =>{
                if(error){
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
    NutritionDatabase
};

async function testNutrition() {
    var conn = NutritionDatabase.instance();

    try{
        const t1 = await conn.createMeal("test meal", 3);
        console.log(t1);
    }
    catch(error)
    {
        console.log(error);
    }
    finally{
        conn.destruct();
    }
}
testNutrition();