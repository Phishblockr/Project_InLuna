import mongoose from "mongoose";

const VideoSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },

    url: {
        type: String,
        required: true,
    },
    duration: {
        type: Number,
        required: true,
    },
    description: {
        type: String,
        default: "No description provided"
    },
    resources: [{
        url: {
            type: String,
            required: false,
        },
        text: {
            type: String,
            required: false,
        }
    }],
    assignEmail: {
        type: Boolean,
        required: true,
    }
})

const courseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    videos: [VideoSchema],
    category: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        default: "No description provided"
    },
    reviews: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User', // Assuming you have a User model for reviewers
            },
            comment: {
                type: String,
                required: true,
            },
            rating: {
                type: Number,
                required: true,
                min: 0,
                max: 5,
            }
        }
    ],
},
    { timestamps: true }
);

const Course = mongoose.model('Course', courseSchema);
export default Course;