import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app  = express();



// configurations: 

// for allowing frontend to interact with backend
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true,
}));

// earlier body parser were used
app.use(express.json({limit:"16kb"}));

//sometimes with url encoded data comes so backend needs to understand it
app.use(express.urlencoded({extended:true,limit:"16kb"}))
// extended for using nested objects {}

// for storing files, pdf, favicon etc static public data
app.use(express.static("public"))

// only server must be able to perform crud operations on user's browser & securely 
app.use(cookieParser());


// routes
import userRouter from './routes/user.routes.js' // .js use must

// routes declartaion
app.use("/api/v1/users",userRouter)  // middleware because to bring router we need it

export {app}