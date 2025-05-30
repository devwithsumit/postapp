const express = require("express");
const app = express();
const path = require("path")
const userModel = require("./models/user")
const postModel = require("./models/post")
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const upload = require("./config/multerconfig");
const session = require('express-session');
const flash = require('connect-flash');
// require('dotenv').config();

app.set("view engine", "ejs")
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")))

app.use(session({
    secret: process.env.SESSION_KEY, // A strong secret string
    resave: false,
    saveUninitialized: true
}));
app.use(flash());

app.use((req, res, next) => {
    // You can name these variables whatever you like
    res.locals.success_msg = req.flash('success');
    res.locals.error_msg = req.flash('error');
    res.locals.info_msg = req.flash('info'); // If you use other types of messages
    // You might also want to make user data available here if using Passport.js
    // res.locals.currentUser = req.user; // Example for authenticated user
    next(); // IMPORTANT: Call next() to pass control to the next middleware/route handler
});

app.get("/", function (req, res) {
    res.render('index');
});

app.get('/profile/upload', function(req, res){
    res.render("upload");
})
app.post('/upload', isLoggedIn, upload.single('image'), async function(req, res){
    let user = await userModel.findOne({email : req.user.email})
    user.profilepic = req.file.filename;
    await user.save();
    res.redirect("profile");
})

app.post("/register", async function (req, res) {
    let { name, email, password } = req.body;

    let user = await userModel.findOne({ email });
    if (user) {
        // return res.status(500).send("Email already registered !");
        req.flash('error', 'Email already registered!');
        return res.status(409).redirect('/');
    }

    bcrypt.genSalt(10, function (err, salt) {
        bcrypt.hash(password, salt, async (err, hash) => {
            let user = await userModel.create({
                name,
                email,
                password: hash,
            });
            let token = jwt.sign({ email: email, userid: user._id }, "secret");
            res.cookie("token", token);
            req.flash('success', 'Registration successful!');
            res.status(200).redirect("/profile");
            // res.send("New User Registered");
        });
    });
});

app.get("/loginPage", function (req, res) {
    res.render("login");
})

app.post("/login", async function (req, res) {
    let { email, password } = req.body;
    
    let user = await userModel.findOne({ email });
    if (!user) {
        req.flash('error', 'Invalid email or password.');
        return res.status(500).redirect("/loginPage");
    }
    
    bcrypt.compare(password, user.password, function (err, result) {
        if (result) {
            let token = jwt.sign({ email: email, userid: user._id }, "secret");
            res.cookie("token", token);
            req.flash('success', 'Logged in successfully!');
            res.status(200).redirect("/profile");
        }
        else {
            req.flash('error', 'Invalid email or password.'); 
            res.redirect("/loginPage");
        }
    });
});

app.get("/profile", isLoggedIn, async function (req, res) {
    let user = await userModel.findOne({ email: req.user.email }).populate("posts");
    let posts = await postModel.find().populate("user")
    res.render("profile", { user, posts });
})

app.post("/post", isLoggedIn, async function (req, res) {
    let user = await userModel.findOne({ email: req.user.email });
    let {postdata} = req.body;
    let post = await postModel.create({
        user : user._id,
        postdata,
    })
    user.posts.push(post._id);
    await user.save();

    res.redirect("/profile");
})

app.get("/like/:id", isLoggedIn, async function (req, res) {
    let post = await postModel.findOne({_id: req.params.id }).populate("user");
    if(post.likes.indexOf(req.user.userid) === -1){
        post.likes.push(req.user.userid);
    }
    else{
        post.likes.splice(post.likes.indexOf(req.user.userid), 1);
    }    
    await post.save();
    res.json(post);
})

app.get("/edit/:id", isLoggedIn, async function (req, res) {
    let post = await postModel.findOne({_id: req.params.id });
    res.render("edit",{post});
})

app.post("/update/:id", isLoggedIn, async function (req, res) {
    let post = await postModel.findOneAndUpdate({_id: req.params.id },{postdata: req.body.postdata});
    res.redirect("/profile");
})

app.get("/logout", function (req, res) {
    res.cookie("token", "")
    req.flash('success', "Logout successful");
    res.redirect("/loginPage")
})

app.get("/delete/:id", async function (req, res) {
    try {
        // Performing findOneAndDelete operation
        let user = await userModel.findOneAndDelete({ _id: req.params.id });

        // Sending response
        if (!user) {
            res.send("User not found");
        } else {
            res.send(`Deleted user: ${user}`);
        }
    } catch (error) {
        console.error("Error in deleting user:", error);
        res.status(500).send("Something went wrong!");
    }
});

function isLoggedIn(req, res, next) {
    if (req.cookies.token === "") res.redirect("/loginPage");
    else {
        let data = jwt.verify(req.cookies.token, "secret");
        req.user = data;
        next();
    }
}
app.listen(process.env.PORT,()=>{
    // Green color for the message
    const greenColor = '\x1b[32m';
    const blueColor = '\x1b[33m';
    console.log(`Server live at: ${blueColor}http://localhost:${process.env.PORT}`);
});
module.exports = app;

// async function removeNameField() {
//     try {
//         // Use the `$unset` operator to remove the `name` field from all users
//         await userModel.updateMany({}, { 
//             $set : {name : ""},
//         });
//         console.log("The `username` field has been removed from all users.1");
//     } catch (err) {
//         console.log("Error removing `username` field:", err);
//     } finally {
//         mongoose.connection.close(); // Close the connection after the update
//     }
// }
// // removeNameField();