import mongoose from "mongoose";
import HeartBeat from "../models/heartBeatModel.js";
import dotenv from 'dotenv';
dotenv.config();

export const saveHeartBeat = async (req, res) => {
    try{
        const userId = req.user.userId;
        const orgId = req.user.orgId;
        let {status, timestamp} = req.body;
        timestamp = timestamp || Date.now();
        const heartBeat = await HeartBeat.findOneAndUpdate(
            {userId, orgId},
            {status, timestamp},
            {new: true, upsert: true}
        );

        const io = req.app.get("socketio");
        io.emit("heartBeat pulsing", heartBeat);

        return res.status(200).json({heartBeat});

    } catch (error) {
        console.error("Error saving heartbeat: ", error);
        return res.status(500).json({ error: "Error saving heartbeat" });
    }
};

export const fetchHeartBeat = async (req, res) => {
    try{
        const userId = req.user.userId;
        const orgId = req.user.orgId;

        const heartBeatData = await HeartBeat.findOne({userId, orgId});
        if(!heartBeatData){
            res.status(400).json({error: "Invalid HeartBeat"})
        } else {
            res.status(200).json({heartBeatData});
        }
    } catch (error) {
        console.error("Error fetching heartbeat: ", error);
        return res.status(500).json({ error: "Error fetching heartbeat" });
    }
}