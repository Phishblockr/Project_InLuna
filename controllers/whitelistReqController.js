import asyncHandler from '../middlewares/asyncHandler.js';
import Url from '../models/urlModel.js';
import WhitelistReq from '../models/whitelistReqModel.js';
import mongoose from 'mongoose';

// for adminLog
import AdminLogs from "../models/adminlogsModel.js";

export const addWhitelistReqExt = async (req, res) => {
    try {
        const userId = mongoose.Types.ObjectId.createFromHexString(req.user.userId);
        const orgId = req.user.orgId;

        const { url, reason } = req.body;

        const existingUrl = await Url.findOne({ url, orgId });
        if (!existingUrl) {
            return res.status(404).json({ message: "Invalid request" })
        }

        const existingRequest = await WhitelistReq.findOne({
            userId,
            url,
            orgId,
            status: { $ne: "approved" }
        })

        if (existingRequest) {
            return res.status(400).json({ message: "You have already submitted a whitelist request for this URL, pending approval." });
        }

        const newWhitelistReq = new WhitelistReq({
            userId,
            url,
            reason,
            orgId,
        });
        await newWhitelistReq.save();

        existingUrl.whitelistReqIds = existingUrl.whitelistReqIds || [];
        existingUrl.whitelistReqIds.push(newWhitelistReq._id);
        await existingUrl.save();

        const io = req.app.get("socketio");
        io.emit("newReqAdded", newWhitelistReq);

        res.status(201).send(newWhitelistReq);
    } catch (error) {
        res.status(400).send(error.message);
    }
};

export const fetchReqs = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;
    const search = req.query.search || ""
    const status = req.query.status || "all";

    const orgId = req.user.orgId;
    const searchFilter = search ? {
        $or: [
            { url: { $regex: search, $options: "i" } },
            { reason: { $regex: search, $options: "i" } },
            { "userDetails.name": { $regex: search, $options: "i" } },
            { "userDetails.email": { $regex: search, $options: "i" } },
        ]
    } : {};

    const statusFilter = status == "all" ? {} : { status };

    try {
        const whitelistReqs = await WhitelistReq.aggregate([
            { $match: { orgId, ...statusFilter } },
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "userDetails"
                }
            },
            { $unwind: "$userDetails" },
            { $match: searchFilter },
            {
                $project: {
                    _id: 1,
                    url: 1,
                    reason: 1,
                    status: 1,
                    createdAt: 1,
                    "userDetails.name": 1,
                    "userDetails.email": 1
                }
            },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit }
        ]);

        const totalReqsAggregation = await WhitelistReq.aggregate([
            { $match: { orgId, ...statusFilter } },
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "userDetails",
                },
            },
            { $unwind: "$userDetails" },
            { $match: searchFilter },
            { $count: "totalCount" },
        ]);

        const totalReqs = totalReqsAggregation[0]?.totalCount || 0;

        res.json({
            data: whitelistReqs,
            currentPage: page,
            totalPages: Math.ceil(totalReqs / limit),
            totalReqs
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

export const approveWhitelistRequest = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;

        const userId = req.user.userId;
        const orgId = req.user.orgId;

        const whitelistRequest = await WhitelistReq.findById(id);
        if (!whitelistRequest) {
            return res.status(404).json({ message: "Whitelist request not found" });
        }

        // Update all whitelist requests associated with the same URL and orgId to approved
        await WhitelistReq.updateMany(
            { url: whitelistRequest.url, orgId: whitelistRequest.orgId }, { status: "approved" }
        )
        let url = await Url.findOne({ url: whitelistRequest.url, orgId: whitelistRequest.orgId });

        if (!url) {
            return res.status(404).json({ message: "URL not found in the database" });
        } else {
            // If the URL exists, update it with the whitelist request ID
            url.isUserAdded = true;
            url.isVerified = true;
            url.isPhishing = false;
            url.status = "whitelisted",
                await url.save();
        }

        const updatedWhitelistRequest = await WhitelistReq.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(id) } },
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "userDetails"
                }
            },
            { $unwind: "$userDetails" },
            {
                $project: {
                    _id: 1,
                    url: 1,
                    reason: 1,
                    status: 1,
                    createdAt: 1,
                    "userDetails.name": 1,
                    "userDetails.email": 1
                }
            }
        ]);

        if (updatedWhitelistRequest.length === 0) {
            return res.status(404).json({ message: "Updated request not found" });
        }

        const io = req.app.get("socketio");
        io.emit("reqUpdated", updatedWhitelistRequest[0]); // Emit the full updated object with user details

        // Add Log entry
        await AdminLogs.create({
            userId,
            operationType: "approved",
            operationsPerformed: `Whitelist Request Approved: ${id}`,
            orgId,
            entityId: id,
            entityType: "whitelistReq"
        })

        res.json({ message: "Whitelist request approved and URL updated", updatedWhitelistRequest: updatedWhitelistRequest[0] });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
        console.error(error)
    }
});

export const deleteRequest = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;

        const userId = req.user.userId;
        const orgId = req.user.orgId;
        const data = await WhitelistReq.findById(id);
        if (!data) {
            return res.status(404).json({ message: "Whitelist request not found" });
        }
        await WhitelistReq.findByIdAndDelete(id);
        const io = req.app.get("socketio");
        io.emit("reqDeleted", id);

        await AdminLogs.create({
            userId,
            operationType: "delete",
            operationsPerformed: `Whitelist Request deleted: ${id}`,
            orgId,
            entityId: id,
            entityType: "whitelistReq",
            entityDetails: { from: data.userId, identifier: data.url, status: data.status, extraInfo: `Reason: ${data.reason}`  } 
        })

        res.status(200).json(id);
    } catch (error) {
        res.status(400).send(error.message);
    }
})
