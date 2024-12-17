import express from "express";
import {
    addBlog,
    getBlogs,
    updateBlog,
    deleteBlog,
    fetchSingleBlog,
    addBlogsFromCsv
} from "../controllers/blogController.js";

const router = express.Router();

// Blog Routes
router.route("/").get(getBlogs); // Fetch blogs with pagination and search
router.route("/").post(addBlog); // Add a new blog
router.route("/:id").get(fetchSingleBlog); // Fetch single blog by ID
router.route("/:id").put(updateBlog); // Update blog by ID
router.route("/:id").delete(deleteBlog); // Delete blog by ID
router.route("/upload/csv").post(addBlogsFromCsv); // Add blogs via CSV

export default router;
