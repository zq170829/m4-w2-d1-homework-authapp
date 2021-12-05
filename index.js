//require express module
const express = require('express');

//create express app by calling express()
const app = express();

//define the directory from which to serve our static files
app.use(express.static(__dirname));

//requires the body-parser MIDDLEWARE, helping us parse the body of our requests.
const bodyParser = require('body-parser');

//require express-session module, helping us save the session cookie
const expressSession = require('express-session')({
  secret:'secret',
  resave:false,
  saveUninitialized:true,
  cookie: {
    secure:false,
    maxAge:60000,
  }
})

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(expressSession);

//use process.env.PORT to set the port to the environment port variable if it exists. otherwise, we'll default to 3000, which is the port we'll be using locally.
const port = process.env.PORT || 3000;

//use app.listen with port variable we set up and a simple log to let us know that it's all working fine and on which port is the app listening.
app.listen(port, () => console.log('App listening on port' + port));


//////* PASSWORD SETUP *//////
//require passport and initialize it along with its session authentication middleware, directly inside our Express app.
const passport = require('passport');
// Initialize Passport and restore authentication state, if any, from the session.
app.use(passport.initialize());
app.use(passport.session());



/////* MONGODB SETUP*/////
const mongoose = require('mongoose');
const passportLocalMongoose = require("passport-local-mongoose");
//connect to the database using mongoose.connect and give it the path to our database.
mongoose.connect('mongodb://localhost/MyDatabase'),
{ useNewUrlParser: true, useUnifiedTopology: true};
//define data structure using Schema. a Schema named UserDetail was created with username and password fields.
const Schema = mongoose.Schema;
const UserDetail = new Schema ({
  username: String,
  password: String,
});
//add passportLocalMongoose as a plugin to our Schema.
UserDetail.plugin(passportLocalMongoose);
//create a model from UserDetail schema
const UserDetails = mongoose.model('userInfo', UserDetail, 'userInfo')



////*PASSPORT LOCAL AUTHENTICATION */////
passport.use(UserDetails.createStrategy());
passport.serializeUser(UserDetails.serializeUser());
passport.deserializeUser(UserDetails.deserializeUser());



//////* ROUTES SETUP *//////
const connectEnsureLogin = require('connect-ensure-login');

//set up a route to handle a POST request to the /login path.
app.post('/login', (req, res, next) => {
  passport.authenticate('local',
  (err, user, info) =>{
    if(err) {
      return next(err);
    }
    if (!user) {
      return res.redirect('/login?info=' + info);
    }
    req.logIn(user, function(err) {
      if(err) {
        return next(err);
      }
      return res.redirect('/');
    });
  }) (req, res, next);
});

app.get('/login', (req, res)=> res.sendFile('html/login.html',{root:__dirname}));
app.get('/', connectEnsureLogin.ensureLoggedIn(), (req,res) => res.sendFile('html/index.html',{root:__dirname}));
app.get('/private', connectEnsureLogin.ensureLoggedIn(),(req, res) => res.sendFile('html/private.html', {root:__dirname}));
app.get('/user', connectEnsureLogin.ensureLoggedIn(),(req, res) => res.send ({user: req.user}));
app.get('/logout', (req, res)=> {req.logOut(),res.sendFile('html/logout.html',{root:__dirname})});


/* REGISTER SOME USERS */
// UserDetails.register({username:'paul', active:false},'paul');
// UserDetails.register({username:'joy', active:false},'joy');
// UserDetails.register({username:'ray', active:false},'ray');