import UserCourse from "../../models/trainingPlatform/userCourseModel.js";
import User from "../../models/userModel.js";
import Course from "../../models/trainingPlatform/courseModel.js";
import asyncHandler from "../../middlewares/asyncHandler.js";


// assign course to a user
export const assignCourse = asyncHandler(async (req, res) => {
    const { userId, courseId } = req.body;
    const adminId = req.user.userId;
    const orgId = req.user.orgId;

    try {
        // Validation check
        // check if users exists
        const user = await User.findOne({ _id: userId, orgId });
        if (!user) {
            return res.status(404).json({ message: "User not found in the organization" });
        }

        // check if the course exists
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: "Course not found" })
        }

        // Check if the course is already assigned to the user
        const existingAssignment = await UserCourse.findOne({ orgId, userId, courseId });
        if (existingAssignment) {
            return res.status(400).json({ message: "Course already assigned to the user" })
        }

        // Create a new assignment
        const newAssignment = new UserCourse({
            orgId,
            userId,
            courseId,
            assignedBy: adminId,
        })
        await newAssignment.save();

        res.status(201).json({ message: "Course assigned successfully", assignment: newAssignment });
    } catch (error) {
        console.error("Error assigning course:", error);
        res.status(500).json({ message: "Internal server error" });
    }
})

export const getCoursesForUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    let userId = id
    try {
        const assignments = await UserCourse.find({ userId })
            .populate("courseId", "name category description")
            .populate("assignedBy", "name email");

        if (!assignments || assignments.length === 0) {
            return res.status(404).json({ message: "No courses assigned to this user" });
        }

        res.status(200).json(assignments);
    } catch (error) {
        console.error("Error fetching courses for user:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

export const updateCourseProgress = async (req, res) => {
    const { userId, courseId, videoId, watchedDuration } = req.body;

    try {
        // Find the user's course assignment
        const assignment = await UserCourse.findOne({ userId, courseId }).populate('courseId');
        if (!assignment) {
            return res.status(404).json({ message: "Course assignment not found" });
        }

        // Find the course details to get the total videos
        const totalVideos = assignment.courseId.videos.length;

        // Check if progress for the video exists
        const videoProgress = assignment.watchStatus.find(
            (status) => status.videoId.toString() === videoId
        );

        if (videoProgress) {
            // Update existing progress
            videoProgress.watchedDuration = watchedDuration;
        } else {
            // Add new progress entry
            assignment.watchStatus.push({ videoId, watchedDuration });
        }

        // Calculate the number of videos marked as watched
        const videosWatched = assignment.watchStatus.length;

        // Update progress percentage
        assignment.progress = Math.round((videosWatched / totalVideos) * 100);

        await assignment.save();

        res.status(200).json({
            message: "Progress updated successfully",
            assignment,
        });
    } catch (error) {
        console.error("Error updating progress:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const removeCourseAssignment = asyncHandler(async (req, res) => {
    const { userId, courseId } = req.body;
    const orgId = req.user.orgId;
    try {
        const deletedAssignment = await UserCourse.findOneAndDelete({ userId, courseId, orgId });

        if (!deletedAssignment) {
            return res.status(404).json({ message: "Course assignment not found" });
        }
        res.status(200).json({ message: "Course assignment removed successfully" });
    } catch (error) {
        console.error("Error removing course assignment:", error);
        res.status(500).json({ message: "Internal server error" });
    }
})

//TODO: For User side (Training Platform) Create endpoints below this line