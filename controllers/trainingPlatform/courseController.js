import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import asyncHandler from "../../middlewares/asyncHandler.js";
import { getCourseModel } from "../../admindb.js";


if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_BUCKET_NAME) {
    throw new Error("Missing AWS environment variables");
}

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});

export const uploadCourseVideo = asyncHandler(async (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ success: false, message: "File is required" });
        }
        const fileName = `videos/${file.originalname}-${Date.now()}`

        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: fileName,
            Body: file.buffer,
            ContentType: file.mimetype
        };
        await s3Client.send(new PutObjectCommand(params));

        const videoUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

        res.status(201).json({ success: true, message: videoUrl });
    } catch (error) {
        console.error("Upload Error:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
})

export const deleteCourseVideo = asyncHandler(async (req, res) => {
    try {
        const { videoUrl } = req.body;

        if (!videoUrl) {
            return res.status(400).json({ success: false, message: "Video URL is required" });
        }

        const fileName = videoUrl.split(`${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/`)[1];

        if (!fileName) {
            return res.status(400).json({ success: false, message: "Invalid video URL format" });
        }

        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: fileName
        };

        await s3Client.send(new DeleteObjectCommand(params));

        res.status(200).json({ success: true, message: "Video deleted successfully" });
    } catch (error) {
        console.error("Delete Error:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
})

export const getSignedUrlController = asyncHandler(async (req, res) => {
    try {
        const { fileName } = req.query;

        if (!fileName) {
            return res.status(400).json({ error: "Filename is required" });
        }

        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `videos/${fileName}`,
        };

        const command = new GetObjectCommand(params);
        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });

        res.json({ success: true, url: signedUrl });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export const createCourse = asyncHandler(async (req, res) => {
    const { name, category, description, videos = [], isDraft } = req.body;

    if (!name || !category) {
        return res.status(400).json({ 
            success: false, 
            message: "Name and category are mandatory." 
        });
    }

    if (!Array.isArray(videos)) {
        return res.status(400).json({ 
            success: false, 
            message: "Videos must be an array." 
        });
    }

    // Fetch the Course model from the adminDB
    const Course = await getCourseModel();

    const course = new Course({
        name: name.trim(),
        category: category.trim(),
        description,
        videos,
        isDraft,
    });

    const savedCourse = await course.save();
    res.status(201).json({ 
        success: true, 
        course: savedCourse 
    });
});

export const updateCourse = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, category, description, videos, isDraft } = req.body;

    if (!name || !category) {
        return res.status(400).json({ 
            success: false, 
            message: "Course name and category are required." 
        });
    }

    // Get the Course model from the adminDB
    const Course = await getCourseModel();

    const course = await Course.findById(id);
    if (!course) {
        return res.status(404).json({ 
            success: false, 
            message: "Course not found." 
        });
    }

    course.name = name.trim();
    course.category = category.trim();
    course.description = description;
    course.videos = videos;
    course.isDraft = isDraft;

    const updatedCourse = await course.save();

    res.status(200).json({ 
        success: true, 
        message: "Course updated successfully", 
        course: updatedCourse 
    });
});

// Get all Courses
export const getAllCourses = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;
        const search = req.query.search || "";
        const category = req.query.category || "all";

        // Build search filter for course name if provided
        const searchFilter = search
            ? { $or: [{ name: { $regex: search, $options: "i" } }] }
            : {};

        // Build category filter if a specific category is provided
        const categoryFilter =
            category === "all"
                ? {}
                : { category: { $regex: `^${category}$`, $options: "i" } };

        // Merge filters
        const queryFilter = { ...searchFilter, ...categoryFilter };

        // Retrieve the Course model from adminDB
        const Course = await getCourseModel();

        // Fetch paginated courses based on the filter
        const courses = await Course.find(queryFilter).skip(skip).limit(limit);

        // Format each course to include the total duration in HH:MM:SS format
        const formattedCourses = courses.map((course) => {
            const totalDurationSeconds = course.videos.reduce(
                (sum, video) => sum + (video.duration || 0),
                0
            );
            const hours = Math.floor(totalDurationSeconds / 3600);
            const minutes = Math.floor((totalDurationSeconds % 3600) / 60);
            const seconds = totalDurationSeconds % 60;

            const totalDurationFormatted = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

            return {
                ...course.toObject(),
                totalDuration: totalDurationFormatted,
            };
        });

        // Get the total count of courses matching the query filter (for pagination)
        const totalCourses = await Course.countDocuments(queryFilter);

        res.status(200).json({
            success: true,
            courses: formattedCourses,
            currentPage: page,
            totalPages: Math.ceil(totalCourses / limit),
            totalCourses,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get a single course by ID
export const getCourseById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Get the Course model from adminDB
    const Course = await getCourseModel();
    const course = await Course.findById(id);

    if (!course) {
        return res
            .status(404)
            .json({ success: false, message: "Course not found." });
    }

    res.status(200).json({ success: true, course });
});

// Delete a course by ID
export const deleteCourse = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Retrieve the Course model from the adminDB
    const Course = await getCourseModel();

    const deletedCourse = await Course.findByIdAndDelete(id);
    if (!deletedCourse) {
        return res
            .status(404)
            .json({ success: false, message: "Course not found." });
    }

    res
        .status(200)
        .json({ success: true, message: "Course deleted successfully." });
});

// fetch category list
export const getCourseCategories = asyncHandler(async (req, res) => {
    // Retrieve the Course model from the adminDB
    const Course = await getCourseModel();

    // Fetch only the "category" field for all courses
    const categoryDocs = await Course.find({}, "category");

    // Create an array of unique categories
    const uniqueCategories = [...new Set(categoryDocs.map((doc) => doc.category))];

    res.status(200).json(uniqueCategories);
});

// fetch title and id of the course of assigning
export const getCourseDetails = asyncHandler(async (req, res) => {
    // Retrieve the Course model from the adminDB connection
    const Course = await getCourseModel();
    
    // Fetch only the _id and name fields of each course
    const courses = await Course.find({}, "_id name");

    // Format the response for react-select (or similar components)
    const options = courses.map((course) => ({
        value: course._id,
        label: course.name,
    }));
    
    res.status(200).json({ options });
});

// Fetch course details for a specific user

export const getUserAssignedCourseDetails = asyncHandler(async (req, res) => {
    const { courseId, userId } = req.params;

    // Check if the course is assigned to the user and populate course details
    const userCourse = await UserCourse.findOne({ courseId, userId }).populate("courseId");

    if (!userCourse) {
        return res
            .status(404)
            .json({ message: "Course not assigned to this user" });
    }

    const courseDetails = {
        courseId: userCourse.courseId._id,
        name: userCourse.courseId.name,
        description: userCourse.courseId.description,
        videos: userCourse.courseId.videos, // Assuming course has a videos field
        progress: userCourse.progress,        // User-specific progress
        category: userCourse.courseId.category,
    };

    res.status(200).json(courseDetails);
});