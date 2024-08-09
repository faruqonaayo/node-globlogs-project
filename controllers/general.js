// my model
const Location = require("../models/location");

module.exports.getIndex = async (req, res, next) => {
  try {
    const allPosts = await Location.find()
      .sort({ date: -1 })
      .populate("userId");
    return res.status(200).render("general-views/index", {
      allPosts: allPosts,
      isAuthenticated: req.isAuthenticated(),
    });
  } catch (error) {
    next(error);
  }
};
