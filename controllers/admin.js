const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");

// importing my models
const User = require("../models/user");

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
    return res.status(200).render("admin-views/location", { error: null });
  }
  return res.redirect("/auth/login");
};
