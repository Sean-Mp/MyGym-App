//Will setup and handle the REST api endpoint for the app, sends a json payload back
//Will handle POST, GET and PATCH
/*  POST: /signup and /login
*   GET /user retrieving a user's profile, /verify a users account
*   PATCH /user/ :userId updating a user's profile, workout or nutrition
*/

require('dotenv').config({path: 'config.env'});
const express = require('express');
const jwt = require('jsonwebtoken');
const {UserDatabase, WorkoutDatabase, ExerciseDatabase, NutritionDatabase, IngredientDatabase} = require('./db_connection');
const tokenSender = require('./tokenSender');

const PORT = process.env.PORT || 3000;
const app = express();
app.use(express.json());

app.listen(PORT, () => {
    console.log("Server Listening on PORT:", PORT);
})

app.post('/signup', async (req, res) => {
    
    const newUser = req.body;

    if(!newUser || Object.keys(newUser).length === 0)
    {
        return res.send({
            status: 'HTTP/1.1 400 Bad Request',
            message: 'JSON body empty'
        });
    }
    if(!newUser.username || !newUser.email || !newUser.password)
    {
        return res.send({
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
    //email will have to be a valid email]

    if(username.length <= 5)
    {
        return res.send({
            status: 'HTTP/1.1 400 Bad Request',
            message: 'username invalid'
        });
    }

    if(!validateEmail(email))
    {
        return res.send({
            status: 'HTTP/1.1 400 Bad Request',
            message: 'email address invalid'
        });
    }

    if(password.length < 8 || !validPassword(password))
    {
        return res.send({
            status : 'HTTP/1.1 400 Bad Request',
            message : 'invalid password'
        });
    }

    //username, email and password are now valid

    var userConn = UserDatabase.instance();

    try{
        //Check for duplicate user
        if(!await userConn.checkUserExists(username, email))
        {
            return res.send({
                status: 'HTTP/1.1 400 Bad Request',
                message: "user already exists"
            });
        }

        //insert new user
        await userConn.insertUser(username, password, email);

        const token = jwt.sign({ email }, 'key', { expiresIn: '10d' });

        const sender = secure_configuration.EMAIL_USERNAME;
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
        userConn.destruct();
    }

    res.status(200).send({
        status: 'HTTP/1.1 200 OK',
        message: 'User successfully created'
    });


});

app.post('/login', async (req, res) => {
    const user = req.body;

    const username = "";
    const email = "";
    
    if(!user || Object.keys(user).length === 0)
    {
        return res.send({
            status: 'HTTP/1.1 400 Bad Request',
            message: 'JSON body empty'
        });
    }
    
    if(!user.password && (!user.username || !user.email))
    {
        return res.send({
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

        return res.send({
            staus: 'HTTP/1.1 400 Bad Request',
            message: 'username or email not included'
        });
    }
            
    const password = user.password;
    //check if user exists in the database
    var userConn = UserDatabase.instance();
    var loggedUser_id;

    try{
        if(!await userConn.verifyUser(username, email, password))
        {
            return res.send({
                status: 'HTTP/1.1 400 Bad Request',
                message: "user doesnt exists"
            });
        }
        loggedUser_id = userConn.getUserID(username, email);
        userConn.updateLastLogin(loggedUser_id);
    }
    catch(error)
    {
        return res.send({
            status: "HTTP/1.1 500 Internal Server Error",
            message: error.message
        });
    }
    finally{
        userConn.destruct();
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
        return res.send({
            status: 'HTTP/1.1 400 Bad Request',
            message: 'JSON body empty'
        });
    }

    //verify that the user_id is included in the request and correct
    var userConn = UserDatabase.instance();
    var user_id = user.user_id;

    try
    {
        if(!userConn.verifyUser(user_id))
        {
            return res.send({
                status: 'HTTP/1.1 400 Bad Request',
                message: 'user doesnt exist'
            });
        }

        //check what type of GET request they want
        if(user.type === 'profile')
        {
            var username = userConn.getUsername(user_id);
            var lastLogin = userConn.getLastLogin(user_id);

            return res.send({
                status: 'HTTP/1.1 200 OK',
                message: 'User Profile',
                username: username,
                lastLogin: lastLogin
            });
        }
        else if(user.type === 'workout')
        {
            try{
                var workoutConn = WorkoutDatabase.instance();
                var workout = workoutConn.getWorkout(user_id);

                return res.send({
                    status: 'HTTP/1.1 200 OK',
                    message: 'User Workout',
                    workout: workout
                });
            }
            catch(error)
            {
                return res.send({
                    status: 'HTTP/1.1 500 Internal Server Error',
                    message: error.message
                });
            }
            finally
            {
                workoutConn.destruct();
            }
        }
        else if(user.type === 'meals')
        {
            try{
                var nutritionConn = NutritionDatabase.instance();
                var meal = nutritionConn.getMeal(user_id);

                return res.send({
                    status: 'HTTP/1.1 200 OK',
                    message: 'All user Meals',
                    meal: meal
                });
            }
            catch(error)
            {
                return res.send({
                    status: 'HTTP/1.1 500 Internal Server Error',
                    message: error.message
                });
            }
            finally
            {
                nutritionConn.destruct();
            }
        }
    }
    catch(error)
    {
        return res.send({
            status: "HTTP/1.1 500 Internal Server Error",
            message: error.message
        });
    }
    finally
    {
        userConn.destruct();
    }
});
app.get('/verify', async (req, res) => {

    const token = req.query.token;

    if(!token)
    {
        return res.send({
            status: 'HTTP/1.1 400 Bad Request',
            message: 'Token not found'
        });
    }

    var userConn = UserDatabase.instance();
    try{
        const decode = jwt.verify(token, 'key');
        const email = decode.email;

        if(!await userConn.verifyUser(req.body.user_id))
        {
            return res.send({
                status: 'HTTP/1.1 400 Bad Request',
                message: 'user doesnt exist'
            });
        }

        res.send({
            status: 'HTTP/1.1 200 OK',
            message: 'Email successfully verified'
        });
    }
    catch(error)
    {
        return res.send({
            status: "HTTP/1.1 500 Internal Server Error",
            message: error.message
        });
    }
    finally{
        userConn.destruct();
    }
});
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