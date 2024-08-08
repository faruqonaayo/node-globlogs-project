const fs = require("fs");

const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");

// importing my models
const User = require("../models/user");
const Location = require("../models/location");

module.exports.getProfile = (req, res, next) => {
  if (req.isAuthenticated()) {
    return res.status(200).render("admin-views/profile", { user: req.user });
  }
  res.redirect("/auth/login");
};

// changing password
module.exports.getChangePassword = (req, res, next) => {
  if (req.isAuthenticated()) {
    return res.status(200).render("admin-views/password-change", {
      user: req.user,
      error: null,
      prevInput: null,
    });
  }
  return res.redirect("/auth/login");
};

module.exports.postChangePassword = async (req, res, next) => {
  const userEmail = req.body.useremail;
  const userPassword = req.body.pw;

  const { errors } = validationResult(req);

  if (errors.length > 0) {
    let inputErrors = errors.map((e) => e.msg);
    return res.status(422).render("admin-views/password-change", {
      error: inputErrors,
      prevInput: { userEmail },
    });
  }
  bcrypt.hash(userPassword, 12, async (err, hashedPassword) => {
    if (err) {
      return next(err);
    }
    try {
      const userToChange = await User.findOne({ email: userEmail });
      if (
        userToChange &&
        (req.user ||
          req.session.tempUser._id.toString() === userToChange._id.toString())
      ) {
        userToChange.password = hashedPassword;
        userToChange.token = null;
        userToChange.tokenExp = null;
        await userToChange.save();
        req.session.tempUser = null;
      }
      if (req.isAuthenticated()) {
        return res.redirect("/admin/profile");
      }
      return res.redirect("/auth/login");
    } catch (error) {
      next(error);
    }
  });
};

module.exports.getTokenChangePassword = async (req, res, next) => {
  const userToken = req.params.token;
  try {
    const userToChange = await User.findOne({
      token: userToken,
      tokenExp: { $gt: Date.now() },
    });
    if (userToChange) {
      req.session.tempUser = userToChange;
      return res.status(200).render("admin-views/password-change", {
        user: userToChange,
        error: null,
        prevInput: null,
      });
    }
    return res.redirect("/auth/login");
  } catch (error) {
    next(error);
  }
};

// adding location
module.exports.getAddLocation = (req, res, next) => {
  if (req.isAuthenticated()) {
    return res
      .status(200)
      .render("admin-views/location", { error: null, prevInput: null });
  }
  return res.redirect("/auth/login");
};
module.exports.postAddLocation = async (req, res, next) => {
  if (req.isAuthenticated()) {
    const userLocation = req.body.location;
    const userCountry = req.body.country;
    const userDescription = req.body.description;
    const locationPicturesUrls = !req.files
      ? null
      : req.files.map((file) => file.path.replace("\\", "/"));

    const { errors } = validationResult(req);
    if (errors.length > 0 || req.files.length === 0) {
      let inputErrors = errors.map((e) => e.msg);
      if (req.files.length > 0) {
        req.files.forEach((file) => {
          fs.unlink(
            path.join("./", "uploads", "locations", file.filename),
            (err) => {
              if (err) {
                return next(err);
              }
            }
          );
        });
      } else {
        inputErrors.push("Enter a valid image file");
      }
      return res.status(422).render("admin-views/location", {
        error: inputErrors,
        prevInput: { userLocation, userCountry, userDescription },
      });
    }
    try {
      const newLocation = new Location({
        location: userLocation,
        country: userCountry,
        description: userDescription,
        locationPicturesUrls: locationPicturesUrls,
        likes: 0,
        date: Date.now(),
        userId: req.user._id,
      });
      await newLocation.save();
      return res.redirect("/");
    } catch (error) {
      next(error);
    }
  }
  return res.redirect("/auth/login");
};

// liking location
module.exports.postLikePost = async (req, res, next) => {
  const postId = req.params.postId;
  try {
    const locationToEdit = await Location.findById(postId);
    if (req.isAuthenticated()) {
      locationToEdit.likes += 1;
      await locationToEdit.save();
      return res.status(200).json({ number: locationToEdit.likes });
    }
    return res.status(200).json({ number: locationToEdit.likes });
  } catch (error) {
    next(error);
  }
};

// getting location details
module.exports.getLocationDetails = async (req, res, next) => {
  if (req.isAuthenticated()) {
    const postId = req.params.postId;
    try {
      const locationDetails = await Location.findById(postId);
      return res
        .status(200)
        .render("admin-views/location-details", { location: locationDetails });
    } catch (error) {
      next(error);
    }
  }
  return res.redirect("/auth/login");
};
