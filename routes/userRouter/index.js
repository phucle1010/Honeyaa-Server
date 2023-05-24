const express = require('express');
const router = express.Router();

const userController = require('../../controller/userController');

router.get('/', userController.handleGetUserDataList);
router.get('/data', userController.handleGetUserData);
router.post('/signup', userController.handlePostUser);
router.post('/signout', userController.handleSignoutUser);
router.get('/signup/phone', userController.handleCheckPhone);
router.get('/activate/:token', userController.handleAuthen);
router.get('/verifyPhone', userController.handleVerifyPhone);
router.get('/verifyOTP', userController.handleVerifyOTP);
router.post('/login', userController.handleLoginUser);
router.get('/profile/img', userController.handleGetImageOfUser);
router.post('/profile/img/post', userController.handlePostImageIntoProfile);
router.delete('/profile/img/delete', userController.handleRemoveImageFromProfile);

module.exports = router;
