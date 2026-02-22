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

const io     = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST"],
  },
});

app.set("io", io);

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL }));

app.use(express.json());
app.use(cors());
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use("/api/streams", streamRouter);

initSocket(io);


export default app;