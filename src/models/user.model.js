import mongoose, {Schema} from "mongoose";
import { Video } from "./video.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs"

const  userSchema=new Schema({
    username:{
        type:String,
        requried:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true

    },
    email:{
        type:String,
        requried:true,
        lowercase:true,
        unique:true,
        trim:true
    },
    fullname:{
        type:String,
        requried:true,
        index:true,
        trim:true
    },
    avatar:{
        type:String,
        requried:true,
    },
    coverImage:{
        type:String
    },
    watchHistory:[
        {
            type:Schema.Types.ObjectId,
            ref:"Video"
        }
    ],
    password:{
        type:String,
        requried:[true,"Password must be required"]
    },
    refreshToken:{
        type:String
    }

},{timestamps:true})

// password encryption method 

userSchema.pre("save",async function(next){
    if(!this.isModified("password")) return next();
    this.password=await bcrypt.hash(this.password,10);
    next()
})

userSchema.methods.isPasswordCorrect=async function(password){
    return await bcrypt.compare(password,this.password)
}


userSchema.methods.generateAccessToken=function(){
    return jwt.sign({
        _id:this._id,
        username:this.userSchema,
        fullname:this.fullname,
        email:this.email
    },
process.env.ACCESS_TOKEN_SECRET,
{
    expiresIn:process.env.ACCESS_TOKEN_EXPIRY
}
)
}

userSchema.methods.generateRefreshToken=function(){
    return jwt.sign({
        _id:this._id
    },
process.env.REFRESH_TOKEN_SECRET,
{
    expiresIn:process.env.REFRESH_TOKEN_EXPIRY
}
)
}

export const User=mongoose.model("User",userSchema)




//Note;
// jwt token --> before saving data,data be encrypted.