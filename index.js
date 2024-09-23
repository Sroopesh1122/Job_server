import  express from 'express'
import cors from 'cors'
import {errorHandler, notFound} from './middlewares/errorHandler.js';
import { DBConnection } from  './config/DBConfig.js';

import dotenv from 'dotenv'
import { UserRouter } from './routers/UserRouter.js';


dotenv.config()
const app =  express();
app.use(cors());
app.use(express.json());


DBConnection()


const port = process.env.PORT || 5000;


app.use("/user",UserRouter)


app.use(notFound)
app.use(errorHandler)




app.listen(port,()=>{
    console.log("Server is listening in "+ port);
    
})



