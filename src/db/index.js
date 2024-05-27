import mongoose from "mongoose";
import express from "express"
import { DB_NAME } from "../constants.js";
const app=express();


const connectDb=async ()=>{
    try {
        const connectMongoDB= await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

        console.log(`MongoDb connection is successfull !! DB HOST  : ${connectMongoDB.connection.host}`)


        // app.on("ERROR",(error)=>{
        //     console.error("MONGODB CONNECTION ERROR :-",error);
        //     process.exit(1)
        // })

        // app.listen(process.env.PORT,()=>{
        //     console.log(`App is listening on port ${process.env.PORT}`)
        // })
        
    } catch (error) {
        console.error('MONGODB CONNECTION ERROR :-',error)
        process.exit(1)
    }
}


export default connectDb