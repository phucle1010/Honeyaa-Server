const express = require('express');
const router = express.Router();

const userController = require('../../controller/userController');

// login, singup, signout, get user data
router.post('/login', userController.handleLoginUser);
router.post('/signup', userController.handlePostUser);
router.post('/signout', userController.handleSignoutUser);
router.get('/signup/phone', userController.handleCheckPhone);
router.get('/activate/:token', userController.handleAuthen);
router.get('/verifyPhone', userController.handleVerifyPhone);
router.get('/verifyOTP', userController.handleVerifyOTP);
router.post('/check_otp', userController.handleCheckOtp);
router.get('/data', userController.handleGetUserData);

// follow like
router.get('/toplike', userController.handleGetTopLike);
router.get('/sent/all/:personId', userController.handleGetSent);
router.get('/xlike/:personId', userController.handleGetXlike);
router.delete('/sent/delete/:likeId', userController.handleDeleteSent);

// post, put, get profile info
router.post('/myInterest/:personid/:data', userController.handlePostMyInterest);
router.get('/profile/:personId', userController.handleGetProfileList);
router.put('/profile/:personId', userController.handlePutProfile);
router.get('/interest', userController.handleGetInterestList);
router.get('/myInterest/:personId', userController.handleGetMyInterest);
router.get('/relationship_oriented', userController.handleGetRelationshipOrientedList);
router.put('/myBasic/:myBasicId', userController.handleUpdateMyBasic);
router.put('/setprofile/:personId', userController.handleSetProfile);
router.put('/profile/edit/password', userController.handlePutPassword);

// upload images
router.get('/profile/img/all', userController.handleGetImageOfUser);
router.get('/profile/img/reviews', userController.handleGetReviewImageOfUser);
router.get('/profile/img/avatar', userController.handleGetAvatarOfUser);
router.post('/profile/img/post', userController.handlePostImageIntoProfile);
router.delete('/profile/img/delete', userController.handleRemoveImageFromProfile);

// get potential user
router.get('/potential_love/main', userController.getPotentialLover);

// chat
router.get('/chat/:personId/:targetId', userController.handleGetChat);
router.get('/matchchat/:personId', userController.handleGetMatchChat);
router.post('/message/post', userController.handlePostMessage);

// notification
router.get('/notifications', userController.handleGetNotification);

// discovery
router.get('/questions-answers', userController.getQuestionsAnswers);
router.post('/questions-answers/answers', userController.saveAnswers);
router.get('/potential_love/discover', userController.getUserDiscover);

router.get('/', userController.handleGetUserDataList);

module.exports = router;
