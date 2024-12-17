import mongoose from "mongoose";

const templateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  body: {
    type: String,
    required: true,  // HTML content of the template
  },
  orgId: {
    type: String,
    required: [true, 'Organization ID is required'],
  },
});

const Template = mongoose.model('Template', templateSchema);
export default Template;
