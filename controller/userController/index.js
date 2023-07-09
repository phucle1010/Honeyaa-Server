const userModel = require('../../model/userModel');
const nodemailer = require('nodemailer');

const handleGetUserData = (req, res) => {
    const token = req.query.token;
    const device_id = req.query.device_id;
    userModel.getUser(token, device_id, res);
};

const handleGetUserDataList = (req, res) => {
    userModel.getUserList(req, res);
};

const handlePostUser = (req, res) => {
    userModel.postUser(req, res);
};

const handleSignoutUser = (req, res) => {
    const phone = req.body.phone;
    const device_id = req.body.device_id;
    userModel.signoutUser(phone, device_id, res);
};

const handleCheckPhone = (req, res) => {
    const phonenumber = req.query.phonenumber;
    if (phonenumber) {
        console.log(phonenumber);
        userModel.checkPhone(phonenumber, res);
    } else {
        res.status(400).send({
            message: 'Wrong phone number :(',
            phonenumber,
            data,
        });
    }
};

const handleAuthen = (req, res) => {
    const { token } = req.params;
    try {
        const decoded = jwt.verify(token, 'secret_key');
        const { email } = decoded;
        userModel.verifyAuthen(true, email, res);
    } catch (error) {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};

const handleVerifyPhone = (req, res) => {
    const phonenumber = req.query.phonenumber;
    if (phonenumber) {
        userModel.verifyPhone(phonenumber, res);
    } else {
        res.status(400).send({
            message: 'Wrong phone number :(',
            phonenumber: req.query.phonenumber,
            data,
        });
    }
};

const handleVerifyOTP = (req, res) => {
    const phonenumber = req.body.phonenumber;
    const code = req.body.code;
    if (phonenumber && code.length === 4) {
        userModel.verifyOTP(phonenumber, code, res);
    } else {
        res.status(400).send({
            message: 'Wrong phone number or code :(',
            phonenumber: req.query.phonenumber,
            data,
        });
    }
};

const handleCheckOtp = (req, res) => {
    const { phone, otp } = req.body;
    console.log(req.body);

    if (!(phone && otp.length === 4)) return res.status(400).json('Something was wrong, please try again');
    else userModel.verifyOTP(phone, otp, res);
};

const handleLoginUser = (req, res) => {
    if (req.body.phone === '' || req.body.pass === '') {
        res.send({
            statusCode: 400,
            responseData: 'Please fill all fields to login',
        });
    } else {
        userModel.loginUser(req, res);
    }
};
const handleGetProfileList = (req, res) => {
    userModel.getProfile(req, res);
};
const handleUpdateMyBasic = (req, res) => {
    userModel.updateMyBasic(req, res);
};
const handleGetInterestList = (req, res) => {
    userModel.getInterestList(req, res);
};
const handleGetMyInterest = (req, res) => {
    userModel.getMyInterest(req, res);
};
const handlePostMyInterest = (req, res) => {
    userModel.postMyInterest(req, res);
};
const handleGetRelationshipOrientedList = (req, res) => {
    userModel.getRelationshipOrientedList(req, res);
};
const handleSetProfile = (req, res) => {
    userModel.setProfile(req, res);
};
const handlePutPassword = async (req, res) => {
    const { current, new_pass, re_new, phone } = req.body;
    await userModel
        .checkCurrentPassword(current, phone)
        .then((result) => {
            if (result.statusCode === 400) {
                res.send(result);
            } else {
                if (new_pass !== re_new) {
                    res.send({
                        statusCode: 400,
                        responseData: 'Current password and re-new ones are not the same. Please try again.',
                    });
                } else {
                    userModel.putNewPassword(new_pass, phone, res);
                }
            }
        })
        .catch((err) => {
            res.send({
                statusCode: 400,
                responseData: err.toString(),
            });
        });
};
const handlePutProfile = (req, res) => {
    userModel.putProfile(req, res);
};
const handleGetImageOfUser = (req, res) => {
    const user_id = req.query.user_id;
    userModel.getImageOfUser(user_id, res);
};
const handleGetReviewImageOfUser = async (req, res) => {
    const result = await userModel.getImageByUserId(req.query.person_id);
    await res.send({
        statusCode: 200,
        responseData: result,
    });
};

const handleGetAvatarOfUser = (req, res) => {
    const user_id = req.query.user_id;
    userModel.getAvatarOfUser(user_id, res);
};

const handlePostImageIntoProfile = (req, res) => {
    const photo = req.body.insertPhoto;
    const person_id = req.body.person_id;
    userModel.postImageIntoProfile(photo, person_id, res);
};

const handleRemoveImageFromProfile = (req, res) => {
    const photo_id = req.query.id;
    const person_id = req.query.person_id;
    userModel.removeImageFromProfile(photo_id, person_id, res);
};

const handleGetTopLike = (req, res) => {
    userModel.getTopLike(req, res);
};
const handleGetSent = (req, res) => {
    userModel.getSent(req, res);
};
const handleDeleteSent = (req, res) => {
    userModel.deleteSent(req, res);
};
const handleGetXlike = (req, res) => {
    userModel.getXlike(req, res);
};
const handleGetChat = (req, res) => {
    userModel.getChat(req, res);
};

const handlePostMessage = (req, res) => {
    userModel.postMessage(req, res);
};
const handleGetMatchChat = (req, res) => {
    userModel.getMatchChat(req, res);
};

const getPotentialLover = async (req, res) => {
    try {
        const id = req.query.id;
        const sex_oriented = req.query.sex_oriented;

        const userPotentials = await userModel.potentialLover(id, sex_oriented);
        const userPotential = userPotentials[0];

        if (!userPotential) {
            return res.send({
                statusCode: 403,
                responseData: {},
            });
        }

        const images = await userModel.getImageByUserId(userPotential.id);

        const interests = await userModel.getMyInterestByUserId(userPotential.id);
        const approachObject = await userModel.getRelationshipOrientedByUserId(userPotential.id);

        let userPotentialLover = {
            id: userPotential.id,
            name: userPotential.full_name,
            dob: userPotential.dob,
            status: 'Đang hoạt động',
            distance: 1,
            gender: userPotential.sex ? userPotential.sex : null,
            img: images,
            hobbies: interests,
            introduction: userPotential.about_me,
            socialContact: null,
            approachObject: approachObject,
        };

        if (userPotentialLover) {
            // console.log('userPotentialLover: ', userPotentialLover);
            res.send({
                statusCode: 200,
                responseData: userPotentialLover,
            });
        }
    } catch (error) {
        res.status(500).json('!!!');
    }
};

module.exports = {
    handleGetUserData,
    handleGetUserDataList,
    handlePostUser,
    handleSignoutUser,
    handleCheckPhone,
    handleAuthen,
    handleVerifyPhone,
    handleVerifyOTP,
    handleCheckOtp,
    handleLoginUser,
    handleGetProfileList,
    handleUpdateMyBasic,
    handleGetInterestList,
    handleGetMyInterest,
    handlePostMyInterest,
    handleGetRelationshipOrientedList,
    handleSetProfile,
    handlePutPassword,
    handlePutProfile,
    handleGetImageOfUser,
    handleGetReviewImageOfUser,
    handleGetAvatarOfUser,
    handlePostImageIntoProfile,
    handleRemoveImageFromProfile,
    handleGetTopLike,
    handleGetChat,
    handlePostMessage,
    handleGetMatchChat,
    getPotentialLover,
    handleGetSent,
    handleGetXlike,
    handleDeleteSent,
};
