const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser,
  loginUser
} = require('../controllers/userController');

// Define routes
router.get('/', getAllUsers);
router.post('/', createUser);
router.get('/:id', getUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
router.post('/login/:orgId', loginUser);

module.exports = router;
