import mongoose from "mongoose";

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,  // HTML content of the blog post
  },
  tags: {
    type: [String],  // Tags for categorization
  },
  author: {
    type: String,
    required: true,  // Author of the blog
  },
  orgId: {
    type: String,
    required: [true, 'Organization ID is required'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Blog = mongoose.model('Blog', blogSchema);
export default Blog;
