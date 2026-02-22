import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['streamer', 'viewer'],
        default: 'viewer'
    }
});

userSchema.methods.toPublicProfile = function() {
    return {
        id: this._id,
        name: this.name,
        email: this.email,
        role: this.role
    };
};

const User = mongoose.model('User', userSchema);

export default User;