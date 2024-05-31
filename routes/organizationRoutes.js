const express = require('express');
const router = express.Router();
const {
  getAllOrganizations,
  createOrganization,
  getOrganization,
  deleteOrganization,
  updateOrganization,
  searchOrganizations,
  getOrganizationsByAdmin,
  aggregateStatistics
} = require('../controllers/organizationController');

router.get('/all', getAllOrganizations);
router.post('/', createOrganization);
router.get('/search', searchOrganizations);
router.get('/admin/:adminName', getOrganizationsByAdmin);
router.get('/stats/aggregate', aggregateStatistics);
router.get('/:id', getOrganization);
router.delete('/:id', deleteOrganization);
router.put('/:id', updateOrganization);

module.exports = router;
