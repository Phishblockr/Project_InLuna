import asyncHandler from "../../middlewares/asyncHandler.js";
import { getIndividualUrlModel } from "../../models/individualModels/indUrlModel.js";
import mongoose from 'mongoose';

export const addUrlInd = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { url, category, isVerified, isPhishing, isUserAdded } = req.body;

    if (!userId) {
        return res.status(400).json({ message: "User ID is required." })
    }

    const Url = await getIndividualUrlModel();

    if (!Url) {
        return res.status(500).json({ message: "Failed to connect to database" });
    }

    let existingUrl = await Url.findOne({ url: url });

    if (existingUrl) {
        let visitor = existingUrl.visitedBy.find(v => v.userId.equals(userId));

        if (visitor) {
            visitor.visits.push({ timestamp: new Date() });
            visitor.totalVisits += 1;
        } else {
            existingUrl.visitedBy.push({
                userId,
                visits: [{ timestamp: new Date() }],
                totalVisits: 1
            });
        }

        await existingUrl.save();
        return res.status(200).json(existingUrl);
    }

    const newUrl = new Url({
        url: url,
        visitedBy: [{
            userId,
            visits: [{ timestamp: new Date() }],
            totalVisits: 1,
        }],
        category: category || ["general"],
        isVerified: isVerified ?? false,
        isPhishing: isPhishing ?? true,
        isUserAdded: isUserAdded ?? false,
    });

    await newUrl.save();

    // TODO: Add socket if required 
    res.status(201).json(newUrl);
});

export const fetchUrlMetricsInd = asyncHandler(async (req, res) => {
    const userId = new mongoose.Types.ObjectId(`${req.user.userId}`);

    if (!userId) {
        return res.status(400).json({ message: "User ID is required." });
    }

    const Url = await getIndividualUrlModel();

    const result = await Url.aggregate([
        { $unwind: "$visitedBy" },
        { $match: { "visitedBy.userId": userId } },
        {
            $group: {
                _id: "$status",
                totalVisits: { $sum: "$visitedBy.totalVisits" }
            }
        }
    ]);
    let response = {
        visitedUrls: 0,
    };

    result.forEach(item => {
        response.visitedUrls = item.totalVisits;
    });

    res.status(200).json(response);
});

export const getUrlsInd = asyncHandler(async (req, res) => {
    const userId = new mongoose.Types.ObjectId(`${req.user.userId}`);

    if (!userId) {
        return res.status(400).json({ message: "User ID is required." });
    }

    const Url = await getIndividualUrlModel();

    if (!Url) {
        return res.status(500).json({ message: "Failed to connect to database" });
    }

    const url = await Url.aggregate([
        { $unwind: "$visitedBy" },
        { $match: { "visitedBy.userId": userId } },
    ]);

    res.status(200).json(url);
})