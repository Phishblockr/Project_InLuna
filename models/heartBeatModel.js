import mongoose from "mongoose";
const {Schema} = mongoose;

const heartbeatSchema = new Schema({
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref:"user",
        require : [true, "UserId cannot be empty"],
    },
    orgId: {
        type: String,
        required: [true, "Organization ID cannot be empty"],
    },
});
heartbeatSchema.index({orgId: 1});
const HeartBeat = mongoose.model("Heartbeat", heartbeatSchema);
export default HeartBeat;
