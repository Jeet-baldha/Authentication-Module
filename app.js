//jshint esversion:6
import "dotenv/config";
import express from 'express';
import ejs from 'ejs';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import session from "express-session";
import passport from 'passport';
import passportLocalMongoose from 'passport-local-mongoose';
import findOrCreate from 'mongoose-findorcreate';
import GoogleStrategy from 'passport-google-oauth20'
import FacebookStrategy from 'passport-facebook'



const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');
app.use(express.static("public"))

app.use(session({
    secret:"my top secret",
    resave:false,
    saveUninitialized:false
}))

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB");

const userShecma = new mongoose.Schema({
    email:String,
    password:String,
    googleId:String,
    facebookId:String

})

userShecma.plugin(passportLocalMongoose);
userShecma.plugin(findOrCreate);

const user = mongoose.model('User', userShecma);


passport.use(user.createStrategy());
passport.serializeUser((user, done)=> {done(null, user); });
passport.deserializeUser((user, done)=>{done(null, user);});



passport.use(new GoogleStrategy({
    clientID:process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    
    user.findOrCreate({ googleId: profile.id }, function (err, user) {
        console.log(profile);
        return cb(err, user);
    });
  }
));

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    user.findOrCreate({ facebookId: profile.id }, function (err, user) {
        console.log(profile);
        return cb(err, user);
    });
  }
));

app.get('/', (req, res) => {
    res.render('home');
})  

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] })
);

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
});

app.get('/auth/facebook',
  passport.authenticate('facebook')
);

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/secrets');
});


app.get('/register', (req, res) => {
    res.render('register');
});


app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/secrets', (req, res) => {

    if(req.isAuthenticated()){
        res.render('secrets');
    }
    else{
        res.redirect('/login');
    }

})

app.post('/register', (req, res) => {

    user.register({username:req.body['username']},req.body['password'],function(err,nuser){
        if(err){
            console.log(err);
            res.redirect('/register');
        }
        else{
            passport.authenticate('local') (req, res, () =>{
                res.redirect('/secrets');
            });
        }
    })

})

app.post('/login',(req, res) => {

    const newUser = new user({
        email:req.body.username,
        password:req.body.password
    })

    req.logIn(newUser,function(err,){
        if(err){
            console.log(err);
            res.redirect('/login');
        }else{
            passport.authenticate('local',{ failureRedirect: '/login' }) (req, res, () =>{
                res.redirect('/secrets  ');
            })
        }
    })

})

app.get('/logout', (req,res) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
      });
})

app.listen(3000,() => {
    console.log('listening on http://localhost:3000');
})
