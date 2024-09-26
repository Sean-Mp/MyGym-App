//Will setup and handle the REST api endpoint for the app, sends a json payload back
//Will handle POST, GET and PATCH
/*  POST: /signup and /login
*   GET /user retrieving a user's profile, /verify verifying a users account
*   PATCH /user/:userId updating a user's profile
*/

require('dotenv').config({path: 'config.env'});
const express = require('express');
const {UserDatabase, WorkoutDatabase, ExerciseDatabase, NutritionDatabase, IngredientDatabase} = require('./db_connection');

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

    try{
        if(!await userConn.verifyUser(username, email, password))
        {
            return res.send({
                status: 'HTTP/1.1 400 Bad Request',
                message: "user doesnt exists"
            });
        }
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
        message: "User succefully logged in"
    });
})


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