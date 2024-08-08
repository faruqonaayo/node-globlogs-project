const express = require("express");

// my controllers
const generalController = require("../controllers/general");

const router = express.Router();

router.get("/", generalController.getIndex);

module.exports = router;
