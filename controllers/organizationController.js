import Organization from '../models/organisationModel.js';
import winston from 'winston';
import User from '../models/userModel.js';
import { getTenantDB } from '../tenantdb.js';
import { getTenantModel } from '../admindb.js';
import asyncHandler from '../middlewares/asyncHandler.js';

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' })
  ]
});

// Get all organizations
export const getAllOrganizations = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const orgs = await Organization.find()
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    const count = await Organization.countDocuments();
    res.status(orgs.length > 0 ? 200 : 404).json(orgs.length > 0 ? {
      orgs,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    } : { error: 'Organizations not found' });
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// Create a new organization
export const createOrganization = asyncHandler(async (req, res) => {
  try {
      const { orgId, name, adminName, totalUsers } = req.body;

      if (!orgId || !name || !adminName || !totalUsers) {
          return res.status(400).json({ error: "All organization details are required." });
      }

      // ✅ Get the Admin DB model (Organizations)
      const TenantModel = await getTenantModel();

      // ✅ Check if the organization already exists
      const existingOrg = await TenantModel.findOne({ orgId });
      if (existingOrg) {
          return res.status(400).json({ error: "Organization with this ID already exists." });
      }

      // ✅ Create a new organization in the Admin DB
      const newOrg = new TenantModel({ orgId, name, adminName, totalUsers });
      await newOrg.save();

      // ✅ Create a new tenant database for the organization
      const tenantDb = await getTenantDB(orgId);
      if (!tenantDb) {
          return res.status(500).json({ error: "Failed to create tenant database." });
      }

      // ✅ Initialize tenant-specific models (User, AdminLogs, HeartBeat)
      if (!tenantDb.models.User) {
          tenantDb.model("User", UserSchema);
      }
      if (!tenantDb.models.AdminLogs) {
          tenantDb.model("AdminLogs", AdminLogsSchema);
      }
      if (!tenantDb.models.HeartBeat) {
          tenantDb.model("HeartBeat", HeartBeatSchema);
      }

      res.status(201).json({ message: "Organization created successfully", organization: newOrg });
  } catch (error) {
      console.error("❌ Error creating organization:", error.message);
      res.status(500).json({ error: "Server error", details: error.message });
  }
});

// Get a single organization by ID
export const getOrganization = asyncHandler(async (req, res) => {
  try {
      const { id: orgId } = req.params;

      if (!orgId) {
          return res.status(400).json({ error: "Organization ID is required." });
      }

      // ✅ Get the Admin DB model (Organizations)
      const TenantModel = await getTenantModel();

      // ✅ Find the organization in the Admin DB
      const org = await TenantModel.findOne({ orgId });

      if (!org) {
          return res.status(404).json({ error: "Organization not found." });
      }

      res.status(200).json(org);
  } catch (error) {
      console.error("❌ Error fetching organization:", error.message);
      res.status(500).json({ error: "Server error", details: error.message });
  }
});


// Delete an organization
export const deleteOrganization = asyncHandler(async (req, res) => {
  try {
      const { id: orgId } = req.params;

      if (!orgId) {
          return res.status(400).json({ error: "Organization ID is required." });
      }

      // ✅ Get the Admin DB model (Organizations)
      const TenantModel = await getTenantModel();

      // ✅ Check if the organization exists in the Admin DB
      const org = await TenantModel.findOneAndDelete({ orgId });

      if (!org) {
          return res.status(404).json({ error: "Organization not found." });
      }

      // ✅ Remove the tenant database (Disconnect & Drop)
      const tenantConnection = mongoose.connections.find(conn => conn.name === `tenant-${orgId}`);

      if (tenantConnection) {
          await tenantConnection.dropDatabase(); // Delete the tenant database
          await tenantConnection.close(); // Close the connection
      }

      res.status(200).json({ message: `Organization ${org.name} removed successfully.` });
  } catch (error) {
      console.error("❌ Error deleting organization:", error.message);
      res.status(500).json({ error: "Server error", details: error.message });
  }
});


// Update an organization
export const updateOrganization = asyncHandler(async (req, res) => {
  try {
      const { id: orgId } = req.params;

      if (!orgId) {
          return res.status(400).json({ error: "Organization ID is required." });
      }

      // ✅ Get the Admin DB model (Organizations)
      const TenantModel = await getTenantModel();

      // ✅ Update organization in the Admin DB
      const updatedOrg = await TenantModel.findOneAndUpdate(
          { orgId },
          req.body,
          { new: true, runValidators: true }
      );

      if (!updatedOrg) {
          return res.status(404).json({ error: "Organization not found." });
      }

      res.status(200).json(updatedOrg);
  } catch (error) {
      console.error("❌ Error updating organization:", error.message);
      
      if (error.name === "ValidationError") {
          return res.status(400).json({ error: error.message });
      }

      res.status(500).json({ error: "Server error", details: error.message });
  }
});


// Search organizations
export const searchOrganizations = asyncHandler(async (req, res) => {
  try {
      const { name, adminName, page = 1, limit = 10 } = req.query;
      const query = {};

      if (name) query.name = { $regex: name, $options: "i" };
      if (adminName) query.adminName = { $regex: adminName, $options: "i" };

      // ✅ Get the Admin DB model (Organizations)
      const TenantModel = await getTenantModel();

      // ✅ Apply pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const orgs = await TenantModel.find(query).skip(skip).limit(parseInt(limit));
      const totalOrgs = await TenantModel.countDocuments(query);

      if (!orgs.length) {
          return res.status(404).json({ error: "Organizations not found." });
      }

      res.status(200).json({
          data: orgs,
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalOrgs / parseInt(limit)),
          totalOrganizations: totalOrgs,
      });
  } catch (error) {
      console.error("❌ Error searching organizations:", error.message);
      res.status(500).json({ error: "Server error", details: error.message });
  }
});
