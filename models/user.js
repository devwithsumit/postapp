const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/miniPostAPP")

const userSchema = mongoose.Schema({
    name : String,
    email : String,
    password : String,
    profilepic : {
        type : String,
        default : "default.png"
    },
    posts :[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref : 'post'
        }
    ]
})

module.exports = mongoose.model('user', userSchema)
