const userModel = require('../../model/userModel');
const nodemailer = require('nodemailer');

const handleGetUserData = (req, res) => {
    const token = req.query.token;
    userModel.getUser(token, res);
};

const handleGetUserDataList = (req, res) => {
    userModel.getUserList(req, res);
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

const handleGetImageOfUser = (req, res) => {
    const person_id = req.query.person_id;
    userModel.getImageOfUser(person_id, res);
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

module.exports = {
    handleGetUserData,
    handleGetUserDataList,
    handlePostUser,
    handleSignoutUser,
    handleCheckPhone,
    handleAuthen,
    handleVerifyPhone,
    handleVerifyOTP,
    handleLoginUser,
    handleGetImageOfUser,
    handlePostImageIntoProfile,
    handleRemoveImageFromProfile,
};
