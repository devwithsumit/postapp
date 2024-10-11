const express = require("express");
const app = express();
const path = require("path")
const userModel = require("./models/user")
const postModel = require("./models/post")
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const upload = require("./config/multerconfig");
const { render } = require("ejs");

app.set("view engine", "ejs")
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")))

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
    if (user) return res.status(500).send("Email already registered !");

    bcrypt.genSalt(10, function (err, salt) {
        bcrypt.hash(password, salt, async (err, hash) => {
            let user = await userModel.create({
                name,
                email,
                password: hash,
            });
            let token = jwt.sign({ email: email, userid: user._id }, "secret");
            res.cookie("token", token);
            res.send("New User Registered");
        });
    });
});

app.get("/loginPage", function (req, res) {
    res.render("login");
})

app.post("/login", async function (req, res) {
    let { email, password } = req.body;
    
    let user = await userModel.findOne({ email });
    if (!user) return res.status(500).send("Something Went Wrong !");
    
    bcrypt.compare(password, user.password, function (err, result) {
        if (result) {
            let token = jwt.sign({ email: email, userid: user._id }, "secret");
            res.cookie("token", token);
            res.status(200).redirect("/profile");
        }
        else res.redirect("/loginPage");
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
    res.redirect("/profile");
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
app.listen(3000);

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