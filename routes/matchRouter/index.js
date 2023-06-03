const express = require('express');
const router = express.Router();

const matchController = require('../../controller/matchController');

router.post('/interact', matchController.handlePostInteract);

module.exports = router;
