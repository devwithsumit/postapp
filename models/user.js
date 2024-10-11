const mongoose = require("mongoose");

mongoose.connect("mongodb+srv://sumit2410:Sumit2410@cluster0.nzb4o.mongodb.net/miniPostAPP")

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
