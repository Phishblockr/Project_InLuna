import { getEmailTemplateModel } from "../../admindb.js";
import asyncHandler from "../../middlewares/asyncHandler.js";
import { getUserEmailModel } from "../../models/trainingPlatform/userEmailModel.js";
import { getUserModel } from "../../models/userModel.js";

export const assignEmail = asyncHandler(async (req, res) => {
  try {
    const { userId, emailTemplateId } = req.body;
    const adminId = req.user.userId;
    const orgId = req.user.orgId;

    const User = await getUserModel(orgId);
    const userEmail = await getUserEmailModel(orgId);

    const Email = await getEmailTemplateModel();

    const user = await User.findOne({ _id: userId, orgId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found in the organisation",
      });
    }

    const email = await Email.findById(emailTemplateId);
    if (!email) {
      return res.status(404).json({
        success: false,
        message: "Email not found",
      });
    }

    const existingAssignment = await userEmail.findOne({
      orgId,
      userId,
      emailTemplateId,
    });
    if (existingAssignment) {
      return res.status(400).json({
        success: false,
        message: "Email already assigned to the user",
      });
    }

    const newAssignment = new userEmail({
      orgId,
      userId,
      emailTemplateId,
      assignedBy: adminId,
    });

    await newAssignment.save();

    res.status(201).json({
      success: true,
      message: "EmailAssigned",
      assignment: newAssignment,
    });
  } catch (error) {
    console.log("Assign Email Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export const getEmailsForUser = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    const orgId = req.user.orgId;

    const userEmail = await getUserEmailModel(orgId);

    const Email = await getEmailTemplateModel();

    const assignments = await userEmail
      .find({ userId })
      .populate({
        path: "emailTemplateId",
        select: "title subject htmlContent isPhishing",
        model: Email,
      })
      .populate("assignedBy", "name email");

    if (!assignments || assignments.length === 0) {
      return res
        .status(200)
        .json({ success: true, message: "No emails assigned to the user" , assignments:[]});
    }

    res.status(200).json({ success: true, assignments });
  } catch (error) {
    console.log("Get Emails for User Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export const removeEmailAssignment = asyncHandler(async (req, res) => {
  try {
    const { userId, emailTemplateId } = req.body;
    const orgId = req.user.orgId;

    const userEmail = await getUserEmailModel(orgId);

    const deleteAssignment = await userEmail.findOneAndDelete({
      userId,
      emailTemplateId,
      orgId,
    });

    if (!deleteAssignment || deleteAssignment.length === 0) {
      return res.status(404).json({ message: "No email assignment found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Email assignment removed" });
  } catch (error) {
    console.log("Remove Email Assignment Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export const getUserAssignedEmailDetails = asyncHandler(async (req, res) => {
  try {
    const { emailTemplateId, userId } = req.params;
    const orgId = req.user.orgId;

    const UserEmail = await getUserEmailModel(orgId);

    const Email = await getEmailTemplateModel();

    const userEmail = await UserEmail.findOne({
      userId,
      emailTemplateId,
    }).populate({
      path: "emailTemplateId",
      model: Email,
    });

    if (!userEmail) {
      return res.status(200).json({success: true, message: "Email not found",});
    }

    // const emailDetails = {
    //     emailId: userEmail.emailTemplateId._id,
    //     title: userEmail.emailTemplateId.title,
    //     subject: userEmail.emailTemplateId.subject,
    //     htmlContent: userEmail.emailTemplateId.htmlContent,
    //     isPhishing: userEmail.emailTemplateId.isPhishing,
    // }
    res.status(200).json({ success: true, userEmail });
  } catch (error) {
    console.log("Get User Assigned Email Details Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});
