import asyncHandler from '../middlewares/asyncHandler.js';
import Url from '../models/urlModel.js';
import Request from '../models/RequestModel.js';
import mongoose from 'mongoose';

// for adminLog
import AdminLogs from "../models/adminlogsModel.js";

//Virus Total domain reputation and url scan
const VIRUSTOTAL_API_KEY = process.env.VIRUSTOTAL_API_KEY;
const VIRUSTOTAL_API_URL = "https://www.virustotal.com/api/v3/domains/";

async function checkDomainReputation(domain) {
    try {
        const url = `${VIRUSTOTAL_API_URL}${domain}`;
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "x-apikey": VIRUSTOTAL_API_KEY,
            },
        });

        if (!response.ok) {
            throw new Error(`VirusTotal API error: ${response.statusText}`);
        }

        const data = await response.json();
        const stats = data.data.attributes.last_analysis_stats;

        return {
            isSafe: stats.malicious === 0,
            stats: stats,
            reputation: data.data.attributes.reputation,
        };
    } catch (error) {
        console.error("Error fetching domain reputation:", error.message);
        throw new Error("Failed to check domain reputation");
    }
}


export const addRequestExt = async (req, res) => {
    try {
        const userId = mongoose.Types.ObjectId.createFromHexString(req.user.userId);
        const orgId = req.user.orgId;
        const { url, reason , reqOption } = req.body;

        // Extract domain from URL
        const domain = new URL(url).hostname;
        // Check domain reputation using VirusTotal
        const reputationResult = await checkDomainReputation(domain);

        let existingUrl = await Url.findOne({ url, orgId });
        if (!existingUrl) {
            const newUrl = new Url ({
                url: `${req.body.url}`,
                orgId: req.user.orgId,
                isVerified: false,
                isPhishing: false,
            })
            existingUrl = await newUrl.save();
            return res.status(404).json({
                message: "The URL you entered is not currently in our database. Please try again or contact support for assistance."
            });
        }
        
        const existingRequest = await Request.findOne({
            userId,
            url,
            orgId,
            status: { $ne: "approved" }
        })

        if (existingRequest) {
            return res.status(400).json({ message: `You have already submitted a ${existingRequest.reqOption} request for this URL, pending approval.` });
        }

        const newRequest = new Request({
            userId,
            url,
            reason,
            orgId,
            reqOption,
            reputationDetails: reputationResult.stats, // Save reputation stats
            reputationScore: reputationResult.reputation, // Save reputation score
        });
        await newRequest.save();

        existingUrl.RequestIds = existingUrl.RequestIds || [];
        existingUrl.RequestIds.push(newRequest._id);
        await existingUrl.save();

        const io = req.app.get("socketio");
        io.emit("newReqAdded", newRequest);
        //res.status(201).send(newRequest);

        // Respond with the new request and reputation details
        res.status(201).json({
            message: "Request submitted successfully",
            request: newRequest,
            reputation: {
                isSafe: reputationResult.isSafe,
                stats: reputationResult.stats,
                reputationScore: reputationResult.reputation,
            },
        });
    } catch (error) {
        //res.status(400).send(error.message);
        res.status(500).json({ message: "Server error", error: error.message });
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
        const Requests = await Request.aggregate([
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
                    reqOption:1,
                    status: 1,
                    createdAt: 1,
                    "userDetails.name": 1,
                    "userDetails.email": 1,
                    reputationDetails: 1, // Include VirusTotal reputation details
                    reputationScore: 1, // Include VirusTotal reputation score
                }
            },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit }
        ]);

        const totalReqsAggregation = await Request.aggregate([
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
            data: Requests,
            currentPage: page,
            totalPages: Math.ceil(totalReqs / limit),
            totalReqs
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

export const approveRequest = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;

        const userId = req.user.userId;
        const orgId = req.user.orgId;

        const RequestData = await Request.findById(id);
        if (!RequestData) {
            return res.status(404).json({ message: "Request not found" });
        }
        const RequestOption = RequestData.reqOption;
        let ReqOpt = "";
        let isPhished = true;
        if(RequestOption==="blacklist"){
            ReqOpt = "blacklisted";
            isPhished;
        }else if(RequestOption==="whitelist"){
            ReqOpt = "whitelisted";
            isPhished= false;
        }


        // Update all Requests associated with the same URL and orgId to approved

        await Request.updateMany(
            { url: RequestData.url, orgId: RequestData.orgId }, { status: "approved", reqOption: RequestOption }
        )
        let url = await Url.findOne({ url: RequestData.url, orgId: RequestData.orgId });
        

        if (!url) {
            return res.status(404).json({ message: "URL not found in the database" });
        } else {
            // If the URL exists, update it with the request ID
            url.isUserAdded = true;
            url.isVerified = true;
            url.isPhishing = isPhished;
            url.status = ReqOpt,
                await url.save();
        }

        const updatedRequestData = await Request.aggregate([
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
                    reqOption: 1,
                    status: 1,
                    createdAt: 1,
                    "userDetails.name": 1,
                    "userDetails.email": 1
                }
            }
        ]);

        if (updatedRequestData.length === 0) {
            return res.status(404).json({ message: "Updated request not found" });
        }

        const io = req.app.get("socketio");
        io.emit("reqUpdated", updatedRequestData[0]); // Emit the full updated object with user details

        // Add Log entry
        await AdminLogs.create({
            userId,
            operationType: "approved",
            operationsPerformed: `Request Approved: ${id}`,
            orgId,
            entityId: id,
            entityType: "whitelistReq"
        })

        res.json({ message: "Request approved and URL updated", updatedRequestData: updatedRequestData[0] });
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
        const data = await Request.findById(id);
        if (!data) {
            return res.status(404).json({ message: "Request not found" });
        }
        const {url} = data;
        const existingUrl = await Url.findOne({ url, orgId });
        existingUrl.RequestIds = existingUrl.RequestIds.filter(
            (requestId) => requestId.toString() !== id
        );
        await existingUrl.save();
        await Request.findByIdAndDelete(id);
        const io = req.app.get("socketio");
        io.emit("reqDeleted", id);

        await AdminLogs.create({
            userId,
            operationType: "delete",
            operationsPerformed: `Request deleted: ${id}`,
            orgId,
            entityId: id,
            entityType: "Request",
            entityDetails: { from: data.userId, identifier: data.url, status: data.status, extraInfo: `Reason: ${data.reason}`  } 
        })

        res.status(200).json(id);
    } catch (error) {
        res.status(400).send(error.message);
    }
})
