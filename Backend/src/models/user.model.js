import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        minlength: [3, 'Username must be at least 3 characters long'],
        maxlength: [30, 'Username must be less than 30 characters long'],
        match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']


    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
        minlength: [6, 'Password must be at least 6 characters long'],
        
    },
    role: {
        type: String,
        enum: ['streamer', 'viewer'],
        default: 'viewer'
    },
    avatar:{
        type:String,
        default: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'

    },
    bio:{
        type:String,
        maxlength: [160, 'Bio must be less than 160 characters long'],
        default: '',

    },
    socialLinks: {
        github: {type: String, default: ''},
        
        linkedin: {type: String, default: ''},
    },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },

    isStreamer: {type: Boolean, default: false},
    isBanned: {type: Boolean, default: false}
}, { timestamps: true });


userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Public profile — safe to send to frontend
userSchema.methods.toPublicProfile = function () {
  return {
    id:             this._id,
    name:           this.name,
    email:          this.email,
    avatar:         this.avatar,
    bio:            this.bio,
    socialLinks:    this.socialLinks,
    role:           this.role,
    isStreamer:     this.isStreamer,
    followersCount: this.followersCount,
    followingCount: this.followingCount,
    createdAt:      this.createdAt,
  };
};

const User = mongoose.model('User', userSchema);

export default User;