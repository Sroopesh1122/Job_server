import express from "express";
import cors from "cors";
import { errorHandler, notFound } from "./middlewares/errorHandler.js";
import { DBConnection } from "./config/DBConfig.js";
import morgan from "morgan";
import dotenv from "dotenv";
import { UserRouter } from "./routers/UserRouter.js";
import { qulificationRouter } from "./routers/QualificationRouter.js";
import { providerRouter } from "./routers/ProviderRouter.js";
import { JobAppRouter } from "./routers/JobAppRouter.js";
import { ProjectAppRouter } from "./routers/ProjectAppRouter.js";
import { skillsRouter } from "./routers/SkillsRouter.js";
import { UploaderRouter } from "./routers/UPloadRouters.js";
import { LocationRouter } from './routers/LocationRouter.js';
import path from "path";
import { fileURLToPath } from "url";
import { Server } from "socket.io"; 
import http from "http"; 
import { freelancerRouter } from "./routers/FreelanceRouter.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

DBConnection();

// Create an HTTP server
const server = http.createServer(app);


const port = process.env.PORT || 5000;

app.use("/user", UserRouter);
app.use("/provider", providerRouter);
app.use("/freelancer", freelancerRouter);
app.use("/qualifications", qulificationRouter);
app.use("/skills", skillsRouter);
app.use("/jobs", JobAppRouter);
app.use("/locations", LocationRouter);
app.use("/projects", ProjectAppRouter);
app.use("/uploader", UploaderRouter);

app.use(notFound);
app.use(errorHandler);


server.listen(port, () => {
  console.log("Server is listening on port " + port);
});
