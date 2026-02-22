import mongoose from "mongoose";
const streamSchema = new mongoose.Schema({
    streamerId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: [true, 'Stream title is required'],
        trim: true,
        maxlength: [100, 'Stream title must be less than 100 characters long']
    },
    description: {
        type: String,
        default: '',
        maxlength: [500, 'Stream description must be less than 500 characters long']
    },
    category: {
        type: String,
        enum:["Frontend","Backend","AI/ML","DevOps","Systems","OpenSource","Other"],
        default: 'Other'
    },
    tags:{
        type: [String],
        validate:{
            validator:(tags)=> tags.length <= 5,
            message:'A stream can have up to 5 tags'
        },

    },
    agoraChannel:{
        type: String,
        required:true,
        unique:true
    },
    isLive:{
        type:Boolean,
        default:true,
    },
    startedAt:{
        type:Date,
        default: Date.now
    },
    endedAt:{
        type:Date,
        default:null
    },
    duration:{
        type:Number,
        default:0
    },

    viewerCount:{type:Number, default:0},
    peakViewers:{type:Number, default:0},
    totalViews:{type:Number, default:0},

    chatEnabled:{type:Boolean, default:true},
    slowMode:{type:Boolean, default:false},
    slowModeDelay:{type:Number, default:0}, // in seconds
    followersOnlyChat:{type:Boolean, default:false},

    bannedUsers:[{type: mongoose.Schema.Types.ObjectId, ref:'User'}],
    moderators:[{type: mongoose.Schema.Types.ObjectId, ref:'User'}],

    vodId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'VOD',
        default:null
    },
    thumbnailUrl:{
        type:String,
        default:"",

    },


    },
    {timestamps:true}
    
);
const Stream=mongoose.model('Stream', streamSchema);
export default Stream;
