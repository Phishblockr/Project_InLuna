import WhitelistReq from '../models/whitelistReqModel.js';
import mongoose from 'mongoose';


export const addWhitelistReqExt = async (req, res) => {
    try {
        const userId = mongoose.Types.ObjectId.createFromHexString(req.user.userId);
        const orgId = parseInt(req.user.orgId);

        const { url, reason } = req.body;
        const newWhitelistReq = new WhitelistReq({
            userId,
            url,
            reason,
            orgId,
        });
        await newWhitelistReq.save();
        res.status(201).send(newWhitelistReq);
    } catch (error) {
        res.status(400).send(error.message);
    }
};
