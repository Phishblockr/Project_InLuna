import Campaign from "../models/campaignModel.js";

// Get all campaigns
export const getAllCampaigns = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const status = req.query.status || "all";
    const timeFormat = req.query.timeFormat === "12" ? "12" : "24";
    const orgId = req.user.orgId;

    const searchFilter = search ? {
        $or: [
            { name: { $regex: search, $options: 'i' } },
            { groups: { $regex: search, $options: 'i' } },
            { department: { $regex: search, $options: 'i' } },
            { courses: { $regex: search, $options: 'i' } }
        ]
    } : {};

    const statusFilter = status === "all" ? {} : {
        status: { $regex: `^${status}$`, $options: "i" }
    };

    const queryFilter = { orgId, ...searchFilter, ...statusFilter };

    try {
        const campaigns = await Campaign.find(queryFilter).skip(skip).limit(limit);
        // Format the `startDate` and `endDate` fields
        const formattedCampaigns = campaigns.map((campaign) => ({
            ...campaign.toObject(),
            startDate: campaign.startDate ? formatDateTime(campaign.startDate, timeFormat) : null,
            endDate: campaign.endDate ? formatDateTime(campaign.endDate, timeFormat) : null,
        }));

        const totalcampaigns = await Campaign.countDocuments(queryFilter)
        res.status(200).json({ success: true, campaigns: formattedCampaigns, totalPages: Math.ceil(totalcampaigns / limit), totalcampaigns });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get a single campaign by ID
export const getCampaignById = async (req, res) => {
    const { id } = req.params;
    try {
        const campaign = await Campaign.findById(id);

        if (!campaign) {
            return res.status(404).json({ success: false, message: "Campaign not found" });
        }

        res.status(200).json({ success: true, data: campaign });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Add a new campaign
export const addCampaign = async (req, res) => {
    const orgId = req.user.orgId;
    const { name, date, groups, courses, status, startDate, endDate, category } = req.body;
    console.log({ name, date, groups, courses, status, startDate, endDate, category, orgId })

    try {
        const newCampaign = new Campaign({
            name,
            date,
            groups,
            courses,
            startDate,
            endDate,
            status,
            category,
            orgId
        });

        newData = await newCampaign.save();
        const io = req.app.get("socketio");
        io.emit("campaignCreated", newData);
        res.status(201).json({ success: true, message: "Campaign added successfully", data: newCampaign });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update an existing campaign
export const updateCampaign = async (req, res) => {
    const { id } = req.params;
    const updatedData = req.body;

    try {
        const campaign = await Campaign.findByIdAndUpdate(id, updatedData, { new: true });

        if (!campaign) {
            return res.status(404).json({ success: false, message: "Campaign not found" });
        }

        const io = req.app.get("socketio");
        io.emit("campaignUpdated", campaign);

        res.status(200).json({ success: true, message: "Campaign updated successfully", data: campaign });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete a campaign
export const deleteCampaign = async (req, res) => {
    const { id } = req.params;

    try {
        const campaign = await Campaign.findByIdAndDelete(id);

        if (!campaign) {
            return res.status(404).json({ success: false, message: "Campaign not found" });
        }

        const io = req.app.get("socketio");
        io.emit("campaignDeleted", id);

        res.status(200).json({ success: true, message: "Campaign deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Helper function to format date and time
const formatDateTime = (date, timeFormat) => {
    const d = new Date(date);
    const options = {
        hour: "2-digit",
        minute: "2-digit",
        hour12: timeFormat === "12", // Toggle 12-hour or 24-hour format
    };
    const time = d.toLocaleTimeString([], options);
    const formattedDate = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    return `${time} ${formattedDate}`;
};