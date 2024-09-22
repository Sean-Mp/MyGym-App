/*This file will be used to connect to the database itself, using the singleton design pattern*/

require('dotenv').config({ path : 'config.env' });

var mysql = require('mysql');
const bcrypt = require('bcryptjs');

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
                    return resolve(false);
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
            //Encrypt password
            bcrypt.genSalt(15, (error, Salt) => {
                if(error) return reject(error);

                bcrypt.hash(password, Salt, (error, hash) => {
                    if(error) return reject(error);

                    const sql = "INSERT INTO users (username, email, password) VALUES (?, ?, ?)" ;

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
module.exports = UserDatabase;

//Test
// async function test(){

//     var conn = UserDatabase.instance();
//     try{
//         // await conn.insertUser("sean", "pass1234", "sean@");
//         const isVerified = await conn.verifyUser("sean", "sean@", "pass1234");

//         if(isVerified)
//         {
//             console.log("success");
//         }
//         else
//         {
//             console.log("failed");
//         }
//     }
//     catch(error){
//         console.log("Error during insertion");
//     }
//     finally{
//         conn.destruct();
//     }
// }
// test();