const express = require("express");
const { body } = require("express-validator");

const adminController = require("../controllers/admin");

const router = express.Router();

router.get("/profile", adminController.getProfile);

const passswordValidationArray = [
  body("useremail", "Enter a valid email").trim().isEmail(),
  body(
    "pw",
    "Password is not strong enough. You need a minimum of 6 characters that must have at least a uppercase, a lower case, a number and a symbol"
  )
    .trim()
    .isStrongPassword({
      minLength: 6,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    }),
  body("confirmpw", "Password has to match").custom((value, { req }) => {
    if (value === req.body.pw) {
      return true;
    }
    return false;
  }),
];

// changing password
router.get("/change/password", adminController.getChangePassword);
router.post(
  "/change/password",
  passswordValidationArray,
  adminController.postChangePassword
);
router.get("/change/password/:token", adminController.getTokenChangePassword);

// adding a post
router.get("/add", adminController.getAddLocation);
module.exports = router;
