const express = require('express');
const router = express.Router();

const userController = require('../../controller/userController');

router.post('/register', userController.handleRegister)
router.get('/', userController.handleGetUserData)

module.exports = router;
