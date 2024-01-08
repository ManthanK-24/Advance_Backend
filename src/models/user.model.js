import mongoose,{Schema} from "mongoose";
import jwt  from "jsonwebtoken";
import bcrypt from "bcrypt";
const userSchema = new Schema(
    {
        username:{
            type:String,
            required:true,
            unique: true,
            lowercase:true,
            trim:true,
            index:true,
        },
        email:{
            type:String,
            required:true,
            unique: true,
            lowercase:true,
            trim:true,
        },
        fullName:{
            type:String,
            required:true,
            trim:true,
            index:true,
        },
        avatar:{
            type:String, // aws or cloudinary url
            required:true,
        },
        coverImage:{
            type:String, // aws or cloudinary url
        },
        watchHistory:[
            {
                type: Schema.Types.ObjectId,
                ref:"Video",
            }
        ],
        password:{
            type:String,
            required:[true,"Password is required"],
        },
        refreshToken:{

        }
    }
    ,{timestamps:true})


// Middeleware hook pre, which executes function before saving
// we can't use here callback way because we want to pass reference of the user
// to save data in DB 
userSchema.pre("save", async function (next){

    // only hash when password got generated first time or password is updated
    if(!this.isModified("password"))return next();
    this.password = await bcrypt.hash(this.password,10);
    next()
})

// custom method
userSchema.methods.isPasswordCorrect = 
async function(password){
    return await bcrypt.compare(password,this.password);
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email:this.email,
            username: this.username,
            fullName:this.fullName,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,
           
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}


export const User = mongoose.model("User",userSchema);