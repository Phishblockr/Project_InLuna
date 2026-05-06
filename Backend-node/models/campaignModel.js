import mongoose from "mongoose";

const campaignSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  text: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ["scheduled", "in progress", "completed"],
    default: "scheduled",
  },
  datetime: {
    type: String,
    required: true
  },
  orgId: {
    type: String,
    required: [true, 'Organization ID is required'],
  },
  // Additional fields from the frontend
  bodyText: {
    type: String,
    required: true,
  },
  templateBody: {
    type: String,
    required: true,
  },
  users: {
    type: String,
    required: true,
  },
});

const Campaign = mongoose.model('Campaign', campaignSchema);
export default Campaign;
