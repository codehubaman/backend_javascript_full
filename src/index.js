// require ('dotenv').config({path:'./env'})


import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config(
    {
        path: `.env.${process.env.NODE_ENV}` // use.env.development for development environment

    }
);



// as we are calling asynchronous method so it return promise 

connectDB()
    .then(() => {
        app.listen(process.env.PORT || 8000, () => {
            console.log(`listening on port :${process.env.PORT}`);
        })
    })
    .catch(err =>
        console.error(" MongoDB connection failed", err)
    )













/*  
 ( async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error", (error) => {
            console.log("ERROR", error);
            throw error;

        })
        app.listen(process.env.PORT, () => {
            console.log(`App is listening on port ${process.env.PORT} `)
        })
    } catch (error) {
        console.error("ERROR", error);
        throw error;
    }
})()
    */
