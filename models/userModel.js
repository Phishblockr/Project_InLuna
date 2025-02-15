import mongoose from 'mongoose';

const { Schema } = mongoose;

// Define the user schema
const userSchema = new Schema({
    img: { type: String },
    gender: { type: String, enum: ["male", "female", "other"] },
    name: { type: String },
    username: { type: String, unique: true, minlength: 3, maxlength: 30 },
    email: { type: String, unique: true, match: [/.+@.+\..+/, 'Please fill a valid email address'] },
    recoveryEmail: { type: String, match: [/.+@.+\..+/, 'Please fill a valid email address'], unique: true, sparse: true },
    password: { type: String, minlength: 6 },
    phone: { type: String, unique: true, match: [/^\+?[1-9]\d{1,14}$/, 'Please fill a valid phone number'] },
    role: { type: String },
    department: { type: String },
    status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
    userType: { type: String, default: () => process.env.USER || 'user' }, // Dynamic default
    createdAt: { type: Date, default: Date.now },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    setupPasswordToken: { type: String },
    setupPasswordExpires: { type: Date },
    orgId: { type: String, required: true }, // Now required to ensure correct assignment
    refreshToken: { type: String },
    refreshTokenExt: { type: String },
});

userSchema.index({ orgId: 1 });

// ❌ Do NOT create a model here! Just export the schema.
export default userSchema;
