// require('dotenv').config({path:'./env'})
import dotenv from "dotenv";

import { app } from "./app.js";

import connectDB from "../db/db.js";

dotenv.config({
  path: "./env",
});
connectDB()
  .then(() => {
    app.on("error", (error) => {
      console.log("ERROR", error);
      throw error;
    });
    app.listen(process.env.PORT || 8000, () => {
      console.log(`server is running at http://localhost:${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("MONGO DB CONNECTION FAILED!! ", err);
  });

// const app = express();

// ;(async()=>{
//     try{
//       await  mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
//       app.on("error",(error)=>{
//         console.log("ERROR",error);
//         throw error
//       })
//       app.listen(process.env.PORT,()=>{
//         console.log(`App is listening on port ${process.env.PORT}`)
//       })
//     }catch(error){
//         console.log("ERROR",error);
//         throw error
//     }
// })()
