import  express from 'express'
import cors from 'cors'
import {errorHandler, notFound} from './middlewares/errorHandler.js';
import { DBConnection } from  './config/DBConfig.js';

import dotenv from 'dotenv'
import { UserRouter } from './routers/UserRouter.js';
import { qulificationRouter } from './routers/QualificationRouter.js';
import { providerRouter } from './routers/ProviderRouter.js';
import { JobAppRouter } from './routers/JobAppRouter.js';
import { ProjectAppRouter } from './routers/ProjectAppRouter.js';
import { skillsRouter } from './routers/SkillsRouter.js';
import { UploaderRouter } from './routers/UPloadRouters.js';


dotenv.config()
const app =  express();
app.use(cors());
app.use(express.json());


DBConnection()


const port = process.env.PORT || 5000;


app.use("/user",UserRouter)
app.use("/provider",providerRouter)
app.use("/qualifications",qulificationRouter)
app.use("/skills",skillsRouter)
app.use("/jobs",JobAppRouter)
app.use("/projects",ProjectAppRouter)
app.use("/uploader",UploaderRouter)



app.use(notFound)
app.use(errorHandler)




app.listen(port,()=>{
    console.log("Server is listening in "+ port);
    
})



