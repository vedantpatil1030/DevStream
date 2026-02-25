import express from 'express';
import { register, login, getMe, logout } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login',    login);
router.get('/getme',     requireAuth, getMe);   // GET — fetches current user
router.post('/logout',   requireAuth, logout);

export default router;