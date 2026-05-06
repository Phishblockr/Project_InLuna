import express from "express";
import {
  addBlog,
  getBlogs,
  updateBlog,
  deleteBlog,
  fetchSingleBlog,
  addBlogsFromCsv,
} from "../controllers/blogController.js";

const router = express.Router();

// Blog Routes
/**
 * @openapi
 * /api/blog:
 *   get:
 *     summary: Fetch blogs with pagination and optional search
 *     tags:
 *       - Blog
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query (title/content)
 *     responses:
 *       '200':
 *         description: Paginated list of blogs
 */
router.route("/").get(getBlogs); // Fetch blogs with pagination and search

/**
 * @openapi
 * /api/blog:
 *   post:
 *     summary: Add a new blog post
 *     tags:
 *       - Blog
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               author:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       '201':
 *         description: Blog created successfully
 */
router.route("/").post(addBlog); // Add a new blog

/**
 * @openapi
 * /api/blog/{id}:
 *   get:
 *     summary: Fetch a single blog by ID
 *     tags:
 *       - Blog
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Blog ID
 *     responses:
 *       '200':
 *         description: Blog object
 *       '404':
 *         description: Blog not found
 */
router.route("/:id").get(fetchSingleBlog); // Fetch single blog by ID

/**
 * @openapi
 * /api/blog/{id}:
 *   put:
 *     summary: Update a blog by ID
 *     tags:
 *       - Blog
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Blog ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       '200':
 *         description: Blog updated successfully
 */
router.route("/:id").put(updateBlog); // Update blog by ID

/**
 * @openapi
 * /api/blog/{id}:
 *   delete:
 *     summary: Delete a blog by ID
 *     tags:
 *       - Blog
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Blog ID
 *     responses:
 *       '200':
 *         description: Blog deleted successfully
 */
router.route("/:id").delete(deleteBlog); // Delete blog by ID

/**
 * @openapi
 * /api/blog/upload/csv:
 *   post:
 *     summary: Upload CSV file to create multiple blog posts
 *     tags:
 *       - Blog
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       '200':
 *         description: Blogs created from CSV
 */
router.route("/upload/csv").post(addBlogsFromCsv); // Add blogs via CSV

export default router;
