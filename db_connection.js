/*This file will be used to connect to the database itself, using the singleton design pattern*/

require('dotenv').config({ path : 'config.env' });

var mysql = require('mysql');

class UserDatabase{
    static #newInstance = null;

    static instance()
    {
        if(this.#newInstance === null)
        {
            this.#newInstance = UserDatabase();
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
            password: process.env.DB_PASSWORD
        });

        this.conn.connect(function(error) {
            if(error) throw error;
            console.log("Database connected successfully");
        })
    }
    retrieveUser(username, email)
    {

    }
    insertUser(username, password, email)
    {

    }
    destruct()
    {
        this.conn.end((error) => {
            if(error)
            {
                return;
            }
        })
    }
}
