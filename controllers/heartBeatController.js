import mongoose from "mongoose";
import HeartBeatSchema from "../models/heartBeatModel.js";
import dotenv from 'dotenv';
import asyncHandler from "../middlewares/asyncHandler.js";
import { getTenantDB } from "../tenantdb.js";
dotenv.config();

export const saveHeartBeat = asyncHandler(async (req, res) => {
    try {
        const { userId, orgId } = req.user;
        const { status, oldTimestamp, newTimestamp, duration, reason } = req.body;

        if (!orgId) {
            return res.status(400).json({ error: "Organization ID is required." });
        }

        if (!oldTimestamp || !newTimestamp) {
            return res.status(400).json({ error: "Both old and new timestamps are required." });
        }

        const oldTime = new Date(oldTimestamp);
        const newTime = new Date(newTimestamp);

        if (isNaN(oldTime.getTime()) || isNaN(newTime.getTime())) {
            return res.status(400).json({ error: "Invalid timestamps provided." });
        }

        // ✅ Get the tenant-specific database
        const tenantDb = await getTenantDB(orgId);
        if (!tenantDb) {
            return res.status(500).json({ error: "Failed to connect to tenant database." });
        }

        // ✅ Ensure HeartBeat model is registered correctly
        const HeartBeat = tenantDb.models.HeartBeat || tenantDb.model("HeartBeat", HeartBeatSchema);

        // ✅ Update or insert heartbeat entry for the user in the tenant DB
        const updatedHeartBeat = await HeartBeat.findOneAndUpdate(
            { userId, orgId },
            {
                $set: { status: status || "active", timestamp: newTime },
                $push: reason
                    ? {
                        downtime: {
                            oldTimestamp: oldTime,
                            newTimestamp: newTime,
                            duration,
                            reason,
                        },
                    }
                    : {},
            },
            { upsert: true, new: true }
        );

        // ✅ Emit heartbeat event via WebSockets (if available)
        const io = req.app.get("socketio");
        if (io) {
            io.emit("heartBeatPulsing", updatedHeartBeat);
        }

        return res.status(200).json({ heartBeat: updatedHeartBeat });
    } catch (error) {
        console.error("❌ Error saving heartbeat:", error);
        return res.status(500).json({ error: "Error saving heartbeat" });
    }
});

export const fetchHeartBeat = asyncHandler(async (req, res) => {
    try {
        const { userId } = req.params;
        const { orgId } = req.user; // ✅ Extract orgId from authenticated user

        if (!orgId) {
            return res.status(400).json({ error: "Organization ID is required." });
        }

        // ✅ Get the tenant-specific database
        const tenantDb = await getTenantDB(orgId);
        if (!tenantDb) {
            return res.status(500).json({ error: "Failed to connect to tenant database." });
        }

        // ✅ Ensure HeartBeat model is registered correctly
        const HeartBeat = tenantDb.models.HeartBeat || tenantDb.model("HeartBeat", HeartBeatSchema);

        // ✅ Find heartbeat data for the user
        const heartBeatData = await HeartBeat.findOne({ userId, orgId });

        if (!heartBeatData) {
            return res.status(404).json({ error: "HeartBeat record not found" });
        }

        // ✅ Inactivity threshold (2 days)
        const INACTIVITY_THRESHOLD = 2 * 24 * 60 * 60 * 1000;
        const cutoffDate = new Date(Date.now() - INACTIVITY_THRESHOLD);

        // ✅ Update status if inactive
        if (heartBeatData.timestamp < cutoffDate && heartBeatData.status !== "inactive") {
            heartBeatData.status = "inactive";
            await heartBeatData.save();
        }

        // ✅ Check if downtime occurred today
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);

        const hasDowntimeToday = heartBeatData.downtime.some(
            (dt) => dt.newTimestamp >= startOfToday && dt.newTimestamp <= endOfToday
        );

        // ✅ Determine the current status
        let status = "active";
        if (hasDowntimeToday) {
            status = "Downtime Detected";
        } else if (heartBeatData.timestamp < cutoffDate) {
            status = "inactive";
        }

        // ✅ Sort downtime records (newest first)
        const sortedDowntime = heartBeatData.downtime.sort((a, b) => b.newTimestamp - a.newTimestamp);

        // ✅ Format downtime duration
        const formattedDowntime = sortedDowntime.map((dt) => {
            const durationInMs = dt.duration;
            const hours = Math.floor(durationInMs / (1000 * 60 * 60));
            const minutes = Math.floor((durationInMs % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((durationInMs % (1000 * 60)) / 1000);

            return {
                oldTimestamp: dt.oldTimestamp,
                newTimestamp: dt.newTimestamp,
                reason: dt.reason,
                duration: `${hours}:${minutes}:${seconds}`,
            };
        });

        return res.status(200).json({
            userId: heartBeatData.userId,
            orgId: heartBeatData.orgId,
            status,
            timestamp: heartBeatData.timestamp,
            downtime: formattedDowntime, 
        });
    } catch (error) {
        console.error("❌ Error fetching heartbeat:", error);
        return res.status(500).json({ error: "Error fetching heartbeat" });
    }
});
