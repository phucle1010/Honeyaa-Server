const express = require('express');
const router = express.Router();

const userController = require('../../controller/userController');

router.post('/login', userController.handleLoginUser);
router.post('/signup', userController.handlePostUser);
router.post('/signout', userController.handleSignoutUser);
router.get('/signup/phone', userController.handleCheckPhone);
router.get('/activate/:token', userController.handleAuthen);
router.get('/verifyPhone', userController.handleVerifyPhone);
router.get('/verifyOTP', userController.handleVerifyOTP);
router.get('/data', userController.handleGetUserData);
router.get('/', userController.handleGetUserDataList);

module.exports = router;
