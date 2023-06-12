const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname);

        // if (ext !== '.pdf') {
        //     return cb(new Error('Only PDFs are allowed'));
        // }

        return cb(null, true);
    }
}).array('photo', 2);

const userController = require('../../controller/userController');

router.get('/recommendation', userController.handleGetRecommendationUserDataList);
router.get('/data', userController.handleGetUserData);
router.post('/signup', upload, userController.handlePostUser);
router.post('/signout', userController.handleSignoutUser);
router.post('/myInterest/:personid/:data', userController.handlePostMyInterest);
router.get('/signup/phone', userController.handleCheckPhone);
router.get('/activate/:token', userController.handleAuthen);
router.get('/verifyPhone', userController.handleVerifyPhone);
router.get('/verifyOTP', userController.handleVerifyOTP);
router.post('/check_otp', userController.checkOtp);
router.get('/toplike', userController.handleGetTopLike);
router.get('/profile/:personId', userController.handleGetProfileList);
router.get('/interest', userController.handleGetInterestList);
router.get('/myInterest/:personId', userController.handleGetMyInterest);
router.get('/relationship_oriented', userController.handleGetRelationshipOrientedList);
router.put('/myBasic/:myBasicId', userController.handleUpdateMyBasic);
router.put('/profile/:personId', userController.handlePutProfile);
router.post('/login', userController.handleLoginUser);
router.get('/profile/img/all', userController.handleGetImageOfUser);
router.get('/profile/img/avatar', userController.handleGetAvatarOfUser);
router.post('/profile/img/post', userController.handlePostImageIntoProfile);
router.delete('/profile/img/delete', userController.handleRemoveImageFromProfile);
router.get('/potential_love', userController.getPotentialLover);
router.get('/', userController.handleGetUserDataList);

module.exports = router;
