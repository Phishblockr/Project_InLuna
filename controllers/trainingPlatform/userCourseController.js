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
    const { userId } = req.params;
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


// Fetch course details for a specific user
export const getUserAssignedCourseDetails = async (req, res) => {
    const { courseId, userId } = req.params;
  
    try {
      // Check if the course is assigned to the user
      const userCourse = await UserCourse.findOne({ courseId, userId }).populate(
        "courseId"
      );
      
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
        progress: userCourse.progress, // User-specific progress
        category: userCourse.courseId.category,
      };
  
      res.status(200).json(courseDetails);
    } catch (error) {
      console.error("Error fetching course details:", error);
      res.status(500).json({ message: "Internal server error" });
    }
};
  

// Update video progress
export const updateVideoProgress = async (req, res) => {
    const {userId, courseId, videoId, watchedDuration} = req.body;

    try {
        const userCourse = await UserCourse.findOne({userId, courseId})

        if(!userCourse){
            return res.status(404).json({success:false, message:"Course not found for the User."})
        }

        //find the video progress inside the watchStatus array
        const videoIndex = userCourse.watchStatus.findIndex((v)=>v.videoId.toString()===videoId);

        if(videoIndex>=0){
            //update the watched duration if the new duration is greater
            if(watchedDuration>userCourse.watchStatus[videoId].watchedDuration){
                userCourse.watchStatus[videoIndex].watchedDuration = watchedDuration;
            }   
        }else {
            //Add new video entry 
            userCourse.watchStatus.push({videoId,watchedDuration});
        }

        // check if all the videos are watched and update the course progress
        const totalVideos = userCourse.watchStatus.length;
        const fullyWatchedVideos = userCourse.watchStatus.filter((v)=> v.watchedDuration >= 90).length; // assuming 90% watched is completed

        userCourse.progress = (fullyWatchedVideos/totalVideos) * 100;
        userCourse.status = userCourse.progress === 100 ? "completed" : "inprogress";

        await userCourse.save();
        res.json({success:true,message:"Video progress updated", progress:userCourse.progress});
    } catch (error) {
        res.status(500).json({success: false, message:error.message})
    }
}

// Get User Course Progress
export const getUserCourseProgress = async (req, res)=>{
    try {
        const userCourse = await UserCourse.findOne({userId:req.params.userId,courseId:req.params.courseId});

        if(!userCourse){
            return res.status(404).json({success:false, message:"course not found"});
        }

        res.json({success:true,progress:userCourse.progress,watchStatus:userCourse.watchStatus});

    } catch (error) {
        res.status(500).json({success:false,message:error.message})
    }
}