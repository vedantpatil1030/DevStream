import express from 'express';
import { getProfile, updateProfile, followUser, getFollowers, getMyFollowing } from '../controllers/user.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();



router.get('/me/following',  requireAuth, getMyFollowing); // GET  /api/users/me/following
router.put('/me',            requireAuth, updateProfile);  // PUT  /api/users/me

router.get('/:username',     getProfile);                  // GET  /api/users/:username  (public)
router.post('/:id/follow',   requireAuth, followUser);     // POST /api/users/:id/follow
router.get('/:id/followers', getFollowers);                // GET  /api/users/:id/followers (public)

export default router;