const mongoose = require("mongoose")
const Schema = mongoose.Schema

const userSchema = new Schema({
    FullName: {
       type:String,
    },
    email: {
        type:String,
        required:true,
        unique:true
       },
   password: {
        type:String,
        required:true
       },
   role: {
        type:String,   
        default:"EMPLOYEE"
       },
      
   profileImage: { type: String }


    
})
module.exports.userModel= mongoose.model("users",userSchema)