const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const locationSchema = new Schema({
  location: { type: String, required: true },
  country: { type: String, required: true },
  description: { type: String, required: true },
  locationPicturesUrls: [{ type: String, required: true }],
  likes: { type: Number, required: true },
  date: { type: Date, required: true },
  userId: { type: mongoose.Types.ObjectId, ref: "User", required: true },
});

module.exports = mongoose.model("Location", locationSchema);
