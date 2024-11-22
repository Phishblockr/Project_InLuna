import mongoose from "mongoose";

const { Schema } = mongoose;

const downtimeSchema = new Schema({
    oldTimestamp: { type: Date, required: true }, 
    newTimestamp: { type: Date, required: true }, 
    duration: { type: Number, required: true },
    reason: { type: String, required: true }, 
});

downtimeSchema.index(
    { oldTimestamp: 1, newTimestamp: 1, reason: 1 },
    { unique: true }
)

const heartbeatSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Reference to the User model
        required: [true, "UserId cannot be empty"],
    },
    orgId: {
        type: String,
        required: [true, "Organization ID cannot be empty"],
    },
    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active",
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
    downtime: [downtimeSchema],
});

heartbeatSchema.index({ userId: 1, orgId: 1 }, { unique: true });

const HeartBeat = mongoose.model("HeartBeat", heartbeatSchema);
export default HeartBeat;