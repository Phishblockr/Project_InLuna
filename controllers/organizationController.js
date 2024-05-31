const Organization = require('../models/organisationModel');
const winston = require("winston");
const asyncHandler = require('../middlewares/asyncHandler');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' })
  ]
});

const getAllOrganizations = asyncHandler(async (req, res) => {
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
});

const createOrganization = asyncHandler(async (req, res) => {
  const newOrg = new Organization(req.body);
  await newOrg.save();
  res.status(201).json(newOrg);
});

const getOrganization = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const org = await Organization.findOne({ orgId: id });
  res.status(org ? 200 : 404).json(org ? org : { error: 'Organization not found' });
});

const deleteOrganization = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const org = await Organization.findOneAndDelete({ orgId: id });
  res.status(org ? 200 : 404).json(org ? { message: `Organization ${org.name} removed successfully` } : { error: 'Organization not found' });
});

const updateOrganization = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updatedOrg = await Organization.findOneAndUpdate(
    { orgId: id },
    req.body,
    { new: true, runValidators: true }
  );
  res.status(updatedOrg ? 200 : 404).json(updatedOrg ? updatedOrg : { error: 'Organization not found' });
});

const searchOrganizations = asyncHandler(async (req, res) => {
  const { name, adminName } = req.query;
  const query = {};
  if (name) query.name = { $regex: name, $options: 'i' };
  if (adminName) query.adminName = { $regex: adminName, $options: 'i' };
  const orgs = await Organization.find(query);
  res.status(orgs.length > 0 ? 200 : 404).json(orgs.length > 0 ? orgs : { error: 'Organizations not found' });
});

const getOrganizationsByAdmin = asyncHandler(async (req, res) => {
  const { adminName } = req.params;
  const orgs = await Organization.find({ adminName });
  res.status(orgs.length > 0 ? 200 : 404).json(orgs.length > 0 ? orgs : { error: `No organizations found for admin ${adminName}` });
});

const aggregateStatistics = asyncHandler(async (req, res) => {
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
});

module.exports = {
  getAllOrganizations,
  createOrganization,
  getOrganization,
  deleteOrganization,
  updateOrganization,
  searchOrganizations,
  getOrganizationsByAdmin,
  aggregateStatistics
};
