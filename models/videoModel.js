import mongoose from "mongoose";

const videoSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  videoUrl: {
    type: String,
    required: true,  // URL or path to the video file
  },
  orgId: {
    type: String,
    required: [true, 'Organization ID is required'],
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

const Video = mongoose.model('Video', videoSchema);
export default Video;
