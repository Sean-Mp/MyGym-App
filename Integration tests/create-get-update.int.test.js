require('dotenv').config({ path: 'config.env' });
const request = require('supertest');
const app = require('../Rest_api'); 
const {
    UserDatabase,
    WorkoutDatabase,
    ExerciseDatabase,
    NutritionDatabase,
    IngredientDatabase
} = require('../db_connection');

const userDB = new UserDatabase();
const workoutDB = new WorkoutDatabase();
const exerciseDB = new ExerciseDatabase();
const nutritionDB = new NutritionDatabase();
const ingredientDB = new IngredientDatabase();

let userIds = [];
let workoutIds = [];
let exerciseIds = [];
let mealIds = [];
let ingredientIds = [];

beforeAll(async () => {
    const userDB = new UserDatabase();
    const res = await userDB.insertUser('testUser', 'TestPass@123', 'tesuser1@gmail.com');
    userIds.push(res.insertId);
});

afterAll(async () => {

    if(ingredientIds.length !== 0)
    {
        for(const ingredientId of ingredientIds){
            await ingredientDB.deleteIngredient(ingredientId);
        }
    }
    if(mealIds.length !== 0)
    {
        for(const mealId of mealIds){
            await nutritionDB.deleteMeal(mealId);
        }
    }
    if(exerciseIds.length !== 0)
    {
        for (const exerciseId of exerciseIds) {
            await exerciseDB.deleteExercise(exerciseId);
        }
    }

    if(workoutIds.length !== 0)
    {
        for (const workoutId of workoutIds) {
            await workoutDB.deleteWorkout(workoutId);
        }
    }

    if(userIds.length !== 0)
    {
        for (const userId of userIds) {
            await userDB.deleteUser(userId);
        }
    }

    await ingredientDB.destruct();
    await nutritionDB.destruct();
    await exerciseDB.destruct();
    await workoutDB.destruct();
    await userDB.destruct();
});

describe('GET /user - Integration tests', () => {
    it('reject invalid userID', async() => {
        const res = await request(app).get('/user').send({
            user_id: 10000000
        });

        expect(res.statusCode).toBe(403);
        expect(res.body.message).toMatch("user doesnt exist");
    });
    it('return the username and lastlogin on user id', async() => {

        const res = await request(app).get('/user').send({
            user_id: userIds[userIds.length-1],
            type: 'profile'
        });

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toMatch('User Profile');
        expect(res.body.username).toMatch('testUser');
        expect(res.body).toHaveProperty("lastLogin");
    });
});

describe('Create workout, update workout and get workout - Integration tests', () =>{
    it("should create a workout, update and get for a valid user", async() => {
        const res = await request(app).put('/user').send({
            user_id: userIds[userIds.length - 1],
            type: 'workout',
            workout_name: 'TestWorkout'
        });

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toMatch("Workout successfully created");
        expect(res.body).toHaveProperty('workout_id');
        workoutIds.push(res.body.workout_id);

        //Get workout
        const resWorkout = await request(app).get('/user').send({
            user_id: userIds[userIds.length - 1],
            type: 'workout',
        });

        expect(resWorkout.statusCode).toBe(200);
        expect(resWorkout.body.message).toMatch('User Workout');
        const fetchedWorkouts = resWorkout.body.workout;
        expect(fetchedWorkouts[fetchedWorkouts.length-1].workout_id).toBe(workoutIds[workoutIds.length-1]);
        expect(fetchedWorkouts[fetchedWorkouts.length-1].workout_name).toMatch('TestWorkout');

        //Update workout
        const update = await request(app).patch('/user').send({
            user_id: userIds[userIds.length - 1],
            type: 'workout',
            update: 'name',
            name: 'TestWorkoutUpdate',
            workout_id: workoutIds[workoutIds.length-1]
        });

        expect(update.statusCode).toBe(200);
        expect(update.body.message).toMatch('Update successful');

        //Get workout
        const resWorkoutUpdate = await request(app).get('/user').send({
            user_id: userIds[userIds.length - 1],
            type: 'workout',
        });

        expect(resWorkoutUpdate.statusCode).toBe(200);
        expect(resWorkoutUpdate.body.message).toMatch('User Workout');
        const getWorkouts = resWorkoutUpdate.body.workout;
        expect(getWorkouts[getWorkouts.length-1].workout_id).toBe(workoutIds[workoutIds.length-1]);
        expect(getWorkouts[getWorkouts.length-1].workout_name).toMatch('TestWorkoutUpdate');
    });
});
describe('Create workout, exercise, update exercise, get exercise', () =>{
    it('should not create an exericse if a workout doesnt exist', async() => {
        //Create exercise
        const res = await request(app).put('/user').send({
            user_id: userIds[userIds.length - 1],
            type: 'exercise',
            workout_id: 1000000
        });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch("workout doesnt exist");
    });
    it('should create a workout, create an exercise, add it to a workout, update exercise and get exercise for a valid user', async() =>{
        //Create workout
        const workoutRes = await request(app).put('/user').send({
            user_id: userIds[userIds.length - 1],
            type: 'workout',
            workout_name: 'TestWorkout'
        });

        expect(workoutRes.statusCode).toBe(200);
        expect(workoutRes.body.message).toMatch("Workout successfully created");
        expect(workoutRes.body).toHaveProperty('workout_id');
        workoutIds.push(workoutRes.body.workout_id);

        //Create exercise
        const createExercise = await request(app).put('/user').send({
            user_id: userIds[userIds.length - 1],
            type: 'exercise',
            workout_id: workoutIds[workoutIds.length-1],
            exercise_name: "test exercise",
            rep_range: [8,10],
            sets: 3,
            current_weight: 50,
            goal_weight: 60,
            notes: "Test notes"
        });

        expect(createExercise.statusCode).toBe(200);
        expect(createExercise.body.message).toMatch("Exercise successfully created");
        expect(createExercise.body).toHaveProperty('exercise_id');
        exerciseIds.push(createExercise.body.exercise_id);

        //Get exercise
        const getExercise = await request(app).get('/user').send({
            user_id: userIds[userIds.length - 1],
            type: 'exercise',
            workout_id: workoutIds[workoutIds.length-1]
        });

        expect(getExercise.statusCode).toBe(200);
        expect(getExercise.body.message).toMatch("Successfully retrived workout exercises");
        const fullExercises = getExercise.body.data;
        expect(fullExercises[fullExercises.length-1].name).toBe("test exercise");

        //Update exercise
        const update = await request(app).patch('/user').send({
            user_id: userIds[userIds.length - 1],
            type: "exercise",
            update: [
                "name",
                "rep_range",
                "sets",
                "current_weight",
                "goal_weight",
                "append notes"
            ],
            name: "test exercise updated",
            rep_range: [10, 12],
            sets: 5,
            current_weight: 65,
            goal_weight: 85,
            notes: " updated",
            exercise_id: exerciseIds[exerciseIds.length-1]
        });

        expect(update.statusCode).toBe(200);
        expect(update.body.message).toMatch("Update successful");
        
        //Get updated exercise
        const resExerciseUpdate = await request(app).get('/user').send({
            user_id: userIds[userIds.length - 1],
            type: 'exercise',
            workout_id: workoutIds[workoutIds.length-1]
        });

        expect(resExerciseUpdate.statusCode).toBe(200);
        expect(resExerciseUpdate.body.message).toMatch("Successfully retrived workout exercises");
        const fullUpdatedExercises = resExerciseUpdate.body.data[0];
        expect(fullUpdatedExercises.name).toBe("test exercise updated");
        expect(fullUpdatedExercises.rep_start).toBe(10);
        expect(fullUpdatedExercises.rep_end).toBe(12);
        expect(fullUpdatedExercises.sets).toBe(5);
        expect(fullUpdatedExercises.current_weight).toBe(65);
        expect(fullUpdatedExercises.goal_weight).toBe(85);
        expect(fullUpdatedExercises.notes).toBe("Test notes updated");
    });
});
describe("Create meal, update meal and get meal - Integration tests", () => {
    it("should create a meal, update and get for a valid user", async() => {
        const res = await request(app).put('/user').send({
            user_id: userIds[userIds.length-1],
            type: "meal",
            meal_name: "test meal",
        });

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toMatch("Meal successfully created");
        expect(res.body).toHaveProperty("meal_id");
        mealIds.push(res.body.meal_id);

        //Get meal
        const resMeal = await request(app).get('/user').send({
            user_id: userIds[userIds.length-1],
            type: 'meals'
        });

        expect(resMeal.statusCode).toBe(200);
        expect(resMeal.body.message).toBe("All user meals");
        expect(resMeal.body.meal[0].name).toBe("test meal");

        //Update meal
        const updateMeal = await request(app).patch('/user').send({
            user_id: userIds[userIds.length-1],
            meal_id: mealIds[mealIds.length-1],
            type: 'meals',
            update: [
                "name"
            ],
            name: "test meal updated"
        });

        expect(updateMeal.statusCode).toBe(200);
        expect(updateMeal.body.message).toBe("Update successful");

        //Get updated meal
        const resMealUpdate = await request(app).get('/user').send({
            user_id: userIds[userIds.length-1],
            type: 'meals'
        });

        expect(resMealUpdate.statusCode).toBe(200);
        expect(resMealUpdate.body.message).toBe("All user meals");
        expect(resMealUpdate.body.meal[0].name).toBe("test meal updated");
    });
});
describe("Create meal, ingredient, update ingredient, get ingredient", () => {
    it('should not create an ingredient if a meal doesnt exist', async () =>{
        //Create ingredient
        const res = await request(app).put("/user").send({
            user_id: userIds[userIds.length - 1],
            type: 'ingredient',
            meal_id: 1000000
        });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch("meal doesnt exist");
    });
    it("should create a meal, create an ingredient, update ingredient and get ingredient for a valid user", async () =>{
        //Create meal
        const mealRes = await request(app).put('/user').send({
            user_id: userIds[userIds.length-1],
            type: "meal",
            meal_name: "test meal",
        });

        expect(mealRes.statusCode).toBe(200);
        expect(mealRes.body.message).toMatch("Meal successfully created");
        expect(mealRes.body).toHaveProperty("meal_id");
        mealIds.push(mealRes.body.meal_id);

        //Create ingredient
        const ingredientRes = await request(app).put("/user").send({
            user_id: userIds[userIds.length - 1],
            type: 'ingredient',
            meal_id: mealIds[mealIds.length-1],
            ingredient_name: "test ingredient",
            calories: 1000,
            protein: 500,
            carbs: 400,
            fat: 200
        });

        expect(ingredientRes.statusCode).toBe(200);
        expect(ingredientRes.body.message).toBe("Ingredient successfully created");
        expect(ingredientRes.body).toHaveProperty("ingredient_id");
        ingredientIds.push(ingredientRes.body.ingredient_id);

        //Get ingredient
        const getIngredient = await request(app).get("/user").send({
            user_id: userIds[userIds.length - 1],
            type: 'ingredient',
            ingredient_id: ingredientIds[ingredientIds.length-1]
        });

        expect(getIngredient.statusCode).toBe(200);
        expect(getIngredient.body.message).toBe("Succesfully retrieved ingredient");
        const fullIngredient = getIngredient.body.ingredient[0];
        expect(fullIngredient.name).toBe("test ingredient");
        expect(fullIngredient.calories).toBe(1000);
        expect(fullIngredient.protein).toBe(500);
        expect(fullIngredient.carbohydrates).toBe(400);
        expect(fullIngredient.fat).toBe(200);

        //Update ingredient
        const updateIngredient = await request(app).patch("/user").send({
            user_id: userIds[userIds.length - 1],
            type: 'ingredient',
            ingredient_id: ingredientIds[ingredientIds.length-1],
            update: [
                "name",
                "calories",
                "protein",
                "carbs",
                "fat"
            ],
            name: "test ingredient updated",
            calories: 1500,
            protein: 700,
            carbs: 600,
            fat: 400
        });

        expect(updateIngredient.statusCode).toBe(200);
        expect(updateIngredient.body.message).toBe("Update successful");

        //Get updated ingredient
        const getUpdatedIngredient = await request(app).get("/user").send({
            user_id: userIds[userIds.length - 1],
            type: "All-Ingredients",
            meal_id:  mealIds[mealIds.length-1]
        });

        expect(getUpdatedIngredient.statusCode).toBe(200);
        expect(getUpdatedIngredient.body.message).toBe("Succesfully retrieved all ingredients");
        const allIngredients = getUpdatedIngredient.body.meal_ingredients[0];
        console.log(allIngredients);
        expect(allIngredients.name).toBe("test ingredient updated");
        expect(allIngredients.calories).toBe(1500);
        expect(allIngredients.protein).toBe(700);
        expect(allIngredients.carbohydrates).toBe(600);
        expect(allIngredients.fat).toBe(400);

    });
})