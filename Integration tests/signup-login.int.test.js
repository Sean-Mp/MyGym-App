require('dotenv').config({ path: 'config.env' });
const request = require('supertest');
const app = require('../Rest_api'); // or wherever your app is exported
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

afterAll(async () => {
    await userDB.conn.query("DELETE FROM users WHERE email LIKE 'testuser%@example.com'");

    await userDB.destruct();
    await workoutDB.destruct();
    await exerciseDB.destruct();
    await nutritionDB.destruct();
    await ingredientDB.destruct();
});

describe('POST /signup - Integration tests', () => {
    it('should create a new user with valid credentials', async() => {
        const res = await request(app).post('/signup').send({
            username: 'testuser1',
            email: 'testuser1@example.com',
            password: 'ValidPass@123'
        });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('user_id');
        expect(res.body.message).toMatch("User successfully created");
    });
    it('rejects user with short username', async() => {
        const res = await request(app).post('/signup').send({
            username: 'abs',
            email: 'testuser1@example.com',
            password: 'Password@123'
        });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch("username invalid");
    });
    it('rejects user with invalid email', async() => {
        const res = await request(app).post('/signup').send({
            username: 'testuser1',
            email: 'testuser1',
            password: 'Password@123'
        });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch("email address invalid");
    });
    it('rejects user with invalid password', async() => {
        const res = await request(app).post('/signup').send({
            username: 'testuser1',
            email: 'testuser1@example.com',
            password: 'pass'
        });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch("invalid password");
    });
    it('rejects duplicate user', async() => {
        await request(app).post('/signup').send({
            username: 'testuser5',
            email: 'testuser5@example.com',
            password: 'Password@123'
        });

        const res = await request(app).post('/signup').send({
            username: 'testuser5',
            email: 'testuser5@example.com',
            password: 'Password@123'
        });

        expect(res.statusCode).toBe(403);
        expect(res.body.message).toMatch("user already exists");
    });
});
describe('POST /login - Integration tests', () => {
    it('should reject login with invalid credentials', async() => {
        const res = await request(app).post('/login').send({
            username: 'nonExistent',
            password: 'WrongPass@12'
        });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch("user doesnt exists");
    });
    it('should successfully login', async() =>{
        jest.setTimeout(10000);
        
        const signupReq = await request(app).post('/signup').send({
            username: 'testuser6',
            email: 'testuser6@example.com',
            password: 'Password@123'
        });

        expect(signupReq.statusCode).toBe(200);

        const res = await request(app).post('/login').send({
            username: 'testuser6',
            password: 'Password@123'
        });


        expect(res.statusCode).toBe(200);
        expect(res.body.message).toMatch("User succefully logged in");
    });
});