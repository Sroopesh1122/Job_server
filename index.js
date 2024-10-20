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
import { Server } from "socket.io"; // Import socket.io Server
import http from "http"; // Import http to create server

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

// Set up Socket.IO with CORS for real-time communication
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Update this if your frontend is running on a different port or domain
    methods: ["*"]
  }
});

// Real-time socket connection handling
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Listen for events sent from clients
  socket.on('message', (data) => {
    console.log('Received message from client:', data);

    // Broadcast the message to all connected clients
    io.emit('message', data);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const port = process.env.PORT || 5000;

// Use existing routers
app.use("/user", UserRouter);
app.use("/provider", providerRouter);
app.use("/qualifications", qulificationRouter);
app.use("/skills", skillsRouter);
app.use("/jobs", JobAppRouter);
app.use("/locations", LocationRouter);
app.use("/projects", ProjectAppRouter);
app.use("/uploader", UploaderRouter);

// Handle errors and not found routes
app.use(notFound);
app.use(errorHandler);

// Start the server with Socket.IO attached
server.listen(port, () => {
  console.log("Server is listening on port " + port);
});
