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

    // if(ingredientIds.length !== 0)
    // {
    //     for(const ingredientId of ingredientIds){
    //         await ingredientDB.deleteIngredient(ingredientId);
    //     }
    // }
    // if(mealIds.length !== 0)
    // {
    //     for(const mealId of mealIds){
    //         await nutritionDB.deleteMeal(mealId);
    //     }
    // }
    // if(exerciseIds.length !== 0)
    // {
    //     for (const exerciseId of exerciseIds) {
    //         await exerciseDB.deleteExercise(exerciseId);
    //     }
    // }

    // if(workoutIds.length !== 0)
    // {
    //     for (const workoutId of workoutIds) {
    //         await workoutDB.deleteWorkout(workoutId);
    //     }
    // }

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
describe("Create a workout with multiple exercises then delete the workout", () =>{
    it("shouldnt delete if user id is invalid", async() => {
        const res = await request(app).delete("/user").send({
            user_id: 1000000,
            type: "meal"
        });

        expect(res.statusCode).toBe(403);
        expect(res.body.message).toBe("user doesnt exist");
    });
    it("should delete entire workout, including exercises", async() => {
        const res = await request(app).put("/user").send({
            user_id: userIds[userIds.length-1],
            type: 'workout',
            workout_name: "test workout"
        });

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toMatch("Workout successfully created");
        expect(res.body).toHaveProperty('workout_id');
        console.log(res.body.workout_id);
        workoutIds.push(res.body.workout_id);

        //Create exercises
        const createExercise1 = await request(app).put('/user').send({
            user_id: userIds[userIds.length - 1],
            type: 'exercise',
            workout_id: workoutIds[workoutIds.length-1],
            exercise_name: "test exercise 1",
            rep_range: [8,10],
            sets: 3,
            current_weight: 50,
            goal_weight: 60,
            notes: "Test notes"
        });

        expect(createExercise1.statusCode).toBe(200);
        expect(createExercise1.body.message).toMatch("Exercise successfully created");
        expect(createExercise1.body).toHaveProperty('exercise_id');
        exerciseIds.push(createExercise1.body.exercise_id);

        const createExercise2 = await request(app).put('/user').send({
            user_id: userIds[userIds.length - 1],
            type: 'exercise',
            workout_id: workoutIds[workoutIds.length-1],
            exercise_name: "test exercise 2",
            rep_range: [8,10],
            sets: 3,
            current_weight: 50,
            goal_weight: 60,
            notes: "Test notes"
        });

        expect(createExercise2.statusCode).toBe(200);
        expect(createExercise2.body.message).toMatch("Exercise successfully created");
        expect(createExercise2.body).toHaveProperty('exercise_id');
        exerciseIds.push(createExercise2.body.exercise_id);

        //Delete workout
        const deleteWorkout = await request(app).delete("/user").send({
            user_id: userIds[userIds.length - 1],
            type: "workout",
            workout_id: workoutIds[workoutIds.length-1],
        });

        expect(deleteWorkout.statusCode).toBe(200);
        expect(deleteWorkout.body.message).toBe("Workout successfully deleted");
    });
    it("should delete a individual exercise from a workout", async()=>{
         //Create workout
         const workoutRes = await request(app).put('/user').send({
            user_id: userIds[userIds.length - 1],
            type: 'workout',
            workout_name: 'TestWorkout'
        });
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
        exerciseIds.push(createExercise.body.exercise_id);

        //Delete exercise 
        const deleteExercise = await request(app).delete('/user').send({
            user_id: userIds[userIds.length - 1],
            type: 'exercise',
            exercise_id: exerciseIds[exerciseIds.length-1]
        });
        expect(deleteExercise.statusCode).toBe(200);
        expect(deleteExercise.body.message).toBe("Exercise successfully deleted");

        //Delete empty workout, clean up
        const deleteWorkout = await request(app).delete("/user").send({
            user_id: userIds[userIds.length - 1],
            type: "workout",
            workout_id: workoutIds[workoutIds.length-1],
        });

        expect(deleteWorkout.statusCode).toBe(200);
        expect(deleteWorkout.body.message).toBe("Workout successfully deleted");
    });
});
describe("Create a meal with ingredients, then delete meal", () =>{
    it("delete an individual ingredient", async() => {
        //Create meal
        const mealRes = await request(app).put('/user').send({
            user_id: userIds[userIds.length-1],
            type: "meal",
            meal_name: "test meal",
        });
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
        ingredientIds.push(ingredientRes.body.ingredient_id);

        //Delete ingredient
        const deleteIngredient = await request(app).delete("/user").send({
            user_id: userIds[userIds.length - 1],
            type: 'ingredient',
            ingredient_id: ingredientIds[ingredientIds.length-1]
        });

        expect(deleteIngredient.statusCode).toBe(200);
        expect(deleteIngredient.body.message).toBe("Ingredient successfully deleted");

        //Delete empty meal
        const deleteMeal = await request(app).delete("/user").send({
            user_id: userIds[userIds.length - 1],
            type: 'meals',
            meal_id: mealIds[mealIds.length-1]
        });

        expect(deleteMeal.statusCode).toBe(200);
        expect(deleteMeal.body.message).toBe("Meal successfully deleted");
    });
    it("should create a meal with multiple ingredients then delete the meal", async()=>{
        //Create meal
        const mealRes = await request(app).put('/user').send({
            user_id: userIds[userIds.length-1],
            type: "meal",
            meal_name: "test meal",
        });
        mealIds.push(mealRes.body.meal_id);

        //Create ingredients
        const ingredientRes1 = await request(app).put("/user").send({
            user_id: userIds[userIds.length - 1],
            type: 'ingredient',
            meal_id: mealIds[mealIds.length-1],
            ingredient_name: "test ingredient 1",
            calories: 1000,
            protein: 500,
            carbs: 400,
            fat: 200
        });
        ingredientIds.push(ingredientRes1.body.ingredient_id);

        const ingredientRes2 = await request(app).put("/user").send({
            user_id: userIds[userIds.length - 1],
            type: 'ingredient',
            meal_id: mealIds[mealIds.length-1],
            ingredient_name: "test ingredient 2",
            calories: 1000,
            protein: 500,
            carbs: 400,
            fat: 200
        });
        ingredientIds.push(ingredientRes2.body.ingredient_id);

        //delete meal
        const deleteMeal = await request(app).delete("/user").send({
            user_id: userIds[userIds.length - 1],
            type: 'meals',
            meal_id: mealIds[mealIds.length-1]
        });

        expect(deleteMeal.statusCode).toBe(200);
        expect(deleteMeal.body.message).toBe("Meal successfully deleted");
    })
});