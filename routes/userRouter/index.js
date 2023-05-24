const express = require('express');
const router = express.Router();

const userController = require('../../controller/userController');



router.post('/signup', userController.handlePostUser);
router.post('/signout', userController.handleSignoutUser);
router.post('/myinterest/:personid/:data', userController.handlePostMyInterest);
router.get('/signup/phone', userController.handleCheckPhone);
router.get('/activate/:token', userController.handleAuthen);
router.get('/verifyPhone', userController.handleVerifyPhone);
router.get('/verifyOTP', userController.handleVerifyOTP);

router.get('/data', userController.handleGetUserData);
router.get('/profile/:personId', userController.handleGetProfileList);
router.get('/interest', userController.handleGetInterestList);
router.get('/myInterest/:personId', userController.handleGetMyInterest);
router.get('/relationship_oriented', userController.handleGetRelationshipOrientedList);
router.get('/', userController.handleGetUserDataList);
router.put('/myBasic/:myBasicId', userController.handleUpdateMyBasic);
router.put('/profile/:personId', userController.handleUpdateMyBasic);
router.post('/login', userController.handleLoginUser);
router.get('/profile/img', userController.handleGetImageOfUser);
router.post('/profile/img/post', userController.handlePostImageIntoProfile);
router.delete('/profile/img/delete', userController.handleRemoveImageFromProfile);

module.exports = router;
