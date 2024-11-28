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
router.get("/", getAllCampaigns);

// GET a single campaign by ID
router.get("/:id", getCampaignById);

// POST a new campaign
router.post("/", addCampaign);

// PUT update a campaign
router.put("/:id", updateCampaign);

// DELETE a campaign
router.delete("/:id", deleteCampaign);

export default router;
