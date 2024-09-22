//Will setup and handle the REST api endpoint for the app, sends a json payload back
//Will handle POST, GET and PATCH
/*  POST: /signup and /login
*   GET /user retrieving a user's profile
*   PATCH /user/:userId updating a user's profile
*/

const express = require('express');
const UserDatabase = require('./db_connection');

const PORT = process.env.PORT || 3000;
const app = express();

app.listen(PORT, () => {
    console.log("Server Listening on PORT:", port);
})

app.post('/signup', (req, res) => {
    const newUser = req.body;

    if(newUser.username === '' || newUser.email === '' || newUser.password === '')
    {
        res.send({
            staus: 'HTTP/1.1 400 Bad Request',
            message: 'username, email or password not included'
        });
    }
    
    const username = newUser.email;
    const email = newUser.email;
    const password = newUser.password;


    //Check if username, email and password is valid
    //Username will be valid if the length of the string is > 5
    //Password will require to be at least 8 characters, including numbers, special character and upper and lower case letters
    //email will have to be a valid email

    const validateEmail = (email) => {
        return String(email)
          .toLowerCase()
          .match(
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
          );
      };
    
})