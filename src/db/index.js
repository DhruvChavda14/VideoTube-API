import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try{
        const connectInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`MongoDB connected !! DB host : ${connectInstance.connection.host}`)
    }catch(error){
        console.log("MongoDB Error : ",error);
        process.exit(1)
    }
}

export default connectDB