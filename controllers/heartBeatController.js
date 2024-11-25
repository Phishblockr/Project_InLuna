import mongoose from "mongoose";
import HeartBeat from "../models/heartBeatModel.js";
import dotenv from 'dotenv';
dotenv.config();

export const saveHeartBeat = async (req, res) => {
    try {
        const userId = req.user.userId;
        const orgId = req.user.orgId;
        const { status, oldTimestamp, newTimestamp, duration, reason } = req.body;

        if (!oldTimestamp || !newTimestamp) {
            return res.status(400).json({ error: "Both old and new timestamps are required." });
        }

        const oldTime = new Date(oldTimestamp);
        const newTime = new Date(newTimestamp);

        if (isNaN(oldTime.getTime()) || isNaN(newTime.getTime())) {
            return res.status(400).json({ error: "Invalid timestamps provided." });
        }

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


        const io = req.app.get("socketio");
        io.emit("heartBeat pulsing", updatedHeartBeat);

        return res.status(200).json({ heartBeat: updatedHeartBeat });
    } catch (error) {
        console.error("Error saving heartbeat: ", error);
        return res.status(500).json({ error: "Error saving heartbeat" });
    }
};

export const fetchHeartBeat = async (req, res) => {
    try {
        const { userId } = req.params;

        const heartBeatData = await HeartBeat.findOne({ userId });
        if (!heartBeatData) {
            return res.status(400).json({ error: "Invalid HeartBeat" })
        }

        const INACTIVITY_THRESHOLD = 2 * 24 * 60 * 60 * 1000; // 2 days in miliseconds
        const cutoffDate = new Date(Date.now() - INACTIVITY_THRESHOLD)

        if (heartBeatData.timestamp < cutoffDate && heartBeatData.status !== "inactive") {
            heartBeatData.status = "inactive";
            await heartBeatData.save();
        }

        // Check if downtime occurred today
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);

        const hasDowntimeToday = heartBeatData.downtime.some(
            (dt) => dt.newTimestamp >= startOfToday && dt.newTimestamp <= endOfToday
        );

        // Determine the current status
        let status = "active";
        if (hasDowntimeToday) {
            status = "Downtime Detected";
        } else if (heartBeatData.timestamp < cutoffDate && heartBeatData.status !== "inactive") {
            status = "inactive";
            heartBeatData.status = "inactive"; // Update the status in the database
            await heartBeatData.save();
        } else {
            status = "active";
        }

        const sortedDowntime = heartBeatData.downtime.sort((a, b) => b.newTimestamp - a.newTimestamp);

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
        console.error("Error fetching heartbeat: ", error);
        return res.status(500).json({ error: "Error fetching heartbeat" });
    }
};