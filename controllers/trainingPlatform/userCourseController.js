import { getUserCourseModel } from "../../models/trainingPlatform/userCourseModel.js";
import { getUserModel } from "../../models/userModel.js";
import asyncHandler from "../../middlewares/asyncHandler.js";
import { getCourseModel } from "../../admindb.js";
import { getEmailTemplateModel } from "../../models/trainingPlatform/emailTemplateModel.js";

// assign course to a user
export const assignCourse = asyncHandler(async (req, res) => {
  const { userId, courseId } = req.body;
  const adminId = req.user.userId;
  const orgId = req.user.orgId; // Tenant/organization ID

  // Retrieve the tenant-specific User model and UserCourse model
  const User = await getUserModel(orgId);
  const UserCourse = await getUserCourseModel(orgId);

  // Retrieve the common Course model from adminDB
  const Course = await getCourseModel();

  // Check if the user exists in the tenant database
  const user = await User.findOne({ _id: userId, orgId });
  if (!user) {
    return res
      .status(404)
      .json({ message: "User not found in the organization" });
  }

  // Check if the course exists in the admin database
  const course = await Course.findById(courseId);
  if (!course) {
    return res.status(404).json({ message: "Course not found" });
  }

  // Check if the course is already assigned to the user
  const existingAssignment = await UserCourse.findOne({
    orgId,
    userId,
    courseId,
  });
  if (existingAssignment) {
    return res
      .status(400)
      .json({ message: "Course already assigned to the user" });
  }

  // Create a new assignment in the tenant-specific UserCourse collection
  const newAssignment = new UserCourse({
    orgId,
    userId,
    courseId,
    assignedBy: adminId,
  });

  await newAssignment.save();

  res
    .status(201)
    .json({
      message: "Course assigned successfully",
      assignment: newAssignment,
    });
});

export const getCoursesForUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const orgId = req.user.orgId; // Ensure the tenant's orgId is available

  // Retrieve the tenant-specific UserCourse model
  const UserCourse = await getUserCourseModel(orgId);
  // Retrieve the common Course model from adminDB
  const Course = await getCourseModel();

  // Find assignments and populate assignedBy (tenant user). We'll fetch course details
  // from the admin DB separately to avoid cross-connection populate issues.
  const assignments = await UserCourse.find({ userId }).populate(
    "assignedBy",
    "name email"
  );

  // Manually attach course details from admin DB for each assignment
  const populatedAssignments = await Promise.all(
    assignments.map(async (assignment) => {
      const a = assignment.toObject();
      const course = await Course.findById(a.courseId).select(
        "name category description"
      );
      a.courseId = course || null;
      return a;
    })
  );

  if (!populatedAssignments || populatedAssignments.length === 0) {
    return res
      .status(404)
      .json({ message: "No courses assigned to this user" });
  }

  res.status(200).json(populatedAssignments);
});

export const updateCourseProgress = asyncHandler(async (req, res) => {
  const { userId, courseId, videoId, watchedDuration } = req.body;
  const orgId = req.user.orgId; // Assuming tenant's organization ID is available here

  // Retrieve the tenant-specific UserCourse model
  const UserCourse = await getUserCourseModel(orgId);

  // Retrieve the admin Course model
  const Course = await getCourseModel();

  // Find the user's course assignment
  const assignment = await UserCourse.findOne({ userId, courseId });
  if (!assignment) {
    return res.status(404).json({ message: "Course assignment not found" });
  }

  // Retrieve the total number of videos in the course from admin DB
  const courseFromAdmin = await Course.findById(assignment.courseId);
  const totalVideos = courseFromAdmin ? courseFromAdmin.videos.length : 0;

  // Find if progress for the specified video already exists
  const videoProgress = assignment.watchStatus.find(
    (status) => status.videoId.toString() === videoId
  );

  if (videoProgress) {
    // Update the watched duration for the existing video progress
    videoProgress.watchedDuration = watchedDuration;
  } else {
    // Add a new progress entry for the video
    assignment.watchStatus.push({ videoId, watchedDuration });
  }

  // Calculate the number of videos with progress entries
  const videosWatched = assignment.watchStatus.length;

  // Update overall progress as a percentage
  assignment.progress =
    totalVideos > 0 ? Math.round((videosWatched / totalVideos) * 100) : 0;

  // Save the updated assignment
  await assignment.save();

  res.status(200).json({
    message: "Progress updated successfully",
    assignment,
  });
});

export const removeCourseAssignment = asyncHandler(async (req, res) => {
  const { userId, courseId } = req.body;
  const orgId = req.user.orgId; // Tenant's organization ID

  // Retrieve the tenant-specific UserCourse model
  const UserCourse = await getUserCourseModel(orgId);

  // Find and delete the assignment
  const deletedAssignment = await UserCourse.findOneAndDelete({
    userId,
    courseId,
    orgId,
  });

  if (!deletedAssignment) {
    return res.status(404).json({ message: "Course assignment not found" });
  }

  res.status(200).json({ message: "Course assignment removed successfully" });
});

//TODO: For User side (Training Platform) Create endpoints below this line

// Fetch course details for a specific user
export const getUserAssignedCourseDetails = asyncHandler(async (req, res) => {
  const { courseId, userId } = req.params;
  const orgId = req.user.orgId; // Retrieve tenant's organization ID

  // Retrieve the tenant-specific UserCourse model
  const UserCourse = await getUserCourseModel(orgId);
  // Retrieve the common Course model from adminDB
  const Course = await getCourseModel();

  // Check if the course is assigned to the user
  const userCourse = await UserCourse.findOne({ userId, courseId });
  if (!userCourse) {
    return res
      .status(404)
      .json({ message: "Course not assigned to this user" });
  }

  // Fetch the course from admin DB
  const courseFromAdmin = await Course.findById(userCourse.courseId);
  if (!courseFromAdmin) {
    return res.status(404).json({ message: "Course not found in admin DB" });
  }

  const courseDetails = {
    courseId: courseFromAdmin._id,
    name: courseFromAdmin.name,
    description: courseFromAdmin.description,
    videos: courseFromAdmin.videos, // Assuming course has a videos field
    progress: userCourse.progress, // User-specific progress
    category: courseFromAdmin.category,
  };

  res.status(200).json(courseDetails);
});

// Update video progress
export const updateVideoProgress = asyncHandler(async (req, res) => {
  const { userId, courseId, videoId, watchedDuration } = req.body;
  const orgId = req.user.orgId; // Assumes tenant's orgId is available on req.user

  // Retrieve the tenant-specific UserCourse model
  const UserCourse = await getUserCourseModel(orgId);

  // Find the user's course assignment
  const userCourse = await UserCourse.findOne({ userId, courseId });
  if (!userCourse) {
    return res.status(404).json({
      success: false,
      message: "Course not found for the user.",
    });
  }

  // Find the index of the video progress in the watchStatus array
  const videoIndex = userCourse.watchStatus.findIndex(
    (v) => v.videoId.toString() === videoId
  );

  if (videoIndex >= 0) {
    // Update the watched duration only if the new duration is greater
    if (watchedDuration > userCourse.watchStatus[videoIndex].watchedDuration) {
      userCourse.watchStatus[videoIndex].watchedDuration = watchedDuration;
    }
  } else {
    // Add a new video progress entry
    userCourse.watchStatus.push({ videoId, watchedDuration });
  }

  // Retrieve the admin Course model and fetch course details to calculate total videos
  const Course = await getCourseModel();
  const courseFromAdmin = await Course.findById(userCourse.courseId);
  const totalVideos = courseFromAdmin ? courseFromAdmin.videos.length : 0;

  // Calculate how many videos are fully watched
  const fullyWatchedVideos = userCourse.watchStatus.filter(
    (v) => v.watchedDuration >= 90 // assuming 90 is the threshold for "fully watched"
  ).length;

  // Update progress percentage and status
  userCourse.progress = Math.round((fullyWatchedVideos / totalVideos) * 100);
  userCourse.status = userCourse.progress === 100 ? "completed" : "inprogress";

  await userCourse.save();

  res.json({
    success: true,
    message: "Video progress updated",
    progress: userCourse.progress,
  });
});

// Get User Course Progress
export const getUserCourseProgress = asyncHandler(async (req, res) => {
  const { userId, courseId } = req.params;
  const orgId = req.user.orgId; // Ensure tenant's orgId is available on req.user

  // Retrieve the tenant-specific UserCourse model
  const UserCourse = await getUserCourseModel(orgId);
  // Retrieve the common Course model from adminDB
  const Course = await getCourseModel();

  // Find the course assignment for the user in the tenant DB
  const userCourse = await UserCourse.findOne({ userId, courseId });

  if (!userCourse) {
    return res
      .status(404)
      .json({ success: false, message: "Course not found" });
  }

  res.status(200).json({
    success: true,
    progress: userCourse.progress,
    watchStatus: userCourse.watchStatus,
  });
});

export const getAllAssignEmails = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    const orgId = req.user.orgId; // Ensure the tenant's orgId is available

    // Retrieve the tenant-specific UserCourse model
    const UserCourse = await getUserCourseModel(orgId);
    // Retrieve the common Course model from adminDB
    const Course = await getCourseModel();
    // Retrieve the common Email Template model from the adminDB
    const EmailTemplate = await getEmailTemplateModel();

    // 1️⃣ Find all assigned courses for the user (tenant-level assignments)
    const userCourses = await UserCourse.find({ userId });

    if (!userCourses || userCourses.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No courses assigned to this user" });
    }

    console.log("Backend User Courses:", userCourses);

    // 2️⃣ For each assigned course, fetch course details from admin DB and extract email groups
    let emailGroups = new Set();
    await Promise.all(
      userCourses.map(async (userCourse) => {
        const course = await Course.findById(userCourse.courseId);
        if (course && course.videos) {
          course.videos.forEach((video) => {
            if (video.assignEmail) {
              emailGroups.add(video.assignEmail); // Store unique email groups
            }
          });
        }
      })
    );

    // Convert Set to Array
    emailGroups = [...emailGroups];

    console.log("Extracted Email Groups:", emailGroups);

    if (emailGroups.length === 0) {
      return res
        .status(404)
        .json({
          success: false,
          message: "No email groups assigned to any videos in courses",
        });
    }

    // 3️⃣ Fetch email templates that match the extracted email groups
    const emailTemplates = await EmailTemplate.find({
      group: { $in: emailGroups },
    });

    console.log("Fetched Email Templates:", emailTemplates);

    res.status(200).json({
      success: true,
      assignedCourses: userCourses.length,
      emailGroups,
      emailTemplates,
    });
  } catch (error) {
    console.error("Error in getAllAssignEmails:", error);
    res
      .status(500)
      .json({ success: false, message: error.message || "Server Error" });
  }
});
