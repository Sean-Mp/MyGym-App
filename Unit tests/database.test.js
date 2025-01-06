//Unit tests used to test the db_connection code

require('dotenv').config({path: '../config.env'});
const { verify } = require('jsonwebtoken');
const {UserDatabase, WorkoutDatabase, ExerciseDatabase, NutritionDatabase, IngredientDatabase} = require('../db_connection');

jest.mock('../db_connection', () => ({
    UserDatabase: jest.fn(() => ({
        insertUser: jest.fn(),
        verifyUser: jest.fn(),
        checkUserExists: jest.fn(),
        getUserID: jest.fn(),
        verifyEmail: jest.fn(),
        updateLastLogin: jest.fn(),
        getLastLogin: jest.fn(),
        deleteUser: jest.fn(),
        destruct: jest.fn(),
    })),
    WorkoutDatabase: jest.fn(() => ({
        createWorkout: jest.fn(),
        getWorkout: jest.fn(),
        updateWorkoutDate: jest.fn(),
        updateName: jest.fn(),
        deleteWorkout: jest.fn(),
        destruct: jest.fn(),
    })),
    ExerciseDatabase: jest.fn(() => ({
        createExercise: jest.fn(),
        getFullWorkout: jest.fn(),
        updateName: jest.fn(),
        updateRepRange: jest.fn(),
        updateSets: jest.fn(),
        updateCurrentWeight: jest.fn(),
        updateGoalWeight: jest.fn(),
        updateNotes: jest.fn(),
        appendNotes: jest.fn(),
        deleteExercise: jest.fn(),
        destruct: jest.fn(),
    })),
    NutritionDatabase: jest.fn(() => ({
        createMeal: jest.fn(),
        getStats: jest.fn(),
        updateStats: jest.fn(),
        deleteMeal: jest.fn(),
        destruct: jest.fn(),
    })),
    IngredientDatabase: jest.fn(() => ({
        createIngredient: jest.fn(),
        updateName: jest.fn(),
        updateCalories: jest.fn(),
        updateJoules: jest.fn(),
        updateProtein: jest.fn(),
        updateCarbs: jest.fn(),
        updateFat : jest.fn(),
        deleteIngredient: jest.fn(),
        destruct: jest.fn(),
    })),
}));

describe('Database Tests', () => {
    let userDb, workoutDb, exerciseDb, nutritionDb, ingredientDb;

    beforeEach(() => {
        userDb = new UserDatabase();
        workoutDb = new WorkoutDatabase();
        exerciseDb = new ExerciseDatabase();
        nutritionDb = new NutritionDatabase();
        ingredientDb = new IngredientDatabase();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('UserDatabase: all functionality', async () => {
        const currDate = new Date();

        userDb.insertUser.mockResolvedValue(true);
        userDb.verifyUser.mockResolvedValue(true);
        userDb.checkUserExists.mockResolvedValue(true);
        userDb.getUserID.mockResolvedValue(1);
        userDb.verifyEmail.mockResolvedValue(true);
        userDb.updateLastLogin.mockResolvedValue(true);
        userDb.getLastLogin.mockResolvedValue(currDate);
        userDb.deleteUser.mockResolvedValue(true);

        await userDb.insertUser('sean', 'pass1234', 'sean@');
        const isVerified = await userDb.verifyUser('sean', 'sean@', 'pass1234');
        const exists = await userDb.checkUserExists('sean', 'sean@');
        const id = await userDb.getUserID('sean', 'sean@', 'pass1234');
        const emailVerified = await userDb.verifyEmail(1);
        const isUpdatedLogin = await userDb.updateLastLogin(1);
        const getLoginDate = await userDb.getLastLogin(1);
        const deletedUser = await userDb.deleteUser(1);


        expect(userDb.insertUser).toHaveBeenCalledWith('sean', 'pass1234', 'sean@');
        expect(userDb.verifyUser).toHaveBeenCalledWith('sean', 'sean@', 'pass1234');
        expect(userDb.checkUserExists).toHaveBeenCalledWith('sean', 'sean@');
        expect(userDb.getUserID).toHaveBeenCalledWith('sean', 'sean@', 'pass1234');
        expect(userDb.verifyEmail).toHaveBeenCalledWith(1);
        expect(userDb.updateLastLogin).toHaveBeenCalledWith(1);
        expect(userDb.getLastLogin).toHaveBeenCalledWith(1);
        expect(userDb.deleteUser).toHaveBeenCalledWith(1);

        expect(isVerified).toBe(true);
        expect(exists).toBe(true);
        expect(id).toEqual(1);
        expect(emailVerified).toBe(true);
        expect(isUpdatedLogin).toBe(true);
        expect(getLoginDate).toEqual(currDate);
        expect(deletedUser).toBe(true);
    });

    test('WorkoutDatabase: all functionality', async () => {

        const currDate = new Date();

        workoutDb.createWorkout.mockResolvedValue({ id: 15, name: 'My Workout' });
        workoutDb.getWorkout.mockResolvedValue({ id: 15, name: 'My Workout' });
        workoutDb.updateWorkoutDate.mockResolvedValue(true);
        workoutDb.updateName.mockResolvedValue(true);
        workoutDb.deleteWorkout.mockResolvedValue(true);

        const workout = await workoutDb.createWorkout('My Workout', 15);
        const fetchedWorkout = await workoutDb.getWorkout(15);
        const getWorkoutDate = await workoutDb.updateWorkoutDate(currDate, 1);
        const getNewName = await workoutDb.updateName('new name', 1);
        const isDeleted = await workoutDb.deleteWorkout(15);

        expect(workoutDb.createWorkout).toHaveBeenCalledWith('My Workout', 15);
        expect(workout).toEqual({ id: 15, name: 'My Workout' });

        expect(workoutDb.getWorkout).toHaveBeenCalledWith(15);
        expect(fetchedWorkout).toEqual({ id: 15, name: 'My Workout' });

        expect(workoutDb.updateWorkoutDate).toHaveBeenCalledWith(currDate, 1);
        expect(getWorkoutDate).toBe(true);

        expect(workoutDb.updateName).toHaveBeenCalledWith('new name', 1);
        expect(getNewName).toBe(true);

        expect(workoutDb.deleteWorkout).toHaveBeenCalledWith(15);
        expect(isDeleted).toBe(true);
    });
    test('ExerciseDatabase: update ExerciseDetails', async () => {
        exerciseDb.createExercise.mockResolvedValue({ id: 1 });
        exerciseDb.getFullWorkout.mockResolvedValue({
            exercise_id: 1,
            name: 'test exercise',
            rep_start: 5,
            rep_end: 7,
            sets: 3,
            current_weight: 10,
            goal_weight: 15,
            notes: 'Notes',
            workout_ID: 5
        });
        exerciseDb.updateName.mockResolvedValue(true);
        exerciseDb.updateRepRange.mockResolvedValue(true);
        exerciseDb.updateSets.mockResolvedValue(true);
        exerciseDb.updateCurrentWeight.mockResolvedValue(true);
        exerciseDb.updateGoalWeight.mockResolvedValue(true);
        exerciseDb.updateNotes.mockResolvedValue(true);
        exerciseDb.appendNotes.mockResolvedValue(true);
        exerciseDb.deleteExercise.mockResolvedValue(true);

        const exercise = await exerciseDb.createExercise('test exercise', [5, 7], 3, 10, 15, 5, 'Notes');
        const workout = await exerciseDb.getFullWorkout(5);
        const updated = await exerciseDb.updateName('updated exercise', 1);
        const repRangeUpdate = await exerciseDb.updateRepRange([8,10], 1);
        const setUpdate = await exerciseDb.updateSets(5, 1);
        const currUpdate = await exerciseDb.updateCurrentWeight(12);
        const goalUpdate = await exerciseDb.updateGoalWeight(18, 1);
        const noteUpdate = await exerciseDb.updateNotes('new notes', 1);
        const noteAppend = await exerciseDb.appendNotes(', checking', 1);
        const deleteEx = await exerciseDb.deleteExercise(1);

        expect(exerciseDb.createExercise).toHaveBeenCalledWith(
            'test exercise',
            [5, 7],
            3,
            10,
            15,
            5,
            'Notes'
        );
        expect(exercise).toEqual({ id: 1 });

        expect(exerciseDb.getFullWorkout).toHaveBeenCalledWith(5);
        expect(workout).toEqual(
            {
                exercise_id: 1, 
                name: 'test exercise', 
                rep_start: 5, 
                rep_end: 7, 
                sets: 3, 
                current_weight: 10, 
                goal_weight: 15, 
                notes: 'Notes',  
                workout_ID: 5
            });

        expect(exerciseDb.updateName).toHaveBeenCalledWith('updated exercise', 1);
        expect(updated).toBe(true);

        expect(exerciseDb.updateRepRange).toHaveBeenCalledWith([8,10],1);
        expect(repRangeUpdate).toBe(true);

        expect(exerciseDb.updateSets).toHaveBeenCalledWith(5, 1);
        expect(setUpdate).toBe(true);

        expect(exerciseDb.updateCurrentWeight).toHaveBeenCalledWith(12);
        expect(currUpdate).toBe(true);

        expect(exerciseDb.updateGoalWeight).toHaveBeenCalledWith(18, 1);
        expect(goalUpdate).toBe(true);

        expect(exerciseDb.updateNotes).toHaveBeenCalledWith('new notes', 1);
        expect(noteUpdate).toBe(true);

        expect(exerciseDb.appendNotes).toHaveBeenCalledWith(', checking', 1);
        expect(noteAppend).toBe(true); 

        expect(exerciseDb.deleteExercise).toHaveBeenCalledWith(1);
        expect(deleteEx).toBe(true);
    });

    test('NutritionDatabase: createMeal', async () => {
        nutritionDb.createMeal.mockResolvedValue({ id: 3, name: 'test meal' });

        const meal = await nutritionDb.createMeal('test meal', 3);

        expect(nutritionDb.createMeal).toHaveBeenCalledWith('test meal', 3);
        expect(meal).toEqual({ id: 3, name: 'test meal' });
    });

    test('IngredientDatabase: create and delete ingredient', async () => {
        ingredientDb.createIngredient.mockResolvedValue({ id: 1, name: 'test ingredient' });
        ingredientDb.updateName.mockResolvedValue(true);
        ingredientDb.updateCalories.mockResolvedValue(true);
        ingredientDb.updateJoules.mockResolvedValue(true);
        ingredientDb.updateProtein.mockResolvedValue(true);
        ingredientDb.updateCarbs.mockResolvedValue(true);
        ingredientDb.updateFat.mockResolvedValue(true);
        ingredientDb.deleteIngredient.mockResolvedValue(true);


        const ingredient = await ingredientDb.createIngredient('test ingredient', 500, 0, 150, 50, 10, 1);
        const updated = await ingredientDb.updateName('updated ingredient', 1);
        const updatedCal = await ingredientDb.updateCalories(600, 1);
        const updatedJoules = await ingredientDb.updateJoules(10, 1);
        const updatedProtein = await ingredientDb.updateProtein(200, 1);
        const updatedCarbs = await ingredientDb.updateCarbs(75, 1);
        const updatedFat = await ingredientDb.updateFat(15, 1);
        const deleted = await ingredientDb.deleteIngredient(1);

        expect(ingredientDb.createIngredient).toHaveBeenCalledWith('test ingredient', 500, 0, 150, 50, 10, 1);
        expect(ingredient).toEqual({ id: 1, name: 'test ingredient' });

        expect(ingredientDb.updateName).toHaveBeenCalledWith('updated ingredient', 1);
        expect(updated).toBe(true);

        expect(ingredientDb.updateCalories).toHaveBeenCalledWith(600, 1);
        expect(updatedCal).toBe(true);

        expect(ingredientDb.updateJoules).toHaveBeenCalledWith(10, 1);
        expect(updatedJoules).toBe(true);

        expect(ingredientDb.updateProtein).toHaveBeenCalledWith(200, 1);
        expect(updatedProtein).toBe(true);

        expect(ingredientDb.updateCarbs).toHaveBeenCalledWith(75, 1);
        expect(updatedCarbs).toBe(true);

        expect(ingredientDb.updateFat).toHaveBeenCalledWith(15, 1);
        expect(updatedFat).toBe(true);

        expect(ingredientDb.deleteIngredient).toHaveBeenCalledWith(1);
        expect(deleted).toBe(true);
    });
});