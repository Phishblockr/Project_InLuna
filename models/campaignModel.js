import mongoose from "mongoose"

const campaignSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  date: {
    type: String,
    required: true,
  },
  groups: {
    type: String,
    required: true,
  },
  courses: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: ["Scheduled", "In Progress", "Completed"],
    default: "Scheduled",
  },
  statusColor: {
    type: String,
    required: true,
    enum: ["bg-red-500", "bg-yellow-500", "bg-green-500"],
    default: "bg-red-500",
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
});

const Campaign = mongoose.model('Campaign', campaignSchema);
export default Campaign;
