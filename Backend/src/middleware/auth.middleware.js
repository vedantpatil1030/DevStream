import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

export const requireAuth = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    console.log('Authorization header:', req.headers.authorization);
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Decoded token:', decoded);
        const user = await User.findById(decoded.id);
        console.log('User found:', user);
        
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized: User not found' });
        }
        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }
};