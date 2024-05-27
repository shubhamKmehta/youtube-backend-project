// require('dotenv').config({path:'./env'})


import { app } from "./app.js";
import connectDb from "./db/index.js";

// for code costency 
import dotenv from 'dotenv'

dotenv.config({
    path:'./.env'
})






connectDb()
.then(()=>{
    app.on("ERROR",(error)=>{
        console.log("ERROR from mongodb connection :-",error)
        process.exit(1)
    })

    app.listen(process.env.PORT,()=>{
        console.log(`server is running at port${process.env.PORT}`)
    })
})
.catch((err)=>{
    console.log(`MONGO db connection failed !!! :-`,err)
})












/*

import express from "express"

const app=express();


;(async ()=>{
    try {
       const connectDb= await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
       app.on("ERROR",(error)=>{
        console.log("ERROR :-",error);
        throw error;
       })
       app.listen(process.env.PORT,()=>{
        console.log(`App is listening on port ${process.env.PORT}`)
       })
       console.log("Database connection successfull :- ",connectDb)
    } catch (error) {
        console.error("ERROR =",error);
        throw error;

    }
})()
*/