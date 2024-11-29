import Campaign from "../models/campaignModel.js";

// Get all campaigns
export const getAllCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find();
    res.status(200).json({ success: true, data: campaigns });
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
  const { name, date, groups, courses, startDate, endDate } = req.body;

  try {
    const newCampaign = new Campaign({
      name,
      date,
      groups,
      courses,
      startDate,
      endDate,
      status: "Scheduled", // default status
      statusColor: "bg-red-500", // default color
    });

    await newCampaign.save();
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

    res.status(200).json({ success: true, message: "Campaign deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
