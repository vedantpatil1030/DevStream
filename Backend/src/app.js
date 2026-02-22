import express from 'express';
import cors from 'cors';
import { configDotenv } from 'dotenv';
import authRouter from './routes/auth.route.js';

const app = express();
configDotenv();
import userRouter from './routes/user.route.js';

app.use(express.json());
app.use(cors());
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);


export default app;