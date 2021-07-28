/*
=======================================================
  Title: index.js
  Author: Alex Haefner
  Date: 07/27/2021
  Modified by: Alex Haefner
  Description: Description
========================================================
*/



/*  EXPRESS SETUP  */

const express = require('express');
const app = express();

//Defining the directory from which to serve static files
app.use(express.static(__dirname));

//Help us parse the body of our request
const bodyParser = require('body-parser');

//Help us save the session cookie
const expressSession = require('express-session')({
  secret: 'secret', //Configuring express-session with a secret to sign the session ID cookie
  resave: false,
  saveUninitialized: false
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressSession);

//Set the port to the environment port variable | default local port is 3000
const port = process.env.PORT || 3000;
app.listen(port, () => console.log('App listening on port ' + port));


/*  PASSPORT JS SETUP  */

//Requiring&initialize passport w/its authentication middleware
const passport = require('passport');
app.use(passport.initialize());
app.use(passport.session());


/*  MONGOOSE SETUP */

const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

//Connecting to DB using mongoose.connect
mongoose.connect('mongodb://localhost/MyDatabase',
{ useNewUrlParser: true, useUinifiedTopology: true });

//Schema to define data structure
const Schema = mongoose.Schema;
const UserDetail = new Schema({

    username: String,
    password: String

});

UserDetail.plugin(passportLocalMongoose);
const UserDetails = mongoose.model('userInfo', UserDetail, 'userInfo');

/*  PASSPORT LOCAL AUTHENTICATION  */

passport.use(UserDetails.createStrategy());

//Serialize the user instance with information passed on to it & store 
//it in the session via a cookie
passport.serializeUser(UserDetails.serializeUser());

//Deserialize the instance, giving it the unique cookie 
//identifier as a 'credential'
passport.deserializeUser(UserDetails.deserializeUser());


/*  ROUTES  */

const connectEnsureLogin = require('connect-ensure-login');

//Setting up a route to handle a POST req to the /login path

app.post('/login', (req, res, next) => {
  passport.authenticate('local',
  (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      return res.redirect('/login?info=' + info);
    }


    req.logIn(user, function(err) {
      if (err) {
        return next(err);
      }

      return res.redirect('/');
    });

  })(req, res, next);
});

//Using res.sendFile() to send the login page. Passing the file path
//and root directory. The login route will be accessable to everyone, but the 
///private and / one won't.
app.get('/login',
    (req, res) => res.sendFile('login.html',
    { root: __dirname })
);

//Before the callback we're adding connectEnsureLogin.ensureLoggedIn(). This is our route guard.
//it's job is validating the session to make sure you're allowed to see that route. We're authenticating the user every time
app.get('/',
  connectEnsureLogin.ensureLoggedIn(),
  (req, res) => res.sendFile('html/index.html', {root: __dirname})
);




app.get('/private',
    connectEnsureLogin.ensureLoggedIn(),
    (req, res) => res.sendFile('private.html', {root: __dirname})
);

//This will return an object with our user information
app.get('/user',
  connectEnsureLogin.ensureLoggedIn(),
  (req, res) => res.send({user: req.user})
);



