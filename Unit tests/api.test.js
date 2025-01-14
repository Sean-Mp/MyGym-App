const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const { UserDatabase, WorkoutDatabase, NutritionDatabase, ExerciseDatabase, IngredientDatabase } = require('../db_connection');
const tokenSender = require('../tokenSender');
const {app, server }  = require('../Rest_api');

jest.mock('../db_connection');
jest.mock('../tokenSender');

describe('REST API Tests', () => {
    let userDbMock, workoutDbMock, nutritionDbMock, exerciseDbMock, ingredientDbMock;

    beforeEach(() => {
        userDbMock = {
            checkUserExists: jest.fn(),
            insertUser: jest.fn(),
            verifyEmail: jest.fn(),
            verifyUser: jest.fn(),
            verifyUserID: jest.fn(),
            getUserID: jest.fn(),
            updateLastLogin: jest.fn(),
            getUsername: jest.fn(),
            getLastLogin: jest.fn(),
            deleteUser: jest.fn(),
            destruct: jest.fn()
        };
        UserDatabase.mockImplementation(() => userDbMock);

        workoutDbMock = {
            getWorkout: jest.fn(),
            createWorkout: jest.fn(),
            updateWorkoutDate: jest.fn(),
            updateName: jest.fn(),
            deleteWorkout: jest.fn(),
            destruct: jest.fn()
        };

        WorkoutDatabase.mockImplementation(() => workoutDbMock);

        exerciseDbMock = {
            createExercise: jest.fn(),
            getFullWorkout: jest.fn(),
            getExercise: jest.fn(),
            updateName: jest.fn(),
            updateRepRange: jest.fn(),
            updateSets: jest.fn(),
            updateCurrentWeight: jest.fn(),
            updateGoalWeight: jest.fn(),
            updateNotes: jest.fn(),
            appendNotes: jest.fn(),
            deleteExercise: jest.fn(),
            destruct: jest.fn()
        };

        ExerciseDatabase.mockImplementation(() => exerciseDbMock);

        nutritionDbMock = {
            createMeal: jest.fn(),
            getMeal: jest.fn(),
            getStats: jest.fn(),
            updateName: jest.fn(),
            updateStats: jest.fn(),
            deleteMeal: jest.fn(),
            destruct: jest.fn()
        };
        NutritionDatabase.mockImplementation(() => nutritionDbMock);

        ingredientDbMock = {
            createIngredient: jest.fn(),
            getIngredient: jest.fn(),
            updateName: jest.fn(),
            updateCalories: jest.fn(),
            updateJoules: jest.fn(),
            updateProtein: jest.fn(),
            updateCarbs: jest.fn(),
            updateFat: jest.fn(),
            deleteIngredient: jest.fn(),
            destruct: jest.fn()
        };

        IngredientDatabase.mockImplementation(() => ingredientDbMock);
    });


    afterEach(() => {
        jest.clearAllMocks();
    });

    afterAll((done) => {
        server.close(done);
    });

    describe('POST /signup', () => {
        it('should return 400 if JSON body is empty', async () => {
            const response = await request(app).post('/signup').send({});
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('JSON body empty');
        });

        it('should return 400 if username, email, or password is not included', async () => {
            const response = await request(app).post('/signup').send({ username: 'test' });
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('username, email or password not included');
        });

        it('should return 400 if username is invalid', async () => {
            const response = await request(app).post('/signup').send({ username: 'test', email: 'test@test.com', password: 'Password1!' });
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('username invalid');
        });

        it('should return 400 if email is invalid', async () => {
            const response = await request(app).post('/signup').send({ username: 'testuser', email: 'invalidemail', password: 'Password1!' });
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('email address invalid');
        });

        it('should return 400 if password is invalid', async () => {
            const response = await request(app).post('/signup').send({ username: 'testuser', email: 'test@test.com', password: 'pass' });
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('invalid password');
        });

        it('should return 200 and send verification email if user is successfully created', async () => {
            userDbMock.checkUserExists.mockResolvedValue(false);
            userDbMock.insertUser.mockResolvedValue(true);
            tokenSender.sendMail.mockResolvedValue(true);

            const response = await request(app).post('/signup').send({ username: 'testuser', email: 'test@test.com', password: 'Password1!' });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('User successfully created');
            expect(userDbMock.checkUserExists).toHaveBeenCalledWith('testuser', 'test@test.com');
            expect(userDbMock.insertUser).toHaveBeenCalledWith('testuser', 'Password1!', 'test@test.com');
            expect(tokenSender.sendMail).toHaveBeenCalled();
        });
    });
    describe('POST /login', () => {
        it('should return 400 if JSON body is empty', async () => {
            const response = await request(app).post('/login').send({});
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('JSON body empty');
        });

        it('should return 400 if username, email, or password is missing', async () => {
            const response = await request(app).post('/login').send({ username: 'testuser' });
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('username, email or password not included');
        });

        it('should return 400 if user does not exist', async () => {
            userDbMock.verifyUser.mockResolvedValue(false);
            const response = await request(app).post('/login').send({
                username: 'testuser',
                email: 'test@test.com',
                password: 'Password1!',
            });
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('user doesnt exists');
        });

        it('should return 200 and log in the user', async () => {
            userDbMock.verifyUser.mockResolvedValue(true);
            userDbMock.getUserID.mockReturnValue(1);
            userDbMock.updateLastLogin.mockResolvedValue(true);

            const response = await request(app).post('/login').send({
                username: 'testuser',
                email: 'test@test.com',
                password: 'Password1!',
            });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('User succefully logged in');
            expect(userDbMock.verifyUser).toHaveBeenCalledWith('testuser', 'test@test.com', 'Password1!');
            expect(userDbMock.getUserID).toHaveBeenCalledWith('testuser', 'test@test.com');
            expect(userDbMock.updateLastLogin).toHaveBeenCalledWith(1);
        });
    });
    describe('GET /verify', () => {
        it('should return 400 if token is not provided', async () => {
            const response = await request(app).get('/verify').query({});
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Token not found');
        });

        it('should return 200 if email is successfully verified', async () => {
            const token = jwt.sign({ email: 'test@test.com' }, 'ourSecretKey', { expiresIn: '30d' });
            userDbMock.verifyEmail.mockResolvedValue(true);

            const response = await request(app).get('/verify').query({ token });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Email successfully verified');
            expect(userDbMock.verifyEmail).toHaveBeenCalledWith('test@test.com');
        });

        it('should return 500 if there is an error verifying the token', async () => {
            const token = jwt.sign({ email: 'test@test.com' }, 'ourSecretKey', { expiresIn: '30d' });
            userDbMock.verifyEmail.mockRejectedValue(new Error('Verification error'));

            const response = await request(app).get('/verify').query({ token });

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Verification error');
        });
    });
    describe('GET /user', () => {
        it('should return 400 if JSON body is empty', async () => {
            const response = await request(app).get('/user').send({});
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('JSON body empty');
        });

        it('should return 400 if user does not exist', async () => {
            userDbMock.verifyUserID.mockResolvedValue(false);
            const response = await request(app).get('/user').send({ user_id: 1 });
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('user doesnt exist');
        });

        it('should return 200 and user profile data', async () => {
            userDbMock.verifyUserID.mockResolvedValue(true);
            userDbMock.getUsername.mockReturnValue('testuser');
            userDbMock.getLastLogin.mockReturnValue('2025-01-01');

            const response = await request(app).get('/user').send({
                user_id: 1,
                type: 'profile',
            });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('User Profile');
            expect(response.body.username).toBe('testuser');
            expect(response.body.lastLogin).toBe('2025-01-01');
        });

        it('should return 200 and user workout data', async () => {
            userDbMock.verifyUserID.mockResolvedValue(true);
            workoutDbMock.getWorkout.mockReturnValue('Workout Data');

            const response = await request(app).get('/user').send({
                user_id: 1,
                type: 'workout',
            });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('User Workout');
            expect(response.body.workout).toBe('Workout Data');
        });

        it('should return 200 and user meal data', async () => {
            userDbMock.verifyUserID.mockResolvedValue(true);
            nutritionDbMock.getMeal.mockReturnValue('Meal Data');

            const response = await request(app).get('/user').send({
                user_id: 1,
                type: 'meals',
            });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('All user Meals');
            expect(response.body.meal).toBe('Meal Data');
        });

        it('should return 200 and meal statistics', async () => {
            userDbMock.verifyUserID.mockResolvedValue(true);
            nutritionDbMock.getStats.mockReturnValue('Meal Stats');

            const response = await request(app).get('/user').send({
                user_id: 1,
                type: 'meal-stats',
                meal_id: 100,
            });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Meal Stats');
            expect(response.body.meal).toBe('Meal Stats');
        });
    });
    describe('PUT /user Tests', () => {
        it('should return 400 if JSON body is empty', async () => {
            const response = await request(app).put('/user').send({});
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('JSON body empty');
        });
    
        it('should return 400 if user does not exist', async () => {
            userDbMock.verifyUserID.mockResolvedValue(false);
    
            const response = await request(app).put('/user').send({ user_id: 1, type: 'workout' });
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('user doesnt exist');
            expect(userDbMock.verifyUserID).toHaveBeenCalledWith(1);
        });
    
        it('should create a workout successfully', async () => {
            userDbMock.verifyUserID.mockResolvedValue(true);
            workoutDbMock.createWorkout.mockResolvedValue(true);
            workoutDbMock.getWorkout.mockResolvedValue({ workout_id: 1 });
    
            const response = await request(app)
                .put('/user')
                .send({ user_id: 1, type: 'workout', workout_name: 'Morning Workout' });
    
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Workout successfully created');
            expect(workoutDbMock.createWorkout).toHaveBeenCalledWith('Morning Workout', 1);
        });
    
        it('should return 400 if workout_name is not included', async () => {
            userDbMock.verifyUserID.mockResolvedValue(true);
    
            const response = await request(app).put('/user').send({ user_id: 1, type: 'workout' });
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Workout name not included');
        });
    
        it('should create an exercise successfully', async () => {
            userDbMock.verifyUserID.mockResolvedValue(true);
            exerciseDbMock.getFullWorkout.mockResolvedValue(true);
            exerciseDbMock.createExercise.mockResolvedValue(true);
    
            const response = await request(app)
                .put('/user')
                .send({
                    user_id: 1,
                    type: 'exercise',
                    workout_id: 1,
                    exercise_name: 'Push Up',
                    rep_range: [10, 12],
                    sets: 3,
                    current_weight: 0,
                    goal_weight: 0,
                    notes: 'Do daily',
                });
    
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Exercise successfully created');
            expect(exerciseDbMock.createExercise).toHaveBeenCalledWith(
                'Push Up',
                [10, 12],
                3,
                0,
                0,
                1,
                'Do daily'
            );
        });
    
        it('should return 400 if exercise fields are missing', async () => {
            userDbMock.verifyUserID.mockResolvedValue(true);
            exerciseDbMock.getFullWorkout.mockResolvedValue(true);
    
            const response = await request(app).put('/user').send({
                user_id: 1,
                type: 'exercise',
                workout_id: 1,
            });
    
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Invalid exercise');
        });
    
        it('should create a meal successfully', async () => {
            userDbMock.verifyUserID.mockResolvedValue(true);
            nutritionDbMock.createMeal.mockResolvedValue(true);
    
            const response = await request(app)
                .put('/user')
                .send({ user_id: 1, type: 'meal', meal_name: 'Healthy Meal' });
    
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Meal successfully created');
            expect(nutritionDbMock.createMeal).toHaveBeenCalledWith('Healthy Meal', 1);
        });
    
        it('should return 400 if meal_name is not included', async () => {
            userDbMock.verifyUserID.mockResolvedValue(true);
    
            const response = await request(app).put('/user').send({ user_id: 1, type: 'meal' });
    
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Meal name not included');
        });
    
        it('should create an ingredient successfully', async () => {
            userDbMock.verifyUserID.mockResolvedValue(true);
            nutritionDbMock.getMeal.mockResolvedValue(true);
            ingredientDbMock.createIngredient.mockResolvedValue(true);
    
            const response = await request(app)
                .put('/user')
                .send({
                    user_id: 1,
                    type: 'ingredient',
                    meal_id: 1,
                    ingredient_name: 'Chicken',
                    calories: 200,
                    protein: 30,
                    carbs: 0,
                    fat: 5,
                });
    
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Ingredient successfully created');
            expect(ingredientDbMock.createIngredient).toHaveBeenCalledWith(
                'Chicken',
                200,
                30,
                0,
                5,
                1
            );
        });
    
        it('should return 400 if ingredient fields are missing', async () => {
            userDbMock.verifyUserID.mockResolvedValue(true);
            nutritionDbMock.getMeal.mockResolvedValue(true);
    
            const response = await request(app).put('/user').send({
                user_id: 1,
                type: 'ingredient',
                meal_id: 1,
            });
    
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Invalid ingredient');
        });
    });
    describe('PATCH /user Tests', () => {
        it('should return 400 if JSON body is empty', async () => {
            const response = await request(app).patch('/user').send({});
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('JSON body empty');
        });
    
        it('should return 400 if user does not exist', async () => {
        userDbMock.verifyUserID.mockResolvedValue(false);
    
        const response = await request(app)
            .patch('/user')
            .send({ user_id: 1, type: 'workout' });
    
        expect(response.status).toBe(400);
        expect(response.body.message).toBe('user doesnt exist');
        expect(userDbMock.verifyUserID).toHaveBeenCalledWith(1);
        });
    
        it('should update workout date successfully', async () => {
        userDbMock.verifyUserID.mockResolvedValue(true);
        workoutDbMock.updateWorkoutDate.mockResolvedValue(true);
    
        const response = await request(app)
            .patch('/user')
            .send({ user_id: 1, type: 'workout', update: 'date', workout_id: 1 });
    
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Update successful');
        expect(workoutDbMock.updateWorkoutDate).toHaveBeenCalledWith(expect.any(Date), 1);
        });
    
        it('should return 400 for invalid workout update type', async () => {
        userDbMock.verifyUserID.mockResolvedValue(true);
    
        const response = await request(app)
            .patch('/user')
            .send({ user_id: 1, type: 'workout', update: 'invalid', workout_id: 1 });
    
        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Invalid workout update');
        });
    
        it('should update exercise name successfully', async () => {
        userDbMock.verifyUserID.mockResolvedValue(true);
        exerciseDbMock.updateName.mockResolvedValue(true);
    
        const response = await request(app)
            .patch('/user')
            .send({ user_id: 1, type: 'exercise', update: 'name', name: 'New Exercise', exercise_id: 1 });
    
        expect(response.status).toBe(200);
        expect(exerciseDbMock.updateName).toHaveBeenCalledWith('New Exercise', 1);
        });
    
        it('should return 400 for invalid exercise update type', async () => {
        userDbMock.verifyUserID.mockResolvedValue(true);
    
        const response = await request(app)
            .patch('/user')
            .send({ user_id: 1, type: 'exercise', update: 'invalid', exercise_id: 1 });
    
        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Invalid exercise update');
        });
    
        it('should update meal name successfully', async () => {
        userDbMock.verifyUserID.mockResolvedValue(true);
        nutritionDbMock.updateName.mockResolvedValue(true);
    
        const response = await request(app)
            .patch('/user')
            .send({ user_id: 1, type: 'meals', update: 'name', name: 'New Meal', meal_id: 1 });
    
        expect(response.status).toBe(200);
        expect(nutritionDbMock.updateName).toHaveBeenCalledWith('New Meal', 1);
        });
    
        it('should update ingredient protein successfully', async () => {
        userDbMock.verifyUserID.mockResolvedValue(true);
        ingredientDbMock.updateProtein.mockResolvedValue(true);
    
        const response = await request(app)
            .patch('/user')
            .send({ user_id: 1, type: 'ingredient', update: 'protein', protein: 25, ingredient_id: 1 });
    
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Update successful');
        expect(ingredientDbMock.updateProtein).toHaveBeenCalledWith(25, 1);
        });
    
        it('should return 400 for invalid ingredient update type', async () => {
        userDbMock.verifyUserID.mockResolvedValue(true);
    
        const response = await request(app)
            .patch('/user')
            .send({ user_id: 1, type: 'ingredient', update: 'invalid', ingredient_id: 1 });
    
        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Invalid ingredient update');
        });
    
        it('should return 500 on server error', async () => {
        userDbMock.verifyUserID.mockImplementation(() => {
            throw new Error('Database connection failed');
        });
    
        const response = await request(app)
            .patch('/user')
            .send({ user_id: 1, type: 'workout', update: 'name', name: 'New Workout', workout_id: 1 });
    
        expect(response.status).toBe(500);
        expect(response.body.message).toBe('Database connection failed');
        });
    });
    describe('DELETE /user', () => {
        it('should return 400 if JSON body is empty', async () => {
            const response = await request(app).delete('/user').send({});
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('JSON body empty');
        });
    
        it('should return 400 if user does not exist', async () => {
            userDbMock.verifyUserID.mockResolvedValue(false);
            const response = await request(app).delete('/user').send({ user_id: 1, type: 'profile' });
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('user doesnt exist');
        });
    
        it('should delete user profile successfully', async () => {
            userDbMock.verifyUserID.mockResolvedValue(true);
            userDbMock.deleteUser.mockResolvedValue(true);
            
            const response = await request(app).delete('/user').send({ user_id: 1, type: 'profile' });
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('User successfully deleted');
        });
    
        it('should return 400 if workout does not exist', async () => {
            userDbMock.verifyUserID.mockResolvedValue(true);
            workoutDbMock.getWorkout.mockResolvedValue(false);
            const response = await request(app).delete('/user').send({ user_id: 1, type: 'workout', workout_id: 1 });
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('workout doesnt exist');
        });
    
        it('should delete workout successfully', async () => {
            userDbMock.verifyUserID.mockResolvedValue(true);
            workoutDbMock.getWorkout.mockResolvedValue(true);
            workoutDbMock.deleteWorkout.mockResolvedValue(true);
            const response = await request(app).delete('/user').send({ user_id: 1, type: 'workout', workout_id: 1 });
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Workout successfully deleted');
        });
    
        it('should return 400 if exercise does not exist', async () => {
            userDbMock.verifyUserID.mockResolvedValue(true);
            exerciseDbMock.getExercise.mockResolvedValue(false);
            const response = await request(app).delete('/user').send({ user_id: 1, type: 'exercise', exercise_id: 1 });
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('exercise doesnt exist');
        });
    
        it('should delete exercise successfully', async () => {
            userDbMock.verifyUserID.mockResolvedValue(true);
            exerciseDbMock.getExercise.mockResolvedValue(true);
            exerciseDbMock.deleteExercise.mockResolvedValue(true);
            const response = await request(app).delete('/user').send({ user_id: 1, type: 'exercise', exercise_id: 1 });
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Exercise successfully deleted');
        });
    
        it('should return 400 if meal does not exist', async () => {
            userDbMock.verifyUserID.mockResolvedValue(true);
            nutritionDbMock.getMeal.mockResolvedValue(false);
            const response = await request(app).delete('/user').send({ user_id: 1, type: 'meals', meal_id: 1 });
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('meal doesnt exist');
        });
    
        it('should delete meal successfully', async () => {
            userDbMock.verifyUserID.mockResolvedValue(true);
            nutritionDbMock.getMeal.mockResolvedValue(true);
            nutritionDbMock.deleteMeal.mockResolvedValue(true);
            const response = await request(app).delete('/user').send({ user_id: 1, type: 'meals', meal_id: 1 });
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Meal successfully deleted');
        });
    
        it('should return 400 if ingredient does not exist', async () => {
            userDbMock.verifyUserID.mockResolvedValue(true);
            ingredientDbMock.getIngredient.mockResolvedValue(false);
            const response = await request(app).delete('/user').send({ user_id: 1, type: 'ingredient', ingredient_id: 1 });
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('ingredient doesnt exist');
        });
    
        it('should delete ingredient successfully', async () => {
            userDbMock.verifyUserID.mockResolvedValue(true);
            ingredientDbMock.getIngredient.mockResolvedValue(true);
            ingredientDbMock.deleteIngredient.mockResolvedValue(true);
            const response = await request(app).delete('/user').send({ user_id: 1, type: 'ingredient', ingredient_id: 1 });
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Ingredient successfully deleted');
        });
    
        it('should return 400 for invalid delete type', async () => {
            userDbMock.verifyUserID.mockResolvedValue(true);
            const response = await request(app).delete('/user').send({ user_id: 1, type: 'invalid' });
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Invalid delete type');
        });
    
        it('should return 500 on server error', async () => {
            userDbMock.verifyUserID.mockImplementation(() => {
                throw new Error('Database connection failed');
            });
            const response = await request(app).delete('/user').send({ user_id: 1, type: 'profile' });
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Database connection failed');
        });
    });
});