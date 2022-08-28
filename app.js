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
const GoogleStrategy = require("passport-google-oauth20").Strategy;

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

mongoose.connect(url).catch((err)=>{
    console.log(err);
});

const userSchema = new mongoose.Schema({
    name: String,
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: String,
    googleId: String
});

userSchema.plugin(passportLocalMongoose, {usernameField: "email"});

const User = mongoose.model("User", userSchema);

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/account"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOne({googleId: profile.id}, (err, user)=>{
        if (err){
            return cb(err);
        }
        
        if (!user){
            user = new User({
                name: profile._json.name,
                googleId: profile._json.sub,
                email: profile._json.email
            });
            user.save((err)=>{
                if (err){
                    console.log(err);
                }
                else {
                    return cb(err, user);
                }
            });
        }
        else {
            return cb(err, user);
        }
    });
  }
));

passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, {
        id: user.id,
        username: user.username,
        picture: user.picture
      });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
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

app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"], prompt: "select_account" }));

app.get("/auth/google/account", passport.authenticate("google", { failureRedirect: "/" }), (req, res)=>{
    res.redirect("/account");
});

app.post("/signup", (req, res)=>{
    User.register(new User({name: req.body.name, email: req.body.email}), req.body.password, (err, user)=>{
        if (err){
            console.log(err);
            res.redirect("/");
        }
        else {
            req.login(user, (err)=>{
                if (err){
                    console.log(err);
                    res.redirect("/");
                }
                else {
                    res.redirect("/account");
                }
            });
        }
    });
});

app.post("/signin", passport.authenticate("local", { failureRedirect: "/" }), (req, res)=>{
    res.redirect("/account");
});

app.post("/signout", (req, res)=>{ // Post Route for Sign Out Button
    req.logout();
    res.redirect("/");
});

app.listen(3000, ()=>{
    console.log("Server started on port 3000...");
});