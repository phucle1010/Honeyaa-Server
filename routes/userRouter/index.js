const express = require('express');
const router = express.Router();

const userController = require('../../controller/userController');

router.get('/data', userController.handleGetUserData);
router.post('/signup', userController.handlePostUser);
router.post('/signout', userController.handleSignoutUser);
router.post('/myInterest/:personid/:data', userController.handlePostMyInterest);
router.get('/signup/phone', userController.handleCheckPhone);
router.get('/activate/:token', userController.handleAuthen);
router.get('/verifyPhone', userController.handleVerifyPhone);
router.get('/verifyOTP', userController.handleVerifyOTP);
router.post('/check_otp', userController.handleCheckOtp);
router.get('/toplike', userController.handleGetTopLike);
router.get('/sent/:personId', userController.handleGetSent);
router.get('/xlike/:personId', userController.handleGetXlike);
router.get('/profile/:personId', userController.handleGetProfileList);
router.get('/interest', userController.handleGetInterestList);
router.get('/myInterest/:personId', userController.handleGetMyInterest);
router.get('/relationship_oriented', userController.handleGetRelationshipOrientedList);
router.put('/myBasic/:myBasicId', userController.handleUpdateMyBasic);
router.put('/profile/:personId', userController.handlePutProfile);
router.post('/login', userController.handleLoginUser);
router.get('/profile/img/all', userController.handleGetImageOfUser);
router.get('/profile/img/reviews', userController.handleGetReviewImageOfUser);
router.get('/profile/img/avatar', userController.handleGetAvatarOfUser);
router.post('/profile/img/post', userController.handlePostImageIntoProfile);
router.delete('/profile/img/delete', userController.handleRemoveImageFromProfile);
router.delete('/sent/delete/:likeId', userController.handleDeleteSent);
router.get('/potential_love', userController.getPotentialLover);
router.get('/chat/:personId/:targetId', userController.handleGetChat);
router.get('/matchchat/:personId', userController.handleGetMatchChat);
router.post('/message/post', userController.handlePostMessage);

// discovery
router.get('/questions-answers', userController.getQuestionsAnswers);
router.post('/questions-answers/answers', userController.saveAnswers);

router.get('/', userController.handleGetUserDataList);

module.exports = router;
