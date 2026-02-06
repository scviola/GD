const express = require('express');
const router = express.Router();

const { protect, restrictTo } = require('../middleware/authMiddleware');
const { getUsers, getUser, updateUser, deleteUser, getMe, updateMe } = require('../controllers/userController');


// USERS
// logged-in user(self)
router.get("/users/me", protect, getMe);
router.put("/users/me", protect, updateMe);

//user mgt
router.get("/users", protect, restrictTo("admin"), getUsers);
router.get("/users/:id", protect, restrictTo("admin"), getUser);
router.put("/users/:id", protect, restrictTo("admin"), updateUser);
router.delete("/users/:id", protect, restrictTo("admin"), deleteUser);


module.exports = router;