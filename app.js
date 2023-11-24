//jshint esversion:6
import "dotenv/config";
import express from 'express';
import ejs from 'ejs';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import session from "express-session";
import passport from 'passport';
import passportLocalMongoose from 'passport-local-mongoose';
import GoogleStrategy from 'passport-google-oauth20'

GoogleStrategy = GoogleStrategy.Strategy;



const saltRounds = 10;

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
    password:String
})

userShecma.plugin(passportLocalMongoose);

const user = mongoose.model('User', userShecma);


passport.use(user.createStrategy());
passport.serializeUser((user, done)=> {done(null, user); });
passport.deserializeUser((user, done)=>{done(null, user);
});

app.get('/', (req, res) => {
    res.render('home');
})  


app.get('/register', (req, res) => {
    res.render('register');
});


app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/secrete', (req, res) => {

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
                res.redirect('/secrete');
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
                res.redirect('/secrete');
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
