const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const { MailtrapTransport } = require("mailtrap");

// mu modules
const dotenv = require("../dotenv");
dotenv;

// importing my models
const User = require("../models/user");

const TOKEN = "45e5600500c65c3d4c522c0d7f920723";
const transporter = nodemailer.createTransport(
  MailtrapTransport({
    token: TOKEN,
  })
);

// signup handlers
module.exports.getSignUp = (req, res, next) => {
  res.status(200).render("auth-views/signup", {
    error: null,
    prevInput: null,
    isAuthenticated: req.isAuthenticated(),
  });
};

module.exports.postSignUp = async (req, res, next) => {
  const userFirstName = req.body.fname;
  const userLastName = req.body.lname;
  const userEmail = req.body.useremail;
  const userPictureUrl = !req.file ? null : req.file.path.replace("\\", "/");
  const userPassword = req.body.pw;

  const { errors } = validationResult(req);
  const emailExists = await User.findOne({ email: userEmail.toLowerCase() });

  if (errors.length > 0 || !req.file || emailExists) {
    let inputErrors = errors.map((e) => e.msg);
    if (req.file || emailExists) {
      fs.unlink(
        path.join("./", "uploads", "profiles", req.file.filename),
        (err) => {
          if (err) {
            return next(err);
          }
          //   console.log("deleted");
        }
      );
      if (emailExists) {
        inputErrors.push("Email exists already enter a new email");
      }
    } else {
      inputErrors.push("Enter a valid image file");
    }

    return res.status(422).render("auth-views/signup", {
      error: inputErrors,
      prevInput: {
        userFirstName,
        userLastName,
        userEmail,
      },
      isAuthenticated: req.isAuthenticated(),
    });
  }

  // if no errors in the input data
  try {
    bcrypt.hash(userPassword, 12, async (err, hashedPassword) => {
      if (err) {
        return next(err);
      }
      const newUser = new User({
        firstName: userFirstName,
        lastName: userLastName,
        email: userEmail,
        profilePictureUrl: userPictureUrl,
        password: hashedPassword,
      });
      await newUser.save();
      transporter.sendMail(
        {
          from: "mailtrap@devfaruqayo.com",
          to: userEmail,
          subject: "Welcome 🌍!",
          html: "<h1>Welcome to globlogs😀</h1>",
        },
        (err) => {
          if (err) {
            console.log(err);
            return;
          }
        }
      );
      res.redirect("/auth/login");
    });
  } catch (error) {
    next(error);
  }
};

// login handlers
module.exports.getLogIn = (req, res, next) => {
  res
    .status(200)
    .render("auth-views/login", {
      error: null,
      prevInput: null,
      isAuthenticated: req.isAuthenticated(),
    });
};

module.exports.getForgotPassword = async (req, res, next) => {
  res
    .status(200)
    .render("auth-views/email", { isAuthenticated: req.isAuthenticated() });
};

module.exports.postForgotPassword = async (req, res, next) => {
  const userEmail = req.body.useremail;
  try {
    const findUser = await User.findOne({ email: userEmail });
    if (findUser) {
      const generatedToken = crypto.randomBytes(16).toString("hex");
      findUser.token = generatedToken;
      findUser.tokenExp = Date.now() + 1000 * 60 * 60;
      await findUser.save();
      transporter.sendMail(
        {
          from: "mailtrap@devfaruqayo.com",
          to: userEmail,
          subject: "Change Password",
          html: `<a href='http://localhost:3000/admin/change/password/${generatedToken}'>Change Password</a>`,
        },
        (err) => {
          if (err) {
            console.log(err);
            return;
          }
        }
      );
    }
    res
      .status(200)
      .send(
        `<p>Change password through the link sent to your email</p> <a href='http://localhost:3000/auth/login>Change Password</a>`
      );
  } catch (error) {
    next(error);
  }
};
