const mongoose = require("mongoose");
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URL)
    .then(() => {
        console.log("Mongo DB connected")
    })

const userSchema = mongoose.Schema({
    name: String,
    email: String,
    password: String,
    profilepic: {
        type: String,
        default: "default.png"
    },
    posts: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'post'
        }
    ]
})

module.exports = mongoose.model('user', userSchema)
