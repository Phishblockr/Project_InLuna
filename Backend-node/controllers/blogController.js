import Blog from "../models/blogModel.js";
import AdminLogs from "../models/adminlogsModel.js";
import asyncHandler from "../middlewares/asyncHandler.js";
import fs from "fs";
import csvParser from "csv-parser";

// Helper Function: Normalize blog title (trim and format)
function normalizeTitle(title) {
  return title?.trim();
}

// @desc    Get all blogs with pagination, search, and filter
// @route   GET /api/blogs
export const getBlogs = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const skip = (page - 1) * limit;
  const search = req.query.search || "";
  const status = req.query.status || "all";
  const orgId = req.user.orgId;

  const searchFilter = search
    ? { $or: [{ title: { $regex: search, $options: "i" } }] }
    : {};

  const statusFilter = status === "all" ? {} : { status: { $regex: `^${status}$`, $options: "i" } };

  const queryFilter = { orgId, ...searchFilter, ...statusFilter };

  const blogs = await Blog.find(queryFilter).skip(skip).limit(limit);
  const totalBlogs = await Blog.countDocuments(queryFilter);

  if (blogs.length > 0) {
    res.status(200).json({ blogs, currentPage: page, totalPages: Math.ceil(totalBlogs / limit), totalBlogs });
  } else {
    res.status(400).json({ error: "No blogs found" });
  }
});

// @desc    Add a new blog
// @route   POST /api/blogs
export const addBlog = asyncHandler(async (req, res) => {
  const { title, content, category, status } = req.body;
  const orgId = req.user.orgId;
  const userId = req.user.userId;

  try {
    const normalizedTitle = normalizeTitle(title);

    // Check if blog already exists
    const existingBlog = await Blog.findOne({ title: normalizedTitle, orgId });
    if (existingBlog) {
      return res.status(400).json({ error: "Blog with this title already exists" });
    }

    const newBlog = await Blog.create({
      title: normalizedTitle,
      content,
      category,
      status,
      orgId,
    });

    const io = req.app.get("socketio");
    io.emit("blogAdded", newBlog);

    // Log the action
    await AdminLogs.create({
      userId,
      operationType: "add",
      operationsPerformed: `Added Blog: ${title}`,
      orgId,
      entityId: newBlog._id,
      entityType: "blog",
    });

    res.status(201).json(newBlog);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// @desc    Update a blog by ID
// @route   PUT /api/blogs/:id
export const updateBlog = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, content, category, status } = req.body;
  const userId = req.user.userId;
  const orgId = req.user.orgId;

  try {
    const normalizedTitle = normalizeTitle(title);

    const updatedBlog = await Blog.findByIdAndUpdate(
      id,
      { title: normalizedTitle, content, category, status },
      { new: true, runValidators: true }
    );

    if (updatedBlog) {
      const io = req.app.get("socketio");
      io.emit("blogUpdated", updatedBlog);

      await AdminLogs.create({
        userId,
        operationType: "update",
        operationsPerformed: `Updated Blog: ${title}`,
        orgId,
        entityId: id,
        entityType: "blog",
      });

      res.status(200).json(updatedBlog);
    } else {
      res.status(404).json({ error: "Blog not found" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// @desc    Delete a blog
// @route   DELETE /api/blogs/:id
export const deleteBlog = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;
  const orgId = req.user.orgId;

  try {
    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ error: "Blog not found" });
    }

    await Blog.findByIdAndDelete(id);
    const io = req.app.get("socketio");
    io.emit("blogDeleted", id);

    await AdminLogs.create({
      userId,
      operationType: "delete",
      operationsPerformed: `Deleted Blog: ${blog.title}`,
      orgId,
      entityId: id,
      entityType: "blog",
    });

    res.status(200).json({ message: "Blog deleted successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// @desc    Fetch a single blog by ID
// @route   GET /api/blogs/:id
export const fetchSingleBlog = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const blog = await Blog.findById(id);
    if (!blog) {
      res.status(404).json({ error: "Blog not found" });
    } else {
      res.status(200).json(blog);
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// @desc    Add blogs from CSV
// @route   POST /api/blogs/upload/csv
export const addBlogsFromCsv = asyncHandler(async (req, res) => {
  const filePath = req.file.path;
  const blogs = [];
  const errors = [];
  const orgId = req.user.orgId;
  const userId = req.user.userId;

  try {
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csvParser())
        .on("data", (row) => {
          const { title, content, category, status } = row;

          if (title) {
            blogs.push({ title: normalizeTitle(title), content, category, status, orgId });
          } else {
            errors.push({ row, error: "Missing title" });
          }
        })
        .on("end", resolve)
        .on("error", reject);
    });

    await Blog.insertMany(blogs);

    const io = req.app.get("socketio");
    io.emit("blogsAddedCsv", blogs);

    await AdminLogs.create({
      userId,
      operationType: "add",
      operationsPerformed: "Added Blogs via CSV",
      orgId,
    });

    res.status(200).json({ message: "Blogs added successfully", errors });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    fs.unlinkSync(filePath);
  }
});
