require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
// const encrypt = require("mongoose-encryption");
// const md5 = require("md5");
// const bcrypt = require("bcrypt");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const session = require("express-session");

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

const url = process.env.DB_URL;

const userSchema = new mongoose.Schema({
    name: String,
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: String
});

userSchema.plugin(passportLocalMongoose, {usernameField: "email"});

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

mongoose.connect(url).catch((err)=>{
    console.log(err);
});

app.get("/", (req, res)=>{
    res.render("home");
});

app.get("/account", (req, res)=>{
    if (req.isAuthenticated()){
        res.send("Perfecto!");
    }
    else {
        res.redirect("/");
    }
});

app.post("/signup", (req, res)=>{
    User.register(new User({name: req.body.name, email: req.body.email}), req.body.password, (err, user)=>{
        if (err){
            console.log(err);
            res.redirect("/");
        }
        else {
            passport.authenticate("local")(req, res, ()=>{
                res.redirect("/account");
            });
        }
    });
});

app.post("/signin", (req, res)=>{
    req.login(new User({email: req.body.email, password: req.body.password}), (err)=>{
        if (err){
            console.log(err);
            res.redirect("/");
        }
        else {
            passport.authenticate("local")(req, res, ()=>{
                res.redirect("/account");
            });
        }
    });
});

app.post("/signout", (req, res)=>{ // Post Route for Sign Out Button
    req.logout();
    res.redirect("/");
});

app.listen(3000, ()=>{
    console.log("Server started on port 3000...");
});