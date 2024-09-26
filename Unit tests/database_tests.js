//Unit tests used to test the db_connection code

require('dotenv').config({path: '../config.env'});
const {UserDatabase, WorkoutDatabase, ExerciseDatabase, NutritionDatabase, IngredientDatabase} = require('../db_connection');

async function test(){

    var conn = UserDatabase.instance();
    try{
        await conn.insertUser("sean", "pass1234", "sean@");
        const isVerified = await conn.verifyUser("sean", "sean@", "pass1234");

        if(isVerified)
        {
            console.log("success");
        }
        else
        {
            console.log("failed");
        }
    }
    catch(error){
        console.log("Error during insertion", error);
    }
    finally{
        conn.destruct();
    }
}
test();

async function testWorkout() {
    var conn = WorkoutDatabase.instance();
    try{
        const r1 = await conn.createWorkout("My Workout", 15);
        console.log(r1);

        const r2 = await conn.getWorkout(15);
        console.log(r2);

        const r3 = await conn.updateDate(new Date(),14);
        console.log(r3);
    }
    catch(error){
        console.log("Error: ", error);
    }
    finally{
        conn.destruct();
    }
}
testWorkout();

async function testExercise() {
    var conn = ExerciseDatabase.instance();
    try{
        const r1 = await conn.createExercise("test exercise", [5,7], 3, 10, 15, 5, "This is my first exercise");
        console.log(r1);

        const r2 = await conn.getFullWorkout(5);
        console.log(r2);

        const r3 = await conn.updateName('my exercise', 1);
        console.log(r3);

        const r4 = await conn.updateRepRange([8,12], 1);
        console.log(r4);

        const r5 = await conn.updateSets(5, 1);
        console.log(r5);

        const r6 = await conn.updateCurrentWeight(12, 1);
        console.log(r6);

        const r7 = await conn.updateGoalWeight(17, 1);
        console.log(r7);

        const r8 = await conn.updateNotes("This is now my second exercise", 1);
        console.log(r8);

        const r9 = await conn.appendNotes(" and I feel good about it", 1);
        console.log(r9);
    }
    catch(error){
        console.log(error);
    }
    finally{
        conn.destruct();
    }
}
testExercise();

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

async function testIngredient() {
    var conn = IngredientDatabase.instance();

    try{
        const t1 = await conn.createIngredient("test ingredient", 500, 0, 150, 50, 10, 1);
        console.log(t1);

        const t2 = await conn.updateName("new name", 1);
        console.log(t2);

        const t3 = await conn.updateCalories(600, 1);
        console.log(t3);

        const t4 = await conn.deleteIngredient(1);
        console.log(t4);
    }
    catch(error){
        console.log(error);
    }
    finally{
        conn.destruct();
    }
}
testIngredient();