import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const generateToken = (user) => {
    return jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: '7d',
    });
};

export const register = async (req, res) => {
    try{
        const { name, email, password, role } = req.body;
        if(!name || !email || !password || !role) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        const emailExists = await User.findOne({ email });
        if(emailExists) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        const usernameExists = await User.findOne({ name});
        if(usernameExists) {
            return res.status(400).json({ message: 'Username already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user= await User.create({
            name,
            email,
            password: hashedPassword,
            role
        });
        const token = generateToken(user);
         res.status(201).json({
         success: true,
         message: "Account created successfully",
         token,
    //   user: user.toPublicProfile(),
         });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const login = async (req, res) => {
    try{
        const { email, password } = req.body;
        if(!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
            const user=await User.findOne({ email }).select('+password');
            if(!user){
                return res.status(400).json({ message: 'Invalid email or password' });
                
            }
            const isMatch = await bcrypt.compare(password, user.password);
            if(!isMatch) {
                return res.status(400).json({ message: 'Invalid email or password' });
            }
            const token = generateToken(user);
            res.status(200).json({
                success: true,
                message: "Login successful",
                token,
            });
    } catch(error) {
        res.status(500).json({ message: error.message });
    }
};

export const getMe = (req, res) => {

    res.status(200).json({ user: req.user.toPublicProfile() });
};  


export const logout = (req, res) => {
    res.status(200).json({ message: 'Logout successful' });
};
