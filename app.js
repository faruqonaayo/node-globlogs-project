const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

// my modules
const dotenv = require("./dotenv");
dotenv;

// importing my routes
const authRoutes = require("./routes/auth");

const app = express();
const PORT = 3000;
const DBURI = process.env.DB_URI;

app.set("view engine", "ejs");
app.set("views", "views");

// app using 3rd party middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// using my routes as middleware
app.use("/auth", authRoutes);
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

app.listen(PORT, async () => {
  try {
    await mongoose.connect(DBURI, { dbName: "globlogs" });
    console.log("Connected to database");
    console.log(`Server is listening on port ${PORT}`);
  } catch (error) {
    console.log(error);
  }
});
