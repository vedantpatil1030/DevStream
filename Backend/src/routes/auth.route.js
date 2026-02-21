import express from 'express';
import { register ,login} from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();
// @route   POST api/auth/login

router.post('/register',register);
router.post('/login',login);
// router.post('/getme',requireAuth, getMe);  //protected routes
// router.post('/logout',requireAuth ,logout); //protected routes

export default router;