import mongoose from "mongoose";
const {Schema} = mongoose;

const FeedbackSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref:"user",
        require : [true, "UserId cannot be empty"],
    },
    feedback: {
        type: String,
        required: [true, "Url cannot be empty"],
    },
    orgId: {
        type: String,
        required: [true, "Organization ID cannot be empty"],
    },
},
{ timestamps: true }
);

FeedbackSchema.index({orgId: 1});
const Feedback = mongoose.model("feedback", FeedbackSchema);
export default Feedback;