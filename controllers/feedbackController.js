import Feedback from "../models/feedbackModel.js";
export const addFeedbackExt = async (req, res) => {
    try {
        const {userProfileImg, userId, username, feedback, orgId} = req.body;
        const newFeedback = new Feedback({
            userProfileImg,
            userId,
            username,
            feedback,
            orgId,
        });
        await newFeedback.save();
        res.status(201).send(newFeedback);
    } catch (error) {
        res.status(400).send(error.message);
    }
};