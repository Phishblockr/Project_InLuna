import asyncHandler from '../middlewares/asyncHandler.js';
import UrlSchema from '../models/urlModel.js';
import RequestSchema from '../models/RequestModel.js';
import mongoose from 'mongoose';
import { getdomainRepModel } from '../models/domainReputationModel.js';

// for adminLog
import UserSchema from '../models/userModel.js';
import { getTenantDB } from '../tenantdb.js';
import getAdminLogsModel from '../models/adminlogsModel.js';

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


export const addRequestExt = asyncHandler(async (req, res) => {
    try {
      const userId = mongoose.Types.ObjectId.createFromHexString(req.user.userId);
      const orgId = req.user.orgId;
      const { url, reason, reqOption } = req.body;
  
      if (!orgId) {
        return res.status(400).json({ message: "Organization ID is required." });
      }
  
      // ✅ Get the tenant-specific database connection for tenant models
      const tenantDb = await getTenantDB(orgId);
      if (!tenantDb) {
        return res.status(500).json({ message: "Failed to get tenant database." });
      }
  
      // ✅ Register tenant-specific models if not already registered
      if (!tenantDb.models.Url) tenantDb.model("Url", UrlSchema);
      if (!tenantDb.models.Request) tenantDb.model("Request", RequestSchema);
      if (!tenantDb.models.User) tenantDb.model("User", UserSchema);
  
      // ✅ Get tenant-specific models
      const Url = tenantDb.models.Url;
      const Request = tenantDb.models.Request;
      const User = tenantDb.models.User;
  
      // ✅ Retrieve the DomainReputation model from the common (admin) database
      const DomainReputation = await getdomainRepModel();
  
      // ✅ Extract domain from URL
      const domain = new URL(url).hostname;
  
      // ✅ Check if domain reputation exists in the adminDB
      let existingReputation = await DomainReputation.findOne({ urlDomain: domain });
  
      if (!existingReputation) {
        // ✅ Check domain reputation using an external service (e.g., VirusTotal)
        const reputationResult = await checkDomainReputation(domain);
        const newDomainReputation = new DomainReputation({
          urlDomain: domain,
          reputationDetails: reputationResult.stats,
          reputationScore: reputationResult.reputation,
        });
        existingReputation = await newDomainReputation.save();
      }
  
      // ✅ Check if URL exists in the tenant database
      let existingUrl = await Url.findOne({ url, orgId });
  
      if (!existingUrl) {
        const newUrl = new Url({
          url: url,
          orgId: orgId,
          isVerified: false,
          isPhishing: false,
          reputationDetails: existingReputation.reputationDetails,
          reputationScore: existingReputation.reputationScore,
        });
  
        existingUrl = await newUrl.save();
        return res.status(404).json({
          message:
            "The URL you entered is not currently in our database. Please try again or contact support for assistance.",
        });
      }
  
      // ✅ Check if a request for this URL already exists (and is not already approved)
      const existingRequest = await Request.findOne({
        userId,
        url,
        orgId,
        status: { $ne: "approved" },
      });
  
      if (existingRequest) {
        return res.status(400).json({
          message: `You have already submitted a ${existingRequest.reqOption} request for this URL, pending approval.`,
        });
      }
  
      // ✅ Create a new request
      const newRequest = new Request({
        userId,
        url,
        reason,
        orgId,
        reqOption,
        reputationDetails: existingReputation.reputationDetails,
        reputationScore: existingReputation.reputationScore,
      });
  
      await newRequest.save();
  
      // ✅ Update URL with the new request ID
      existingUrl.RequestIds = existingUrl.RequestIds || [];
      existingUrl.RequestIds.push(newRequest._id);
      await existingUrl.save();
  
      // ✅ Emit WebSocket event for real-time updates (if applicable)
      const io = req.app.get("socketio");
      if (io) {
        io.emit("newReqAdded", newRequest);
      }
  
      // ✅ Respond with success and details
      res.status(201).json({
        message: "Request submitted successfully",
        request: newRequest,
        reputation: {
          stats: existingReputation.reputationDetails,
          reputationScore: existingReputation.reputationScore,
        },
      });
    } catch (error) {
      console.error("❌ Error in addRequestExt:", error.message);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
  

export const fetchReqs = asyncHandler(async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;
        const search = req.query.search || "";
        const status = req.query.status || "all";

        const orgId = req.user.orgId;

        if (!orgId) {
            return res.status(400).json({ message: "Organization ID is required." });
        }

        // ✅ Get the tenant-specific database connection
        const tenantDb = await getTenantDB(orgId);
        if (!tenantDb) {
            return res.status(500).json({ message: "Failed to get tenant database." });
        }

        // ✅ Register models dynamically in tenant DB if not already registered
        if (!tenantDb.models.Request) tenantDb.model("Request", RequestSchema);
        if (!tenantDb.models.User) tenantDb.model("User", UserSchema);

        // ✅ Get models
        const Request = tenantDb.models.Request;
        const User = tenantDb.models.User;

        // ✅ Build search filter
        const searchFilter = search ? {
            $or: [
                { url: { $regex: search, $options: "i" } },
                { reason: { $regex: search, $options: "i" } },
                { "userDetails.name": { $regex: search, $options: "i" } },
                { "userDetails.email": { $regex: search, $options: "i" } },
            ],
        } : {};

        // ✅ Build status filter
        const statusFilter = status === "all" ? {} : { status };

        // ✅ Aggregate Requests with User Details
        const Requests = await Request.aggregate([
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
            {
                $project: {
                    _id: 1,
                    url: 1,
                    reason: 1,
                    reqOption: 1,
                    status: 1,
                    createdAt: 1,
                    "userDetails.name": 1,
                    "userDetails.email": 1,
                    reputationDetails: 1, // Include VirusTotal reputation details
                    reputationScore: 1, // Include VirusTotal reputation score
                },
            },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
        ]);

        // ✅ Count total requests for pagination
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

        // ✅ Send response
        res.status(200).json({
            data: Requests,
            currentPage: page,
            totalPages: Math.ceil(totalReqs / limit),
            totalReqs,
        });

    } catch (error) {
        console.error("❌ Error in fetchReqs:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

export const approveRequest = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const orgId = req.user.orgId;

        if (!orgId) {
            return res.status(400).json({ message: "Organization ID is required." });
        }

        // ✅ Get the tenant-specific database connection
        const tenantDb = await getTenantDB(orgId);
        if (!tenantDb) {
            return res.status(500).json({ message: "Failed to get tenant database." });
        }

        // ✅ Register models dynamically in tenant DB
        if (!tenantDb.models.Request) tenantDb.model("Request", RequestSchema);
        if (!tenantDb.models.Url) tenantDb.model("Url", UrlSchema);
        if (!tenantDb.models.User) tenantDb.model("User", UserSchema);

        // ✅ Get models
        const Request = tenantDb.models.Request;
        const Url = tenantDb.models.Url;
        const User = tenantDb.models.User;
        const AdminLogs = getAdminLogsModel(tenantDb); // ✅ Fetch tenant-specific AdminLogs model

        // ✅ Find the request in the tenant database
        const requestData = await Request.findById(id);
        if (!requestData) {
            return res.status(404).json({ message: "Request not found" });
        }

        // ✅ Determine request type (whitelist/blacklist)
        let reqStatus, isPhished;
        if (requestData.reqOption === "blacklist") {
            reqStatus = "blacklisted";
            isPhished = true;
        } else if (requestData.reqOption === "whitelist") {
            reqStatus = "whitelisted";
            isPhished = false;
        } else {
            return res.status(400).json({ message: "Invalid request option" });
        }

        // ✅ Update all related requests for the same URL & orgId
        await Request.updateMany(
            { url: requestData.url, orgId },
            { status: "approved", reqOption: requestData.reqOption }
        );

        // ✅ Find or update URL entry in the tenant database
        let url = await Url.findOne({ url: requestData.url, orgId });
        if (!url) {
            return res.status(404).json({ message: "URL not found in the database" });
        } else {
            url.isUserAdded = true;
            url.isVerified = true;
            url.isPhishing = isPhished;
            url.status = reqStatus;
            await url.save();
        }

        // ✅ Fetch updated request details (with user info)
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

        // ✅ Emit WebSocket event for frontend updates
        const io = req.app.get("socketio");
        io.emit("reqUpdated", updatedRequestData[0]);

        // ✅ Log the approval in AdminLogs
        await AdminLogs.create({
            userId,
            operationType: "approved",
            operationsPerformed: `Request Approved: ${id}`,
            orgId,
            entityId: id,
            entityType: "whitelistReq",
            entityDetails: {
                identifier: requestData.url,
                status: reqStatus,
                user: requestData.userId.toString(),
                extraInfo: `Reason: ${requestData.reason}`
            }
        });

        // ✅ Send success response
        res.status(200).json({
            message: "Request approved and URL updated",
            updatedRequestData: updatedRequestData[0]
        });

    } catch (error) {
        console.error("❌ Error in approveRequest:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});


export const deleteRequest = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const orgId = req.user.orgId;

        if (!orgId) {
            return res.status(400).json({ message: "Organization ID is required." });
        }

        // ✅ Get the tenant-specific database connection
        const tenantDb = await getTenantDB(orgId);
        if (!tenantDb) {
            return res.status(500).json({ message: "Failed to get tenant database." });
        }

        // ✅ Register models dynamically in tenant DB
        if (!tenantDb.models.Request) tenantDb.model("Request", RequestSchema);
        if (!tenantDb.models.Url) tenantDb.model("Url", UrlSchema);

        // ✅ Get models for the specific tenant
        const Request = tenantDb.models.Request;
        const Url = tenantDb.models.Url;
        const AdminLogs = getAdminLogsModel(tenantDb); // ✅ Get tenant-specific AdminLogs model

        // ✅ Find the request in the tenant's database
        const requestData = await Request.findById(id);
        if (!requestData) {
            return res.status(404).json({ message: "Request not found" });
        }

        const { url } = requestData;

        // ✅ Find the associated URL entry in the tenant database
        const existingUrl = await Url.findOne({ url, orgId });

        if (existingUrl) {
            // ✅ Remove request ID from URL document (if it exists)
            existingUrl.RequestIds = existingUrl.RequestIds.filter(
                (requestId) => requestId.toString() !== id
            );
            await existingUrl.save();
        }

        // ✅ Delete the request from the database
        await Request.findByIdAndDelete(id);

        // ✅ Emit WebSocket event for real-time update
        const io = req.app.get("socketio");
        io.emit("reqDeleted", id);

        // ✅ Log the deletion in AdminLogs
        await AdminLogs.create({
            userId,
            operationType: "delete",
            operationsPerformed: `Request deleted: ${id}`,
            orgId,
            entityId: id,
            entityType: "Request",
            entityDetails: {
                from: requestData.userId,
                identifier: requestData.url,
                status: requestData.status,
                extraInfo: `Reason: ${requestData.reason}`
            }
        });

        // ✅ Send success response
        res.status(200).json({ message: "Request deleted successfully", requestId: id });

    } catch (error) {
        console.error("❌ Error deleting request:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

