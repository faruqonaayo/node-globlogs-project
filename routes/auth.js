const path = require("path");

const express = require("express");
const multer = require("multer");
const { body } = require("express-validator");
const passport = require("passport");

const authController = require("../controllers/auth");
const { fileStorage, fileFilter } = require("../util/multerConfig");

// my models
const User = require("../models/user");

const router = express.Router();

// router using 3rd party middlewares
const upload = multer({
  storage: fileStorage(path.join("./", "uploads", "profiles")),
  fileFilter: fileFilter,
});

const signUpValidationArray = [
  body(
    "fname",
    "First name has to be alphabets only with a mininum length of 2"
  )
    .trim()
    .isAlpha()
    .isLength({ min: 2 }),
  body("lname", "Last name has to be alphabets only with a mininum length of 2")
    .trim()
    .isAlpha()
    .isLength({ min: 2 }),
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

router.get("/signup", authController.getSignUp);
router.post(
  "/signup",
  upload.single("profilepic"),
  signUpValidationArray,
  authController.postSignUp
);

// login
const logInValidationArray = [
  body("useremail", "Enter a valid email").trim().isEmail(),
];

router.get("/login", authController.getLogIn);
router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/auth/login",
  })
);

// forgot password
router.get("/forgot", authController.getForgotPassword);
router.post("/forgot", authController.postForgotPassword);

// logout
router.get("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

module.exports = router;
