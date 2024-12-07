import express from "express";
import {
  getAllCampaigns,
  getCampaignById,
  addCampaign,
  updateCampaign,
  deleteCampaign,
} from "../controllers/campaignController.js";

const router = express.Router();

// GET all campaigns
router.get("/fetchAll", getAllCampaigns);

// GET a single campaign by ID
router.get("/fetch/:id", getCampaignById);

// POST a new campaign
router.post("/add", addCampaign);

// PUT update a campaign
router.put("/update/:id", updateCampaign);

// DELETE a campaign
router.delete("/delete/:id", deleteCampaign);

export default router;
