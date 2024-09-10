import Url from '../models/urlModel.js';
import WhitelistReq from '../models/whitelistReqModel.js';
import mongoose from 'mongoose';


export const addWhitelistReqExt = async (req, res) => {
    try {
        const userId = mongoose.Types.ObjectId.createFromHexString(req.user.userId);
        const orgId = req.user.orgId;

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

export const approveWhitelistRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    // Find the whitelist request
    const whitelistRequest = await WhitelistReq.findById(requestId);
    if (!whitelistRequest) {
      return res.status(404).json({ message: "Whitelist request not found" });
    }

    // Update the status of the whitelist request to 'approved'
    whitelistRequest.status = 'approved';
    await whitelistRequest.save();

    // Check if the URL already exists in the URL collection
    let url = await Url.findOne({ url: whitelistRequest.url, orgId: whitelistRequest.orgId });

    if (!url) {
      // If the URL doesn't exist, create a new one and link the whitelist request ID
      url = new Url({
        url: whitelistRequest.url,
        orgId: whitelistRequest.orgId,
        isUserAdded: true,
        isVerified: true, // Assuming approval marks it as verified
        isPhishing: false, // Assuming approval means it’s not phishing
        whitelistReqId: whitelistRequest._id,
      });
      await url.save();
    } else {
      // If the URL exists, update it with the whitelist request ID
      url.whitelistReqId = whitelistRequest._id;
      url.isUserAdded = true;
      url.isVerified = true;
      url.isPhishing = false;
      await url.save();
    }

    res.json({ message: "Whitelist request approved and URL updated", url });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
