import { request } from 'express';
import User from '../models/user.model.js';

// GET /api/users/:username
// Anyone can view — no auth required
export const getProfile= async (req, res) => {
    try{
        const{username}=req.params;
        const user= await User.findOne({name: username.toLowerCase()});
        if(!user){
            return res.status(404).json({message: 'User not found'});
        }
        res.status(200).json({user: user.toPublicProfile()});

    }catch(error){
        res.status(500).json({message: error.message});
    }
};

// PUT /api/users/me
// Only logged in user can update their own profile
export const updateProfile = async (req, res) => {
    try{
        const allowedFields = ['bio', 'socialLinks','avatar'];
        const updates={};
        allowedFields.forEach(field => {
            if(req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        if(Object.keys(updates).length === 0) {
            return res.status(400).json({message: 'No valid fields to update'});
        }

        if(updates.bio && updates.bio.length > 160) {
            return res.status(400).json({message: 'Bio must be less than 160 characters long'});
        }
        const user=await User.findByIdAndUpdate(
            req.user._id,
            {$set: updates},
            {new: true, runValidators: true}
        );
        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user: user.toPublicProfile()}
        );


    }catch(error){
        res.status(500).json({message: error.message});
    };
};
//POST /api/users/:id/follow
// Toggle — if following, unfollow. If not following, follow.

export const followUser=async (req, res) => {
    try {
        const targetId = req.params.id;
        console.log('req.user:', req.user);
        const myId = req.user?._id;
        if (!myId) {
            return res.status(401).json({ message: 'Unauthorized - User not authenticated' });
        }

        if (targetId.toString() === myId.toString()) {
            return res.status(400).json({ message: 'You cannot follow yourself' });
        }
        const targetUser = await User.findById(targetId);
        if (!targetUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        const alreadyFollowing = targetUser.followers.includes(myId);
        if (alreadyFollowing) {
            await User.findByIdAndUpdate(targetId, { $pull: { followers: myId }, $inc: { followersCount: -1 } });
            await User.findByIdAndUpdate(myId, { $pull: { following: targetId }, $inc: { followingCount: -1 } });
            return res.status(200).json({ message: `Unfollowed successfully ${targetUser.name}` });
        } else {
            await User.findByIdAndUpdate(targetId, { $push: { followers: myId }, $inc: { followersCount: 1 } });
            await User.findByIdAndUpdate(myId, { $push: { following: targetId }, $inc: { followingCount: 1 } });
            return res.status(200).json({ message: `Followed successfully ${targetUser.name}` });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/users/:id/followers (public)
export const getFollowers = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).populate('followers', 'name avatar bio followersCount');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ followers: user.followers });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/users/me/following
export const getMyFollowing= async (req, res) => {
    try{
        const user= await User.findById(req.user._id).populate('following', 'name avatar bio followersCount');
        res.status(200).json({following: user.following});
    }catch(error){
        res.status(500).json({message: error.message});
    }
};

