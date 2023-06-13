const userModel = require('../../model/userModel');
const nodemailer = require('nodemailer');

const handleGetUserData = (req, res) => {
    const token = req.query.token;
    userModel.getUser(token, res);
};

const handleGetUserDataList = (req, res) => {
    userModel.getUserList(req, res);
};

const handleGetRecommendationUserDataList = (req, res) => {
    const requestedUserId = req.query.user_id;
    userModel.getRecommendationUserDataList(requestedUserId, res);
};

const handlePostUser = (req, res) => {
    userModel.postUser(req, res);
};

const handleSignoutUser = (req, res) => {
    const token = req.body.token;
    userModel.signoutUser(token, res);
};

const handleCheckPhone = (req, res) => {
    const phonenumber = req.query;
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
    const phonenumber = req.body.phonenumber;
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
const handlePutProfile = (req, res) => {
    userModel.putProfile(req, res);
};
const handleGetImageOfUser = (req, res) => {
    const user_id = req.query.user_id;
    userModel.getImageOfUser(user_id, res);
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

const getPotentialLover = async (req, res) => {
    try {
        const {token} = req.query;
        const user = await userModel.getUserInfoByToken(token);
        if (!user.length) {
            return res.send({
                statusCode: 403,
                responseData: `user was not found!1`,
            });
        }
    
        const userInfo = user[0];
        console.log(userInfo);

        if (!userInfo) {
            return res.send({
                statusCode: 403,
                responseData: `user was not found!3`,
            });
        }
    
        const userPotentials = await userModel.potentialLover(userInfo);
        const userPotential = userPotentials[0];
        console.log(userPotential);
        if (!userPotential) {
            return res.send({
                statusCode: 403,
                responseData: `user was not found!4`,
            });
        }
            
        const images = await userModel.getImageByUserId(userPotential.id);
    
        const interests = await userModel.getMyInterestByUserId(userPotential.id);
        const approachObject = await userModel.getRelationshipOrientedByUserId(userPotential.id);
    
        let userPotentialLover = {
            id: userPotential.id,
            name: userPotential.full_name,
            dob: userPotential.dob,
            status: "Đang hoạt động",
            distance: 1,
            gender: userPotential.sex?userPotential.sex: null,
            img: images,
            hobbies: interests,
            introduction: userPotential.about_me,
            socialContact: null,
            approachObject: approachObject, 
        }
    
        if (userPotentialLover) {
            console.log(userPotentialLover);
            res.status(200).json(userPotentialLover);
        }
    } catch (error) {
        res.status(500).json("!!!");
    }
}

const checkOtp = (req, res) => {
    const {phone, otp} = req.body;
    console.log(req.body);

    if (!(phone && otp.length === 4)) return res.status(400).json('Something was wrong, please try again');
    else userModel.verifyOTP(phone, otp, res);
}
const getNotification = async (req, res) => {
    try {
        console.log(req.headers.authentication);
        const user = await userModel.getUserInfoByToken(req.headers.authentication);
        if (!user) return res.status(403).json('user was not found!');

        const result = await userModel.getNotification(user.id);
        console.log(result);
        return res.status(200).json(result);
        
    } catch (e) {
        console.log(e);
        return res.status(500).json({detail: e.message});
    }

}

module.exports = {
    handleGetUserData,
    handleGetUserDataList,
    handleGetRecommendationUserDataList,
    handlePostUser,
    handleSignoutUser,
    handleCheckPhone,
    handleAuthen,
    handleVerifyPhone,
    handleVerifyOTP,
    handleLoginUser,
    handleGetProfileList,
    handleUpdateMyBasic,
    handleGetInterestList,
    handleGetMyInterest,
    handlePostMyInterest,
    handleGetRelationshipOrientedList,
    handlePutProfile,
    handleGetImageOfUser,
    handleGetAvatarOfUser,
    handlePostImageIntoProfile,
    handleRemoveImageFromProfile,
    handleGetTopLike,
    getPotentialLover,
    checkOtp,
    getNotification,
};
