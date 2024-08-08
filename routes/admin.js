const path = require("path");

const express = require("express");
const multer = require("multer");
const { body } = require("express-validator");

const adminController = require("../controllers/admin");
const { fileStorage, fileFilter } = require("../util/multerConfig");

const router = express.Router();

// router using 3rd party middlewares
const upload = multer({
  storage: fileStorage(path.join("./", "uploads", "locations")),
  fileFilter: fileFilter,
});

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

const locationValidationArray = [
  body("location", "Location has to be a minimum of 2 characters").isLength({
    min: 2,
  }),
  body("country", "Country has to be a minimum of 2 characters").isLength({
    min: 2,
  }),
  body(
    "description",
    "Description has to be a minimum of 5 characters"
  ).isLength({
    min: 5,
  }),
];

router.post(
  "/add",
  upload.array("locationpics", 3),
  locationValidationArray,
  adminController.postAddLocation
);

// like
router.post("/like/:postId", adminController.postLikePost);

// view
router.get("/:postId", adminController.getLocationDetails);

module.exports = router;
