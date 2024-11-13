import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const { Schema } = mongoose;

// Define the user schema
const userSchema = new Schema({
    img: {
        type: String,
    },
    gender: {
        type: String,
        enum: ["male", "female", "other"],
    },
    name: {
        type: String
    },
    username: {
        type: String,
        required: true,
        unique: true,
        minlength: 3,
        maxlength: 30
    },
    email: {
        type: String,
        required: true,
        unique: true,
        match: [/.+@.+\..+/, 'Please fill a valid email address']
    },
    recoveryEmail: {
        type: String,
        match: [/.+@.+\..+/, 'Please fill a valid email address'],
        unique: true,
        sparse: true
    },
    password: {
        type: String,
        minlength: 6
    },
    phone: {
        type: String,
        unique: true,
        match: [/^\+?[1-9]\d{1,14}$/, 'Please fill a valid phone number']
    },
    role: {
        type: String,
        required: true,
    },
    department: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
        default: 'active'
    },
    userType: {
        type: String,
        default: process.env.USER,
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    resetPasswordToken: { 
        type: String 
    }, 
    resetPasswordExpires: { 
        type: Date 
    },        
    orgId: {
        type: String,
        required: [true, 'Organization ID is required'],
    }
});

userSchema.index({orgId: 1});
// Compile the schema into a model
const User = mongoose.model('User', userSchema);

export default User;
