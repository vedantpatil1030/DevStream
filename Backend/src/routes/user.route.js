import express from 'express';
import { getProfile, updateProfile, followUser,getFollowers,getMyFollowing } from '../controllers/user.controller.js';

import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/:username', getProfile); //public route
router.put('/me', requireAuth, updateProfile);
router.post('/:id/follow', requireAuth, followUser);
router.get('/:id/followers', getFollowers); // Now public, id is user id
router.get('/me/following', requireAuth, getMyFollowing);

export default router;