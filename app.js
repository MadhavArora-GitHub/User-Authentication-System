require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
// const encrypt = require("mongoose-encryption");
// const md5 = require("md5");
const bcrypt = require("bcrypt");

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const url = process.env.DB_URL;

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }
});

// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"]});

const User = mongoose.model("User", userSchema);

const saltRounds = 12;

mongoose.connect(url).catch((err)=>{
    console.log(err);
});

app.get("/", (req, res)=>{
    res.render("home");
});

app.post("/signup", (req, res)=>{
    const name = req.body.name;
    const email = req.body.email;

    bcrypt.hash(req.body.password, saltRounds, (err, password)=>{
        if (err){
            console.log(err);
        }
        else {
            const user = new User({
                name: name,
                email: email,
                password: password
            });
        
            user.save((err)=>{
                if (err){
                    console.log(err);
                }
                else {
                    res.send("Perfecto!");
                }
            });
        }
    });
});

app.post("/signin", (req, res)=>{
    const email = req.body.email;

    User.findOne({email: email}, (err, user)=>{
        if (err){
            console.log(err);
        }
        else {
            if (user){
                bcrypt.compare(req.body.password, user.password, (err, result)=>{
                    if (result){
                        res.send("Perfecto!");
                    }
                    else {
                        res.redirect("/");
                    }
                });
            }
        }
    });
});

app.listen(3000, ()=>{
    console.log("Server started on port 3000...");
});