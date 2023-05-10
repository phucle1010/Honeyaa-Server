const userModel = require('../../model/userModel')

const handleGetUserData = (req, res) => {
    userModel.getUser(req, res);
}

const handleRegister = (req, res) => {

}

module.exports = {
    handleGetUserData,
    handleRegister
}