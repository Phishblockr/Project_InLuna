import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import asyncHandler from "../../middlewares/asyncHandler.js";
import Course from "../../models/trainingPlatform/courseModel.js"


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
        const signedUrl  = await getSignedUrl(s3Client, command, { expiresIn: 60 });

        res.json({ success: true, url: signedUrl });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export const createCourse = asyncHandler(async(req, res) => {
    try{
        const {name, category, description, videos = [], isDraft} = req.body;
        if (!name || !category){
            return res.status(400).json({success: false, message: "name and category are mandatory."})
        }

        if (!Array.isArray(videos)) {
            return res.status(400).json({ success: false, message: "Videos must be an array." });
        }

            const course = new Course({
                name: name.trim(),
                category: category.trim(),
                description,
                videos,
                isDraft

            });
        const savedCourse = await course.save();
        res.status(201).json({success: true, template: savedCourse})
    }   catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
})

export const updateCourse = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const { name, category, description, videos, isDraft } = req.body;

        if (!name || !category) {
            return res.status(400).json({ success: false, message: "Course name and category are required." });
        }

        const course = await Course.findById(id);
        if (!course) {
            return res.status(404).json({ success: false, message: "Course not found." });
        }

        course.name = name.trim();
        course.category = category.trim();
        course.description = description;
        course.videos = videos;
        course.isDraft = isDraft;

        const updatedCourse = await course.save();  // Save changes

        res.status(200).json({ success: true, message: "Course updated successfully", course: updatedCourse });
    } catch (error) {
        console.error("Update Course Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});


// Get all Courses
export const getAllCourses = async (req, res) => {

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const category = req.query.category || "all";

    const searchFilter = search ? {
        $or: [
            { name: { $regex: search, $options: 'i' } },
        ]
    } : {};

    const categoryFilter = category === "all" ? {} : {
        category: { $regex: `^${category}$`, $options: "i" }
    };

    try {
        const queryFilter = { ...searchFilter, ...categoryFilter };
        const courses = await Course.find(queryFilter);

        const formattedCourses = courses.map((course) => {
            const totalDurationSeconds = course.videos.reduce((sum, video) => sum + (video.duration || 0),0);
            const hours = Math.floor(totalDurationSeconds / 3600);
            const minutes = Math.floor((totalDurationSeconds % 3600) / 60);
            const seconds = totalDurationSeconds % 60;

            const totalDurationFormatted = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
            return {
                ...course.toObject(), 
                totalDuration: totalDurationFormatted,
            };
        })

        const totalCourses = await Course.countDocuments(queryFilter)
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
export const getCourseById = async (req, res) => {
    try {
        const { id } = req.params;

        const course = await Course.findById(id);
        if (!course) {
            return res.status(404).json({ success: false, message: "course not found." });
        }

        res.status(200).json({ success: true, course });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete a course by ID
export const deleteCourse = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedCourse = await Course.findByIdAndDelete(id);
        if (!deletedCourse) {
            return res.status(404).json({ success: false, message: "Course not found." });
        }

        res.status(200).json({ success: true, message: "Course deleted successfully." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// fetch category list
export const getCourseCategories = asyncHandler(async (req, res) => {
    try {
        const category = await Course.find({}, "category");
        const uniqueCategory = [...new Set(category.map((doc) => doc.category))];
        res.json(uniqueCategory);
    } catch (error) {
        console.error("Error fetching category: ", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
})

// fetch title and id of the course of assigning
export const getCourseDetails = asyncHandler(async (req, res) => {
    try {
        const courses = await Course.find({}, "_id name")

        // Format the response for react-select
        const options = courses.map(course => ({
            value: course._id,
            label: course.name,
        }));
        res.status(200).json({ options });
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ message: 'Server error' });
    }
})