import mongoose from "mongoose";

const { Schema } = mongoose;

const organizationSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    adminName: {
        type: String,
        required: true,
        trim: true
    },
    totalUsers: {
        type: Number,
        required: true
    },
    orgId: {
        type: String,
        required: true,
        unique: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// ✅ Export the schema, NOT the model
export default organizationSchema;
