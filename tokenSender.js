/*Will handle sending a token to the users email in order to verify the user
* Will use jsonwebtoken and nodemailer
* After verification the database will be updated to reflect that change
*/

const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
require('dotenv').config({path: 'config.env'});

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.PASSWORD
    }
});

class tokenSender{

    createMailConfigurations(sender, receiver, token){
        const token = jwt.sign({
            email: receiver,
            data: 'Token Data' },
            'ourSecretKey', 
            { expiresIn: '30d' }  
        ); 

        return{
            from: sender,
            to: receiver,
            subject: 'Email Verfication',
            text: `Hi, Welcome to MyGym, You have recently created a MyGym account
                   Please follow the given link to verify your email:  
                   http://localhost:3000/verify/${token}`
        }
    }
    forgotMailConfigurations(sender, receiver, token){
        const token = jwt.sign({
            email: receiver,
            data: 'Token Data' },
            'ourSecretKey', 
            { expiresIn: '30d' }  
        ); 
        return{
            from: sender,
            to: receiver,
            subject: 'Password Reset',
            text: `Hi, You have requested a password reset on your account
                   If this wasnt you please ignore this email:
                   http://localhost:3000/reset/${token}`
        }
    }
    
    sendMail(sender, receiver)
    {
        const mailConfiguration = this.createMailConfigurations(sender, receiver, token);

        transporter.sendMail(mailConfiguration, function(error, info){
            if(error){
                throw new Error(error);
            }
        });
    }
    sendResetMail(sender, receiver)
    {
        const mailConfiguration = this.forgotMailConfigurations(sender, receiver, token);

        transporter.sendMail(mailConfiguration, function(err){
            if(err)
            {
                throw new Error(error);
            }
        });
    }
}

module.exports = new tokenSender();