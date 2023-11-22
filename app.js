//jshint esversion:6
import "dotenv/config";
import express from 'express';
import ejs from 'ejs';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';

import mdp from "md5";
import md5 from "md5";

const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');
app.use(express.static("public"))

mongoose.connect("mongodb://localhost:27017/userDB");

const userShecma = new mongoose.Schema({
    email:String,
    password:String
})



const user = mongoose.model('User', userShecma);

app.get('/', (req, res) => {
    res.render('home');
})


app.get('/register', (req, res) => {
    res.render('register');
});


app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/register', (req, res) => {
    const newUser = new user({
        email:req.body['username'],
        password:md5(req.body['password'])
    });

    newUser.save();

    res.render('secrets');
})

app.post('/login', async (req, res) => {
    const username = req.body['username'];
    const password = req.body['password'];

    var founndUser = await user.findOne({ email: username});

    if(founndUser.password === md5(password)){
        res.render('secrets');
    }
    else{
        res.redirect('/');
    }


})

app.listen(3000,() => {
    console.log('listening on http://localhost:3000');
})
