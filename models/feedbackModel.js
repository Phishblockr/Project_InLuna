import mongoose from "mongoose";
const {Schema} = mongoose;

const FeedbackSchema = new Schema({
    userProfileImg: {
        type:String,
        default: ""
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref:"user",
        require : [true, "UserId cannot be empty"],
    },
    username: {
        type: String,
        required: [true, "Username cannot be empty"],
        trim: true
    },
    feedback: {
        type: String,
        required: [true, "Url cannot be empty"],
    },
    orgId: {
        type: Number,
        required: [true, "Organization ID cannot be empty"],
    },
},
{ timestamps: true }
);

FeedbackSchema.index({orgId: 1});
const Feedback = mongoose.model("feedback", FeedbackSchema);
export default Feedback;