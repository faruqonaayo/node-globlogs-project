const path = require("path");
const fs = require("fs");
const https = require("https");

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const passport = require("passport");
const { Strategy } = require("passport-local");
const bcrypt = require("bcrypt");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");

// my modules
const dotenv = require("./dotenv");
dotenv;

// importing my models
const User = require("./models/user");

// importing my routes
const authRoutes = require("./routes/auth");
const generalRoutes = require("./routes/general");
const adminRoutes = require("./routes/admin");

const app = express();
const PORT = process.env.PORT || 3000;
const DBURI =
  "mongodb+srv://faruq:64DYLRAyX9RpmVTA@cluster0.yse2dvd.mongodb.net/";

app.set("view engine", "ejs");
app.set("views", "views");

// app using 3rd party middlewares
const accessLogStream = fs.createWriteStream(
  path.join(__dirname, "access.log"),
  { flags: "a" }
);

app.use(helmet());
app.use(compression());
app.use(morgan("combined", { stream: accessLogStream }));
const store = new MongoDBStore(
  {
    uri: DBURI,
    databaseName: "globlogs",
    collection: "sessions",
  },
  (err) => {
    if (err) {
      console.log(err);
    }
  }
);

// const privateKey = fs.readFileSync("server.key");
// const certificate = fs.readFileSync("server.cert");

app.use(
  session({
    secret: "my secret",
    resave: false,
    saveUninitialized: true,
    store: store,
    cookie: { maxAge: 1000 * 60 },
  })
);
app.use(passport.session());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// using my routes as middleware
app.use(generalRoutes);
app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// error handling middleware
app.use((req, res, next) => {
  res.status(404).render("error-views/404");
});
app.use((error, req, res, next) => {
  console.log(error);
  next();
});
app.use((req, res, next) => {
  res.status(500).render("error-views/500");
});

passport.use(
  new Strategy("local", async function verify(username, password, cb) {
    try {
      const user = await User.findOne({ email: username });
      if (!user) {
        return cb(null, false);
      } else {
        bcrypt.compare(password, user.password, (err, result) => {
          if (err) {
            return cb(err);
          } else if (result) {
            return cb(null, user);
          } else {
            return cb(null, false);
          }
        });
      }
    } catch (error) {
      cb(error);
    }
  })
);
passport.serializeUser((user, cb) => {
  return cb(null, user);
});
passport.deserializeUser((user, cb) => {
  return cb(null, user);
});

app.listen(PORT, async () => {
  try {
    await mongoose.connect(DBURI, { dbName: "globlogs" });
    console.log("Connected to database");
    console.log(`Server is listening on port ${PORT}`);
  } catch (error) {
    console.log(error);
  }
});
