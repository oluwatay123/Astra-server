const express = require('express');
const router = express();

const {sendResponse} = require('../controllers/gemini.controller')


router.post("/send-response", sendResponse);

module.exports = router
