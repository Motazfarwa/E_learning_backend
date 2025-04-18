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
        enum: ['ADMIN','APPRENANT', 'INSTRUCTEUR', 'EXPERT'],
        default: 'APPRENANT',
       },
      
   profileImage: { type: String }


    
})
module.exports.userModel= mongoose.model("users",userSchema)