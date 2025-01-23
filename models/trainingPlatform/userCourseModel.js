import mongoose from "mongoose";

const userCourseSchema = new mongoose.Schema({
    orgId: {
        type: String,
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: true,
    },
    assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    assignedDate: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ["assigned", "completed", "inprogress"],
        default: "assigned"
    },
    watchStatus: [{
        videoId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        watchedDuration: {
            type: Number,
            default: 0,
        },
    },],
});

const UserCourse = mongoose.model("UserCourse", userCourseSchema);
export default UserCourse;