import Organization from '../models/organisationModel.js';
import winston from 'winston';
import User from '../models/userModel.js';

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
export const createOrganization = async (req, res) => {
  try {
    const newOrg = new Organization(req.body);
    await newOrg.save();
    res.status(201).json(newOrg);
  } catch (error) {
    logger.error(error.message);
    if (error.name === 'ValidationError') {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Server error' });
    }
  }
};

// Get a single organization by ID
export const getOrganization = async (req, res) => {
  try {
    const { id } = req.params;
    const org = await Organization.findOne({ orgId: id });
    res.status(org ? 200 : 404).json(org ? org : { error: 'Organization not found' });
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete an organization
export const deleteOrganization = async (req, res) => {
  try {
    const { id } = req.params;
    const org = await Organization.findOneAndDelete({ orgId: id });
    res.status(org ? 200 : 404).json(org ? { message: `Organization ${org.name} removed successfully` } : { error: 'Organization not found' });
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update an organization
export const updateOrganization = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedOrg = await Organization.findOneAndUpdate(
      { orgId: id },
      req.body,
      { new: true, runValidators: true }
    );
    res.status(updatedOrg ? 200 : 404).json(updatedOrg ? updatedOrg : { error: 'Organization not found' });
  } catch (error) {
    logger.error(error.message);
    if (error.name === 'ValidationError') {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Server error' });
    }
  }
};

// Search organizations
export const searchOrganizations = async (req, res) => {
  try {
    const { name, adminName } = req.query;
    const query = {};
    if (name) query.name = { $regex: name, $options: 'i' };
    if (adminName) query.adminName = { $regex: adminName, $options: 'i' };
    const orgs = await Organization.find(query);
    res.status(orgs.length > 0 ? 200 : 404).json(orgs.length > 0 ? orgs : { error: 'Organizations not found' });
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get organizations by admin name
export const getOrganizationsByAdmin = async (req, res) => {
  try {
    const { adminName } = req.params;
    const orgs = await Organization.find({ adminName });
    res.status(orgs.length > 0 ? 200 : 404).json(orgs.length > 0 ? orgs : { error: `No organizations found for admin ${adminName}` });
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// Aggregate statistics
export const aggregateStatistics = async (req, res) => {
  try {
    const stats = await Organization.aggregate([
      {
        $group: {
          _id: null,
          totalPhishingLinksVisited: { $sum: '$statistics.phishingLinksVisited' },
          totalLinksWhitelisted: { $sum: '$statistics.linksWhitelisted' },
          totalBlacklistedLinksClicked: { $sum: '$statistics.blacklistedLinksClicked' },
          totalPhishingLinksBlocked: { $sum: '$statistics.phishingLinksBlocked' },
        }
      }
    ]);
    res.status(200).json(stats[0]);
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// Find all users with UUID
export const findUsersWithUuid = async (req, res) => {
  try {
    const { orgId } = req.params;
    console.log(orgId);
    const users = await User.find({ uuid: orgId });
    console.log(users);
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
