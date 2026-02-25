import express from 'express';
import cors from 'cors';

import authRouter from './routes/auth.route.js';
import { createServer } from "http";
import { Server }     from "socket.io";
import streamRouter   from "./routes/stream.routes.js";
import userRouter from './routes/user.route.js';
import { initSocket } from './socket/index.js';

const app = express();
const server = createServer(app);

const ALLOWED_ORIGINS = [
  process.env.CLIENT_URL || "http://localhost:5173",
  "http://localhost:5173",
];

const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ["GET", "POST"],
  },
});

app.set("io", io);

// Middleware — CORS first, before any routes
// In dev, allow all origins. For production set CLIENT_URL env var.
app.use(cors({
  origin: process.env.CLIENT_URL
    ? [process.env.CLIENT_URL, "http://localhost:5173"]
    : true,          // true = reflect any origin (dev mode)
  credentials: true,
}));
app.use(express.json());
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use("/api/streams", streamRouter);

initSocket(io);


export default app;