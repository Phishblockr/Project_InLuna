import Feedback from "../models/feedbackModel.js";
import mongoose from 'mongoose';

export const addFeedbackExt = async (req, res) => {
    try {

        const userId = mongoose.Types.ObjectId.createFromHexString(req.user.userId);
        const orgId = req.user.orgId;

        const {feedback} = req.body;
        const newFeedback = new Feedback({
            userId,
            feedback,
            orgId,
        });
        await newFeedback.save();
        res.status(201).send(newFeedback);
    } catch (error) {
        res.status(400).send(error.message);
    }
};