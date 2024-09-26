/*Will handle sending a token to the users email in order to verify the user
* Will use jsonwebtoken and nodemailer
* After verification the database will be updated to reflect that change
*/

const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: secure_configuration.EMAIL_USERNAME,
        pass: secure_configuration.PASSWORD
    }
});

const token = jwt.sign({
    data: 'Token Data' },
    'ourSecretKey', 
    { expiresIn: '30d' }  
); 

class tokenSender{

    createMailConfigurations(sender, receiver, token){
        return{
            from: sender,
            to: receiver,
            subject: 'Email Verfication',
            text: `Hi, Welcome to MyGym, You have recently created a MyGym account
                   Please follow the given link to verify your email:  
                   http://localhost:3000/verify/${token}`
        }
    }
    
    sendMail(sender, receiver)
    {
        const mailConfiguration = this.createMailConfigurations(sender, receiver, token);

        transporter.sendMail(mailConfiguration, function(error, info){
            if(error){
                throw new Error(error);
            }
            console.log('Email Sent Successfully');
            console.log(info);
        });
    }
}

module.exports = {
    tokenSender
};